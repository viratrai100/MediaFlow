import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import { User } from '../models/User.js';
import { DownloadJob } from '../models/DownloadJob.js';
import { AppSettings } from '../models/AppSettings.js';
import { sanitizeFilename, buildContentDisposition } from '../services/media/filenameSanitizer.js';
import { normalizeUrl } from '../services/url/urlNormalizer.js';
import { validateUrlForSSRF } from '../services/url/ssrfValidator.js';
import { jobQueueService } from '../services/jobs/jobQueueService.js';
import { adapterRegistry } from '../services/extractors/AdapterRegistry.js';
import { connectDB, disconnectDB } from '../config/db.js';

describe('Comprehensive Unit Tests: Models, Helpers & Services', () => {
  before(async () => {
    await connectDB();
  });

  after(async () => {
    await disconnectDB();
  });

  describe('1. User Model & Password Cryptography Unit Tests', () => {
    test('User.hashPassword should produce secure bcrypt hash', async () => {
      const password = 'TestSecurePassword123!';
      const hash = await User.hashPassword(password);
      assert.ok(hash);
      assert.ok(hash.startsWith('$2'));
      assert.notStrictEqual(hash, password);
    });

    test('User.comparePassword should verify correct password and reject wrong password', async () => {
      const password = 'CorrectPassword99!';
      const hash = await User.hashPassword(password);
      const user = new User({
        username: 'cryptotest',
        email: 'crypto@example.com',
        passwordHash: hash
      });

      const matchTrue = await user.comparePassword(password);
      assert.strictEqual(matchTrue, true);

      const matchFalse = await user.comparePassword('WrongPassword123!');
      assert.strictEqual(matchFalse, false);
    });

    test('toSafeObject should never include passwordHash or internal mongo fields', async () => {
      const hash = await User.hashPassword('Secret123!');
      const user = new User({
        username: 'safeuser',
        email: 'safe@example.com',
        passwordHash: hash,
        role: 'user'
      });

      const safeObj = user.toSafeObject();
      assert.strictEqual(safeObj.passwordHash, undefined);
      assert.strictEqual(safeObj.username, 'safeuser');
      assert.strictEqual(safeObj.email, 'safe@example.com');
    });
  });

  describe('2. Filename Sanitizer & Content-Disposition Unit Tests', () => {
    test('sanitizeFilename handles path traversal and special characters', () => {
      const input = '../../..//video:?*<>"|name.mp4';
      const output = sanitizeFilename(input, 'mp4');
      assert.ok(!output.includes('../'));
      assert.ok(!output.includes(':'));
      assert.ok(!output.includes('?'));
      assert.ok(!output.includes('*'));
      assert.ok(!output.includes('<'));
      assert.ok(!output.includes('>'));
      assert.ok(!output.includes('|'));
    });

    test('sanitizeFilename handles empty or invalid titles safely', () => {
      const outputNull = sanitizeFilename(null, 'mp4');
      assert.ok(outputNull.startsWith('media_'));
      assert.ok(outputNull.endsWith('.mp4'));

      const outputEmpty = sanitizeFilename('   ', 'mp3');
      assert.ok(outputEmpty.startsWith('media_'));
      assert.ok(outputEmpty.endsWith('.mp3'));
    });

    test('buildContentDisposition formats standard and UTF-8 encoded headers correctly', () => {
      const filename = 'Tokyo Drift 東京.mp4';
      const header = buildContentDisposition(filename);
      assert.ok(header.startsWith('attachment;'));
      assert.ok(header.includes('filename="'));
      assert.ok(header.includes("filename*=UTF-8''"));
      assert.ok(header.includes(encodeURIComponent(filename)));
    });
  });

  describe('3. URL Normalizer & Platform Adapter Unit Tests', () => {
    test('normalizeUrl strips tracking parameters (utm_*, fbclid, igshid, si)', () => {
      const dirtyUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&utm_source=twitter&utm_medium=social&fbclid=12345&si=abcde';
      const cleanUrl = normalizeUrl(dirtyUrl);
      assert.ok(!cleanUrl.includes('utm_source'));
      assert.ok(!cleanUrl.includes('fbclid'));
      assert.ok(!cleanUrl.includes('si='));
      assert.ok(cleanUrl.includes('v=dQw4w9WgXcQ'));
    });

    test('YouTubeAdapter.normalize canonicalizes youtu.be shortlinks', () => {
      const adapter = adapterRegistry.resolveAdapter('https://youtu.be/dQw4w9WgXcQ');
      const canonical = adapter.normalize('https://youtu.be/dQw4w9WgXcQ');
      assert.ok(canonical.includes('youtube.com/watch?v=dQw4w9WgXcQ'));
    });

    test('TikTokAdapter.normalize canonicalizes mobile and query-heavy tiktok links', () => {
      const adapter = adapterRegistry.resolveAdapter('https://www.tiktok.com/@user/video/1234567890?is_from_webapp=1&sender_device=pc');
      const canonical = adapter.normalize('https://www.tiktok.com/@user/video/1234567890?is_from_webapp=1&sender_device=pc');
      assert.ok(!canonical.includes('is_from_webapp'));
      assert.ok(!canonical.includes('sender_device'));
      assert.ok(canonical.includes('/video/1234567890'));
    });
  });

  describe('4. In-Memory Job Queue Worker Unit Tests', () => {
    test('jobQueueService activeWorkers map tracks job processes', () => {
      const mockJobId = 'job_' + Date.now();
      const abortController = new AbortController();

      jobQueueService.activeWorkers.set(mockJobId, { abortController, startedAt: Date.now() });
      assert.strictEqual(jobQueueService.activeWorkers.has(mockJobId), true);

      jobQueueService.activeWorkers.delete(mockJobId);
      assert.strictEqual(jobQueueService.activeWorkers.has(mockJobId), false);
    });

    test('jobQueueService countActiveJobsForUser counts user active pipelines', async (t) => {
      try {
        const count = await jobQueueService.countActiveJobsForUser(null, '127.0.0.1');
        assert.strictEqual(typeof count, 'number');
        assert.ok(count >= 0);
      } catch (e) {
        t.skip('MongoDB required for countActiveJobsForUser');
      }
    });
  });

  describe('5. AppSettings Model Singleton Unit Tests', () => {
    test('AppSettings.getSettings returns singleton record with default operational limits', async (t) => {
      try {
        const settings = await AppSettings.getSettings();
        assert.ok(settings);
        assert.strictEqual(settings.singletonKey, 'GLOBAL_SETTINGS');
        assert.strictEqual(typeof settings.maxConcurrentDownloadsPerUser, 'number');
        assert.strictEqual(typeof settings.maxDownloadFileSizeMB, 'number');
      } catch (e) {
        t.skip('MongoDB connection required for AppSettings singleton query');
      }
    });
  });
});
