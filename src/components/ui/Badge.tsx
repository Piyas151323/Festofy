import React from 'react';

export type BadgeVariant =
  | 'default'
  | 'accent'
  | 'danger'
  | 'warning'
  | 'success'
  | 'info'
  | 'outline';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-[#191b20] text-[#8a91a6] border border-[#2e3442]',
  accent: 'bg-[#ff4f1a]/15 text-[#ff4f1a] border border-[#ff4f1a]/30',
  danger: 'bg-red-500/15 text-red-400 border border-red-500/30',
  warning: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
  success: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
  info: 'bg-blue-500/15 text-blue-400 border border-blue-500/30',
  outline: 'bg-transparent text-[#8a91a6] border border-[#2e3442]',
};

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  size = 'md',
  className = '',
  children,
  ...rest
}) => {
  const sizeStyle =
    size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-lg font-mono uppercase tracking-wider ${sizeStyle} ${variantStyles[variant]} ${className}`}
      {...rest}
    >
      {children}
    </span>
  );
};
