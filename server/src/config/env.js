import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from server root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const env = Object.freeze({
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT, 10) || 5000,
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/social_media_downloader',
  JWT_SECRET: process.env.JWT_SECRET || 'super_secret_jwt_key_social_stream_downloader_2026',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 2000,
  TEMP_STORAGE_PATH: process.env.TEMP_STORAGE_PATH || './temp',
  MAX_DOWNLOAD_CONCURRENCY: parseInt(process.env.MAX_DOWNLOAD_CONCURRENCY, 10) || 10,
  TEMP_FILE_TTL_MS: parseInt(process.env.TEMP_FILE_TTL_MS, 10) || 60 * 60 * 1000,
  MAX_MEDIA_FILE_SIZE_MB: parseInt(process.env.MAX_MEDIA_FILE_SIZE_MB, 10) || 500,
  ALLOWED_ORIGINS: (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173').split(','),
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV === 'development' || !process.env.NODE_ENV
});
