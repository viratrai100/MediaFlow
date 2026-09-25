import { normalizeUrl } from '../services/url/urlNormalizer.js';
import { validateUrlForSSRF } from '../services/url/ssrfValidator.js';
import { adapterRegistry } from '../services/extractors/AdapterRegistry.js';
import { AppError } from '../utils/appError.js';
import { HTTP_STATUS } from '../constants/httpStatusCodes.js';
import { ERROR_CODES } from '../constants/errorCodes.js';

/**
 * Middleware: Normalize URL, enforce SSRF protection, and resolve adapter
 */
export function validateUrl(req, res, next) {
  const rawUrl = req.body?.url || req.query?.url;

  if (!rawUrl || typeof rawUrl !== 'string' || !rawUrl.trim()) {
    return next(
      new AppError(
        'A valid media URL is required.',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.INVALID_URL
      )
    );
  }

  try {
    // 1. Normalize and strip tracking query params
    const normalized = normalizeUrl(rawUrl);

    // 2. Enforce SSRF blocklists and private IP checks
    validateUrlForSSRF(normalized);

    // 3. Resolve matching platform adapter
    const adapter = adapterRegistry.resolveAdapter(normalized);

    req.rawUrl = rawUrl;
    req.sanitizedUrl = normalized;
    req.mediaPlatform = adapter.platformKey;
    req.platformAdapter = adapter;

    next();
  } catch (err) {
    if (err instanceof AppError) return next(err);

    // Check for SSRF / security violation
    const isSsrf = err.message && (err.message.includes('SSRF') || err.message.includes('prohibited'));
    if (isSsrf) {
      return next(
        new AppError(
          err.message,
          HTTP_STATUS.FORBIDDEN,
          ERROR_CODES.PRIVATE_MEDIA_RESTRICTED
        )
      );
    }

    return next(
      new AppError(
        err.message || 'Invalid media URL.',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.INVALID_URL
      )
    );
  }
}
