import React, { useState } from 'react';
import { Film, Music, CheckCircle2, Sparkles, SlidersHorizontal, HardDrive } from 'lucide-react';
import Badge from '../common/Badge';

export default function FormatSelector({ formats = [], selectedFormat, onSelectFormat }) {
  const [activeTab, setActiveTab] = useState('video'); // 'video' | 'audio'

  const videoFormats = formats.filter((f) => f.type === 'video');
  const audioFormats = formats.filter((f) => f.type === 'audio');

  const displayedFormats = activeTab === 'video' ? videoFormats : audioFormats;

  return (
    <div className="space-y-4 pt-4 border-t border-white/10">
      {/* Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 bg-dark-900/80 p-1 rounded-xl border border-white/5 w-fit">
          <button
            type="button"
            onClick={() => setActiveTab('video')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'video'
                ? 'bg-brand-purple text-white shadow-glow-purple'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span>Video (MP4)</span>
            <span className="px-1.5 py-0.2 rounded bg-black/30 text-[10px]">{videoFormats.length}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('audio')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'audio'
                ? 'bg-brand-purple text-white shadow-glow-purple'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Music className="w-3.5 h-3.5" />
            <span>Audio Only (MP3/M4A)</span>
            <span className="px-1.5 py-0.2 rounded bg-black/30 text-[10px]">{audioFormats.length}</span>
          </button>
        </div>

        <span className="text-xs text-slate-400 flex items-center gap-1.5">
          <HardDrive className="w-3.5 h-3.5 text-brand-cyan" />
          Direct Stream Chunking (Zero Server Retention)
        </span>
      </div>

      {/* Formats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {displayedFormats.map((fmt, index) => {
          const formatKey = fmt.formatId || fmt.id || `${fmt.type}_${fmt.quality || fmt.label || index}_${fmt.container}`;
          const isSelected = (selectedFormat?.formatId && fmt.formatId)
            ? selectedFormat.formatId === fmt.formatId
            : (selectedFormat?.id === fmt.id || selectedFormat?.label === fmt.label);
          const Icon = fmt.type === 'audio' ? Music : Film;
          const fmtSize = fmt.size || fmt.sizeMB;

          return (
            <button
              key={formatKey}
              type="button"
              onClick={() => onSelectFormat(fmt)}
              className={`p-4 rounded-xl border text-left flex items-center justify-between transition-all duration-200 relative overflow-hidden group ${
                isSelected
                  ? 'bg-brand-purple/20 border-brand-purple ring-1 ring-brand-purple shadow-glow-purple text-white'
                  : 'bg-dark-900/60 border-white/5 hover:border-white/20 text-slate-300 hover:bg-dark-900/90'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-xl transition-colors ${
                    isSelected
                      ? 'bg-brand-purple text-white'
                      : 'bg-dark-700 text-slate-400 group-hover:text-brand-cyan'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs font-bold leading-tight text-white">
                      {fmt.label || fmt.quality}
                      {fmtSize && (
                        <span className="text-brand-cyan ml-1.5 font-semibold text-[11px]">
                          — {fmtSize}
                        </span>
                      )}
                    </p>
                    {fmt.recommended && (
                      <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase rounded bg-brand-cyan/20 text-brand-cyan border border-brand-cyan/30">
                        Recommended
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {fmt.container?.toUpperCase() || 'MP4'} • {fmt.codec || 'Standard Stream'}
                  </p>
                </div>
              </div>

              <div className="flex items-center">
                {isSelected ? (
                  <CheckCircle2 className="w-5 h-5 text-brand-cyan shrink-0" />
                ) : (
                  <div className="w-5 h-5 rounded-full border border-white/20 group-hover:border-white/40" />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
