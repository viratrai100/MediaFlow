import { pipeline } from 'stream/promises';
import { Transform } from 'stream';
import { buildContentDisposition } from './filenameSanitizer.js';
import { logger } from '../../utils/logger.js';

/**
 * Stream Pipeline Manager
 * Safely transfers media streams to HTTP response with HTTP Range (206 Partial Content) support
 * and abort/cancellation safety.
 */
export async function pipeMediaToResponse({
  req,
  res,
  readableStream,
  filename,
  contentType = 'video/mp4',
  contentLength = null,
  isRange = false,
  rangeStart = null,
  rangeEnd = null,
  totalSize = null,
  cleanupCallback = null
}) {
  const rangeHeader = req?.headers?.range;
  const total = totalSize || contentLength;

  // 1. Process HTTP Range request if requested and total size is known
  if (rangeHeader && total && total > 0 && !isRange) {
    const match = rangeHeader.match(/bytes=(\d+)-(\d+)?/);
    if (match) {
      const reqStart = parseInt(match[1], 10);
      const reqEnd = match[2] ? parseInt(match[2], 10) : total - 1;

      if (reqStart >= total || reqEnd >= total || reqStart > reqEnd) {
        res.status(416);
        res.setHeader('Content-Range', `bytes */${total}`);
        res.setHeader('Accept-Ranges', 'bytes');
        res.end();
        return;
      }

      isRange = true;
      rangeStart = reqStart;
      rangeEnd = reqEnd;
      contentLength = reqEnd - reqStart + 1;

      // If readableStream is not already offset at rangeStart and rangeStart > 0, slice via Transform stream
      if (reqStart > 0 && readableStream && typeof readableStream.pipe === 'function') {
        let currentPos = 0;
        const sliceTransform = new Transform({
          transform(chunk, encoding, callback) {
            const chunkLen = chunk.length;
            const chunkStart = currentPos;
            const chunkEnd = currentPos + chunkLen;
            currentPos += chunkLen;

            if (chunkEnd <= reqStart) {
              // Completely before requested range
              return callback();
            }

            if (chunkStart > reqEnd) {
              // Completely after requested range
              return callback();
            }

            const sliceFrom = Math.max(0, reqStart - chunkStart);
            const sliceTo = Math.min(chunkLen, reqEnd + 1 - chunkStart);
            const slice = chunk.subarray(sliceFrom, sliceTo);
            this.push(slice);
            callback();
          }
        });

        readableStream = readableStream.pipe(sliceTransform);
      }
    }
  }

  // 2. Set Status Code and Headers
  if (isRange && rangeStart !== null && rangeEnd !== null && total) {
    res.status(206);
    res.setHeader('Content-Range', `bytes ${rangeStart}-${rangeEnd}/${total}`);
  } else {
    res.status(200);
  }

  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Disposition', buildContentDisposition(filename, 'attachment'));
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Accept-Ranges', 'bytes');

  if (contentLength && Number(contentLength) > 0) {
    res.setHeader('Content-Length', String(contentLength));
  } else {
    res.setHeader('Transfer-Encoding', 'chunked');
  }

  let isAborted = false;

  // 3. Handle client cancellation / disconnect
  req.on('close', () => {
    if (!res.writableEnded) {
      isAborted = true;
      logger.warn(`Client disconnected prematurely during download: ${filename}`);

      if (readableStream && typeof readableStream.destroy === 'function') {
        readableStream.destroy();
      }

      if (cleanupCallback && typeof cleanupCallback === 'function') {
        cleanupCallback();
      }
    }
  });

  try {
    // Node.js backpressure-safe streaming pipeline
    await pipeline(readableStream, res);

    if (!isAborted) {
      logger.success(`Stream transfer completed: ${filename} (${isRange ? `Range ${rangeStart}-${rangeEnd}` : 'Full'})`);
    }
  } catch (err) {
    if (!isAborted && !res.writableEnded) {
      logger.error(`Stream pipeline error for ${filename}:`, err.message);
      throw err;
    }
  } finally {
    if (cleanupCallback && typeof cleanupCallback === 'function') {
      await cleanupCallback();
    }
  }
}

