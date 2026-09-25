import { logger } from '../utils/logger.js';

/**
 * Express Request & Latency Logger Middleware
 */
export function requestLogger(req, res, next) {
  const start = Date.now();
  const { method, originalUrl, ip } = req;

  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;

    const message = `${method} ${originalUrl} ${statusCode} - ${duration}ms [IP: ${ip || req.socket.remoteAddress}]`;

    if (statusCode >= 500) {
      logger.error(message);
    } else if (statusCode >= 400) {
      logger.warn(message);
    } else {
      logger.info(message);
    }
  });

  next();
}
