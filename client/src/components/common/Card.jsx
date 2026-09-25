import React from 'react';

/**
 * Reusable Glassmorphism Card Component
 * Supports variants: 'default' | 'interactive' | 'flat' | 'gradient'
 */
export default function Card({
  children,
  variant = 'default',
  className = '',
  onClick,
  ...props
}) {
  const baseStyles = 'rounded-2xl p-6 transition-all duration-300 relative overflow-hidden';

  const variantStyles = {
    default: 'glass-panel',
    interactive: 'glass-panel-interactive cursor-pointer hover:-translate-y-1 hover:shadow-glow-purple',
    flat: 'bg-dark-800/90 border border-white/5',
    gradient: 'bg-gradient-to-br from-dark-800/90 via-dark-700/80 to-dark-800/90 border border-brand-purple/20 shadow-glow-purple',
  };

  return (
    <div
      onClick={onClick}
      className={`${baseStyles} ${variantStyles[variant] || variantStyles.default} ${className}`}
      {...props}
    >
      {/* Subtle top glare highlight */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />
      {children}
    </div>
  );
}
