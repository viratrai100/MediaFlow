import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import { sanitizeFilename, buildContentDisposition } from '../services/media/filenameSanitizer.js';
import { tempFileManager } from '../services/media/tempFileManager.js';
import { createApp } from '../app.js';

describe('Filename Sanitizer & Content-Disposition Tests', () => {
  test('sanitizeFilename should remove path traversal and dangerous characters', () => {
    const malicious = '../../../etc/passwd: *secret? "video" <clip> | test';
    const clean = sanitizeFilename(malicious, 'mp4');

    assert.ok(!clean.includes('/'));
    assert.ok(!clean.includes('\\'));
    assert.ok(!clean.includes(':'));
    assert.ok(!clean.includes('*'));
    assert.ok(!clean.includes('..'));
    assert.ok(clean.endsWith('.mp4'));
  });

  test('sanitizeFilename should truncate overly long titles', () => {
    const longTitle = 'a'.repeat(200);
    const clean = sanitizeFilename(longTitle, 'mp3', 60);

    assert.ok(clean.length <= 65); // 60 chars + .mp3
    assert.ok(clean.endsWith('.mp3'));
  });

  test('buildContentDisposition should generate compliant RFC5987 attachment headers', () => {
    const header = buildContentDisposition('My Awesome Video (2026).mp4', 'attachment');

    assert.ok(header.startsWith('attachment;'));
    assert.ok(header.includes('filename="My_Awesome_Video__2026_.mp4"'));
    assert.ok(header.includes("filename*=UTF-8''My%20Awesome%20Video%20(2026).mp4"));
  });
});

describe('Temp File Manager & Garbage Collection Tests', () => {
  test('createTempPath and safeUnlink should manage scratch file lifecycle', async () => {
    const tempPath = tempFileManager.createTempPath('tmp');
    assert.ok(typeof tempPath === 'string');

    // Create file
    await fs.promises.writeFile(tempPath, 'temporary stream buffer data');
    assert.strictEqual(fs.existsSync(tempPath), true);

    // Unlink
    await tempFileManager.safeUnlink(tempPath);
    assert.strictEqual(fs.existsSync(tempPath), false);
  });

  test('purgeStaleFiles should cleanup files older than TTL', async () => {
    const staleFile = tempFileManager.createTempPath('stale');
    await fs.promises.writeFile(staleFile, 'stale scratch buffer');

    // Manually set mtime to 2 hours ago
    const twoHoursAgo = new Date(Date.now() - 7200000);
    await fs.promises.utimes(staleFile, twoHoursAgo, twoHoursAgo);

    // Run GC with 1-hour max age
    const purged = await tempFileManager.purgeStaleFiles(3600000);
    assert.ok(purged >= 1);
    assert.strictEqual(fs.existsSync(staleFile), false);
  });
});

describe('Media Streaming Endpoint Tests', () => {
  let server;
  let baseUrl;
  const STREAM_TEST_PORT = 5096;

  before((_, done) => {
    const app = createApp();
    server = app.listen(STREAM_TEST_PORT, () => {
      baseUrl = `http://127.0.0.1:${STREAM_TEST_PORT}`;
      done();
    });
  });

  after((_, done) => {
    server.close(done);
  });

  test('GET /api/v1/media/download without URL should return 400', async () => {
    const res = await fetch(`${baseUrl}/api/v1/media/download`);
    assert.strictEqual(res.status, 400);

    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.error.code, 'INVALID_URL');
  });

  test('GET /api/v1/media/download with SSRF private IP should return 403', async () => {
    const res = await fetch(`${baseUrl}/api/v1/media/download?url=http://192.168.1.1/video.mp4`);
    assert.strictEqual(res.status, 403);

    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.error.code, 'PRIVATE_MEDIA_RESTRICTED');
  });
});
