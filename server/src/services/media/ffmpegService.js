import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import ffprobeInstaller from '@ffprobe-installer/ffprobe';
import { PassThrough } from 'stream';
import { logger } from '../../utils/logger.js';
import { AppError } from '../../utils/appError.js';
import { HTTP_STATUS } from '../../constants/httpStatusCodes.js';
import { ERROR_CODES } from '../../constants/errorCodes.js';

const resolvedFfmpegPath = process.env.FFMPEG_PATH || ffmpegInstaller?.path || 'ffmpeg';
const resolvedFfprobePath = process.env.FFPROBE_PATH || ffprobeInstaller?.path || 'ffprobe';

try {
  ffmpeg.setFfmpegPath(resolvedFfmpegPath);
} catch (e) {
  logger.warn('Failed to set FFmpeg path:', e.message);
}

try {
  ffmpeg.setFfprobePath(resolvedFfprobePath);
} catch (e) {
  logger.warn('Failed to set FFprobe path:', e.message);
}

const ALLOWED_AUDIO_FORMATS = new Set(['mp3', 'm4a', 'aac', 'ogg', 'wav', 'flac']);
const ALLOWED_AUDIO_BITRATES = new Set(['320k', '256k', '192k', '128k', '96k', '64k']);
const ALLOWED_CONTAINERS = new Set(['mp4', 'webm', 'mkv']);

class FFmpegService {
  constructor() {
    this.isFFmpegAvailable = Boolean(ffmpegInstaller?.path);
  }

  /**
   * Mux separate video and audio streams into single MP4 container
   */
  muxVideoAndAudio(videoSource, audioSource, outputStream, options = {}) {
    return new Promise((resolve, reject) => {
      const command = ffmpeg()
        .input(videoSource)
        .input(audioSource)
        .outputOptions([
          '-c:v copy',          // Zero re-encoding for video to maximize speed
          '-c:a aac',           // Standard AAC audio
          '-b:a 192k',
          '-movflags frag_keyframe+empty_moov+default_base_moof', // Required for live MP4 chunked streaming
          '-shortest'
        ])
        .format('mp4');

      if (options.timeout && typeof options.timeout === 'number' && options.timeout > 0) {
        command.timeout(Math.min(options.timeout, 300)); // Max 5 minutes timeout
      }

      command.on('start', (cmdLine) => {
        logger.stream(`FFmpeg Muxer Spawned safely.`);
      });

      command.on('error', (err, stdout, stderr) => {
        logger.error('FFmpeg Muxing Error:', err.message);
        reject(
          new AppError(
            `FFmpeg stream processing error: ${err.message}`,
            HTTP_STATUS.INTERNAL_SERVER_ERROR,
            ERROR_CODES.STREAM_PIPELINE_ERROR
          )
        );
      });

      command.on('end', () => {
        logger.stream('FFmpeg Muxing Completed Successfully.');
        resolve();
      });

      // Pipe to output stream
      command.pipe(outputStream, { end: true });
    });
  }

  /**
   * Extract audio stream and transcode to MP3 / M4A / AAC with strict allowlist validation
   */
  extractAudioStream(sourceStream, outputStream, options = {}) {
    const rawFormat = (options.format || 'mp3').toLowerCase().trim();
    const rawBitrate = (options.bitrate || '320k').toLowerCase().trim();

    // Strict parameter allowlisting to prevent option injection
    const format = ALLOWED_AUDIO_FORMATS.has(rawFormat) ? rawFormat : 'mp3';
    const bitrate = ALLOWED_AUDIO_BITRATES.has(rawBitrate) ? rawBitrate : '320k';

    return new Promise((resolve, reject) => {
      const command = ffmpeg(sourceStream)
        .noVideo();

      if (format === 'mp3') {
        command
          .format('mp3')
          .audioCodec('libmp3lame')
          .audioBitrate(bitrate)
          .audioChannels(2)
          .audioFrequency(44100);
      } else if (format === 'm4a' || format === 'aac') {
        command
          .format('adts')
          .audioCodec('aac')
          .audioBitrate(bitrate);
      } else {
        command.format(format);
      }

      command.on('start', (cmdLine) => {
        logger.stream(`FFmpeg Audio Extraction started (${format}, ${bitrate}).`);
      });

      command.on('error', (err) => {
        logger.error('FFmpeg Audio Extraction Error:', err.message);
        reject(
          new AppError(
            `Audio conversion failed: ${err.message}`,
            HTTP_STATUS.INTERNAL_SERVER_ERROR,
            ERROR_CODES.STREAM_PIPELINE_ERROR
          )
        );
      });

      command.on('end', () => {
        logger.stream('FFmpeg Audio Extraction Completed.');
        resolve();
      });

      command.pipe(outputStream, { end: true });
    });
  }

  /**
   * Probe media file to get video/audio stream properties (resolution, codec, duration)
   */
  probeMedia(filePath) {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) return reject(err);
        const videoStream = metadata.streams?.find((s) => s.codec_type === 'video');
        const audioStream = metadata.streams?.find((s) => s.codec_type === 'audio');
        resolve({
          width: videoStream?.width || 0,
          height: videoStream?.height || 0,
          vcodec: videoStream?.codec_name || 'unknown',
          acodec: audioStream?.codec_name || 'unknown',
          duration: metadata.format?.duration || 0,
          size: metadata.format?.size || 0,
          bitrate: metadata.format?.bit_rate || 0
        });
      });
    });
  }
}

export const ffmpegService = new FFmpegService();
