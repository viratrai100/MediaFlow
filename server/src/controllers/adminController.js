import os from 'os';
import { User } from '../models/User.js';
import { DownloadJob } from '../models/DownloadJob.js';
import { PlatformConfig } from '../models/PlatformConfig.js';
import { AuditLog } from '../models/AuditLog.js';
import { AppSettings } from '../models/AppSettings.js';
import { jobQueueService } from '../services/jobs/jobQueueService.js';
import { tempFileManager } from '../services/media/tempFileManager.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { AppError } from '../utils/appError.js';
import { HTTP_STATUS } from '../constants/httpStatusCodes.js';
import { ERROR_CODES } from '../constants/errorCodes.js';

export class AdminController {
  /**
   * GET /api/v1/admin/stats - Aggregated system statistics & telemetry
   */
  static async getSystemStats(req, res, next) {
    try {
      const memoryUsage = process.memoryUsage();

      const [
        totalUsers,
        totalJobs,
        completedJobs,
        failedJobs,
        activeJobs,
        recentAudits
      ] = await Promise.all([
        User.countDocuments(),
        DownloadJob.countDocuments(),
        DownloadJob.countDocuments({ status: 'completed' }),
        DownloadJob.countDocuments({ status: 'failed' }),
        DownloadJob.countDocuments({ status: { $in: ['queued', 'processing'] } }),
        AuditLog.find().sort({ createdAt: -1 }).limit(5).lean()
      ]);

      const stats = {
        users: {
          totalRegistered: totalUsers,
          adminCount: await User.countDocuments({ role: 'admin' }),
          blockedCount: await User.countDocuments({ isBlocked: true })
        },
        jobs: {
          total: totalJobs,
          completed: completedJobs,
          failed: failedJobs,
          active: activeJobs,
          successRate: totalJobs > 0 ? ((completedJobs / totalJobs) * 100).toFixed(1) + '%' : '100%'
        },
        system: {
          nodeVersion: process.version,
          uptimeSeconds: Math.floor(process.uptime()),
          memory: {
            heapUsedMB: Math.round(memoryUsage.heapUsed / 1024 / 1024),
            heapTotalMB: Math.round(memoryUsage.heapTotal / 1024 / 1024),
            rssMB: Math.round(memoryUsage.rss / 1024 / 1024)
          },
          cpuCount: os.cpus().length,
          activeWorkerPipes: jobQueueService.activeWorkers.size
        },
        recentAudits
      };

      return ApiResponse.success(res, stats, 'Admin system metrics retrieved.');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/admin/users - List users with pagination & search
   */
  static async listUsers(req, res, next) {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = Math.min(50, parseInt(req.query.limit, 10) || 15);
      const skip = (page - 1) * limit;

      const { search, role, status } = req.query;
      const query = {};

      if (search && search.trim()) {
        query.$or = [
          { username: { $regex: search.trim(), $options: 'i' } },
          { email: { $regex: search.trim(), $options: 'i' } }
        ];
      }

      if (role && role !== 'all') {
        query.role = role;
      }

      if (status === 'blocked') {
        query.isBlocked = true;
      } else if (status === 'active') {
        query.isBlocked = false;
      }

      const [users, totalCount] = await Promise.all([
        User.find(query)
          .select('-passwordHash')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        User.countDocuments(query)
      ]);

      const totalPages = Math.ceil(totalCount / limit) || 1;

      return ApiResponse.success(
        res,
        {
          users,
          pagination: {
            currentPage: page,
            totalPages,
            totalItems: totalCount,
            limit
          }
        },
        'User accounts list retrieved.'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/admin/users/:id - Update user role, status, quota
   */
  static async updateUser(req, res, next) {
    try {
      const { id } = req.params;
      const { role, isBlocked, dailyLimit } = req.body;

      const user = await User.findById(id);
      if (!user) {
        throw new AppError('User not found.', HTTP_STATUS.NOT_FOUND, ERROR_CODES.ROUTE_NOT_FOUND);
      }

      // Prevent admin self-demotion or self-blocking
      if (req.user._id.toString() === user._id.toString()) {
        if (role === 'user' || isBlocked === true) {
          throw new AppError(
            'Cannot modify your own administrative privileges or block your own account.',
            HTTP_STATUS.FORBIDDEN,
            ERROR_CODES.PRIVATE_MEDIA_RESTRICTED
          );
        }
      }

      if (role && ['user', 'admin'].includes(role)) {
        user.role = role;
      }

      if (typeof isBlocked === 'boolean') {
        user.isBlocked = isBlocked;
      }

      if (typeof dailyLimit === 'number' && dailyLimit >= 0) {
        user.quota.dailyLimit = dailyLimit;
      }

      await user.save();

      // Log audit
      await AuditLog.create({
        user: req.user._id,
        action: 'ADMIN_USER_UPDATED',
        resource: 'user',
        details: { targetUserId: user._id, updates: { role, isBlocked, dailyLimit } },
        status: 'success'
      });

      return ApiResponse.success(
        res,
        { user: user.toSafeObject() },
        'User updated successfully.'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/admin/jobs - System-wide download job monitor
   */
  static async listAllJobs(req, res, next) {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = Math.min(50, parseInt(req.query.limit, 10) || 15);
      const skip = (page - 1) * limit;

      const { status, platform, search } = req.query;
      const query = {};

      if (status && status !== 'all') {
        query.status = status;
      }

      if (platform && platform !== 'all') {
        query.platform = platform.toLowerCase();
      }

      if (search && search.trim()) {
        query.mediaTitle = { $regex: search.trim(), $options: 'i' };
      }

      const [jobs, totalCount] = await Promise.all([
        DownloadJob.find(query)
          .populate('user', 'username email')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        DownloadJob.countDocuments(query)
      ]);

      const totalPages = Math.ceil(totalCount / limit) || 1;

      return ApiResponse.success(
        res,
        {
          jobs,
          pagination: {
            currentPage: page,
            totalPages,
            totalItems: totalCount,
            limit
          }
        },
        'All system download jobs retrieved.'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/admin/jobs/:id/cancel - Force cancel any job
   */
  static async forceCancelJob(req, res, next) {
    try {
      const { id } = req.params;
      const cancelled = await jobQueueService.cancelJob(id, req.user);

      await AuditLog.create({
        user: req.user._id,
        action: 'ADMIN_FORCE_CANCEL_JOB',
        resource: 'job',
        details: { jobId: id },
        status: 'success'
      });

      return ApiResponse.success(
        res,
        { id: cancelled._id, status: cancelled.status },
        'Job force cancelled by administrator.'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/admin/platforms - List all platform configs
   */
  static async listPlatforms(req, res, next) {
    try {
      let platforms = await PlatformConfig.find().lean();

      // Seed default configs if empty
      if (platforms.length === 0) {
        const defaults = [
          { platform: 'youtube', name: 'YouTube', isEnabled: true, rateLimitPerMinute: 20, maxDurationSeconds: 1800 },
          { platform: 'tiktok', name: 'TikTok', isEnabled: true, rateLimitPerMinute: 30, maxDurationSeconds: 600 },
          { platform: 'instagram', name: 'Instagram', isEnabled: true, rateLimitPerMinute: 25, maxDurationSeconds: 600 },
          { platform: 'twitter', name: 'X / Twitter', isEnabled: true, rateLimitPerMinute: 20, maxDurationSeconds: 900 },
          { platform: 'vimeo', name: 'Vimeo', isEnabled: true, rateLimitPerMinute: 15, maxDurationSeconds: 3600 },
          { platform: 'direct', name: 'Direct Streams', isEnabled: true, rateLimitPerMinute: 30, maxDurationSeconds: 3600 },
        ];
        await PlatformConfig.insertMany(defaults);
        platforms = await PlatformConfig.find().lean();
      }

      return ApiResponse.success(res, { platforms }, 'Platform configurations retrieved.');
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/admin/platforms/:platform - Update platform rules
   */
  static async updatePlatform(req, res, next) {
    try {
      const { platform } = req.params;
      const { isEnabled, rateLimitPerMinute, maxDurationSeconds } = req.body;

      const updated = await PlatformConfig.findOneAndUpdate(
        { platform: platform.toLowerCase() },
        {
          ...(typeof isEnabled === 'boolean' && { isEnabled }),
          ...(typeof rateLimitPerMinute === 'number' && { rateLimitPerMinute }),
          ...(typeof maxDurationSeconds === 'number' && { maxDurationSeconds }),
          lastHealthCheck: new Date()
        },
        { new: true, upsert: true }
      );

      await AuditLog.create({
        user: req.user._id,
        action: 'ADMIN_PLATFORM_CONFIG_UPDATED',
        resource: 'platform',
        details: { platform, updates: { isEnabled, rateLimitPerMinute, maxDurationSeconds } },
        status: 'success'
      });

      return ApiResponse.success(res, { platform: updated }, 'Platform configuration updated.');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/admin/audit-logs - View audit logs
   */
  static async listAuditLogs(req, res, next) {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = Math.min(50, parseInt(req.query.limit, 10) || 20);
      const skip = (page - 1) * limit;

      const { action, status } = req.query;
      const query = {};

      if (action && action !== 'all') {
        query.action = action;
      }
      if (status && status !== 'all') {
        query.status = status;
      }

      const [logs, totalCount] = await Promise.all([
        AuditLog.find(query)
          .populate('user', 'username email role')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        AuditLog.countDocuments(query)
      ]);

      const totalPages = Math.ceil(totalCount / limit) || 1;

      return ApiResponse.success(
        res,
        {
          logs,
          pagination: {
            currentPage: page,
            totalPages,
            totalItems: totalCount,
            limit
          }
        },
        'Audit logs retrieved.'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/admin/settings - Read AppSettings
   */
  static async getSettings(req, res, next) {
    try {
      const settings = await AppSettings.getSettings();
      return ApiResponse.success(res, { settings }, 'Global application settings retrieved.');
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/v1/admin/settings - Update AppSettings
   */
  static async updateSettings(req, res, next) {
    try {
      const updates = req.body;
      const settings = await AppSettings.findOneAndUpdate(
        { singletonKey: 'GLOBAL_SETTINGS' },
        { $set: updates },
        { new: true, upsert: true }
      );

      await AuditLog.create({
        user: req.user._id,
        action: 'ADMIN_SETTINGS_UPDATED',
        resource: 'settings',
        details: updates,
        status: 'success'
      });

      return ApiResponse.success(res, { settings }, 'Global application settings updated.');
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/admin/maintenance/gc - Trigger scratch cleanup
   */
  static async triggerGarbageCollection(req, res, next) {
    try {
      const purgedCount = await tempFileManager.purgeStaleFiles(0); // Force purge all completed scratch

      await AuditLog.create({
        user: req.user._id,
        action: 'ADMIN_MANUAL_GC_TRIGGERED',
        resource: 'system',
        details: { purgedCount },
        status: 'success'
      });

      return ApiResponse.success(
        res,
        { purgedCount, timestamp: new Date().toISOString() },
        `Garbage collection completed. Purged ${purgedCount} temporary files.`
      );
    } catch (error) {
      next(error);
    }
  }
}
