import React from 'react';
import { Cpu, Zap, Shield, Sparkles, Check, Globe, RefreshCw, FileCode2 } from 'lucide-react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';

export default function FeaturesPage() {
  const features = [
    {
      title: 'Zero Python Footprint',
      desc: 'Written purely in modern Node.js and React. No heavy Python sub-processes, virtual environments, or external Python binaries required.',
      icon: FileCode2,
      badge: '100% JS',
      color: 'primary'
    },
    {
      title: 'Progressive Stream Multiplexing',
      desc: 'Seamlessly merges separate high-definition video and audio tracks on the fly using native fluent-ffmpeg streams.',
      icon: Zap,
      badge: 'High Speed',
      color: 'cyan'
    },
    {
      title: 'Backpressure-Safe Piping',
      desc: 'Utilizes Node.js stream.pipeline to prevent socket starvation and memory buffer overflow under heavy concurrent downloads.',
      icon: RefreshCw,
      badge: 'Robust',
      color: 'success'
    },
    {
      title: 'Automatic Transient File GC',
      desc: 'Automated garbage collection worker purges temporary intermediate conversion files upon completion to maintain zero disk bloat.',
      icon: Cpu,
      badge: 'Clean Storage',
      color: 'warning'
    },
    {
      title: 'Ethical & Platform Compliant',
      desc: 'Strict enforcement blocking DRM-encrypted streams, paywalled content, and private profiles. Engineered for legitimate creator use.',
      icon: Shield,
      badge: 'Fair Use',
      color: 'danger'
    },
    {
      title: 'Universal Platform Compatibility',
      desc: 'Modular extractor adapters supporting public YouTube, TikTok, Instagram Reels, Twitter/X, and Vimeo streams.',
      icon: Globe,
      badge: 'Multi-Platform',
      color: 'cyan'
    }
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 space-y-12">
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <Badge variant="primary" size="md">
          Platform Capabilities
        </Badge>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white">
          Built for Velocity, Precision & <br />
          <span className="text-gradient">Architectural Cleanliness</span>
        </h1>
        <p className="text-sm text-slate-400">
          Explore how SocialStream handles high-throughput video extraction and conversion with 
          lightweight Node.js streaming.
        </p>
      </div>

      {/* Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feat) => {
          const Icon = feat.icon;
          return (
            <Card key={feat.title} variant="interactive" className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-dark-700 flex items-center justify-center text-white border border-white/10">
                  <Icon className="w-5 h-5 text-brand-purple" />
                </div>
                <Badge variant={feat.color} size="sm">
                  {feat.badge}
                </Badge>
              </div>
              <h3 className="text-lg font-heading font-semibold text-white">
                {feat.title}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {feat.desc}
              </p>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
