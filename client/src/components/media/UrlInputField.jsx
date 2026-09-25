import React from 'react';
import { Search, Clipboard, Sparkles, X, Check } from 'lucide-react';
import Button from '../common/Button';
import Badge from '../common/Badge';

export default function UrlInputField({
  url,
  onChangeUrl,
  onSubmit,
  isLoading,
  detectedPlatform,
  onClear,
}) {
  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        onChangeUrl(text);
      }
    } catch (e) {
      console.warn('Clipboard read failed or permission denied', e);
    }
  };

  return (
    <form onSubmit={onSubmit} className="w-full max-w-3xl mx-auto space-y-2">
      <div className="glass-panel p-2 rounded-2xl flex flex-col sm:flex-row items-center gap-2 border-brand-purple/30 focus-within:border-brand-purple focus-within:ring-2 focus-within:ring-brand-purple/20 transition-all shadow-glow-purple relative">
        <div className="flex-1 w-full relative flex items-center">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 pointer-events-none" />
          
          <input
            type="url"
            value={url}
            onChange={(e) => onChangeUrl(e.target.value)}
            placeholder="Paste public link from YouTube, TikTok, Instagram, Twitter/X, Vimeo..."
            className="w-full bg-transparent pl-12 pr-28 py-3.5 text-sm text-white placeholder-slate-500 focus:outline-none"
            aria-label="Social media video URL"
            required
          />

          <div className="absolute right-2 flex items-center gap-1.5">
            {url && (
              <button
                type="button"
                onClick={onClear}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                title="Clear input"
                aria-label="Clear input"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={handlePaste}
              className="px-2.5 py-1.5 rounded-lg bg-dark-700/80 hover:bg-dark-600 text-slate-300 hover:text-white text-xs font-medium border border-white/5 flex items-center gap-1.5 transition-colors"
              title="Paste from clipboard"
            >
              <Clipboard className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Paste</span>
            </button>
          </div>
        </div>

        <Button
          type="submit"
          size="md"
          isLoading={isLoading}
          icon={Sparkles}
          className="w-full sm:w-auto shrink-0 px-6 py-3.5 font-semibold"
        >
          Fetch Media
        </Button>
      </div>

      {/* Auto-detected Platform Indicator */}
      <div className="h-6 flex items-center justify-between px-2 text-xs">
        {detectedPlatform ? (
          <div className="flex items-center gap-1.5 text-slate-300 animate-in fade-in duration-200">
            <span className="text-slate-500">Platform detected:</span>
            <Badge variant={detectedPlatform.badgeColor || 'primary'} size="sm">
              {detectedPlatform.name}
            </Badge>
          </div>
        ) : (
          <span className="text-[11px] text-slate-500">
            Only public and permitted URLs are supported.
          </span>
        )}
        <span className="text-[11px] text-slate-500 hidden sm:inline">
          100% Client-Safe Streaming
        </span>
      </div>
    </form>
  );
}
