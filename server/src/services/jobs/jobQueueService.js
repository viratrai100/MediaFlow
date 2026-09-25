import fs from 'fs';
import { DownloadJob } from '../../models/DownloadJob.js';
import { User } from '../../models/User.js';
import { AuditLog } from '../../models/AuditLog.js';
import { adapterRegistry } from '../extractors/AdapterRegistry.js';
import { tempFileManager } from '../media/tempFileManager.js';
import { sanitizeFilename } from '../media/filenameSanitizer.js';
import { AppError } from '../../utils/appError.js';
import { HTTP_STATUS } from '../../constants/httpStatusCodes.js';
import { ERROR_CODES } from '../../constants/errorCodes.js';
import { logger } from '../../utils/logger.js';

class JobQueueService {
  constructor() {
    this.activeWorkers = new Map(); // jobId -> { abortController, processInfo }
    this.concurrencyLimits = {
      guest: 4,
      user: 10,
      admin: 25
    };
    this.isProcessingQueue = false;

    // Start background stale cleaner interval (every 5 minutes)
    setInterval(() => this.cleanupStaleJobs(), 5 * 60 * 1000);
  }

  /**
   * Enqueue a new download job with quota and concurrency verification
   */
  async enqueueJob({ url, formatId = '720p', user = null, ip = 'unknown' }) {
    const userRole = user ? user.role : 'guest';
    const limit = this.concurrencyLimits[userRole] || 4;

    // 1. Verify active concurrency limit for user/IP
    const activeCount = await this.countActiveJobsForUser(user ? user._id : null, ip);
    if (activeCount >= limit) {
      throw new AppError(
        `Active download limit reached (${activeCount}/${limit}). Please wait a moment for current jobs to finish or cancel an active job.`,
        HTTP_STATUS.TOO_MANY_REQUESTS,
        ERROR_CODES.RATE_LIMIT_EXCEEDED,
        { activeCount, limit, retryAfterSeconds: 30 }
      );
    }

    // 2. Check and increment user daily quota if authenticated
    if (user) {
      const dbUser = await User.findById(user._id);
      if (dbUser) {
        // Reset quota if day changed
        const today = new Date().toDateString();
        const lastReset = new Date(dbUser.quota.lastResetDate).toDateString();
        if (today !== lastReset) {
          dbUser.quota.downloadsToday = 0;
          dbUser.quota.lastResetDate = new Date();
        }

        if (dbUser.quota.downloadsToday >= dbUser.quota.dailyLimit && dbUser.role !== 'admin') {
          throw new AppError(
            `Daily download quota exceeded (${dbUser.quota.downloadsToday}/${dbUser.quota.dailyLimit}). Please upgrade or try again tomorrow.`,
            HTTP_STATUS.TOO_MANY_REQUESTS,
            ERROR_CODES.RATE_LIMIT_EXCEEDED
          );
        }

        dbUser.quota.downloadsToday += 1;
        await dbUser.save({ validateBeforeSave: false });
      }
    }

    // 3. Resolve metadata from platform adapter
    const adapter = adapterRegistry.resolveAdapter(url);
    const normalizedUrl = adapter.normalize(url);
    let metadata;
    try {
      metadata = await adapter.extractMetadata(normalizedUrl);
    } catch (err) {
      metadata = {
        title: 'Social Media Stream',
        platform: adapter.platformKey,
        durationSeconds: 0,
        formats: []
      };
    }

    const isAudio = formatId.startsWith('mp3') || formatId.startsWith('m4a') || formatId.includes('audio');
    const container = isAudio ? 'mp3' : 'mp4';
    const mediaType = isAudio ? 'audio' : 'video';

    // 4. Create Job document in MongoDB
    const job = await DownloadJob.create({
      user: user ? user._id : null,
      clientIpHash: ip,
      platform: adapter.platformKey,
      url: normalizedUrl,
      mediaTitle: metadata.title || 'Untitled Media',
      formatId,
      container,
      mediaType,
      durationSeconds: metadata.durationSeconds || 0,
      status: 'queued',
      progress: 0
    });

    logger.info(`📥 Job #${job._id} Enqueued [${adapter.platformKey} - ${formatId}]`);

    // 5. Trigger queue processor asynchronously
    setImmediate(() => this.processNextJobs());

    return job;
  }

  /**
   * Process pending queued jobs
   */
  async processNextJobs() {
    if (this.isProcessingQueue) return;
    this.isProcessingQueue = true;

    try {
      const queuedJobs = await DownloadJob.find({ status: 'queued' })
        .sort({ createdAt: 1 })
        .limit(5);

      for (const job of queuedJobs) {
        // Double check concurrency before picking up
        const activeCount = await this.countActiveJobsForUser(job.user, job.clientIpHash);
        const limit = job.user ? this.concurrencyLimits.user : this.concurrencyLimits.guest;

        if (activeCount < limit) {
          this.executeJob(job._id);
        }
      }
    } catch (err) {
      logger.error('Error in processNextJobs:', err.message);
    } finally {
      this.isProcessingQueue = false;
    }
  }

  /**
   * Execute an individual job lifecycle
   */
  async executeJob(jobId) {
    const job = await DownloadJob.findById(jobId);
    if (!job || job.status !== 'queued') return;

    const abortController = new AbortController();
    this.activeWorkers.set(job._id.toString(), {
      abortController,
      startedAt: Date.now()
    });

    try {
      // Transition to processing
      job.status = 'processing';
      job.progress = 5;
      await job.save();
      logger.stream(`⚡ Job #${job._id} Processing Started: ${job.mediaTitle}`);

      const adapter = adapterRegistry.resolveAdapter(job.url);
      const streamSource = await adapter.getStreamSources(job.url, job.formatId);

      if (!streamSource || !streamSource.stream) {
        throw new Error('Platform stream source could not be resolved.');
      }

      // Create scratch file in temp directory for buffered download
      const tempPath = tempFileManager.createTempPath(job.container);
      job.tempFilePath = tempPath;
      await job.save();

      // Pipe source stream to temp scratch file with progress tracking
      await new Promise((resolve, reject) => {
        const writeStream = fs.createWriteStream(tempPath);
        let bytesReceived = 0;

        const onAbort = () => {
          writeStream.destroy();
          if (streamSource.stream && typeof streamSource.stream.destroy === 'function') {
            streamSource.stream.destroy();
          }
          reject(new Error('JOB_CANCELLED'));
        };

        abortController.signal.addEventListener('abort', onAbort);

        streamSource.stream.on('data', (chunk) => {
          bytesReceived += chunk.length;
          // Increment progress safely
          if (job.progress < 90) {
            job.progress = Math.min(90, job.progress + 5);
          }
        });

        streamSource.stream.on('error', (err) => {
          abortController.signal.removeEventListener('abort', onAbort);
          reject(err);
        });

        writeStream.on('error', (err) => {
          abortController.signal.removeEventListener('abort', onAbort);
          reject(err);
        });

        writeStream.on('finish', async () => {
          abortController.signal.removeEventListener('abort', onAbort);
          try {
            const stats = await fs.promises.stat(tempPath);
            job.fileSizeMB = parseFloat((stats.size / 1024 / 1024).toFixed(2));
            resolve();
          } catch (e) {
            resolve();
          }
        });

        streamSource.stream.pipe(writeStream);
      });

      // Mark completed
      job.status = 'completed';
      job.progress = 100;
      await job.save();
      logger.success(`✔ Job #${job._id} Completed [Size: ${job.fileSizeMB} MB]`);

      // Audit Log
      await AuditLog.create({
        user: job.user,
        action: 'JOB_COMPLETED',
        resource: 'job',
        details: { jobId: job._id, platform: job.platform, fileSizeMB: job.fileSizeMB },
        status: 'success'
      });

    } catch (err) {
      const isCancelled = err.message === 'JOB_CANCELLED' || abortController.signal.aborted;

      if (isCancelled) {
        job.status = 'cancelled';
        job.errorMessage = 'Download was cancelled by user.';
        logger.warn(`🚫 Job #${job._id} Cancelled by user.`);
      } else {
        job.status = 'failed';
        let friendlyMsg = err.message || 'Media extraction pipeline failed.';
        if (friendlyMsg.includes('Failed to find any playable formats') || friendlyMsg.includes('No playable formats')) {
          friendlyMsg = 'The platform has restricted or protected progressive stream playback for this video. Please try another video or platform.';
        }
        job.errorMessage = friendlyMsg;
        logger.error(`✖ Job #${job._id} Failed:`, friendlyMsg);
      }

      // Cleanup any created temp scratch file on error/cancel
      if (job.tempFilePath) {
        await tempFileManager.safeUnlink(job.tempFilePath);
        job.tempFilePath = null;
      }

      await job.save();
    } finally {
      this.activeWorkers.delete(job._id.toString());
      // Trigger next queued job
      setImmediate(() => this.processNextJobs());
    }
  }

  /**
   * Cancel an active or queued job
   */
  async cancelJob(jobId, user = null, ip = 'unknown') {
    const job = await DownloadJob.findById(jobId);
    if (!job) {
      throw new AppError('Job not found.', HTTP_STATUS.NOT_FOUND, ERROR_CODES.ROUTE_NOT_FOUND);
    }

    // Verify ownership
    this.assertJobOwnership(job, user, ip);

    if (['completed', 'failed', 'cancelled'].includes(job.status)) {
      return job; // Already in final state
    }

    // If active worker running, trigger abort signal
    const worker = this.activeWorkers.get(job._id.toString());
    if (worker && worker.abortController) {
      worker.abortController.abort();
    }

    job.status = 'cancelled';
    job.errorMessage = 'Cancelled by user request.';
    if (job.tempFilePath) {
      await tempFileManager.safeUnlink(job.tempFilePath);
      job.tempFilePath = null;
    }
    await job.save();

    logger.info(`Job #${jobId} marked cancelled.`);
    return job;
  }

  /**
   * Assert user or IP owns the job
   */
  assertJobOwnership(job, user, ip) {
    if (!job) return;

    if (user) {
      // If user is admin, allow access
      if (user.role === 'admin') return;

      // If job belongs to authenticated user, verify match
      if (job.user && job.user.toString() === user._id.toString()) return;
    }

    // If job was created by guest with matching IP
    if (!job.user && job.clientIpHash === ip) return;

    throw new AppError(
      'Forbidden: You do not have permission to access or manage this download job.',
      HTTP_STATUS.FORBIDDEN,
      ERROR_CODES.PRIVATE_MEDIA_RESTRICTED
    );
  }

  /**
   * Count active processing/queued jobs for a user/IP
   */
  async countActiveJobsForUser(userId, ip) {
    // Auto-expire any jobs that have been stuck in queued/processing for > 2 minutes
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
    try {
      await DownloadJob.updateMany(
        {
          ...(userId ? { user: userId } : { clientIpHash: ip, user: null }),
          status: { $in: ['queued', 'processing'] },
          updatedAt: { $lt: twoMinutesAgo }
        },
        {
          $set: {
            status: 'failed',
            errorMessage: 'Job expired due to inactivity.'
          }
        }
      );
    } catch (e) {}

    const query = {
      status: { $in: ['queued', 'processing'] }
    };

    if (userId) {
      query.user = userId;
    } else {
      query.clientIpHash = ip;
      query.user = null;
    }

    return DownloadJob.countDocuments(query);
  }

  /**
   * Stale Job Cleaner: Auto-fails jobs stuck in processing for > 30 minutes
   */
  async cleanupStaleJobs() {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

    try {
      const staleJobs = await DownloadJob.find({
        status: 'processing',
        updatedAt: { $lt: thirtyMinutesAgo }
      });

      for (const job of staleJobs) {
        job.status = 'failed';
        job.errorMessage = 'Job timed out after 30 minutes of inactivity.';
        if (job.tempFilePath) {
          await tempFileManager.safeUnlink(job.tempFilePath);
          job.tempFilePath = null;
        }
        await job.save();
        logger.warn(`🧹 Cleaned up stale job #${job._id}`);
      }
    } catch (e) {
      logger.error('Error cleaning stale jobs:', e.message);
    }
  }
}

export const jobQueueService = new JobQueueService();
