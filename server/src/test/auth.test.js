import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import { createApp } from '../app.js';
import { connectDB, disconnectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { Session } from '../models/Session.js';

describe('Authentication & Session Integration Tests', () => {
  let server;
  let baseUrl;
  const AUTH_TEST_PORT = 5098;
  let isDbAvailable = false;

  const testUser = {
    username: 'testdownloader_' + Math.random().toString(36).substring(2, 7),
    email: `test_${Math.random().toString(36).substring(2, 7)}@example.com`,
    password: 'SecurePassword123!'
  };

  let authToken = null;

  before(async () => {
    await connectDB();
    const app = createApp();

    await new Promise((resolve) => {
      server = app.listen(AUTH_TEST_PORT, () => {
        baseUrl = `http://127.0.0.1:${AUTH_TEST_PORT}`;
        resolve();
      });
    });

    // Check if DB is connected
    try {
      await User.findOne();
      isDbAvailable = true;
    } catch (e) {
      isDbAvailable = false;
    }
  });

  after(async () => {
    if (isDbAvailable) {
      try {
        await User.deleteMany({ email: testUser.email });
        await Session.deleteMany({});
      } catch (e) {}
    }
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await disconnectDB();
  });

  test('POST /api/v1/auth/signup should register user and never expose passwordHash', async (t) => {
    if (!isDbAvailable) {
      t.skip('MongoDB not available in current environment for live write test');
      return;
    }

    const res = await fetch(`${baseUrl}/api/v1/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    });

    assert.strictEqual(res.status, 201);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.ok(body.data.token);
    assert.strictEqual(body.data.user.email, testUser.email);
    assert.strictEqual(body.data.user.passwordHash, undefined);
    authToken = body.data.token;
  });

  test('POST /api/v1/auth/signup with duplicate email should return 409 Conflict', async (t) => {
    if (!isDbAvailable) {
      t.skip('MongoDB not available');
      return;
    }

    const res = await fetch(`${baseUrl}/api/v1/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    });

    assert.strictEqual(res.status, 409);
    const body = await res.json();
    assert.strictEqual(body.success, false);
  });

  test('POST /api/v1/auth/login with valid credentials should return token', async (t) => {
    if (!isDbAvailable) {
      t.skip('MongoDB not available');
      return;
    }

    const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testUser.email,
        password: testUser.password
      })
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.ok(body.data.token);
    assert.strictEqual(body.data.user.passwordHash, undefined);
  });

  test('POST /api/v1/auth/login with wrong password should return 401', async (t) => {
    if (!isDbAvailable) {
      t.skip('MongoDB not available');
      return;
    }

    const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testUser.email,
        password: 'WrongPassword999!'
      })
    });

    assert.strictEqual(res.status, 401);
    const body = await res.json();
    assert.strictEqual(body.success, false);
  });

  test('GET /api/v1/auth/me without token should return 401 Unauthorized', async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/me`);
    assert.strictEqual(res.status, 401);
    const body = await res.json();
    assert.strictEqual(body.success, false);
  });

  test('GET /api/v1/auth/me with Bearer token should return profile', async (t) => {
    if (!isDbAvailable || !authToken) {
      t.skip('Requires active auth token and DB');
      return;
    }

    const res = await fetch(`${baseUrl}/api/v1/auth/me`, {
      headers: {
        Authorization: `Bearer ${authToken}`
      }
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.user.email, testUser.email);
    assert.strictEqual(body.data.user.passwordHash, undefined);
  });

  test('POST /api/v1/auth/logout should revoke session', async (t) => {
    if (!isDbAvailable || !authToken) {
      t.skip('Requires active auth token and DB');
      return;
    }

    const res = await fetch(`${baseUrl}/api/v1/auth/logout`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authToken}`
      }
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.loggedOut, true);

    // Subsequent request with revoked token should fail
    const meRes = await fetch(`${baseUrl}/api/v1/auth/me`, {
      headers: {
        Authorization: `Bearer ${authToken}`
      }
    });
    assert.strictEqual(meRes.status, 401);
  });
});
