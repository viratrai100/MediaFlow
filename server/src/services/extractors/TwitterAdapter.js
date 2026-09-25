import { BasePlatformAdapter } from './BasePlatformAdapter.js';
import { safeHttpClient } from '../http/safeHttpClient.js';
import { AppError } from '../../utils/appError.js';
import { HTTP_STATUS } from '../../constants/httpStatusCodes.js';
import { ERROR_CODES } from '../../constants/errorCodes.js';

export class TwitterAdapter extends BasePlatformAdapter {
  constructor() {
    super('twitter', 'X / Twitter', ['twitter.com', 'x.com']);
  }

  normalize(url) {
    try {
      const parsed = new URL(url);
      const match = parsed.pathname.match(/\/status\/(\d+)/);
      if (match && match[1]) {
        return `https://x.com/i/status/${match[1]}`;
      }
      return url;
    } catch (e) {
      return url;
    }
  }

  async extractMetadata(url) {
    const canonicalUrl = this.normalize(url);

    try {
      // Use Twitter/X official public oEmbed
      const oembedUrl = `https://publish.twitter.com/oembed?url=${encodeURIComponent(canonicalUrl)}`;
      const res = await safeHttpClient.get(oembedUrl);
      const data = res.data;

      const formats = [
        { formatId: 'tw_1080p', label: '1080p Video', container: 'mp4', type: 'video', codec: 'H.264 / AAC', recommended: true },
        { formatId: 'tw_720p', label: '720p Video', container: 'mp4', type: 'video', codec: 'H.264 / AAC' },
        { formatId: 'tw_audio', label: 'Extracted Audio (MP3)', container: 'mp3', type: 'audio', codec: 'MP3', hasVideo: false }
      ];

      // Strip raw HTML tags from embed string
      const cleanTitle = data.html ? data.html.replace(/<[^>]*>?/gm, '').slice(0, 140) : 'X / Twitter Public Video';

      return {
        id: 'tw_' + Date.now(),
        platform: this.platformKey,
        displayName: this.displayName,
        url: canonicalUrl,
        title: cleanTitle,
        author: data.author_name ? `@${data.author_name}` : 'X Creator',
        authorUrl: data.author_url || null,
        duration: 'Post Media',
        durationSeconds: 120,
        views: 0,
        thumbnail: 'https://images.unsplash.com/photo-1517976487502-d5a23078a63c?w=800&auto=format&fit=crop&q=60',
        formats: this.buildFormatList(formats),
        isLive: false
      };
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw new AppError(
        'Unable to fetch X/Twitter post metadata. Post may be deleted, protected, or age-restricted.',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.EXTRACTION_FAILED
      );
    }
  }

  async getStreamSources(url, formatId = 'tw_1080p') {
    throw new AppError(
      'X / Twitter video stream requires authenticated API access or the post contains no downloadable progressive video.',
      HTTP_STATUS.FORBIDDEN,
      ERROR_CODES.PRIVATE_MEDIA_RESTRICTED
    );
  }
}
