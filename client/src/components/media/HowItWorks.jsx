import React from 'react';
import { Link2, Sliders, ArrowDownCircle, ShieldCheck } from 'lucide-react';
import Card from '../common/Card';

export default function HowItWorks() {
  const steps = [
    {
      step: '01',
      title: 'Paste Public Link',
      desc: 'Copy any public video, reel, or audio URL from supported platforms and paste it into the search box.',
      icon: Link2,
      color: 'text-brand-purple bg-brand-purple/10 border-brand-purple/30'
    },
    {
      step: '02',
      title: 'Select Format & Quality',
      desc: 'Choose from 1080p Full HD down to 360p video, or direct studio-quality 320kbps MP3 audio.',
      icon: Sliders,
      color: 'text-brand-cyan bg-brand-cyan/10 border-brand-cyan/30'
    },
    {
      step: '03',
      title: 'Instant Stream Pipe',
      desc: 'The pure JavaScript stream engine multiplexes and pipes the media directly to your device with zero ads.',
      icon: ArrowDownCircle,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
    }
  ];

  return (
    <div className="space-y-6 pt-10 border-t border-white/10">
      <div className="text-center space-y-2">
        <h3 className="text-xl sm:text-2xl font-heading font-bold text-white">
          How It Works in 3 Fast Steps
        </h3>
        <p className="text-xs text-slate-400">
          Streamlined, private, and optimized for speed.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {steps.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.step} className="space-y-3 relative group hover:border-brand-purple/40">
              <div className="flex items-center justify-between">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${s.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-2xl font-heading font-extrabold text-slate-700 group-hover:text-brand-purple/50 transition-colors">
                  {s.step}
                </span>
              </div>
              <h4 className="text-sm font-heading font-bold text-white">{s.title}</h4>
              <p className="text-xs text-slate-400 leading-relaxed">{s.desc}</p>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
