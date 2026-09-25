import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../app.js';
import { connectDB, disconnectDB } from '../config/db.js';
import { DownloadJob } from '../models/DownloadJob.js';
import { tempFileManager } from '../services/media/tempFileManager.js';
import fs from 'fs';

describe('Download Pipeline End-to-End Verification Tests', () => {
  let server;
  let baseUrl;
  const TEST_PORT = 5088;

  before(async () => {
    await connectDB();
    const app = createApp();
    await new Promise((resolve) => {
      server = app.listen(TEST_PORT, () => {
        baseUrl = `http://127.0.0.1:${TEST_PORT}`;
        resolve();
      });
    });
  });

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await disconnectDB();
  });

  test('1. Completed job endpoint /api/v1/jobs/:id/download delivers buffered temp file with genuine headers and content', async () => {
    const tempPath = tempFileManager.createTempPath('mp4');
    fs.writeFileSync(tempPath, Buffer.from('FAKE_MP4_HEADER_TEST_BYTES_1234567890'));

    const job = await DownloadJob.create({
      clientIpHash: '::ffff:127.0.0.1',
      platform: 'direct',
      url: 'https://example.com/test.mp4',
      mediaTitle: 'My Test Stream',
      formatId: '720p',
      container: 'mp4',
      mediaType: 'video',
      status: 'completed',
      tempFilePath: tempPath,
      fileSizeMB: 0.01,
      progress: 100
    });

    const res = await fetch(`${baseUrl}/api/v1/jobs/${job._id}/download`);

    assert.equal(res.status, 200);
    assert.match(res.headers.get('content-type'), /video\/mp4/);
    assert.match(res.headers.get('content-disposition'), /attachment; filename="My_Test_Stream.mp4"/);
    const text = await res.text();
    assert.equal(text, 'FAKE_MP4_HEADER_TEST_BYTES_1234567890');

    // Clean up
    await tempFileManager.safeUnlink(tempPath);
    await DownloadJob.findByIdAndDelete(job._id);
  });

  test('2. Job in queued status returns 400 error on premature download request', async () => {
    const job = await DownloadJob.create({
      clientIpHash: '::ffff:127.0.0.1',
      platform: 'direct',
      url: 'https://example.com/test.mp4',
      mediaTitle: 'Queued Video',
      formatId: '720p',
      container: 'mp4',
      mediaType: 'video',
      status: 'queued',
      progress: 10
    });

    const res = await fetch(`${baseUrl}/api/v1/jobs/${job._id}/download`);

    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.match(body.error.message, /Cannot download media for job in "queued" status/);

    await DownloadJob.findByIdAndDelete(job._id);
  });

  test('3. Restricted platform without direct stream returns clear 403 error', async () => {
    const res = await fetch(`${baseUrl}/api/v1/media/download?url=https://www.instagram.com/reel/C123456789/&formatId=reel_1080p`);

    assert.equal(res.status, 403);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.match(body.error.message, /authentication|restricted/i);
  });

  test('4. YouTube metadata extraction and normalization works without rate limit rejection', async () => {
    const res = await fetch(`${baseUrl}/api/v1/media/info`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: 'https://youtu.be/e2kIhlfmOJw?si=5js6Ops_8pYHN87_' })
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.platform, 'youtube');
    assert.ok(Array.isArray(body.data.formats));
    assert.ok(body.data.formats.length > 0);
  });
});
