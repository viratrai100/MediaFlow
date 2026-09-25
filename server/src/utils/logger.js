/**
 * Structured Console Logger with Timestamping and Colors
 */

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  info: '\x1b[36m',    // Cyan
  success: '\x1b[32m', // Green
  warn: '\x1b[33m',    // Yellow
  error: '\x1b[31m',   // Red
  magenta: '\x1b[35m'  // Magenta
};

const formatTime = () => new Date().toISOString();

export const logger = {
  info: (message, meta = '') => {
    console.log(`${colors.dim}[${formatTime()}]${colors.reset} ${colors.info}ℹ [INFO]${colors.reset} ${message}`, meta ? meta : '');
  },
  success: (message, meta = '') => {
    console.log(`${colors.dim}[${formatTime()}]${colors.reset} ${colors.success}✔ [SUCCESS]${colors.reset} ${message}`, meta ? meta : '');
  },
  warn: (message, meta = '') => {
    console.warn(`${colors.dim}[${formatTime()}]${colors.reset} ${colors.warn}⚠ [WARN]${colors.reset} ${message}`, meta ? meta : '');
  },
  error: (message, error = '') => {
    console.error(`${colors.dim}[${formatTime()}]${colors.reset} ${colors.error}✖ [ERROR]${colors.reset} ${message}`, error ? error : '');
  },
  stream: (message, meta = '') => {
    console.log(`${colors.dim}[${formatTime()}]${colors.reset} ${colors.magenta}⚡ [STREAM]${colors.reset} ${message}`, meta ? meta : '');
  }
};
