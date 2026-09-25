import React from 'react';
import { ShieldCheck, Lock, ExternalLink, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t border-white/[0.08] bg-dark-900/60 backdrop-blur-md mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Col */}
          <div className="space-y-4 md:col-span-2">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-brand-purple to-brand-cyan flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-heading font-bold text-white">SocialStream</span>
            </div>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              High-performance JavaScript streaming architecture for authorized public social media content.
              Built strictly for ethical workflows, creator backups, and educational use.
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span>No user credentials collected • Zero-DRM bypass policy</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-4">
              Navigation
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <Link to="/" className="hover:text-brand-cyan transition-colors">Downloader Hub</Link>
              </li>
              <li>
                <Link to="/features" className="hover:text-brand-cyan transition-colors">Features & Formats</Link>
              </li>
              <li>
                <Link to="/faq" className="hover:text-brand-cyan transition-colors">Compliance & FAQ</Link>
              </li>
              <li>
                <Link to="/admin" className="hover:text-brand-cyan transition-colors">Admin Dashboard</Link>
              </li>
            </ul>
          </div>

          {/* Supported Media */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-4">
              Supported Platforms
            </h4>
            <div className="flex flex-wrap gap-1.5 text-[11px]">
              {['YouTube (Public)', 'TikTok (Public)', 'Instagram Reels', 'X / Twitter', 'Vimeo'].map((p) => (
                <span key={p} className="px-2.5 py-1 rounded-md bg-dark-700/60 text-slate-300 border border-white/5">
                  {p}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} SocialStream. All rights reserved.</p>
          <div className="flex items-center gap-1">
            <span>Crafted with</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 mx-0.5" />
            <span>in 100% Pure JavaScript</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
