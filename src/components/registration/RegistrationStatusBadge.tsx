import React from 'react';
import {
  CheckCircle2,
  Clock,
  Users,
  XCircle,
  Trophy,
  UserCheck
} from 'lucide-react';
import { RegistrationStatus } from '../../types';

interface RegistrationStatusBadgeProps {
  status: RegistrationStatus;
  showDescription?: boolean;
}

export const RegistrationStatusBadge: React.FC<RegistrationStatusBadgeProps> = ({
  status,
  showDescription = false
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'confirmed':
        return {
          label: 'Confirmed',
          description: 'Registration confirmed',
          icon: CheckCircle2,
          badgeClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
        };
      case 'pending':
        return {
          label: 'Pending Approval',
          description: 'Awaiting organizer approval',
          icon: Clock,
          badgeClass: 'bg-amber-500/15 text-amber-400 border-amber-500/30'
        };
      case 'waitlisted':
        return {
          label: 'Waitlisted',
          description: 'Currently on waitlist',
          icon: Users,
          badgeClass: 'bg-blue-500/15 text-blue-400 border-blue-500/30'
        };
      case 'cancelled':
        return {
          label: 'Cancelled',
          description: 'Registration cancelled',
          icon: XCircle,
          badgeClass: 'bg-zinc-800 text-zinc-400 border-zinc-700'
        };
      case 'completed':
        return {
          label: 'Completed',
          description: 'Event completed',
          icon: Trophy,
          badgeClass: 'bg-purple-500/15 text-purple-400 border-purple-500/30'
        };
      case 'checked_in':
        return {
          label: 'Checked In',
          description: 'Checked in on-site',
          icon: UserCheck,
          badgeClass: 'bg-teal-500/15 text-teal-400 border-teal-500/30'
        };
      default:
        return {
          label: status,
          description: status,
          icon: CheckCircle2,
          badgeClass: 'bg-[#ff4f1a]/15 text-[#ff4f1a] border-[#ff4f1a]/30'
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div className="inline-flex items-center gap-2">
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold font-mono uppercase tracking-wider border ${config.badgeClass}`}
      >
        <Icon className="w-3.5 h-3.5 shrink-0" />
        <span>{config.label}</span>
      </span>
      {showDescription && (
        <span className="text-xs text-[#9da3b4] font-medium hidden sm:inline">
          {config.description}
        </span>
      )}
    </div>
  );
};

export const GeneralStatusBadge: React.FC<{
  status: string;
  size?: 'sm' | 'md';
}> = ({ status, size = 'sm' }) => {
  const normalized = (status || '').toLowerCase().replace(/[\s-]/g, '_');

  let badgeClass = 'bg-zinc-800 text-zinc-300 border-zinc-700';
  let label = status;

  switch (normalized) {
    case 'published':
    case 'active':
      badgeClass = 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      label = 'Published';
      break;
    case 'draft':
      badgeClass = 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      label = 'Draft';
      break;
    case 'completed':
      badgeClass = 'bg-purple-500/15 text-purple-400 border-purple-500/30';
      label = 'Completed';
      break;
    case 'cancelled':
      badgeClass = 'bg-red-500/15 text-red-400 border-red-500/30';
      label = 'Cancelled';
      break;
    case 'pending':
    case 'pending_review':
      badgeClass = 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      label = 'Pending';
      break;
    case 'confirmed':
    case 'approved':
      badgeClass = 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      label = 'Confirmed';
      break;
    case 'checked_in':
      badgeClass = 'bg-teal-500/15 text-teal-400 border-teal-500/30';
      label = 'Checked In';
      break;
    case 'waitlisted':
      badgeClass = 'bg-blue-500/15 text-blue-400 border-blue-500/30';
      label = 'Waitlisted';
      break;
    case 'full':
    case 'capacity_filled':
      badgeClass = 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      label = 'Event Full';
      break;
    case 'registration_closed':
    case 'closed':
      badgeClass = 'bg-zinc-800 text-zinc-400 border-zinc-700';
      label = 'Registration Closed';
      break;
    default:
      badgeClass = 'bg-[#ff4f1a]/15 text-[#ff4f1a] border-[#ff4f1a]/30';
      label = status;
  }

  const paddingClass = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center font-mono font-semibold uppercase tracking-wider rounded-md border ${paddingClass} ${badgeClass}`}
    >
      {label}
    </span>
  );
};
