import { BasePlatformAdapter } from './BasePlatformAdapter.js';
import { safeHttpClient } from '../http/safeHttpClient.js';
import { AppError } from '../../utils/appError.js';
import { HTTP_STATUS } from '../../constants/httpStatusCodes.js';
import { ERROR_CODES } from '../../constants/errorCodes.js';

export class TikTokAdapter extends BasePlatformAdapter {
  constructor() {
    super('tiktok', 'TikTok', ['tiktok.com', 'vm.tiktok.com']);
  }

  normalize(url) {
    try {
      const parsed = new URL(url);
      return `${parsed.protocol}//${parsed.hostname}${parsed.pathname}`;
    } catch (e) {
      return url;
    }
  }

  async extractMetadata(url) {
    const canonicalUrl = this.normalize(url);

    try {
      // Official public TikTok oEmbed endpoint
      const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(canonicalUrl)}`;
      const res = await safeHttpClient.get(oembedUrl);
      const data = res.data;

      const formats = [
        { formatId: 'hd_mp4', label: 'HD Clean Video', container: 'mp4', type: 'video', codec: 'H.264 / AAC', recommended: true },
        { formatId: 'sd_mp4', label: 'Standard Video', container: 'mp4', type: 'video', codec: 'H.264 / AAC' },
        { formatId: 'audio_mp3', label: 'Original Sound (MP3)', container: 'mp3', type: 'audio', codec: 'MP3', hasVideo: false, recommended: true }
      ];

      return {
        id: data.embed_product_id || 'tiktok_' + Date.now(),
        platform: this.platformKey,
        displayName: this.displayName,
        url: canonicalUrl,
        title: data.title || 'TikTok Public Video',
        author: data.author_name || 'TikTok Creator',
        authorUrl: data.author_url || null,
        duration: 'Short Video',
        durationSeconds: 60,
        views: 0,
        thumbnail: data.thumbnail_url || 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=800&auto=format&fit=crop&q=60',
        formats: this.buildFormatList(formats),
        isLive: false
      };
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw new AppError(
        'Unable to fetch public TikTok metadata. Video may be private, deleted, or region-restricted.',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.EXTRACTION_FAILED
      );
    }
  }

  async getStreamSources(url, formatId = 'hd_mp4') {
    throw new AppError(
      'TikTok progressive video streams require platform session authentication or are protected against automated extraction.',
      HTTP_STATUS.FORBIDDEN,
      ERROR_CODES.PRIVATE_MEDIA_RESTRICTED
    );
  }
}
