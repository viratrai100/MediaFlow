import React from 'react';
import { AlertCircle } from 'lucide-react';

/**
 * Reusable Input Component with glowing focus states and prefix/suffix support
 */
export default function Input({
  label,
  error,
  helperText,
  icon: Icon,
  rightElement,
  className = '',
  containerClassName = '',
  id,
  type = 'text',
  ...props
}) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className={`w-full flex flex-col gap-1.5 ${containerClassName}`}>
      {label && (
        <label htmlFor={inputId} className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          {label}
        </label>
      )}

      <div className="relative flex items-center">
        {Icon && (
          <div className="absolute left-3.5 text-slate-400 pointer-events-none flex items-center justify-center">
            <Icon className="w-4 h-4" />
          </div>
        )}

        <input
          id={inputId}
          type={type}
          className={`w-full bg-dark-800/80 text-slate-100 placeholder-slate-500 text-sm rounded-xl border ${
            error
              ? 'border-rose-500/80 focus:border-rose-500 focus:ring-rose-500/20'
              : 'border-white/10 focus:border-brand-purple focus:ring-brand-purple/20 hover:border-white/20'
          } ${
            Icon ? 'pl-10' : 'pl-4'
          } ${
            rightElement ? 'pr-20' : 'pr-4'
          } py-3 transition-all duration-200 focus:outline-none focus:ring-2 shadow-inner ${className}`}
          {...props}
        />

        {rightElement && (
          <div className="absolute right-2 flex items-center">
            {rightElement}
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-1.5 text-xs text-rose-400 font-medium mt-0.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!error && helperText && (
        <p className="text-xs text-slate-400 mt-0.5">{helperText}</p>
      )}
    </div>
  );
}
