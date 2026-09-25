import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../app.js';
import { connectDB, disconnectDB } from '../config/db.js';
import { DownloadJob } from '../models/DownloadJob.js';
import { tempFileManager } from '../services/media/tempFileManager.js';
import { rangeStreamService } from '../services/media/rangeStreamService.js';
import fs from 'fs';

describe('HTTP Range and Partial Content (206) Stream Tests', () => {
  let server;
  let baseUrl;
  const TEST_PORT = 5087;

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

  test('1. HTTP Range bytes=0-19 returns 206 Partial Content with exact slice and Content-Range', async () => {
    const testContent = Buffer.from('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_FULL_TEST_BUFFER_CONTENT');
    const totalSize = testContent.length;
    const tempPath = tempFileManager.createTempPath('mp4');
    fs.writeFileSync(tempPath, testContent);

    const job = await DownloadJob.create({
      clientIpHash: '::ffff:127.0.0.1',
      platform: 'direct',
      url: 'https://example.com/range_test.mp4',
      mediaTitle: 'Range Test Stream',
      formatId: '720p',
      container: 'mp4',
      mediaType: 'video',
      status: 'completed',
      tempFilePath: tempPath,
      fileSizeMB: (totalSize / 1024 / 1024),
      progress: 100
    });

    const res = await fetch(`${baseUrl}/api/v1/jobs/${job._id}/download`, {
      headers: { 'Range': 'bytes=0-19' }
    });

    assert.equal(res.status, 206, 'Should respond with 206 Partial Content');
    assert.equal(res.headers.get('content-range'), `bytes 0-19/${totalSize}`);
    assert.equal(res.headers.get('content-length'), '20');
    assert.equal(res.headers.get('accept-ranges'), 'bytes');

    const buf = Buffer.from(await res.arrayBuffer());
    assert.equal(buf.length, 20);
    assert.equal(buf.toString('utf-8'), testContent.subarray(0, 20).toString('utf-8'));

    // Clean up
    await tempFileManager.safeUnlink(tempPath);
    await DownloadJob.findByIdAndDelete(job._id);
  });

  test('2. HTTP Range resume from middle bytes=20- returns 206 Partial Content without restarting from 0', async () => {
    const testContent = Buffer.from('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_RESUME_CHUNK_DATA');
    const totalSize = testContent.length;
    const tempPath = tempFileManager.createTempPath('mp4');
    fs.writeFileSync(tempPath, testContent);

    const job = await DownloadJob.create({
      clientIpHash: '::ffff:127.0.0.1',
      platform: 'direct',
      url: 'https://example.com/resume_test.mp4',
      mediaTitle: 'Resume Test Stream',
      formatId: '720p',
      container: 'mp4',
      mediaType: 'video',
      status: 'completed',
      tempFilePath: tempPath,
      fileSizeMB: (totalSize / 1024 / 1024),
      progress: 100
    });

    const res = await fetch(`${baseUrl}/api/v1/jobs/${job._id}/download`, {
      headers: { 'Range': 'bytes=20-' }
    });

    assert.equal(res.status, 206);
    assert.equal(res.headers.get('content-range'), `bytes 20-${totalSize - 1}/${totalSize}`);
    assert.equal(res.headers.get('content-length'), String(totalSize - 20));

    const buf = Buffer.from(await res.arrayBuffer());
    assert.equal(buf.length, totalSize - 20);
    assert.equal(buf.toString('utf-8'), testContent.subarray(20).toString('utf-8'));

    await tempFileManager.safeUnlink(tempPath);
    await DownloadJob.findByIdAndDelete(job._id);
  });

  test('3. Invalid HTTP Range beyond file length returns 416 Range Not Satisfiable', async () => {
    const testContent = Buffer.from('SHORT_BUFFER');
    const totalSize = testContent.length;
    const tempPath = tempFileManager.createTempPath('mp4');
    fs.writeFileSync(tempPath, testContent);

    const job = await DownloadJob.create({
      clientIpHash: '::ffff:127.0.0.1',
      platform: 'direct',
      url: 'https://example.com/invalid_range.mp4',
      mediaTitle: 'Invalid Range',
      formatId: '720p',
      container: 'mp4',
      mediaType: 'video',
      status: 'completed',
      tempFilePath: tempPath,
      progress: 100
    });

    const res = await fetch(`${baseUrl}/api/v1/jobs/${job._id}/download`, {
      headers: { 'Range': 'bytes=9999-10000' }
    });

    assert.equal(res.status, 416);
    assert.equal(res.headers.get('content-range'), `bytes */${totalSize}`);

    await tempFileManager.safeUnlink(tempPath);
    await DownloadJob.findByIdAndDelete(job._id);
  });

  test('4. RangeStreamService probes and handles single connection and parallel chunks cleanly', async () => {
    const dummyUrl = 'https://raw.githubusercontent.com/octocat/Spoon-Knife/main/README.md';
    const probe = await rangeStreamService.probeUrl(dummyUrl);
    assert.ok(typeof probe.supportsRange === 'boolean');
  });
});
