import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { YouTubeAdapter } from '../services/extractors/YouTubeAdapter.js';
import { createApp } from '../app.js';
import { connectDB, disconnectDB } from '../config/db.js';
import { execFile } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ffprobePath = path.resolve(__dirname, '../../../server/node_modules/@ffprobe-installer/win32-x64/ffprobe.exe');

function probeMedia(filePath) {
  return new Promise((resolve, reject) => {
    execFile(ffprobePath, ['-v', 'error', '-show_entries', 'stream=codec_type,codec_name,width,height', '-of', 'json', filePath], (err, stdout) => {
      if (err) return reject(err);
      resolve(JSON.parse(stdout));
    });
  });
}

describe('Python Media Service & YouTube Adapter Multi-Quality Verification', () => {
  let app;
  let server;
  let baseUrl;
  const testUrl = 'https://youtu.be/e2kIhlfmOJw?si=5js6Ops_8pYHN87_';

  before(async () => {
    await connectDB();
    app = createApp();
    server = app.listen(5080);
    baseUrl = 'http://127.0.0.1:5080';
  });

  after(async () => {
    if (server) server.close();
    await disconnectDB();
  });

  test('1. Metadata Extraction discovers exact formats and calculated sizes', async () => {
    const adapter = new YouTubeAdapter();
    const meta = await adapter.extractMetadata(testUrl);

    assert.ok(meta.title, 'Should have video title');
    assert.ok(meta.formats.length >= 4, 'Should have discovered multiple formats');

    const formatIds = meta.formats.map(f => f.formatId);
    console.log('Discovered format IDs:', formatIds);
    assert.ok(formatIds.includes('360p'), 'Should include 360p');
    assert.ok(formatIds.includes('720p'), 'Should include 720p');
    assert.ok(formatIds.includes('1080p'), 'Should include 1080p');
    assert.ok(formatIds.includes('mp3_320'), 'Should include mp3_320');

    // Verify sizes are distinct and non-zero
    const size360 = meta.formats.find(f => f.formatId === '360p').size;
    const size720 = meta.formats.find(f => f.formatId === '720p').size;
    const size1080 = meta.formats.find(f => f.formatId === '1080p').size;

    console.log(`Sizes: 360p=${size360}, 720p=${size720}, 1080p=${size1080}`);
    assert.notEqual(size360, size720, '360p and 720p must have different sizes');
    assert.notEqual(size720, size1080, '720p and 1080p must have different sizes');
  });

  test('2. API /api/v1/media/info returns genuine format list with real size strings', async () => {
    const res = await fetch(`${baseUrl}/api/v1/media/info`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: testUrl })
    });

    const json = await res.json();
    assert.equal(res.status, 200);
    assert.equal(json.success, true);
    assert.ok(json.data.formats.length >= 4);
    assert.ok(json.data.formats.some(f => f.formatId === '720p' && f.size.includes('MB')));
  });

  test('3. Direct Stream for 360p streams matching size and content-length', async () => {
    const streamUrl = `${baseUrl}/api/v1/media/download?url=${encodeURIComponent(testUrl)}&formatId=360p&title=test_360`;
    const res = await fetch(streamUrl);

    assert.equal(res.status, 200);
    assert.equal(res.headers.get('content-type'), 'video/mp4');
    const contentLength = parseInt(res.headers.get('content-length'), 10);
    assert.ok(contentLength > 0, 'Content-Length must be provided');

    const buffer = await res.arrayBuffer();
    assert.equal(buffer.byteLength, contentLength, 'Downloaded bytes must match Content-Length header exactly');
    console.log(`360p downloaded bytes: ${buffer.byteLength} (~${(buffer.byteLength / 1024 / 1024).toFixed(2)} MB)`);
    assert.ok(buffer.byteLength > 4 * 1024 * 1024 && buffer.byteLength < 12 * 1024 * 1024, '360p size should be ~8-9 MB');
  });

  test('4. Direct Stream for 720p streams larger HD file matching 720p format', async () => {
    const streamUrl = `${baseUrl}/api/v1/media/download?url=${encodeURIComponent(testUrl)}&formatId=720p&title=test_720`;
    const res = await fetch(streamUrl);

    assert.equal(res.status, 200);
    const contentLength = parseInt(res.headers.get('content-length'), 10);
    assert.ok(contentLength > 15 * 1024 * 1024, '720p file size must be significantly larger than 360p (>15 MB)');

    const buffer = await res.arrayBuffer();
    console.log(`720p downloaded bytes: ${buffer.byteLength} (~${(buffer.byteLength / 1024 / 1024).toFixed(2)} MB)`);
    assert.ok(buffer.byteLength > 18 * 1024 * 1024, '720p should be ~20-25 MB');
  });

  test('5. Audio Stream for mp3_320 streams valid MP3 audio stream', async () => {
    const streamUrl = `${baseUrl}/api/v1/media/download?url=${encodeURIComponent(testUrl)}&formatId=mp3_320&title=test_audio`;
    const res = await fetch(streamUrl);

    assert.equal(res.status, 200);
    assert.equal(res.headers.get('content-type'), 'audio/mpeg');
    const contentLength = parseInt(res.headers.get('content-length'), 10);
    assert.ok(contentLength > 0);

    const buffer = await res.arrayBuffer();
    console.log(`MP3 downloaded bytes: ${buffer.byteLength} (~${(buffer.byteLength / 1024 / 1024).toFixed(2)} MB)`);
    assert.ok(buffer.byteLength > 2 * 1024 * 1024 && buffer.byteLength < 10 * 1024 * 1024);
  });
});
