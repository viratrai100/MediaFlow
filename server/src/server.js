  import { createApp } from './app.js';
import { env } from './config/env.js';
import { connectDB, disconnectDB } from './config/db.js';
import { logger } from './utils/logger.js';

async function bootstrap() {
  const app = createApp();

  // Initialize Database
  await connectDB();

  // Start HTTP Listener
  const server = app.listen(env.PORT, () => {
    logger.success(`🚀 Express Server running on http://localhost:${env.PORT} in [${env.NODE_ENV}] mode`);
    logger.info(`Health check available at: http://localhost:${env.PORT}/api/v1/health`);
  });

  // Graceful Shutdown handler
  const shutdown = async (signal) => {
    logger.info(`Received ${signal}. Gracefully terminating Express server...`);
    server.close(async () => {
      logger.info('HTTP server closed.');
      await disconnectDB();
      logger.success('Process cleanly exited.');
      process.exit(0);
    });

    // Force close after 10s if stuck
    setTimeout(() => {
      logger.error('Could not close connections in time, forcefully shutting down.');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  process.on('unhandledRejection', (err) => {
    logger.error('Unhandled Promise Rejection:', err.stack || err);
  });

  process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception:', err.stack || err);
    process.exit(1);
  });
}

bootstrap();
