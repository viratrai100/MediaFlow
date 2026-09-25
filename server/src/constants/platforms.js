/**
 * Platform identifiers and supported public workflow definitions.
 * Only public and authorized endpoints are allowed.
 */
export const SUPPORTED_PLATFORMS = Object.freeze({
  YOUTUBE: 'youtube',
  TIKTOK: 'tiktok',
  INSTAGRAM: 'instagram',
  TWITTER: 'twitter',
  VIMEO: 'vimeo',
  DIRECT: 'direct'
});

export const PLATFORM_DOMAINS = Object.freeze({
  [SUPPORTED_PLATFORMS.YOUTUBE]: ['youtube.com', 'youtu.be', 'www.youtube.com', 'm.youtube.com'],
  [SUPPORTED_PLATFORMS.TIKTOK]: ['tiktok.com', 'www.tiktok.com', 'vm.tiktok.com'],
  [SUPPORTED_PLATFORMS.INSTAGRAM]: ['instagram.com', 'www.instagram.com'],
  [SUPPORTED_PLATFORMS.TWITTER]: ['twitter.com', 'x.com', 'www.twitter.com', 'www.x.com'],
  [SUPPORTED_PLATFORMS.VIMEO]: ['vimeo.com', 'www.vimeo.com']
});
