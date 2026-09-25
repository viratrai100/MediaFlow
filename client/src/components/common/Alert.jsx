import React from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';

/**
 * Reusable Alert & Error Message Component
 * Variants: 'error' | 'success' | 'warning' | 'info'
 */
export default function Alert({
  variant = 'info',
  title,
  children,
  onClose,
  className = '',
}) {
  const configs = {
    error: {
      icon: AlertCircle,
      containerClass: 'bg-rose-500/10 border-rose-500/30 text-rose-200',
      iconClass: 'text-rose-400',
    },
    success: {
      icon: CheckCircle2,
      containerClass: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200',
      iconClass: 'text-emerald-400',
    },
    warning: {
      icon: AlertTriangle,
      containerClass: 'bg-amber-500/10 border-amber-500/30 text-amber-200',
      iconClass: 'text-amber-400',
    },
    info: {
      icon: Info,
      containerClass: 'bg-brand-blue/10 border-brand-blue/30 text-blue-200',
      iconClass: 'text-brand-cyan',
    },
  };

  const current = configs[variant] || configs.info;
  const Icon = current.icon;

  return (
    <div
      role="alert"
      className={`flex items-start gap-3 p-4 rounded-xl border backdrop-blur-md transition-all ${current.containerClass} ${className}`}
    >
      <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${current.iconClass}`} />

      <div className="flex-1 text-sm">
        {title && <h5 className="font-semibold mb-0.5">{title}</h5>}
        <div>{children}</div>
      </div>

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          aria-label="Dismiss alert"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
