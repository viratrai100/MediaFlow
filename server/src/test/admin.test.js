import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import { createApp } from '../app.js';
import { connectDB, disconnectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { Session } from '../models/Session.js';
import { PlatformConfig } from '../models/PlatformConfig.js';
import { AppSettings } from '../models/AppSettings.js';

describe('Admin Protected RBAC & Management Integration Tests', () => {
  let server;
  let baseUrl;
  const ADMIN_TEST_PORT = 5096;
  let isDbAvailable = false;

  const normalUser = {
    username: 'regular_user_' + Math.random().toString(36).substring(2, 7),
    email: `reg_${Math.random().toString(36).substring(2, 7)}@example.com`,
    password: 'UserPass123!'
  };

  const adminUser = {
    username: 'admin_user_' + Math.random().toString(36).substring(2, 7),
    email: `adm_${Math.random().toString(36).substring(2, 7)}@example.com`,
    password: 'AdminPass123!'
  };

  let regularToken = null;
  let adminToken = null;
  let targetUserId = null;
  let adminUserId = null;

  before(async () => {
    await connectDB();
    const app = createApp();

    await new Promise((resolve) => {
      server = app.listen(ADMIN_TEST_PORT, () => {
        baseUrl = `http://127.0.0.1:${ADMIN_TEST_PORT}`;
        resolve();
      });
    });

    try {
      await User.findOne();
      isDbAvailable = true;

      // 1. Create standard user
      const regRes = await fetch(`${baseUrl}/api/v1/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(normalUser)
      });
      const regData = await regRes.json();
      regularToken = regData.data.token;
      targetUserId = regData.data.user._id || regData.data.user.id;

      // 2. Create admin user
      const admRes = await fetch(`${baseUrl}/api/v1/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adminUser)
      });
      const admData = await admRes.json();
      adminToken = admData.data.token;
      adminUserId = admData.data.user._id || admData.data.user.id;

      // Promote adminUser directly in DB
      await User.findByIdAndUpdate(adminUserId, { role: 'admin' });
    } catch (e) {
      isDbAvailable = false;
    }
  });

  after(async () => {
    if (isDbAvailable) {
      try {
        await User.deleteMany({ email: { $in: [normalUser.email, adminUser.email] } });
        await Session.deleteMany({});
      } catch (e) {}
    }
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await disconnectDB();
  });

  test('GET /api/v1/admin/stats without token should return 401 Unauthorized', async () => {
    const res = await fetch(`${baseUrl}/api/v1/admin/stats`);
    assert.strictEqual(res.status, 401);
    const body = await res.json();
    assert.strictEqual(body.success, false);
  });

  test('GET /api/v1/admin/stats with standard user token should return 403 Forbidden', async (t) => {
    if (!isDbAvailable || !regularToken) {
      t.skip('Requires active regular user token and DB');
      return;
    }

    const res = await fetch(`${baseUrl}/api/v1/admin/stats`, {
      headers: { Authorization: `Bearer ${regularToken}` }
    });

    assert.strictEqual(res.status, 403);
    const body = await res.json();
    assert.strictEqual(body.success, false);
  });

  test('GET /api/v1/admin/stats with admin token should return 200 and telemetry data', async (t) => {
    if (!isDbAvailable || !adminToken) {
      t.skip('Requires active admin token and DB');
      return;
    }

    const res = await fetch(`${baseUrl}/api/v1/admin/stats`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.ok(body.data.users);
    assert.ok(body.data.jobs);
    assert.ok(body.data.system);
    assert.ok(typeof body.data.system.uptimeSeconds === 'number');
  });

  test('GET /api/v1/admin/users should list accounts with pagination', async (t) => {
    if (!isDbAvailable || !adminToken) {
      t.skip('Requires active admin token and DB');
      return;
    }

    const res = await fetch(`${baseUrl}/api/v1/admin/users?page=1&limit=5`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.ok(Array.isArray(body.data.users));
    assert.ok(body.data.pagination);
    assert.ok(body.data.users.length > 0);
    // Ensure passwords are NEVER exposed in admin user listings
    for (const u of body.data.users) {
      assert.strictEqual(u.passwordHash, undefined);
    }
  });

  test('PATCH /api/v1/admin/users/:id should update user quota and status', async (t) => {
    if (!isDbAvailable || !adminToken || !targetUserId) {
      t.skip('Requires target user and admin token');
      return;
    }

    const res = await fetch(`${baseUrl}/api/v1/admin/users/${targetUserId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        dailyLimit: 75,
        isBlocked: false
      })
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.user.quota.dailyLimit, 75);
    assert.strictEqual(body.data.user.passwordHash, undefined);
  });

  test('PATCH /api/v1/admin/users/:id self-demotion or self-blocking should return 403 Forbidden', async (t) => {
    if (!isDbAvailable || !adminToken || !adminUserId) {
      t.skip('Requires admin user id');
      return;
    }

    const res = await fetch(`${baseUrl}/api/v1/admin/users/${adminUserId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        role: 'user'
      })
    });

    assert.strictEqual(res.status, 403);
    const body = await res.json();
    assert.strictEqual(body.success, false);
  });

  test('GET /api/v1/admin/platforms and PATCH /api/v1/admin/platforms/:platform', async (t) => {
    if (!isDbAvailable || !adminToken) {
      t.skip('Requires admin token');
      return;
    }

    // 1. List platforms
    const listRes = await fetch(`${baseUrl}/api/v1/admin/platforms`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.strictEqual(listRes.status, 200);
    const listBody = await listRes.json();
    assert.strictEqual(listBody.success, true);
    assert.ok(Array.isArray(listBody.data.platforms));

    // 2. Update platform config
    const patchRes = await fetch(`${baseUrl}/api/v1/admin/platforms/youtube`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        isEnabled: true,
        rateLimitPerMinute: 45
      })
    });
    assert.strictEqual(patchRes.status, 200);
    const patchBody = await patchRes.json();
    assert.strictEqual(patchBody.success, true);
    assert.strictEqual(patchBody.data.platform.rateLimitPerMinute, 45);
  });

  test('GET /api/v1/admin/audit-logs should return recorded audit actions', async (t) => {
    if (!isDbAvailable || !adminToken) {
      t.skip('Requires admin token');
      return;
    }

    const res = await fetch(`${baseUrl}/api/v1/admin/audit-logs`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.ok(Array.isArray(body.data.logs));
    assert.ok(body.data.logs.length > 0);
  });

  test('GET /api/v1/admin/settings and PUT /api/v1/admin/settings', async (t) => {
    if (!isDbAvailable || !adminToken) {
      t.skip('Requires admin token');
      return;
    }

    const getRes = await fetch(`${baseUrl}/api/v1/admin/settings`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.strictEqual(getRes.status, 200);
    const getBody = await getRes.json();
    assert.strictEqual(getBody.success, true);

    const putRes = await fetch(`${baseUrl}/api/v1/admin/settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        maxConcurrentDownloadsPerUser: 4,
        maxDownloadFileSizeMB: 800
      })
    });
    assert.strictEqual(putRes.status, 200);
    const putBody = await putRes.json();
    assert.strictEqual(putBody.success, true);
    assert.strictEqual(putBody.data.settings.maxConcurrentDownloadsPerUser, 4);
    assert.strictEqual(putBody.data.settings.maxDownloadFileSizeMB, 800);
  });

  test('POST /api/v1/admin/maintenance/gc should trigger temporary file purge', async (t) => {
    if (!isDbAvailable || !adminToken) {
      t.skip('Requires admin token');
      return;
    }

    const res = await fetch(`${baseUrl}/api/v1/admin/maintenance/gc`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.ok(typeof body.data.purgedCount === 'number');
  });
});
