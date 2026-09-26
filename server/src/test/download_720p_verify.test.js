import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import { createApp } from '../app.js';

describe('720p Live Download Pipeline Integration Test', () => {
  let server;
  let baseUrl;
  const PORT = 5098;

  before((_, done) => {
    const app = createApp();
    server = app.listen(PORT, '127.0.0.1', () => {
      baseUrl = `http://127.0.0.1:${PORT}`;
      done();
    });
  });

  after((_, done) => {
    server.close(done);
  });

  test('GET /api/v1/media/download?url=...&formatId=720p streams bytes with 200 and video/mp4', async () => {
    const testUrl = `${baseUrl}/api/v1/media/download?url=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3Dri1Ar5nEq4s&formatId=720p&title=Test720pDownload`;
    
    const response = await fetch(testUrl);
    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.headers.get('content-type'), 'video/mp4');
    assert.ok(response.headers.get('content-disposition').includes('Test720pDownload.mp4'));

    const reader = response.body.getReader();
    let totalBytes = 0;
    
    for (let i = 0; i < 5; i++) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.length;
    }

    assert.ok(totalBytes > 0, 'Stream should transfer binary data');
    console.log(`Successfully streamed initial ${totalBytes} bytes from 720p pipeline!`);

    await reader.cancel();
  });
});
