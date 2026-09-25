import { ApiResponse } from '../utils/apiResponse.js';
import { adapterRegistry } from '../services/extractors/AdapterRegistry.js';
import { DownloadJob } from '../models/DownloadJob.js';
import { AuditLog } from '../models/AuditLog.js';
import { pipeMediaToResponse } from '../services/media/streamPipeline.js';
import { sanitizeFilename } from '../services/media/filenameSanitizer.js';
import { tempFileManager } from '../services/media/tempFileManager.js';
import { AppError } from '../utils/appError.js';
import { HTTP_STATUS } from '../constants/httpStatusCodes.js';
import { ERROR_CODES } from '../constants/errorCodes.js';

/**
 * Extract metadata using resolved platform adapter
 */
export async function getMediaInfo(req, res, next) {
  try {
    const { sanitizedUrl, platformAdapter } = req;

    const metadata = await platformAdapter.extractMetadata(sanitizedUrl);

    // Track job in DB if available
    try {
      await DownloadJob.create({
        user: req.user ? req.user._id : null,
        clientIpHash: req.ip || 'unknown',
        platform: metadata.platform,
        url: sanitizedUrl,
        mediaTitle: metadata.title,
        formatId: metadata.formats[0]?.formatId || 'default',
        container: metadata.formats[0]?.container || 'mp4',
        mediaType: metadata.formats[0]?.type || 'video',
        status: 'queued',
        durationSeconds: metadata.durationSeconds || 0
      });
    } catch (dbErr) {}

    return ApiResponse.success(res, metadata, 'Media metadata extracted successfully.');
  } catch (error) {
    next(error);
  }
}

/**
 * Stream Media Controller: Resolves stream from adapter and pipes to client
 */
export async function streamMedia(req, res, next) {
  const startTime = Date.now();
  let jobRecord = null;

  try {
    const { formatId = '720p', title } = req.query;
    const { sanitizedUrl, platformAdapter } = req;

    // 1. Resolve title and file extension (skip redundant network extraction if title passed)
    let mediaTitle = title;
    if (!mediaTitle) {
      try {
        const metadata = await platformAdapter.extractMetadata(sanitizedUrl);
        mediaTitle = metadata.title || 'media';
      } catch (e) {
        mediaTitle = 'SocialMedia_Download';
      }
    }

    const isAudio = formatId.startsWith('mp3') || formatId.startsWith('m4a') || formatId.includes('audio');
    const extension = isAudio ? 'mp3' : 'mp4';
    const contentType = isAudio ? 'audio/mpeg' : 'video/mp4';
    const filename = sanitizeFilename(mediaTitle, extension);

    // 2. Create or update job record in MongoDB
    try {
      jobRecord = await DownloadJob.create({
        user: req.user ? req.user._id : null,
        clientIpHash: req.ip || 'unknown',
        platform: platformAdapter.platformKey,
        url: sanitizedUrl,
        mediaTitle,
        formatId,
        container: extension,
        mediaType: isAudio ? 'audio' : 'video',
        status: 'processing'
      });
    } catch (e) {}

    // 3. Resolve readable stream from platform adapter
    let streamSource;
    try {
      streamSource = await platformAdapter.getStreamSources(sanitizedUrl, formatId);
    } catch (adapterErr) {
      if (adapterErr instanceof AppError) {
        throw adapterErr;
      }
      const rawMsg = adapterErr.message || '';
      if (rawMsg.includes('Failed to find any playable formats') || rawMsg.includes('No playable formats')) {
        throw new AppError(
          `Unable to retrieve stream from ${platformAdapter.displayName}: The platform has restricted or protected progressive stream playback for this video.`,
          HTTP_STATUS.BAD_REQUEST,
          ERROR_CODES.EXTRACTION_FAILED
        );
      }
      throw new AppError(
        `Failed to initialize stream from ${platformAdapter.displayName}: ${rawMsg}`,
        HTTP_STATUS.BAD_GATEWAY,
        ERROR_CODES.STREAM_PIPELINE_ERROR
      );
    }

    if (!streamSource || !streamSource.stream) {
      throw new AppError(
        'Platform stream source is unavailable or restricted.',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.EXTRACTION_FAILED
      );
    }

    // 4. Pipe stream to HTTP response
    await pipeMediaToResponse({
      req,
      res,
      readableStream: streamSource.stream,
      filename,
      contentType: streamSource.contentType || contentType,
      contentLength: streamSource.contentLength || null,
      cleanupCallback: async () => {
        const durationMs = Date.now() - startTime;
        if (jobRecord) {
          try {
            await DownloadJob.findByIdAndUpdate(jobRecord._id, {
              status: 'completed',
              progress: 100
            });
            await AuditLog.create({
              user: req.user ? req.user._id : null,
              action: 'MEDIA_DOWNLOAD_COMPLETED',
              resource: 'stream',
              details: { platform: platformAdapter.platformKey, formatId, durationMs },
              status: 'success'
            });
          } catch (e) {}
        }
      }
    });

  } catch (error) {
    if (jobRecord) {
      try {
        await DownloadJob.findByIdAndUpdate(jobRecord._id, {
          status: 'failed',
          errorMessage: error.message
        });
      } catch (e) {}
    }

    if (!res.headersSent) {
      next(error);
    }
  }
}

/**
 * List all supported platforms and domain rules
 */
export function listPlatforms(req, res) {
  const platforms = adapterRegistry.listSupportedPlatforms();
  return ApiResponse.success(res, { platforms }, 'Supported platforms list.');
}
