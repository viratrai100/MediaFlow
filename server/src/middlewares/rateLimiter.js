import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';
import { HTTP_STATUS } from '../constants/httpStatusCodes.js';
import { ERROR_CODES } from '../constants/errorCodes.js';
import { ApiResponse } from '../utils/apiResponse.js';

/**
 * Standard General API Rate Limiter (e.g. 2000 req / 15 min; excludes direct stream downloads & health)
 */
export const apiRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000,
  max: env.isDevelopment ? 5000 : (env.RATE_LIMIT_MAX_REQUESTS || 2000),
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Never block streaming download endpoints or health check with general API limiter
    return req.path.includes('/download') || req.path.includes('/health');
  },
  handler: (req, res) => {
    const retrySec = Math.ceil((env.RATE_LIMIT_WINDOW_MS || 900000) / 1000);
    res.setHeader('Retry-After', retrySec);
    return ApiResponse.error(
      res,
      `Too many API requests. Please try again after ${Math.ceil((env.RATE_LIMIT_WINDOW_MS || 900000) / 60000)} minutes.`,
      HTTP_STATUS.TOO_MANY_REQUESTS,
      ERROR_CODES.RATE_LIMIT_EXCEEDED,
      {
        retryAfterMinutes: Math.ceil((env.RATE_LIMIT_WINDOW_MS || 900000) / 60000),
        retryAfterSeconds: retrySec
      }
    );
  }
});

/**
 * Strict Auth Rate Limiter (e.g. 30 attempts / 15 min for signup/login to prevent brute-force)
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30,                  // max 30 attempts per IP
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  handler: (req, res) => {
    res.setHeader('Retry-After', 900);
    return ApiResponse.error(
      res,
      'Too many authentication attempts from this IP. Please wait 15 minutes before retrying.',
      HTTP_STATUS.TOO_MANY_REQUESTS,
      ERROR_CODES.RATE_LIMIT_EXCEEDED,
      {
        retryAfterMinutes: 15,
        retryAfterSeconds: 900
      }
    );
  }
});

/**
 * Media Ingest Rate Limiter (e.g. 300 requests / 10 min)
 */
export const mediaRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: env.isDevelopment ? 1000 : 300,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    return req.path.includes('/download');
  },
  handler: (req, res) => {
    res.setHeader('Retry-After', 600);
    return ApiResponse.error(
      res,
      'Media extraction rate limit reached. Please wait 10 minutes before downloading more items.',
      HTTP_STATUS.TOO_MANY_REQUESTS,
      ERROR_CODES.RATE_LIMIT_EXCEEDED,
      {
        retryAfterMinutes: 10,
        retryAfterSeconds: 600
      }
    );
  }
});
