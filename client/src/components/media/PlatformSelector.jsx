import React from 'react';
import { Youtube, Film, Instagram, Twitter, Video, Globe } from 'lucide-react';
import { PLATFORMS } from '../../services/mockMediaService';

export default function PlatformSelector({ selectedPlatform, onSelectPlatform }) {
  const platformList = [
    { key: 'youtube', name: 'YouTube', icon: Youtube, color: 'hover:text-rose-500 hover:border-rose-500/40', active: 'border-rose-500 bg-rose-500/15 text-rose-400', sample: 'https://youtube.com/watch?v=dQw4w9WgXcQ' },
    { key: 'tiktok', name: 'TikTok', icon: Film, color: 'hover:text-brand-cyan hover:border-brand-cyan/40', active: 'border-brand-cyan bg-brand-cyan/15 text-brand-cyan', sample: 'https://tiktok.com/@creator/video/123456789' },
    { key: 'instagram', name: 'Instagram', icon: Instagram, color: 'hover:text-pink-500 hover:border-pink-500/40', active: 'border-pink-500 bg-pink-500/15 text-pink-400', sample: 'https://instagram.com/reel/C8_xyz123' },
    { key: 'twitter', name: 'X / Twitter', icon: Twitter, color: 'hover:text-sky-400 hover:border-sky-400/40', active: 'border-sky-400 bg-sky-400/15 text-sky-300', sample: 'https://x.com/status/9876543210' },
    { key: 'vimeo', name: 'Vimeo', icon: Video, color: 'hover:text-emerald-400 hover:border-emerald-400/40', active: 'border-emerald-400 bg-emerald-400/15 text-emerald-300', sample: 'https://vimeo.com/76979871' },
  ];

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
      {platformList.map((p) => {
        const Icon = p.icon;
        const isSelected = selectedPlatform?.id === p.key;
        return (
          <button
            key={p.key}
            type="button"
            onClick={() => onSelectPlatform(p.sample)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 ${
              isSelected
                ? p.active
                : `bg-dark-800/80 text-slate-300 border-white/5 ${p.color}`
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span>{p.name}</span>
          </button>
        );
      })}
    </div>
  );
}
