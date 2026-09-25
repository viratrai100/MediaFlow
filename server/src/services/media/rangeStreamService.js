import { Readable, PassThrough } from 'stream';
import http from 'http';
import https from 'https';
import { logger } from '../../utils/logger.js';

// High-performance connection pools with Keep-Alive
const httpAgent = new http.Agent({ keepAlive: true, maxSockets: 50, timeout: 30000 });
const httpsAgent = new https.Agent({ keepAlive: true, maxSockets: 50, timeout: 30000 });

/**
 * Parallel Range Streamer
 * Accelerates media downloads by fetching concurrent byte ranges when supported by CDN
 * Never restarts already-downloaded data; retries only failed byte slices with exponential backoff.
 */
export class RangeStreamService {
  /**
   * Probe URL for Range support and Content-Length
   */
  async probeUrl(url, customHeaders = {}) {
    const defaultHeaders = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      ...customHeaders
    };

    const parsedUrl = new URL(url);
    const isHttps = parsedUrl.protocol === 'https:';
    const client = isHttps ? https : http;
    const agent = isHttps ? httpsAgent : httpAgent;

    // 1. Attempt lightweight HEAD request
    try {
      const headRes = await new Promise((resolve, reject) => {
        const req = client.request(url, { method: 'HEAD', headers: defaultHeaders, agent, timeout: 5000 }, resolve);
        req.on('error', reject);
        req.on('timeout', () => {
          req.destroy();
          reject(new Error('PROBE_TIMEOUT'));
        });
        req.end();
      });

      const acceptRanges = headRes.headers['accept-ranges'];
      const contentLength = parseInt(headRes.headers['content-length'], 10) || null;
      const contentType = headRes.headers['content-type'] || 'video/mp4';

      if (headRes.statusCode >= 200 && headRes.statusCode < 300 && contentLength && contentLength > 2 * 1024 * 1024) {
        const supportsRange = acceptRanges === 'bytes' || Boolean(headRes.headers['content-range']);
        return {
          supportsRange: Boolean(supportsRange),
          contentLength,
          contentType,
          statusCode: headRes.statusCode
        };
      }
    } catch (e) {}

    // 2. Fallback: probe with a 1-byte Range request (Range: bytes=0-0)
    try {
      const rangeRes = await new Promise((resolve, reject) => {
        const reqHeaders = { ...defaultHeaders, 'Range': 'bytes=0-0' };
        const req = client.request(url, { method: 'GET', headers: reqHeaders, agent, timeout: 5000 }, resolve);
        req.on('error', reject);
        req.on('timeout', () => {
          req.destroy();
          reject(new Error('PROBE_RANGE_TIMEOUT'));
        });
        req.end();
      });

      const contentRange = rangeRes.headers['content-range'];
      const contentType = rangeRes.headers['content-type'] || 'video/mp4';
      let totalLength = null;

      if (contentRange) {
        const match = contentRange.match(/\/(\d+)/);
        if (match) {
          totalLength = parseInt(match[1], 10);
        }
      }

      const isRangeSupported = rangeRes.statusCode === 206 && Boolean(totalLength);
      rangeRes.resume(); // Discard the single byte body

      return {
        supportsRange: isRangeSupported && totalLength > 2 * 1024 * 1024,
        contentLength: totalLength || null,
        contentType,
        statusCode: rangeRes.statusCode
      };
    } catch (err) {
      return { supportsRange: false, contentLength: null, contentType: 'video/mp4' };
    }
  }

  /**
   * Create an optimized high-throughput stream
   * Uses parallel range workers when supported; otherwise uses single high-buffer stream.
   */
  createOptimizedStream(url, options = {}) {
    const {
      contentLength = null,
      concurrency = 4,
      chunkSize = 4 * 1024 * 1024, // 4MB chunks
      headers = {},
      onProgress = null
    } = options;

    const outPass = new PassThrough({ highWaterMark: 1024 * 1024 }); // 1MB buffer

    if (!contentLength || contentLength < 4 * 1024 * 1024 || concurrency <= 1) {
      // Single connection high-speed stream
      this.streamSingleConnection(url, outPass, headers, onProgress);
      return outPass;
    }

    // Parallel Range Connection Streamer
    this.streamParallelRanges(url, outPass, { contentLength, concurrency, chunkSize, headers, onProgress });
    return outPass;
  }

  /**
   * Single connection stream with 1MB highWaterMark and TCP no-delay
   */
  streamSingleConnection(url, outPass, customHeaders = {}, onProgress = null) {
    const parsedUrl = new URL(url);
    const isHttps = parsedUrl.protocol === 'https:';
    const client = isHttps ? https : http;
    const agent = isHttps ? httpsAgent : httpAgent;

    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Accept-Encoding': 'identity',
      ...customHeaders
    };

    const req = client.get(url, { headers, agent, timeout: 30000 }, (res) => {
      if (res.statusCode >= 400) {
        outPass.destroy(new Error(`Upstream returned HTTP ${res.statusCode}`));
        return;
      }

      res.socket?.setNoDelay(true);

      let bytesReceived = 0;
      res.on('data', (chunk) => {
        bytesReceived += chunk.length;
        if (onProgress) onProgress(bytesReceived);
      });

      res.pipe(outPass);
    });

    req.on('error', (err) => {
      outPass.destroy(err);
    });
  }

  /**
   * Parallel chunk worker pool with retry backoff and strictly in-order streaming
   */
  async streamParallelRanges(url, outPass, options) {
    const { contentLength, concurrency = 4, chunkSize = 4 * 1024 * 1024, headers = {}, onProgress = null } = options;

    const totalChunks = Math.ceil(contentLength / chunkSize);
    let currentChunkIndex = 0;
    let nextChunkToWrite = 0;
    const chunkBufferMap = new Map();
    let isAborted = false;
    let totalBytesStreamed = 0;

    outPass.on('close', () => {
      isAborted = true;
    });

    const fetchRangeChunk = (startByte, endByte) => {
      return new Promise((resolve, reject) => {
        const parsedUrl = new URL(url);
        const isHttps = parsedUrl.protocol === 'https:';
        const client = isHttps ? https : http;
        const agent = isHttps ? httpsAgent : httpAgent;

        const reqHeaders = {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Range': `bytes=${startByte}-${endByte}`,
          'Accept-Encoding': 'identity',
          ...headers
        };

        const req = client.get(url, { headers: reqHeaders, agent, timeout: 25000 }, (res) => {
          if (res.statusCode !== 206 && res.statusCode !== 200) {
            reject(new Error(`Range request [${startByte}-${endByte}] failed with HTTP ${res.statusCode}`));
            return;
          }

          res.socket?.setNoDelay(true);
          const chunks = [];

          res.on('data', (d) => chunks.push(d));
          res.on('end', () => resolve(Buffer.concat(chunks)));
          res.on('error', reject);
        });

        req.on('error', reject);
        req.on('timeout', () => {
          req.destroy();
          reject(new Error(`Range chunk [${startByte}-${endByte}] request timed out`));
        });
      });
    };

    const fetchChunkWithRetry = async (startByte, endByte, maxRetries = 3) => {
      let attempt = 0;
      while (attempt < maxRetries) {
        try {
          return await fetchRangeChunk(startByte, endByte);
        } catch (err) {
          attempt++;
          if (attempt >= maxRetries || isAborted) {
            throw err;
          }
          const backoffDelay = Math.min(300 * Math.pow(2, attempt - 1), 2000);
          logger.warn(`Chunk [${startByte}-${endByte}] attempt ${attempt} failed: ${err.message}. Retrying in ${backoffDelay}ms...`);
          await new Promise((r) => setTimeout(r, backoffDelay));
        }
      }
    };

    const worker = async () => {
      while (!isAborted) {
        // Backpressure pause if buffer has more than concurrency * 2 unwritten chunks
        while (chunkBufferMap.size >= concurrency * 2 && !isAborted) {
          await new Promise((r) => setTimeout(r, 50));
        }

        const chunkIdx = currentChunkIndex++;
        if (chunkIdx >= totalChunks) break;

        const startByte = chunkIdx * chunkSize;
        const endByte = Math.min(contentLength - 1, (chunkIdx + 1) * chunkSize - 1);

        try {
          const chunkData = await fetchChunkWithRetry(startByte, endByte, 3);
          if (isAborted) return;

          chunkBufferMap.set(chunkIdx, chunkData);

          // Flush available contiguous chunks in strict sequential order
          while (chunkBufferMap.has(nextChunkToWrite) && !isAborted) {
            const data = chunkBufferMap.get(nextChunkToWrite);
            chunkBufferMap.delete(nextChunkToWrite);
            outPass.write(data);
            totalBytesStreamed += data.length;
            if (onProgress) onProgress(totalBytesStreamed);
            nextChunkToWrite++;
          }
        } catch (err) {
          logger.error(`Parallel range chunk ${chunkIdx} failed permanently: ${err.message}`);
          isAborted = true;
          outPass.destroy(err);
          return;
        }
      }
    };

    // Run parallel workers concurrently
    const activeWorkers = [];
    const numWorkers = Math.min(concurrency, totalChunks);
    for (let i = 0; i < numWorkers; i++) {
      activeWorkers.push(worker());
    }

    try {
      await Promise.all(activeWorkers);
      if (!isAborted && nextChunkToWrite >= totalChunks) {
        outPass.end();
      }
    } catch (e) {
      if (!isAborted) outPass.destroy(e);
    }
  }
}

export const rangeStreamService = new RangeStreamService();

