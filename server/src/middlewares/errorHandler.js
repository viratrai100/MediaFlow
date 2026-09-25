import { env } from '../config/env.js';
import { HTTP_STATUS } from '../constants/httpStatusCodes.js';
import { ERROR_CODES } from '../constants/errorCodes.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { logger } from '../utils/logger.js';

/**
 * Centralized Express Error Handling Middleware
 */
export function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  let errorCode = err.errorCode || ERROR_CODES.INTERNAL_SERVER_ERROR;
  let message = err.message || 'An unexpected internal error occurred.';
  let details = err.details || null;

  // Handle Mongoose Validation Error
  if (err.name === 'ValidationError') {
    statusCode = HTTP_STATUS.UNPROCESSABLE_ENTITY;
    errorCode = ERROR_CODES.VALIDATION_ERROR;
    message = 'Validation failed for one or more fields.';
    details = Object.values(err.errors).map((e) => e.message);
  }

  // Handle CastError (invalid MongoDB ObjectId)
  if (err.name === 'CastError') {
    statusCode = HTTP_STATUS.BAD_REQUEST;
    errorCode = ERROR_CODES.VALIDATION_ERROR;
    message = `Invalid format for field: ${err.path}`;
  }

  // Handle JSON parse syntax errors in body
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    statusCode = HTTP_STATUS.BAD_REQUEST;
    errorCode = ERROR_CODES.VALIDATION_ERROR;
    message = 'Malformed JSON body in request.';
  }

  // Log non-operational / 500 errors
  if (statusCode >= 500) {
    logger.error(`[Unhandled Exception] ${req.method} ${req.originalUrl}:`, err.stack || err);
  }

  // In development, attach stack trace to details if not explicitly set
  if (env.isDevelopment && !details && statusCode >= 500) {
    details = { stack: err.stack };
  }

  return ApiResponse.error(res, message, statusCode, errorCode, details);
}
