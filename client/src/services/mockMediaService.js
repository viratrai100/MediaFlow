/**
 * Mock Media Service
 * Simulates platform detection, metadata extraction, format tables, and progressive streaming.
 */

export const PLATFORMS = {
  YOUTUBE: { id: 'youtube', name: 'YouTube', domains: ['youtube.com', 'youtu.be'], color: 'text-rose-500', badgeColor: 'danger' },
  TIKTOK: { id: 'tiktok', name: 'TikTok', domains: ['tiktok.com'], color: 'text-brand-cyan', badgeColor: 'cyan' },
  INSTAGRAM: { id: 'instagram', name: 'Instagram', domains: ['instagram.com'], color: 'text-pink-500', badgeColor: 'primary' },
  TWITTER: { id: 'twitter', name: 'X / Twitter', domains: ['twitter.com', 'x.com'], color: 'text-sky-400', badgeColor: 'primary' },
  VIMEO: { id: 'vimeo', name: 'Vimeo', domains: ['vimeo.com'], color: 'text-emerald-400', badgeColor: 'success' },
  DIRECT: { id: 'direct', name: 'Direct Stream', domains: [], color: 'text-brand-purple', badgeColor: 'primary' }
};

/**
 * Detect platform from URL
 */
export function detectPlatform(url) {
  if (!url || typeof url !== 'string') return null;
  const cleanUrl = url.toLowerCase().trim();

  for (const key of Object.keys(PLATFORMS)) {
    const platform = PLATFORMS[key];
    if (platform.domains.some((d) => cleanUrl.includes(d))) {
      return platform;
    }
  }

  if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
    return PLATFORMS.DIRECT;
  }

  return null;
}

/**
 * Mock Metadata Extractor
 */
export async function mockFetchMediaInfo(url) {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 800));

  const cleanUrl = url.trim().toLowerCase();

  // Test failure conditions
  if (cleanUrl.includes('private') || cleanUrl.includes('onlyfans') || cleanUrl.includes('restricted')) {
    const error = new Error('Access Denied: Private accounts and DRM-protected media cannot be parsed.');
    error.code = 'PRIVATE_MEDIA_RESTRICTED';
    throw error;
  }

  if (cleanUrl.includes('drm') || cleanUrl.includes('netflix') || cleanUrl.includes('spotify')) {
    const error = new Error('Digital Rights Management: This stream is encrypted with DRM.');
    error.code = 'DRM_PROTECTED';
    throw error;
  }

  const detected = detectPlatform(url) || PLATFORMS.YOUTUBE;

  // Platform-specific mock content
  const mockTitles = {
    youtube: 'Fullstack Node.js Real-Time Media Streaming Masterclass 2026',
    tiktok: 'Ultra Smooth 4K Kinetic Typography & Animation Tutorial #creative',
    instagram: 'Cinematic Drone Footage Across Iceland Fjords (4K 60FPS Reel)',
    twitter: 'SpaceX Falcon Heavy Triple Booster Landing in Real Time',
    vimeo: 'Echoes of the Arctic - An Award-Winning Environmental Documentary',
    direct: 'Direct WebM Progressive Stream Sample'
  };

  const mockAuthors = {
    youtube: 'TechVision Studio • 420K subscribers',
    tiktok: '@motion.architect • 1.2M followers',
    instagram: '@cinematography.daily',
    twitter: '@SpaceflightNow',
    vimeo: 'Nordic Visuals Collective',
    direct: 'Direct Public Host'
  };

  const mockThumbnails = {
    youtube: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=60',
    tiktok: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=800&auto=format&fit=crop&q=60',
    instagram: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=60',
    twitter: 'https://images.unsplash.com/photo-1517976487502-d5a23078a63c?w=800&auto=format&fit=crop&q=60',
    vimeo: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=60',
    direct: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop&q=60'
  };

  return {
    id: 'media_' + Math.random().toString(36).substring(2, 9),
    url,
    platform: detected,
    title: mockTitles[detected.id] || mockTitles.youtube,
    author: mockAuthors[detected.id] || mockAuthors.youtube,
    duration: '12:45',
    durationSeconds: 765,
    views: '1.4M views',
    uploadedAt: '3 days ago',
    thumbnail: mockThumbnails[detected.id] || mockThumbnails.youtube,
    formats: [
      {
        id: '1080p',
        label: '1080p Full HD',
        resolution: '1920x1080',
        type: 'video',
        container: 'MP4',
        codec: 'H.264 / AAC',
        size: '54.2 MB',
        sizeBytes: 56832819,
        recommended: true
      },
      {
        id: '720p',
        label: '720p HD',
        resolution: '1280x720',
        type: 'video',
        container: 'MP4',
        codec: 'H.264 / AAC',
        size: '28.6 MB',
        sizeBytes: 29989273,
        recommended: false
      },
      {
        id: '480p',
        label: '480p SD',
        resolution: '854x480',
        type: 'video',
        container: 'MP4',
        codec: 'H.264 / AAC',
        size: '14.1 MB',
        sizeBytes: 14784921,
        recommended: false
      },
      {
        id: '360p',
        label: '360p Mobile',
        resolution: '640x360',
        type: 'video',
        container: 'MP4',
        codec: 'H.264 / AAC',
        size: '8.3 MB',
        sizeBytes: 8703180,
        recommended: false
      },
      {
        id: 'mp3_320',
        label: '320 kbps Studio Audio',
        resolution: 'Audio Only',
        type: 'audio',
        container: 'MP3',
        codec: 'MPEG-3 Audio',
        size: '10.8 MB',
        sizeBytes: 11324620,
        recommended: true
      },
      {
        id: 'mp3_128',
        label: '128 kbps Standard Audio',
        resolution: 'Audio Only',
        type: 'audio',
        container: 'MP3',
        codec: 'MPEG-3 Audio',
        size: '4.3 MB',
        sizeBytes: 4508876,
        recommended: false
      },
      {
        id: 'm4a_256',
        label: '256 kbps AAC Master',
        resolution: 'Audio Only',
        type: 'audio',
        container: 'M4A',
        codec: 'AAC-LC',
        size: '8.7 MB',
        sizeBytes: 9122611,
        recommended: false
      }
    ]
  };
}
