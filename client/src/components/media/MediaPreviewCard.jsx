import React from 'react';
import { Clock, Eye, Calendar, User, CheckCircle2, ShieldCheck, Play } from 'lucide-react';
import Card from '../common/Card';
import Badge from '../common/Badge';

export default function MediaPreviewCard({ mediaInfo }) {
  if (!mediaInfo) return null;

  return (
    <div className="flex flex-col md:flex-row gap-6 items-start">
      {/* Thumbnail with overlay badges */}
      <div className="relative w-full md:w-64 aspect-video rounded-xl overflow-hidden bg-dark-900 shrink-0 border border-white/10 shadow-lg group">
        <img
          src={mediaInfo.thumbnail}
          alt={mediaInfo.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
        
        <div className="absolute top-2.5 left-2.5">
          <Badge variant={mediaInfo.platform.badgeColor || 'primary'} size="sm">
            {mediaInfo.platform.name}
          </Badge>
        </div>

        <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-sm text-[11px] font-mono text-white flex items-center gap-1 border border-white/10">
          <Clock className="w-3 h-3 text-brand-cyan" />
          <span>{mediaInfo.duration}</span>
        </div>
      </div>

      {/* Metadata Description */}
      <div className="flex-1 space-y-3 text-left">
        <div>
          <h2 className="text-lg sm:text-xl font-heading font-bold text-white leading-snug">
            {mediaInfo.title}
          </h2>
          <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-1">
            <User className="w-3.5 h-3.5 text-brand-cyan shrink-0" />
            <span>{mediaInfo.author}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <Eye className="w-3.5 h-3.5 text-slate-500" />
            {mediaInfo.views}
          </span>
          <span className="text-slate-600">•</span>
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            {mediaInfo.uploadedAt}
          </span>
        </div>

        <div className="pt-2 flex items-center gap-2">
          <Badge variant="success" size="sm" icon={ShieldCheck}>
            Public Stream Verified
          </Badge>
          <span className="text-[11px] text-slate-500">
            Node.js Pipeline Ready
          </span>
        </div>
      </div>
    </div>
  );
}
