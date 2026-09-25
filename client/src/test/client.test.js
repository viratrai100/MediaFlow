import { test, describe } from 'node:test';
import assert from 'node:assert';
import { detectPlatform, PLATFORMS } from '../services/mockMediaService.js';
import { apiService } from '../services/apiService.js';

describe('Frontend Client Unit & Logic Tests', () => {
  describe('1. Platform Detection Tests', () => {
    test('detectPlatform correctly identifies YouTube URLs', () => {
      const p1 = detectPlatform('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
      assert.strictEqual(p1.id, 'youtube');

      const p2 = detectPlatform('https://youtu.be/dQw4w9WgXcQ');
      assert.strictEqual(p2.id, 'youtube');
    });

    test('detectPlatform correctly identifies TikTok URLs', () => {
      const p = detectPlatform('https://www.tiktok.com/@creator/video/123456');
      assert.strictEqual(p.id, 'tiktok');
    });

    test('detectPlatform correctly identifies Instagram URLs', () => {
      const p = detectPlatform('https://www.instagram.com/reel/C8xyz123/');
      assert.strictEqual(p.id, 'instagram');
    });

    test('detectPlatform correctly identifies Twitter / X URLs', () => {
      const p1 = detectPlatform('https://twitter.com/SpaceX/status/12345');
      assert.strictEqual(p1.id, 'twitter');

      const p2 = detectPlatform('https://x.com/SpaceX/status/12345');
      assert.strictEqual(p2.id, 'twitter');
    });

    test('detectPlatform correctly identifies Vimeo URLs', () => {
      const p = detectPlatform('https://vimeo.com/76979871');
      assert.strictEqual(p.id, 'vimeo');
    });

    test('detectPlatform falls back to Direct Stream for arbitrary http/https links', () => {
      const p = detectPlatform('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4');
      assert.strictEqual(p.id, 'direct');
    });

    test('detectPlatform returns null for empty or invalid strings', () => {
      assert.strictEqual(detectPlatform(''), null);
      assert.strictEqual(detectPlatform(null), null);
      assert.strictEqual(detectPlatform('not-a-url'), null);
    });
  });

  describe('2. API Service URL Builder Tests', () => {
    test('getDownloadUrl builds valid streaming link with format and title parameters', () => {
      const url = apiService.getDownloadUrl('https://youtube.com/watch?v=123', '1080p', 'My Video');
      assert.ok(url.includes('/media/download'));
      assert.ok(url.includes('formatId=1080p'));
      assert.ok(url.includes('title=My+Video') || url.includes('title=My%20Video'));
    });

    test('getJobDownloadUrl builds correct job download endpoint', () => {
      const url = apiService.getJobDownloadUrl('job_xyz999');
      assert.ok(url.includes('/jobs/job_xyz999/download'));
    });
  });
});
