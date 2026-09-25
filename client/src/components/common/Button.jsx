import React from 'react';

/**
 * Reusable Button Component
 * Supports variants: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
 * Sizes: 'sm' | 'md' | 'lg'
 */
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  icon: Icon,
  iconPosition = 'left',
  className = '',
  onClick,
  type = 'button',
  ...props
}) {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-900 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]';

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-5 py-2.5 text-sm gap-2',
    lg: 'px-6 py-3.5 text-base gap-2.5',
  };

  const variantStyles = {
    primary: 'bg-gradient-to-r from-brand-purple via-brand-violet to-brand-blue text-white shadow-glow-purple hover:shadow-lg hover:brightness-110 focus:ring-brand-purple border border-white/10',
    secondary: 'bg-dark-700 hover:bg-dark-600 text-slate-100 border border-white/10 hover:border-white/20 focus:ring-slate-400',
    outline: 'border border-brand-purple/50 hover:border-brand-purple text-brand-purple hover:bg-brand-purple/10 focus:ring-brand-purple',
    ghost: 'text-slate-300 hover:text-white hover:bg-white/5 focus:ring-slate-500',
    danger: 'bg-gradient-to-r from-rose-600 to-rose-700 text-white shadow-lg shadow-rose-900/30 hover:brightness-110 focus:ring-rose-500 border border-rose-500/30',
  };

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      className={`${baseStyles} ${sizeStyles[size] || sizeStyles.md} ${variantStyles[variant] || variantStyles.primary} ${className}`}
      {...props}
    >
      {isLoading ? (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      ) : Icon && iconPosition === 'left' ? (
        <Icon className="w-4 h-4 shrink-0" />
      ) : null}

      <span>{children}</span>

      {!isLoading && Icon && iconPosition === 'right' && (
        <Icon className="w-4 h-4 shrink-0" />
      )}
    </button>
  );
}
