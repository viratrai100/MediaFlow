import { AppError } from '../utils/appError.js';
import { HTTP_STATUS } from '../constants/httpStatusCodes.js';
import { ERROR_CODES } from '../constants/errorCodes.js';

/**
 * 404 Route Not Found Middleware
 */
export function notFoundHandler(req, res, next) {
  next(
    new AppError(
      `Cannot find endpoint ${req.method} ${req.originalUrl} on this server.`,
      HTTP_STATUS.NOT_FOUND,
      ERROR_CODES.ROUTE_NOT_FOUND
    )
  );
}
