import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import { createApp } from '../app.js';
import { normalizeUrl } from '../services/url/urlNormalizer.js';
import { validateUrlForSSRF } from '../services/url/ssrfValidator.js';
import { adapterRegistry } from '../services/extractors/AdapterRegistry.js';

describe('URL Normalizer & Security Tests', () => {
  test('normalizeUrl should strip tracking parameters and canonicalize protocol', () => {
    const raw = 'http://www.youtube.com/watch?v=dQw4w9WgXcQ&utm_source=twitter&si=abc123xyz&fbclid=IwAR0';
    const cleaned = normalizeUrl(raw);

    assert.strictEqual(cleaned.startsWith('https://'), true);
    assert.ok(!cleaned.includes('utm_source'));
    assert.ok(!cleaned.includes('si='));
    assert.ok(!cleaned.includes('fbclid'));
    assert.ok(cleaned.includes('v=dQw4w9WgXcQ'));
  });

  test('validateUrlForSSRF should allow legitimate public social domains', () => {
    assert.strictEqual(validateUrlForSSRF('https://www.youtube.com/watch?v=dQw4w9WgXcQ'), true);
    assert.strictEqual(validateUrlForSSRF('https://tiktok.com/@creator/video/12345'), true);
    assert.strictEqual(validateUrlForSSRF('https://instagram.com/reel/C8_abc123'), true);
    assert.strictEqual(validateUrlForSSRF('https://x.com/user/status/123456789'), true);
    assert.strictEqual(validateUrlForSSRF('https://vimeo.com/76979871'), true);
  });

  test('validateUrlForSSRF should block loopback and local IPs', () => {
    assert.throws(() => validateUrlForSSRF('http://localhost/admin'), /prohibited/i);
    assert.throws(() => validateUrlForSSRF('http://127.0.0.1:80/admin'), /prohibited/i);
    assert.throws(() => validateUrlForSSRF('http://0.0.0.0/'), /prohibited/i);
    assert.throws(() => validateUrlForSSRF('http://[::1]/'), /prohibited/i);
  });

  test('validateUrlForSSRF should block private RFC1918 subnets', () => {
    assert.throws(() => validateUrlForSSRF('http://192.168.1.1/secret'), /prohibited/i);
    assert.throws(() => validateUrlForSSRF('http://10.0.0.5/data'), /prohibited/i);
    assert.throws(() => validateUrlForSSRF('http://172.16.0.1/status'), /prohibited/i);
  });

  test('validateUrlForSSRF should block cloud metadata endpoints', () => {
    assert.throws(() => validateUrlForSSRF('http://169.254.169.254/latest/meta-data'), /prohibited/i);
    assert.throws(() => validateUrlForSSRF('http://metadata.google.internal/computeMetadata/v1/'), /prohibited/i);
  });

  test('validateUrlForSSRF should block non-standard ports', () => {
    assert.throws(() => validateUrlForSSRF('https://youtube.com:22/watch?v=123'), /Custom ports/i);
    assert.throws(() => validateUrlForSSRF('https://vimeo.com:3306/12345'), /Custom ports/i);
  });
});

describe('Platform Adapter Resolution Tests', () => {
  test('AdapterRegistry should resolve YouTubeAdapter for youtube links', () => {
    const adapter = adapterRegistry.resolveAdapter('https://youtube.com/watch?v=dQw4w9WgXcQ');
    assert.strictEqual(adapter.platformKey, 'youtube');
  });

  test('AdapterRegistry should resolve TikTokAdapter for tiktok links', () => {
    const adapter = adapterRegistry.resolveAdapter('https://www.tiktok.com/@user/video/12345');
    assert.strictEqual(adapter.platformKey, 'tiktok');
  });

  test('AdapterRegistry should resolve InstagramAdapter for instagram reels', () => {
    const adapter = adapterRegistry.resolveAdapter('https://instagram.com/reel/C8_abc123');
    assert.strictEqual(adapter.platformKey, 'instagram');
  });

  test('AdapterRegistry should resolve TwitterAdapter for X/Twitter links', () => {
    const adapter = adapterRegistry.resolveAdapter('https://x.com/nasa/status/987654321');
    assert.strictEqual(adapter.platformKey, 'twitter');
  });

  test('AdapterRegistry should resolve VimeoAdapter for Vimeo links', () => {
    const adapter = adapterRegistry.resolveAdapter('https://vimeo.com/76979871');
    assert.strictEqual(adapter.platformKey, 'vimeo');
  });

  test('AdapterRegistry should resolve DirectStreamAdapter for direct mp4 links', () => {
    const adapter = adapterRegistry.resolveAdapter('https://example-cdn.com/videos/sample.mp4');
    assert.strictEqual(adapter.platformKey, 'direct');
  });

  test('AdapterRegistry should throw error for unsupported platform', () => {
    assert.throws(() => {
      adapterRegistry.resolveAdapter('https://unknown-random-unsupported-site.com/media');
    }, /Unsupported platform URL/i);
  });
});

describe('Media API Endpoints with Adapters', () => {
  let server;
  let baseUrl;
  const ADAPTER_TEST_PORT = 5097;

  before((_, done) => {
    const app = createApp();
    server = app.listen(ADAPTER_TEST_PORT, () => {
      baseUrl = `http://127.0.0.1:${ADAPTER_TEST_PORT}`;
      done();
    });
  });

  after((_, done) => {
    server.close(done);
  });

  test('GET /api/v1/media/platforms should return list of supported adapters', async () => {
    const res = await fetch(`${baseUrl}/api/v1/media/platforms`);
    assert.strictEqual(res.status, 200);

    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.ok(Array.isArray(body.data.platforms));
    assert.ok(body.data.platforms.some((p) => p.platformKey === 'youtube'));
    assert.ok(body.data.platforms.some((p) => p.platformKey === 'tiktok'));
  });

  test('POST /api/v1/media/info with unsupported site should return 400', async () => {
    const res = await fetch(`${baseUrl}/api/v1/media/info`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: 'https://unsupported-unknown-domain.org/video' })
    });

    assert.strictEqual(res.status, 400);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.error.code, 'UNSUPPORTED_PLATFORM');
  });
});
