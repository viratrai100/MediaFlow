import { YouTubeAdapter } from './YouTubeAdapter.js';
import { TikTokAdapter } from './TikTokAdapter.js';
import { InstagramAdapter } from './InstagramAdapter.js';
import { TwitterAdapter } from './TwitterAdapter.js';
import { VimeoAdapter } from './VimeoAdapter.js';
import { DirectStreamAdapter } from './DirectStreamAdapter.js';
import { AppError } from '../../utils/appError.js';
import { HTTP_STATUS } from '../../constants/httpStatusCodes.js';
import { ERROR_CODES } from '../../constants/errorCodes.js';

export class AdapterRegistry {
  constructor() {
    this.adapters = [];
    this.registerDefaults();
  }

  registerDefaults() {
    this.register(new YouTubeAdapter());
    this.register(new TikTokAdapter());
    this.register(new InstagramAdapter());
    this.register(new TwitterAdapter());
    this.register(new VimeoAdapter());
    this.register(new DirectStreamAdapter());
  }

  register(adapter) {
    this.adapters.push(adapter);
  }

  /**
   * Resolve appropriate platform adapter for given URL
   */
  resolveAdapter(url) {
    for (const adapter of this.adapters) {
      if (adapter.canHandle(url)) {
        return adapter;
      }
    }

    throw new AppError(
      'Unsupported platform URL. Currently supported platforms are: YouTube, TikTok, Instagram Reels, X / Twitter, and Vimeo.',
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.UNSUPPORTED_PLATFORM
    );
  }

  /**
   * Extract metadata using matching adapter
   */
  async extractMetadata(url) {
    const adapter = this.resolveAdapter(url);
    const normalizedUrl = adapter.normalize(url);
    return adapter.extractMetadata(normalizedUrl);
  }

  /**
   * List all registered platforms and supported domains
   */
  listSupportedPlatforms() {
    return this.adapters.map((a) => ({
      platformKey: a.platformKey,
      displayName: a.displayName,
      domains: a.domains
    }));
  }
}

// Export singleton instance
export const adapterRegistry = new AdapterRegistry();
