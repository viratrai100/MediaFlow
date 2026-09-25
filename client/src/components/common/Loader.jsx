import React from 'react';

/**
 * Reusable Loader Component
 * Variants: 'spinner' | 'dots' | 'bar' | 'skeleton'
 */
export default function Loader({
  variant = 'spinner',
  size = 'md',
  text,
  progress,
  className = '',
}) {
  const spinnerSizes = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  if (variant === 'bar') {
    return (
      <div className={`w-full flex flex-col gap-2 ${className}`}>
        {text && (
          <div className="flex justify-between items-center text-xs font-medium text-slate-300">
            <span>{text}</span>
            {typeof progress === 'number' && <span>{Math.round(progress)}%</span>}
          </div>
        )}
        <div className="w-full h-2.5 bg-dark-700 rounded-full overflow-hidden border border-white/5 relative">
          <div
            className="h-full bg-gradient-to-r from-brand-purple via-brand-blue to-brand-cyan transition-all duration-300 rounded-full shadow-glow-purple"
            style={{ width: `${Math.min(100, Math.max(0, progress || 0))}%` }}
          />
        </div>
      </div>
    );
  }

  if (variant === 'dots') {
    return (
      <div className={`flex items-center justify-center gap-1.5 ${className}`}>
        <div className="w-2.5 h-2.5 rounded-full bg-brand-purple animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-2.5 h-2.5 rounded-full bg-brand-blue animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-2.5 h-2.5 rounded-full bg-brand-cyan animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    );
  }

  if (variant === 'skeleton') {
    return (
      <div className={`animate-pulse bg-white/5 rounded-xl ${className}`} />
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <div
        className={`${spinnerSizes[size] || spinnerSizes.md} rounded-full border-brand-purple/20 border-t-brand-purple animate-spin`}
      />
      {text && <span className="text-xs text-slate-400 font-medium tracking-wide">{text}</span>}
    </div>
  );
}
