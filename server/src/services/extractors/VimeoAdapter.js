import { BasePlatformAdapter } from './BasePlatformAdapter.js';
import { safeHttpClient } from '../http/safeHttpClient.js';
import { AppError } from '../../utils/appError.js';
import { HTTP_STATUS } from '../../constants/httpStatusCodes.js';
import { ERROR_CODES } from '../../constants/errorCodes.js';

export class VimeoAdapter extends BasePlatformAdapter {
  constructor() {
    super('vimeo', 'Vimeo', ['vimeo.com', 'player.vimeo.com']);
  }

  normalize(url) {
    try {
      const parsed = new URL(url);
      const match = parsed.pathname.match(/\/(\d+)/);
      if (match && match[1]) {
        return `https://vimeo.com/${match[1]}`;
      }
      return url;
    } catch (e) {
      return url;
    }
  }

  async extractMetadata(url) {
    const canonicalUrl = this.normalize(url);

    try {
      const oembedUrl = `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(canonicalUrl)}`;
      const res = await safeHttpClient.get(oembedUrl);
      const data = res.data;

      const durationSec = data.duration || 180;
      const minutes = Math.floor(durationSec / 60);
      const seconds = durationSec % 60;
      const formattedDuration = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

      const formats = [
        { formatId: '1080p', label: '1080p Full HD', container: 'mp4', type: 'video', codec: 'H.264 / AAC', recommended: true },
        { formatId: '720p', label: '720p HD', container: 'mp4', type: 'video', codec: 'H.264 / AAC' },
        { formatId: '540p', label: '540p SD', container: 'mp4', type: 'video', codec: 'H.264 / AAC' },
        { formatId: 'audio_mp3', label: 'Extracted Soundtrack (MP3)', container: 'mp3', type: 'audio', codec: 'MP3', hasVideo: false }
      ];

      return {
        id: String(data.video_id || Date.now()),
        platform: this.platformKey,
        displayName: this.displayName,
        url: canonicalUrl,
        title: data.title || 'Vimeo Public Video',
        author: data.author_name || 'Vimeo Creator',
        authorUrl: data.author_url || null,
        duration: formattedDuration,
        durationSeconds: durationSec,
        views: 0,
        thumbnail: data.thumbnail_url || 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=60',
        formats: this.buildFormatList(formats),
        isLive: false
      };
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw new AppError(
        'Unable to retrieve Vimeo video metadata. Video may be private or password-protected.',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.EXTRACTION_FAILED
      );
    }
  }

  /**
   * Resolve readable progressive stream from Vimeo
   */
  async getStreamSources(url, formatId = '720p') {
    const canonicalUrl = this.normalize(url);
    const parsed = new URL(canonicalUrl);
    const match = parsed.pathname.match(/\/(\d+)/);
    const videoId = match ? match[1] : null;

    if (!videoId) {
      throw new AppError('Invalid Vimeo video identifier.', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.INVALID_URL);
    }

    try {
      const configRes = await safeHttpClient.get(`https://player.vimeo.com/video/${videoId}/config`, {
        headers: {
          'Referer': 'https://vimeo.com/',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
        }
      });

      const files = configRes.data?.request?.files?.progressive || [];
      if (files.length === 0) {
        throw new Error('No progressive MP4 streams available for this Vimeo video.');
      }

      let selected = files.find((f) => f.quality === formatId);
      if (!selected) {
        files.sort((a, b) => (b.height || 0) - (a.height || 0));
        selected = files[0];
      }

      const streamRes = await safeHttpClient.get(selected.url, {
        responseType: 'stream'
      });

      const isAudio = formatId.startsWith('mp3') || formatId.startsWith('audio');
      return {
        stream: streamRes.data,
        type: isAudio ? 'audio' : 'video',
        contentType: selected.mime || 'video/mp4',
        container: 'mp4',
        contentLength: streamRes.headers['content-length']
      };
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw new AppError(
        `Unable to stream Vimeo video: ${err.message || 'Media may be restricted or embed-locked.'}`,
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.EXTRACTION_FAILED
      );
    }
  }
}
