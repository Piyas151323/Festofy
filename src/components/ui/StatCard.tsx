import React from 'react';

export interface StatCardProps {
  title: string;
  value: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  variant?: 'neutral' | 'accent' | 'success' | 'warning' | 'danger';
  className?: string;
}

const iconBgStyles = {
  neutral: 'bg-[#191b20] text-[#8a91a6] border-[#2e3442]',
  accent: 'bg-[#ff4f1a]/15 text-[#ff4f1a] border-[#ff4f1a]/30',
  success: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  warning: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  danger: 'bg-red-500/15 text-red-400 border-red-500/30',
};

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  variant = 'neutral',
  className = '',
}) => {
  return (
    <div
      className={`p-4 sm:p-5 rounded-2xl bg-[#14161a] border border-[#242730] transition-colors hover:border-[#2e3442] flex flex-col justify-between ${className}`}
    >
      <div className="flex items-center justify-between gap-3 mb-2">
        <span className="text-xs font-semibold text-[#8a91a6] tracking-wide uppercase font-mono truncate">
          {title}
        </span>
        {icon && (
          <div
            className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${iconBgStyles[variant]}`}
            aria-hidden="true"
          >
            {icon}
          </div>
        )}
      </div>

      <div className="space-y-1">
        <div className="font-heading text-2xl sm:text-3xl font-extrabold text-[#f4f5f7] tracking-tight">
          {value}
        </div>
        {subtitle && <div className="text-xs text-[#8a91a6]">{subtitle}</div>}
      </div>
    </div>
  );
};
