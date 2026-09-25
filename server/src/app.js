import express from 'express';
import { configureSecurity } from './config/security.js';
import { requestLogger } from './middlewares/requestLogger.js';
import { apiRateLimiter } from './middlewares/rateLimiter.js';
import { notFoundHandler } from './middlewares/notFoundHandler.js';
import { errorHandler } from './middlewares/errorHandler.js';
import apiRoutes from './routes/api.routes.js';

export function createApp() {
  const app = express();

  // Trust proxy for rate limiting behind reverse proxies (nginx, load balancers)
  app.set('trust proxy', 1);

  // Security HTTP headers and CORS
  configureSecurity(app);

  // Body parsers
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // HTTP Request Logging
  app.use(requestLogger);

  // Rate Limiting
  app.use('/api', apiRateLimiter);

  // Favicon 204 handler
  app.get('/favicon.ico', (req, res) => res.status(204).end());

  // Root & Direct Health Check for Cloud Load Balancers
  app.get('/', (req, res) => res.status(200).json({ status: 'ok', message: 'MediaFlow API is live', time: new Date().toISOString() }));
  app.get('/health', (req, res) => res.status(200).json({ status: 'ok', service: 'mediaflow-backend' }));

  // API Routes Mount
  app.use('/api/v1', apiRoutes);

  // 404 Handler for unmatched routes
  app.use(notFoundHandler);

  // Centralized Error Handling
  app.use(errorHandler);

  return app;
}
