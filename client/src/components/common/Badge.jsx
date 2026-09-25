import React from 'react';

/**
 * Reusable Badge / Chip Component
 */
export default function Badge({
  children,
  variant = 'neutral',
  size = 'md',
  icon: Icon,
  className = '',
}) {
  const sizeStyles = {
    sm: 'px-2 py-0.5 text-[10px] gap-1',
    md: 'px-2.5 py-1 text-xs gap-1.5',
    lg: 'px-3.5 py-1.5 text-sm gap-2',
  };

  const variantStyles = {
    primary: 'bg-brand-purple/15 text-brand-purple border border-brand-purple/30',
    cyan: 'bg-brand-cyan/15 text-brand-cyan border border-brand-cyan/30',
    success: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
    warning: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
    danger: 'bg-rose-500/15 text-rose-400 border border-rose-500/30',
    neutral: 'bg-white/5 text-slate-300 border border-white/10',
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full ${sizeStyles[size] || sizeStyles.md} ${variantStyles[variant] || variantStyles.neutral} ${className}`}
    >
      {Icon && <Icon className="w-3 h-3 shrink-0" />}
      <span>{children}</span>
    </span>
  );
}
