import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import { createApp } from '../app.js';
import { connectDB, disconnectDB } from '../config/db.js';
import { DownloadJob } from '../models/DownloadJob.js';
import { User } from '../models/User.js';

describe('Job Lifecycle & Management Integration Tests', () => {
  let server;
  let baseUrl;
  const JOB_TEST_PORT = 5095;
  let createdJobId = null;

  before(async () => {
    await connectDB();
    const app = createApp();

    await new Promise((resolve) => {
      server = app.listen(JOB_TEST_PORT, () => {
        baseUrl = `http://127.0.0.1:${JOB_TEST_PORT}`;
        resolve();
      });
    });
  });

  after(async () => {
    try {
      if (createdJobId) {
        await DownloadJob.findByIdAndDelete(createdJobId);
      }
    } catch (e) {}

    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await disconnectDB();
  });

  test('POST /api/v1/jobs should create and enqueue a download job', async () => {
    const res = await fetch(`${baseUrl}/api/v1/jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        formatId: '720p'
      })
    });

    assert.strictEqual(res.status, 201);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.ok(body.data.jobId);
    assert.strictEqual(body.data.platform, 'youtube');
    assert.strictEqual(body.data.container, 'mp4');
    createdJobId = body.data.jobId;
  });

  test('GET /api/v1/jobs/:id should inspect job details and status', async () => {
    assert.ok(createdJobId, 'Job should exist');

    const res = await fetch(`${baseUrl}/api/v1/jobs/${createdJobId}`);
    assert.strictEqual(res.status, 200);

    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.id, createdJobId);
    assert.ok(['queued', 'processing', 'completed'].includes(body.data.status));
    assert.ok(typeof body.data.progress === 'number');
  });

  test('POST /api/v1/jobs/:id/cancel should cancel job and return cancelled state', async () => {
    assert.ok(createdJobId);

    const res = await fetch(`${baseUrl}/api/v1/jobs/${createdJobId}/cancel`, {
      method: 'POST'
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.ok(body.data.status === 'cancelled' || body.data.status === 'completed');
  });

  test('GET /api/v1/jobs should return paginated list of jobs', async () => {
    const res = await fetch(`${baseUrl}/api/v1/jobs?page=1&limit=5`);
    assert.strictEqual(res.status, 200);

    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.ok(Array.isArray(body.data.jobs));
    assert.ok(body.data.pagination);
    assert.strictEqual(body.data.pagination.currentPage, 1);
  });

  test('DELETE /api/v1/jobs/:id should remove job record', async () => {
    assert.ok(createdJobId);

    const res = await fetch(`${baseUrl}/api/v1/jobs/${createdJobId}`, {
      method: 'DELETE'
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.deletedId, createdJobId);

    // Subsequent query should return 404
    const checkRes = await fetch(`${baseUrl}/api/v1/jobs/${createdJobId}`);
    assert.strictEqual(checkRes.status, 404);
  });
});
