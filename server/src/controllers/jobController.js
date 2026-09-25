import fs from 'fs';
import { DownloadJob } from '../models/DownloadJob.js';
import { jobQueueService } from '../services/jobs/jobQueueService.js';
import { adapterRegistry } from '../services/extractors/AdapterRegistry.js';
import { tempFileManager } from '../services/media/tempFileManager.js';
import { pipeMediaToResponse } from '../services/media/streamPipeline.js';
import { sanitizeFilename } from '../services/media/filenameSanitizer.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { AppError } from '../utils/appError.js';
import { HTTP_STATUS } from '../constants/httpStatusCodes.js';
import { ERROR_CODES } from '../constants/errorCodes.js';

export class JobController {
  /**
   * POST /api/v1/jobs - Enqueue download job
   */
  static async createJob(req, res, next) {
    try {
      const { sanitizedUrl } = req;
      const { formatId = '720p' } = req.body;
      const clientIp = req.ip || req.socket.remoteAddress;

      const job = await jobQueueService.enqueueJob({
        url: sanitizedUrl,
        formatId,
        user: req.user,
        ip: clientIp
      });

      return ApiResponse.created(
        res,
        {
          jobId: job._id,
          status: job.status,
          mediaTitle: job.mediaTitle,
          platform: job.platform,
          formatId: job.formatId,
          container: job.container,
          createdAt: job.createdAt
        },
        'Download job enqueued successfully.'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/jobs - List user's jobs with pagination & filters
   */
  static async listJobs(req, res, next) {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = Math.min(50, parseInt(req.query.limit, 10) || 10);
      const skip = (page - 1) * limit;

      const { status, platform, search, type } = req.query;
      const clientIp = req.ip || req.socket.remoteAddress;

      const filter = {};

      // Scope to authenticated user or guest IP
      if (req.user) {
        filter.user = req.user._id;
      } else {
        filter.clientIpHash = clientIp;
        filter.user = null;
      }

      if (status && status !== 'all') {
        filter.status = status;
      }

      if (platform && platform !== 'all') {
        filter.platform = platform.toLowerCase();
      }

      if (type && type !== 'all') {
        filter.mediaType = type;
      }

      if (search && search.trim()) {
        filter.mediaTitle = { $regex: search.trim(), $options: 'i' };
      }

      const [jobs, totalCount] = await Promise.all([
        DownloadJob.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        DownloadJob.countDocuments(filter)
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
        'Download jobs retrieved successfully.'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/jobs/:id - Inspect specific job progress
   */
  static async getJobById(req, res, next) {
    try {
      const { id } = req.params;
      const clientIp = req.ip || req.socket.remoteAddress;

      const job = await DownloadJob.findById(id);
      if (!job) {
        throw new AppError('Job not found.', HTTP_STATUS.NOT_FOUND, ERROR_CODES.ROUTE_NOT_FOUND);
      }

      // Assert ownership
      jobQueueService.assertJobOwnership(job, req.user, clientIp);

      return ApiResponse.success(
        res,
        {
          id: job._id,
          status: job.status,
          progress: job.progress,
          mediaTitle: job.mediaTitle,
          platform: job.platform,
          formatId: job.formatId,
          container: job.container,
          mediaType: job.mediaType,
          fileSizeMB: job.fileSizeMB,
          durationSeconds: job.durationSeconds,
          errorMessage: job.errorMessage,
          isCompleted: job.status === 'completed',
          createdAt: job.createdAt,
          updatedAt: job.updatedAt
        },
        'Job details retrieved.'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/jobs/:id/cancel - Cancel active or queued job
   */
  static async cancelJob(req, res, next) {
    try {
      const { id } = req.params;
      const clientIp = req.ip || req.socket.remoteAddress;

      const cancelled = await jobQueueService.cancelJob(id, req.user, clientIp);

      return ApiResponse.success(
        res,
        {
          id: cancelled._id,
          status: cancelled.status,
          errorMessage: cancelled.errorMessage
        },
        'Job cancelled successfully.'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/jobs/:id - Delete individual job history record
   */
  static async deleteJob(req, res, next) {
    try {
      const { id } = req.params;
      const clientIp = req.ip || req.socket.remoteAddress;

      const job = await DownloadJob.findById(id);
      if (!job) {
        throw new AppError('Job not found.', HTTP_STATUS.NOT_FOUND, ERROR_CODES.ROUTE_NOT_FOUND);
      }

      jobQueueService.assertJobOwnership(job, req.user, clientIp);

      if (job.tempFilePath) {
        await tempFileManager.safeUnlink(job.tempFilePath);
      }

      await DownloadJob.findByIdAndDelete(id);

      return ApiResponse.success(
        res,
        { deletedId: id },
        'Job history record deleted.'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/jobs - Clear all jobs for user/IP
   */
  static async clearUserJobs(req, res, next) {
    try {
      const clientIp = req.ip || req.socket.remoteAddress;
      const filter = req.user
        ? { user: req.user._id }
        : { clientIpHash: clientIp, user: null };

      // Find jobs with temp files to unlink
      const jobsWithTemp = await DownloadJob.find({ ...filter, tempFilePath: { $ne: null } });
      for (const j of jobsWithTemp) {
        if (j.tempFilePath) {
          await tempFileManager.safeUnlink(j.tempFilePath);
        }
      }

      const result = await DownloadJob.deleteMany(filter);

      return ApiResponse.success(
        res,
        { deletedCount: result.deletedCount },
        'All job history cleared.'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/jobs/:id/download - Stream media for completed job
   */
  static async downloadJobMedia(req, res, next) {
    try {
      const { id } = req.params;
      const clientIp = req.ip || req.socket.remoteAddress;

      const job = await DownloadJob.findById(id);
      if (!job) {
        throw new AppError('Job not found.', HTTP_STATUS.NOT_FOUND, ERROR_CODES.ROUTE_NOT_FOUND);
      }

      jobQueueService.assertJobOwnership(job, req.user, clientIp);

      if (job.status !== 'completed') {
        throw new AppError(
          `Cannot download media for job in "${job.status}" status.`,
          HTTP_STATUS.BAD_REQUEST,
          ERROR_CODES.STREAM_PIPELINE_ERROR
        );
      }

      const filename = sanitizeFilename(job.mediaTitle, job.container);
      const contentType = job.mediaType === 'audio' ? 'audio/mpeg' : 'video/mp4';

      // If temp file exists on disk, stream it with native range seeking
      if (job.tempFilePath && fs.existsSync(job.tempFilePath)) {
        const stats = await fs.promises.stat(job.tempFilePath);
        const totalSize = stats.size;
        const rangeHeader = req.headers.range;

        let start = 0;
        let end = totalSize - 1;
        let isRange = false;

        if (rangeHeader) {
          const match = rangeHeader.match(/bytes=(\d+)-(\d+)?/);
          if (match) {
            const reqStart = parseInt(match[1], 10);
            const reqEnd = match[2] ? parseInt(match[2], 10) : totalSize - 1;

            if (reqStart >= totalSize || reqEnd >= totalSize || reqStart > reqEnd) {
              res.status(416);
              res.setHeader('Content-Range', `bytes */${totalSize}`);
              res.setHeader('Accept-Ranges', 'bytes');
              res.end();
              return;
            }

            start = reqStart;
            end = reqEnd;
            isRange = true;
          }
        }

        const fileStream = fs.createReadStream(job.tempFilePath, isRange ? { start, end } : {});

        await pipeMediaToResponse({
          req,
          res,
          readableStream: fileStream,
          filename,
          contentType,
          contentLength: isRange ? (end - start + 1) : totalSize,
          isRange,
          rangeStart: isRange ? start : null,
          rangeEnd: isRange ? end : null,
          totalSize
        });
        return;
      }

      // If already purged from temp, re-stream directly from adapter
      const adapter = adapterRegistry.resolveAdapter(job.url);
      const streamSource = await adapter.getStreamSources(job.url, job.formatId);

      await pipeMediaToResponse({
        req,
        res,
        readableStream: streamSource.stream,
        filename,
        contentType: streamSource.contentType || contentType,
        contentLength: streamSource.contentLength || null
      });

    } catch (error) {
      if (!res.headersSent) {
        next(error);
      }
    }
  }
}
