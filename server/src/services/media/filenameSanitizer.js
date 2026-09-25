/**
 * Filename Sanitizer Utility
 * Sanitizes video and audio titles into safe filenames preventing
 * path traversal, null-byte injection, and Content-Disposition corruption.
 */

export function sanitizeFilename(rawTitle, extension = 'mp4', maxLen = 80) {
  if (!rawTitle || typeof rawTitle !== 'string') {
    return `media_${Date.now()}.${extension.replace(/^\./, '')}`;
  }

  // 1. Remove dangerous characters (/ \ : * ? " < > | null-bytes)
  let safe = rawTitle
    .replace(/[\/\?<>\\:\*\|":]/g, '')
    .replace(/[\x00-\x1f\x80-\x9f]/g, '') // Control chars
    .replace(/\.\.+/g, '')               // Path traversal dots
    .trim();

  // 2. Replace multiple spaces/underscores with a single underscore
  safe = safe.replace(/[\s\-_]+/g, '_');

  // 3. Remove leading/trailing periods, underscores, or hyphens
  safe = safe.replace(/^[\._\-]+|[\._\-]+$/g, '');

  // 4. Truncate length
  if (safe.length > maxLen) {
    safe = safe.slice(0, maxLen);
  }

  // Fallback if title becomes empty
  if (!safe) {
    safe = `media_${Date.now()}`;
  }

  const cleanExt = (extension || 'mp4').replace(/^\./, '').toLowerCase();
  return `${safe}.${cleanExt}`;
}

/**
 * Generates RFC 5987 compliant Content-Disposition header
 */
export function buildContentDisposition(filename, type = 'attachment') {
  const safeAscii = filename.replace(/[^a-zA-Z0-9\._\-]/g, '_');
  const encodedUtf8 = encodeURIComponent(filename);

  return `${type}; filename="${safeAscii}"; filename*=UTF-8''${encodedUtf8}`;
}
