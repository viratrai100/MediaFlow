import { BasePlatformAdapter } from './BasePlatformAdapter.js';
import { safeHttpClient } from '../http/safeHttpClient.js';
import { rangeStreamService } from '../media/rangeStreamService.js';
import { AppError } from '../../utils/appError.js';
import { HTTP_STATUS } from '../../constants/httpStatusCodes.js';
import { ERROR_CODES } from '../../constants/errorCodes.js';

export class DirectStreamAdapter extends BasePlatformAdapter {
  constructor() {
    super('direct', 'Direct Public Stream', []);
  }

  canHandle(url) {
    try {
      const parsed = new URL(url);
      const ext = parsed.pathname.split('.').pop().toLowerCase();
      return ['mp4', 'webm', 'mov', 'm4a', 'mp3', 'aac', 'wav'].includes(ext);
    } catch (e) {
      return false;
    }
  }

  async extractMetadata(url) {
    try {
      const probe = await rangeStreamService.probeUrl(url);
      const contentType = (probe.contentType || 'video/mp4').toLowerCase();
      const contentLength = probe.contentLength || 0;

      const isVideo = contentType.includes('video') || url.match(/\.(mp4|webm|mov)$/i);
      const isAudio = contentType.includes('audio') || url.match(/\.(mp3|m4a|aac|wav)$/i);

      if (!isVideo && !isAudio) {
        throw new AppError(
          `URL content-type "${contentType}" is not a supported media stream.`,
          HTTP_STATUS.BAD_REQUEST,
          ERROR_CODES.UNSUPPORTED_PLATFORM
        );
      }

      const sizeMB = contentLength ? (contentLength / 1024 / 1024).toFixed(1) + ' MB' : 'Stream Chunked';
      const container = url.split('.').pop().split('?')[0].toUpperCase();

      const formats = [
        {
          formatId: 'direct_stream',
          label: `Original ${container} Stream`,
          container: container.toLowerCase(),
          type: isAudio ? 'audio' : 'video',
          sizeMB,
          codec: contentType,
          recommended: true
        }
      ];

      return {
        id: 'direct_' + Date.now(),
        platform: this.platformKey,
        displayName: this.displayName,
        url,
        title: url.split('/').pop().split('?')[0] || 'Direct Media File',
        author: 'Direct Server Host',
        authorUrl: null,
        duration: 'Direct Stream',
        durationSeconds: 0,
        views: 0,
        thumbnail: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop&q=60',
        formats: this.buildFormatList(formats),
        isLive: false
      };
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw new AppError(
        'Unable to access direct media stream. Verify the URL is publicly reachable.',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.EXTRACTION_FAILED
      );
    }
  }

  async getStreamSources(url) {
    const probe = await rangeStreamService.probeUrl(url);
    const contentType = probe.contentType || 'video/mp4';
    const container = url.split('.').pop().split('?')[0].toLowerCase() || 'mp4';

    const stream = rangeStreamService.createOptimizedStream(url, {
      contentLength: probe.contentLength,
      concurrency: 4
    });

    return {
      stream,
      type: contentType.includes('audio') ? 'audio' : 'video',
      contentType,
      container,
      contentLength: probe.contentLength
    };
  }
}
