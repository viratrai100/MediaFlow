import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import { createApp } from '../app.js';

describe('Express Backend API Integration Tests', () => {
  let server;
  let baseUrl;
  const TEST_PORT = 5099;

  before((_, done) => {
    const app = createApp();
    server = app.listen(TEST_PORT, () => {
      baseUrl = `http://127.0.0.1:${TEST_PORT}`;
      done();
    });
  });

  after((_, done) => {
    server.close(done);
  });

  test('GET /api/v1/health should return 200 with system telemetry', async () => {
    const res = await fetch(`${baseUrl}/api/v1/health`);
    assert.strictEqual(res.status, 200);

    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.status, 'healthy');
    assert.ok(typeof body.data.uptimeSeconds === 'number');
    assert.ok(body.data.system.nodeVersion);
    assert.ok(body.data.database.status);
  });

  test('POST /api/v1/media/info without URL should return 400 with validation error', async () => {
    const res = await fetch(`${baseUrl}/api/v1/media/info`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });

    assert.strictEqual(res.status, 400);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.error.code, 'INVALID_URL');
  });

  test('POST /api/v1/media/info with valid YouTube URL should return 200 and format table', async () => {
    const res = await fetch(`${baseUrl}/api/v1/media/info`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' })
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.platform, 'youtube');
    assert.ok(Array.isArray(body.data.formats));
  });

  test('POST /api/v1/media/info with SSRF localhost URL should return 403 Forbidden', async () => {
    const res = await fetch(`${baseUrl}/api/v1/media/info`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: 'http://localhost:8080/secret' })
    });

    assert.strictEqual(res.status, 403);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.error.code, 'PRIVATE_MEDIA_RESTRICTED');
  });

  test('GET /api/v1/unknown-route should return 404 with standard error structure', async () => {
    const res = await fetch(`${baseUrl}/api/v1/non-existent-endpoint`);
    assert.strictEqual(res.status, 404);

    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.error.code, 'ROUTE_NOT_FOUND');
  });
});
