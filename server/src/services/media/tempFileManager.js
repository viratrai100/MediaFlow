import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';

class TempFileManager {
  constructor() {
    this.tempDir = path.resolve(process.cwd(), env.TEMP_STORAGE_PATH || './temp');
    this.ensureTempDir();
  }

  ensureTempDir() {
    try {
      if (!fs.existsSync(this.tempDir)) {
        fs.mkdirSync(this.tempDir, { recursive: true });
      }
    } catch (err) {
      logger.error('Failed to create temp directory:', err.message);
    }
  }

  /**
   * Generates a unique temporary file path with extension
   */
  createTempPath(extension = 'tmp') {
    this.ensureTempDir();
    const cleanExt = extension.replace(/^\./, '');
    const randomId = crypto.randomBytes(8).toString('hex');
    const timestamp = Date.now();
    const filename = `stream_${timestamp}_${randomId}.${cleanExt}`;
    return path.join(this.tempDir, filename);
  }

  /**
   * Safe asynchronous file removal
   */
  async safeUnlink(filePath) {
    if (!filePath || typeof filePath !== 'string') return;

    try {
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
        logger.info(`Temp file unlinked: ${path.basename(filePath)}`);
      }
    } catch (err) {
      logger.warn(`Could not unlink temp file (${path.basename(filePath)}):`, err.message);
    }
  }

  /**
   * Background TTL Garbage Collector: purges files older than TTL (default 1 hour)
   */
  async purgeStaleFiles(maxAgeMs = env.TEMP_FILE_TTL_MS) {
    this.ensureTempDir();

    try {
      const files = await fs.promises.readdir(this.tempDir);
      const now = Date.now();
      let purgedCount = 0;

      for (const file of files) {
        if (file === '.gitkeep') continue;

        const filePath = path.join(this.tempDir, file);
        try {
          const stats = await fs.promises.stat(filePath);
          const age = now - stats.mtimeMs;

          if (age > maxAgeMs) {
            await fs.promises.unlink(filePath);
            purgedCount++;
          }
        } catch (e) {
          // File might have already been unlinked
        }
      }

      if (purgedCount > 0) {
        logger.info(`🧹 Temp GC Worker: Purged ${purgedCount} stale scratch files.`);
      }
      return purgedCount;
    } catch (err) {
      logger.error('Temp GC Worker error:', err.message);
      return 0;
    }
  }
}

export const tempFileManager = new TempFileManager();
