import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { tempFileManager } from './tempFileManager.js';
import { AppError } from '../../utils/appError.js';
import { HTTP_STATUS } from '../../constants/httpStatusCodes.js';
import { ERROR_CODES } from '../../constants/errorCodes.js';
import { logger } from '../../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ENGINE_PATH = path.resolve(__dirname, '../../../python_engine/media_engine.py');

class PythonMediaService {
  constructor() {
    this.pythonExecutable = process.env.PYTHON_PATH || 'python';
  }

  /**
   * Execute python media engine CLI command asynchronously
   */
  async runEngine(args, signal = null) {
    return new Promise((resolve, reject) => {
      const spawnOpts = { windowsHide: true };
      if (signal) {
        spawnOpts.signal = signal;
      }
      const child = spawn(this.pythonExecutable, [ENGINE_PATH, ...args], spawnOpts);

      let stdoutData = '';
      let stderrData = '';

      child.stdout.on('data', (chunk) => {
        stdoutData += chunk.toString('utf-8');
      });

      child.stderr.on('data', (chunk) => {
        stderrData += chunk.toString('utf-8');
      });

      child.on('error', (err) => {
        if (err.name === 'AbortError') {
          return reject(new Error('DOWNLOAD_CANCELLED'));
        }
        reject(new Error(`Failed to execute Python media engine: ${err.message}`));
      });

      child.on('close', (code) => {
        if (code !== 0 && !stdoutData.trim()) {
          return reject(new Error(stderrData.trim() || `Python media engine exited with code ${code}`));
        }

        try {
          // Normalize carriage returns and find the last JSON object
          const cleanedStdout = stdoutData.replace(/\r/g, '\n').trim();
          const match = cleanedStdout.match(/\{[\s\S]*\}(?![\s\S]*\{)/);
          
          if (!match) {
            return reject(new Error(stderrData.trim() || 'Invalid response from media engine.'));
          }

          const jsonResult = JSON.parse(match[0]);

          if (jsonResult.success === false) {
            return reject(new Error(jsonResult.error || 'Media engine operation failed.'));
          }

          resolve(jsonResult);
        } catch (parseErr) {
          reject(new Error(`Failed to parse engine output: ${parseErr.message}\nRaw: ${stdoutData}`));
        }
      });
    });
  }

  /**
   * Extract video metadata and genuine available resolutions
   */
  async extractMetadata(url) {
    try {
      const result = await this.runEngine(['info', '--url', url]);
      return result;
    } catch (err) {
      logger.error('Python media metadata extraction failed:', err.message);
      throw new AppError(
        `Unable to extract media metadata: ${err.message}`,
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.EXTRACTION_FAILED
      );
    }
  }

  /**
   * Download exact requested format and remux/merge video + audio into a scratch file
   */
  async downloadToFile(url, formatId, outputPath, signal = null) {
    try {
      const result = await this.runEngine(
        ['download', '--url', url, '--format', formatId, '--output', outputPath],
        signal
      );
      return result;
    } catch (err) {
      if (err.message === 'DOWNLOAD_CANCELLED') {
        throw new AppError('Download was cancelled.', HTTP_STATUS.CLIENT_CLOSED_REQUEST, ERROR_CODES.CLIENT_DISCONNECTED);
      }
      logger.error(`Python media download failed for format ${formatId}:`, err.message);
      throw new AppError(
        `Download failed for format "${formatId}": ${err.message}`,
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.STREAM_PIPELINE_ERROR
      );
    }
  }

  /**
   * Get a high-fidelity readable stream for direct HTTP streaming
   */
  async getStreamSources(url, formatId = '720p') {
    const isAudio = formatId.startsWith('mp3') || formatId.startsWith('m4a') || formatId.includes('audio');
    const container = isAudio ? (formatId === 'm4a_aac' ? 'm4a' : 'mp3') : 'mp4';
    const contentType = isAudio ? (container === 'mp3' ? 'audio/mpeg' : 'audio/mp4') : 'video/mp4';

    // 1. Create a dedicated temporary scratch file
    const tempPath = tempFileManager.createTempPath(container);

    // 2. Download and remux exact format with zero quality degradation
    const dlResult = await this.downloadToFile(url, formatId, tempPath);
    const resolvedPath = dlResult.filePath || tempPath;

    // 3. Inspect final file stats
    const stats = await fs.promises.stat(resolvedPath);
    const stream = fs.createReadStream(resolvedPath, { highWaterMark: 1024 * 1024 });

    // Clean up temp file when stream closes/destroys
    stream.on('close', () => {
      tempFileManager.safeUnlink(resolvedPath).catch(() => {});
    });

    return {
      stream,
      filePath: resolvedPath,
      type: isAudio ? 'audio' : 'video',
      container,
      contentType,
      quality: formatId,
      contentLength: stats.size,
      fileSizeMB: dlResult.fileSizeMB
    };
  }
}

export const pythonMediaService = new PythonMediaService();
