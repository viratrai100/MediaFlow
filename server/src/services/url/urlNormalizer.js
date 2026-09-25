/**
 * URL Normalizer & Query Parameter Stripper
 * Cleans user-submitted URLs and removes tracking/referral junk.
 */

// Tracking parameters commonly appended by social media share buttons
const TRACKING_PARAMS = new Set([
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'fbclid',
  'igsh',
  'si',
  'feature',
  'share_id',
  'ref',
  'source',
  't',
  'gclid',
  'mc_eid',
  '_hsenc',
  '_hsmi'
]);

export function normalizeUrl(inputUrl) {
  if (!inputUrl || typeof inputUrl !== 'string') {
    throw new Error('A valid URL string must be provided.');
  }

  let raw = inputUrl.trim();

  // Prepend https:// if protocol is missing
  if (!/^https?:\/\//i.test(raw)) {
    raw = 'https://' + raw;
  }

  let parsed;
  try {
    parsed = new URL(raw);
  } catch (err) {
    throw new Error('Invalid URL format: could not parse URL structure.');
  }

  // Canonicalize protocol to https
  parsed.protocol = 'https:';

  // Lowercase hostname
  parsed.hostname = parsed.hostname.toLowerCase();

  // Strip port 80/443 default ports
  if (parsed.port === '80' || parsed.port === '443') {
    parsed.port = '';
  }

  // Remove trailing slashes from path if not root
  if (parsed.pathname.length > 1 && parsed.pathname.endsWith('/')) {
    parsed.pathname = parsed.pathname.slice(0, -1);
  }

  // Strip userinfo (e.g. user:pass@)
  parsed.username = '';
  parsed.password = '';

  // Remove tracking search params
  const cleanParams = new URLSearchParams();
  for (const [key, val] of parsed.searchParams.entries()) {
    if (!TRACKING_PARAMS.has(key.toLowerCase())) {
      cleanParams.append(key, val);
    }
  }
  parsed.search = cleanParams.toString();

  // Remove hash/fragment
  parsed.hash = '';

  return parsed.toString();
}

/**
 * Extract clean hostname without www
 */
export function getCleanHostname(url) {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./i, '').toLowerCase();
  } catch (e) {
    return '';
  }
}
