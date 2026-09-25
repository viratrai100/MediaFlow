import os from 'os';
import { ApiResponse } from '../utils/apiResponse.js';
import { getDBStatus } from '../config/db.js';
import { env } from '../config/env.js';

/**
 * Health Check & Telemetry Controller
 */
export function getHealth(req, res) {
  const memoryUsage = process.memoryUsage();

  const healthData = {
    status: 'healthy',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
    database: {
      status: getDBStatus()
    },
    system: {
      platform: process.platform,
      nodeVersion: process.version,
      memory: {
        rssMB: Math.round(memoryUsage.rss / 1024 / 1024),
        heapUsedMB: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        heapTotalMB: Math.round(memoryUsage.heapTotal / 1024 / 1024)
      },
      cpuCount: os.cpus().length,
      loadAvg: os.loadavg()
    },
    policies: {
      rateLimitWindowMs: env.RATE_LIMIT_WINDOW_MS,
      maxRequests: env.RATE_LIMIT_MAX_REQUESTS,
      maxFileSizeMB: env.MAX_MEDIA_FILE_SIZE_MB
    }
  };

  return ApiResponse.success(res, healthData, 'System is healthy and operational.');
}
