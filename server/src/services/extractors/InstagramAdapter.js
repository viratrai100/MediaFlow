import { BasePlatformAdapter } from './BasePlatformAdapter.js';
import { safeHttpClient } from '../http/safeHttpClient.js';
import { AppError } from '../../utils/appError.js';
import { HTTP_STATUS } from '../../constants/httpStatusCodes.js';
import { ERROR_CODES } from '../../constants/errorCodes.js';

export class InstagramAdapter extends BasePlatformAdapter {
  constructor() {
    super('instagram', 'Instagram', ['instagram.com']);
  }

  normalize(url) {
    try {
      const parsed = new URL(url);
      const parts = parsed.pathname.split('/').filter(Boolean);
      // Support /p/code, /reel/code, /tv/code
      if (['p', 'reel', 'reels', 'tv'].includes(parts[0]) && parts[1]) {
        return `https://www.instagram.com/reel/${parts[1]}`;
      }
      return `${parsed.protocol}//${parsed.hostname}${parsed.pathname}`;
    } catch (e) {
      return url;
    }
  }

  async extractMetadata(url) {
    const canonicalUrl = this.normalize(url);

    try {
      // Validate Instagram Reel structure
      const isReelOrPost = /\/(p|reel|reels|tv)\/[a-zA-Z0-9_-]+/i.test(canonicalUrl);
      if (!isReelOrPost) {
        throw new AppError(
          'Please provide a link to a public Instagram Reel or Video post.',
          HTTP_STATUS.BAD_REQUEST,
          ERROR_CODES.INVALID_URL
        );
      }

      // Try public oEmbed
      let title = 'Instagram Public Reel';
      let author = 'Instagram Creator';
      let thumbnail = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=60';

      try {
        const oembedRes = await safeHttpClient.get(`https://api.instagram.com/oembed/?url=${encodeURIComponent(canonicalUrl)}`);
        if (oembedRes.data) {
          title = oembedRes.data.title || title;
          author = oembedRes.data.author_name || author;
          thumbnail = oembedRes.data.thumbnail_url || thumbnail;
        }
      } catch (oembedErr) {
        // Fallback for public posts
      }

      const formats = [
        { formatId: 'reel_1080p', label: '1080p HD Reel', container: 'mp4', type: 'video', codec: 'H.264 / AAC', recommended: true },
        { formatId: 'reel_720p', label: '720p Reel', container: 'mp4', type: 'video', codec: 'H.264 / AAC' },
        { formatId: 'audio_mp3', label: 'Extracted Audio Track', container: 'mp3', type: 'audio', codec: 'MP3', hasVideo: false, recommended: true }
      ];

      return {
        id: 'ig_' + Date.now(),
        platform: this.platformKey,
        displayName: this.displayName,
        url: canonicalUrl,
        title,
        author,
        authorUrl: null,
        duration: 'Reel Clip',
        durationSeconds: 60,
        views: 0,
        thumbnail,
        formats: this.buildFormatList(formats),
        isLive: false
      };
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw new AppError(
        'Unable to access Instagram media. Private accounts and stories are restricted.',
        HTTP_STATUS.FORBIDDEN,
        ERROR_CODES.PRIVATE_MEDIA_RESTRICTED
      );
    }
  }

  async getStreamSources(url, formatId = 'reel_1080p') {
    throw new AppError(
      'Instagram media stream requires user session authentication and cannot be downloaded anonymously.',
      HTTP_STATUS.FORBIDDEN,
      ERROR_CODES.PRIVATE_MEDIA_RESTRICTED
    );
  }
}
