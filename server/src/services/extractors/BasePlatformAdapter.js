/**
 * Base Platform Adapter Interface (Abstract Class)
 */
export class BasePlatformAdapter {
  constructor(platformKey, displayName, domains = []) {
    this.platformKey = platformKey;
    this.displayName = displayName;
    this.domains = domains.map((d) => d.toLowerCase());
  }

  /**
   * Returns true if this adapter can process the URL
   */
  canHandle(url) {
    try {
      const parsed = new URL(url);
      const host = parsed.hostname.replace(/^www\./i, '').toLowerCase();
      return this.domains.some((d) => host === d || host.endsWith('.' + d));
    } catch (e) {
      return false;
    }
  }

  /**
   * Canonicalizes platform-specific URL
   */
  normalize(url) {
    return url;
  }

  /**
   * Extracts metadata (title, author, thumbnail, duration, format options)
   * Must be implemented by concrete adapters.
   */
  async extractMetadata(url, options = {}) {
    throw new Error(`extractMetadata() not implemented in ${this.constructor.name}`);
  }

  /**
   * Resolves direct media stream sources for streaming
   */
  async getStreamSources(url, formatId, options = {}) {
    throw new AppError(
      `Direct streaming is not supported or not available for ${this.displayName}.`,
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.UNSUPPORTED_PLATFORM
    );
  }

  /**
   * Helper: Standardizes format list output
   */
  buildFormatList(formats = []) {
    return formats.map((f) => ({
      formatId: f.formatId,
      quality: f.quality || f.formatId,
      label: f.label || f.formatId,
      container: f.container || 'mp4',
      type: f.type || 'video',
      size: f.size || f.sizeMB || null,
      sizeMB: f.sizeMB || f.size || null,
      bitrate: f.bitrate || null,
      codec: f.codec || 'H.264 / AAC',
      hasAudio: f.hasAudio !== undefined ? f.hasAudio : true,
      hasVideo: f.hasVideo !== undefined ? f.hasVideo : true,
      height: f.height || null,
      recommended: Boolean(f.recommended)
    }));
  }
}
