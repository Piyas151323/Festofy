import React from 'react';

export type StatusType =
  | 'pending'
  | 'confirmed'
  | 'waitlisted'
  | 'cancelled'
  | 'completed'
  | 'checked_in'
  | 'approved'
  | 'rejected'
  | 'draft'
  | 'published'
  | string;

export interface StatusPillProps {
  status: StatusType;
  label?: string;
  size?: 'sm' | 'md';
  className?: string;
}

interface StatusConfig {
  label: string;
  dotColor: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
}

const statusMap: Record<string, StatusConfig> = {
  confirmed: {
    label: 'Confirmed',
    dotColor: 'bg-emerald-400',
    bgColor: 'bg-emerald-500/10',
    textColor: 'text-emerald-400',
    borderColor: 'border-emerald-500/25',
  },
  checked_in: {
    label: 'Checked In',
    dotColor: 'bg-cyan-400',
    bgColor: 'bg-cyan-500/10',
    textColor: 'text-cyan-400',
    borderColor: 'border-cyan-500/25',
  },
  pending: {
    label: 'Pending Review',
    dotColor: 'bg-amber-400',
    bgColor: 'bg-amber-500/10',
    textColor: 'text-amber-300',
    borderColor: 'border-amber-500/25',
  },
  completed: {
    label: 'Completed',
    dotColor: 'bg-indigo-400',
    bgColor: 'bg-indigo-500/10',
    textColor: 'text-indigo-300',
    borderColor: 'border-indigo-500/25',
  },
  waitlisted: {
    label: 'Waitlisted',
    dotColor: 'bg-purple-400',
    bgColor: 'bg-purple-500/10',
    textColor: 'text-purple-300',
    borderColor: 'border-purple-500/25',
  },
  cancelled: {
    label: 'Cancelled',
    dotColor: 'bg-red-400',
    bgColor: 'bg-red-500/10',
    textColor: 'text-red-400',
    borderColor: 'border-red-500/25',
  },
  approved: {
    label: 'Approved',
    dotColor: 'bg-emerald-400',
    bgColor: 'bg-emerald-500/10',
    textColor: 'text-emerald-400',
    borderColor: 'border-emerald-500/25',
  },
  rejected: {
    label: 'Rejected',
    dotColor: 'bg-red-400',
    bgColor: 'bg-red-500/10',
    textColor: 'text-red-400',
    borderColor: 'border-red-500/25',
  },
  published: {
    label: 'Published',
    dotColor: 'bg-emerald-400',
    bgColor: 'bg-emerald-500/10',
    textColor: 'text-emerald-400',
    borderColor: 'border-emerald-500/25',
  },
  draft: {
    label: 'Draft',
    dotColor: 'bg-zinc-400',
    bgColor: 'bg-zinc-800/40',
    textColor: 'text-zinc-300',
    borderColor: 'border-zinc-700',
  },
};

export const StatusPill: React.FC<StatusPillProps> = ({
  status,
  label,
  size = 'md',
  className = '',
}) => {
  const norm = (status || '').toLowerCase();
  const config = statusMap[norm] || {
    label: label || status || 'Unknown',
    dotColor: 'bg-zinc-400',
    bgColor: 'bg-zinc-800/40',
    textColor: 'text-zinc-300',
    borderColor: 'border-zinc-700',
  };

  const displayText = label || config.label;
  const sizeClasses =
    size === 'sm'
      ? 'px-2 py-0.5 text-[11px] gap-1.5'
      : 'px-2.5 py-1 text-xs gap-2';

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${sizeClasses} ${config.bgColor} ${config.textColor} ${config.borderColor} ${className}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full shrink-0 ${config.dotColor}`}
        aria-hidden="true"
      />
      <span className="truncate">{displayText}</span>
    </span>
  );
};
