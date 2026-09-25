import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import { createApp } from '../app.js';
import { connectDB, disconnectDB } from '../config/db.js';
import { validateUrlForSSRF } from '../services/url/ssrfValidator.js';
import { sanitizeFilename } from '../services/media/filenameSanitizer.js';

describe('Security Hardening & Threat Model Regression Tests', () => {
  let server;
  let baseUrl;
  const SECURITY_TEST_PORT = 5094;

  before(async () => {
    await connectDB();
    const app = createApp();

    await new Promise((resolve) => {
      server = app.listen(SECURITY_TEST_PORT, () => {
        baseUrl = `http://127.0.0.1:${SECURITY_TEST_PORT}`;
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

  describe('1. SSRF & Hostname Validation Unit & Integration Tests', () => {
    const maliciousUrls = [
      { url: 'http://localhost/admin', reason: 'localhost' },
      { url: 'http://127.0.0.1:8080/test', reason: '127.0.0.1 loopback' },
      { url: 'http://127.0.0.254/internal', reason: '127.0.0.0/8 subnet' },
      { url: 'http://10.0.0.1/status', reason: '10.0.0.0/8 private network' },
      { url: 'http://172.16.0.1/', reason: '172.16.0.0/12 private network' },
      { url: 'http://192.168.1.1/router', reason: '192.168.0.0/16 private network' },
      { url: 'http://169.254.169.254/latest/meta-data/', reason: 'cloud metadata' },
      { url: 'http://[::1]/', reason: 'IPv6 loopback' },
      { url: 'http://0177.0.0.1/', reason: 'Octal loopback' },
      { url: 'http://0x7f000001/', reason: 'Hex loopback' },
      { url: 'http://2130706433/', reason: 'Decimal integer loopback' },
      { url: 'http://user:password@youtube.com/watch?v=dQw4w9WgXcQ', reason: 'Embedded basic auth credentials' },
      { url: 'http://youtube.com:8443/watch?v=123', reason: 'Custom non-standard port' },
      { url: 'file:///etc/passwd', reason: 'File protocol' },
      { url: 'gopher://127.0.0.1:70/', reason: 'Gopher protocol' }
    ];

    for (const item of maliciousUrls) {
      test(`validateUrlForSSRF should block ${item.reason}: ${item.url}`, () => {
        assert.throws(
          () => validateUrlForSSRF(item.url),
          /SSRF violation|Forbidden protocol|Invalid URL/i
        );
      });
    }

    test('POST /api/v1/media/info with SSRF attempt should return 403 Forbidden', async () => {
      const res = await fetch(`${baseUrl}/api/v1/media/info`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'http://169.254.169.254/latest/meta-data/' })
      });

      assert.strictEqual(res.status, 403);
      const body = await res.json();
      assert.strictEqual(body.success, false);
      assert.strictEqual(body.error.code, 'PRIVATE_MEDIA_RESTRICTED');
    });
  });

  describe('2. HTTP Security Headers Verification', () => {
    test('Response should contain hardened security headers', async () => {
      const res = await fetch(`${baseUrl}/api/v1/health`);
      assert.strictEqual(res.status, 200);

      // Verify Helmet and custom security headers
      assert.strictEqual(res.headers.get('x-content-type-options'), 'nosniff');
      assert.strictEqual(res.headers.get('x-frame-options'), 'DENY');
      assert.strictEqual(res.headers.get('x-permitted-cross-domain-policies'), 'none');
      assert.ok(res.headers.get('permissions-policy'));
    });
  });

  describe('3. Password Complexity & Input Validation Tests', () => {
    test('POST /api/v1/auth/signup with weak password (no numbers) should return 400', async () => {
      const res = await fetch(`${baseUrl}/api/v1/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'validuser123',
          email: 'validuser123@example.com',
          password: 'onlylettershere'
        })
      });

      assert.strictEqual(res.status, 400);
      const body = await res.json();
      assert.strictEqual(body.success, false);
      assert.match(body.error.message, /letter and one number/i);
    });

    test('POST /api/v1/auth/signup with invalid email format should return 400', async () => {
      const res = await fetch(`${baseUrl}/api/v1/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'validuser123',
          email: 'invalid-email-address',
          password: 'ValidPassword123!'
        })
      });

      assert.strictEqual(res.status, 400);
      const body = await res.json();
      assert.strictEqual(body.success, false);
      assert.match(body.error.message, /valid email/i);
    });
  });


  describe('4. Filename Sanitization & Path Traversal Protections', () => {
    test('sanitizeFilename should prevent path traversal sequences', () => {
      const malicious = '../../../../etc/shadow';
      const clean = sanitizeFilename(malicious, 'mp4');
      assert.ok(!clean.includes('../'));
      assert.ok(!clean.includes('/'));
      assert.ok(!clean.includes('\\'));
    });

    test('sanitizeFilename should strip null bytes and control chars', () => {
      const nullByteTitle = 'video\x00_test\x1f_file';
      const clean = sanitizeFilename(nullByteTitle, 'mp4');
      assert.ok(!clean.includes('\x00'));
      assert.ok(!clean.includes('\x1f'));
    });
  });
});
