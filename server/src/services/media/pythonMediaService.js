import { spawn, spawnSync, execSync } from 'child_process';
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
    this._cachedPython = null;
    // Perform startup dependency check asynchronously
    this.ensureDependencies().catch(() => {});
  }

  /**
   * Resolve active working python executable across Windows & Linux environments
   */
  getPython() {
    if (this._cachedPython) return this._cachedPython;

    if (process.env.PYTHON_PATH && fs.existsSync(process.env.PYTHON_PATH)) {
      this._cachedPython = process.env.PYTHON_PATH;
      return this._cachedPython;
    }

    const candidates = process.platform === 'win32'
      ? ['python', 'py', 'python3']
      : ['python3', 'python', '/usr/bin/python3', '/usr/local/bin/python3'];

    for (const c of candidates) {
      try {
        const res = spawnSync(c, ['--version'], { stdio: 'pipe' });
        if (res.status === 0) {
          this._cachedPython = c;
          return this._cachedPython;
        }
      } catch (e) {}
    }

    this._cachedPython = process.platform === 'win32' ? 'python' : 'python3';
    return this._cachedPython;
  }

  /**
   * Verify and self-heal yt-dlp installation on Render / production environments
   */
  async ensureDependencies() {
    try {
      const pythonExe = this.getPython();
      const checkRes = spawnSync(pythonExe, ['-c', 'import yt_dlp; print(yt_dlp.version.__version__)'], {
        encoding: 'utf-8',
        stdio: 'pipe'
      });

      if (checkRes.status === 0 && checkRes.stdout) {
        logger.info(`✔ Python media engine ready: ${pythonExe} (yt-dlp v${checkRes.stdout.trim()})`);
        return true;
      }

      logger.warn(`yt-dlp module not detected in ${pythonExe}. Attempting automatic installation on host...`);
      const pipCommands = [
        'pip install --no-cache-dir yt-dlp --break-system-packages',
        'pip3 install --no-cache-dir yt-dlp --break-system-packages',
        `${pythonExe} -m pip install --no-cache-dir yt-dlp --break-system-packages`,
        'pip install yt-dlp',
        'pip3 install yt-dlp'
      ];

      for (const cmd of pipCommands) {
        try {
          execSync(cmd, { stdio: 'pipe' });
          logger.info(`✔ yt-dlp installed successfully on host using: ${cmd}`);
          return true;
        } catch (pipErr) {}
      }
      logger.error('Failed to automatically install yt-dlp. Please verify requirements.txt in build command.');
      return false;
    } catch (e) {
      logger.warn('Dependency check error:', e.message);
      return false;
    }
  }

  /**
   * Execute python media engine CLI command asynchronously
   */
  async runEngine(args, signal = null, isRetry = false) {
    return new Promise((resolve, reject) => {
      const pythonExe = this.getPython();
      const spawnOpts = {
        windowsHide: true,
        env: {
          ...process.env,
          PYTHONUNBUFFERED: '1',
          PYTHONPATH: path.dirname(ENGINE_PATH)
        }
      };
      if (signal) {
        spawnOpts.signal = signal;
      }
      const child = spawn(pythonExe, [ENGINE_PATH, ...args], spawnOpts);

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

      child.on('close', async (code) => {
        if (code !== 0 && !stdoutData.trim()) {
          const rawErr = stderrData.trim();
          // Self-heal if yt_dlp is missing
          if (rawErr.includes("No module named 'yt_dlp'") && !isRetry) {
            logger.warn('Missing yt_dlp detected during execution, self-healing...');
            const healed = await this.ensureDependencies();
            if (healed) {
              try {
                const retryResult = await this.runEngine(args, signal, true);
                return resolve(retryResult);
              } catch (retryErr) {
                return reject(retryErr);
              }
            }
          }
          return reject(new Error(rawErr || `Python media engine exited with code ${code}`));
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
