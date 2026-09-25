import net from 'net';

/**
 * Multi-Layered SSRF Protection & IP Blocklist Validator
 */

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  'localhost.localdomain',
  '127.0.0.1',
  '0.0.0.0',
  '::1',
  '[::1]',
  'metadata.google.internal',
  'instance-data',
  '169.254.169.254',
  '169.254.169.253',
  'local',
  'internal',
  'intranet'
]);

const BLOCKED_SUFFIXES = [
  '.local',
  '.internal',
  '.lan',
  '.home',
  '.corp',
  '.onion',
  '.invalid'
];

function isPrivateIPv4(ip) {
  const parts = ip.split('.').map((p) => parseInt(p, 10));
  if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) {
    return true;
  }

  const [a, b, c, d] = parts;

  // 0.0.0.0/8 (Current network)
  if (a === 0) return true;
  // 10.0.0.0/8 (Private network)
  if (a === 10) return true;
  // 127.0.0.0/8 (Loopback)
  if (a === 127) return true;
  // 169.254.0.0/16 (Link-local)
  if (a === 169 && b === 254) return true;
  // 172.16.0.0/12 (Private network)
  if (a === 172 && b >= 16 && b <= 31) return true;
  // 192.168.0.0/16 (Private network)
  if (a === 192 && b === 168) return true;
  // 224.0.0.0/4 (Multicast)
  if (a >= 224) return true;
  // 100.64.0.0/10 (Carrier-grade NAT)
  if (a === 100 && b >= 64 && b <= 127) return true;

  return false;
}

function isPrivateIPv6(ip) {
  const normalized = ip.toLowerCase().replace(/^\[|\]$/g, '');
  if (normalized === '::1' || normalized === '0:0:0:0:0:0:0:1' || normalized === '::') return true;
  if (normalized.startsWith('fc') || normalized.startsWith('fd')) return true;
  if (normalized.startsWith('fe8') || normalized.startsWith('fe9') || normalized.startsWith('fea') || normalized.startsWith('feb')) return true;
  if (normalized.includes('::ffff:')) {
    const ipv4Part = normalized.split('::ffff:')[1];
    if (net.isIP(ipv4Part) === 4) {
      return isPrivateIPv4(ipv4Part);
    }
  }
  return false;
}

/**
 * Checks for octal/hex/dword decimal IP representations
 */
function isEncodedIp(hostname) {
  // Pure integer dword IP (e.g. 2130706433)
  if (/^\d+$/.test(hostname)) {
    const num = parseInt(hostname, 10);
    if (!isNaN(num) && num >= 0 && num <= 4294967295) {
      return true;
    }
  }

  // Hexadecimal notation (e.g. 0x7f000001 or 0x7f.0.0.1)
  if (/^0x[0-9a-f]+$/i.test(hostname) || /0x/i.test(hostname)) {
    return true;
  }

  // Octal or leading-zero octets (e.g. 0177.0.0.1 or 127.000.000.001)
  const parts = hostname.split('.');
  if (parts.length > 1 && parts.some((p) => p.length > 1 && p.startsWith('0'))) {
    return true;
  }

  return false;
}

export function validateUrlForSSRF(url) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch (err) {
    throw new Error('Invalid URL format.');
  }

  // Protocol check
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error(`SSRF violation: Forbidden protocol "${parsed.protocol}". Only HTTP and HTTPS are allowed.`);
  }

  // Prohibit embedded credentials in URLs (e.g. http://user:pass@host/)
  if (parsed.username || parsed.password) {
    throw new Error('SSRF violation: User authentication in URL is prohibited.');
  }

  const rawHostname = parsed.hostname.toLowerCase().trim();
  const cleanHostname = rawHostname.replace(/^\[|\]$/g, '');

  // Block localhost and internal hosts
  if (
    BLOCKED_HOSTNAMES.has(rawHostname) ||
    BLOCKED_HOSTNAMES.has(cleanHostname) ||
    cleanHostname.startsWith('127.') ||
    cleanHostname.startsWith('0.')
  ) {
    throw new Error(`SSRF violation: Destination host "${rawHostname}" is prohibited.`);
  }

  // Block internal domain suffixes
  for (const suffix of BLOCKED_SUFFIXES) {
    if (cleanHostname.endsWith(suffix)) {
      throw new Error(`SSRF violation: Internal domain suffix "${suffix}" is prohibited.`);
    }
  }

  // Block encoded / alternative IP formats
  if (isEncodedIp(cleanHostname)) {
    throw new Error(`SSRF violation: Encoded IP/octal notation in host "${cleanHostname}" is prohibited.`);
  }

  // Check IPv4 & IPv6 addresses
  const ipType = net.isIP(cleanHostname);
  if (ipType === 4 && isPrivateIPv4(cleanHostname)) {
    throw new Error(`SSRF violation: Private IPv4 address "${cleanHostname}" is prohibited.`);
  }

  if (ipType === 6 && isPrivateIPv6(cleanHostname)) {
    throw new Error(`SSRF violation: Private IPv6 address "${cleanHostname}" is prohibited.`);
  }

  // Port restrictions
  if (parsed.port && parsed.port !== '80' && parsed.port !== '443') {
    throw new Error(`SSRF violation: Custom ports (${parsed.port}) are prohibited.`);
  }

  return true;
}
