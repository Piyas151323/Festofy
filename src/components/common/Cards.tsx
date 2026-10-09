import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Users, Clock, ArrowRight, ShieldCheck } from 'lucide-react';
import { Fest, EventItem } from '../../types';
import { formatDateRange, formatDateTime, getDeadlineText } from '../../utils/dateUtils';

interface FestCardProps {
  fest: Fest;
}

export const FestCard: React.FC<FestCardProps> = ({ fest }) => {
  const isPast = fest.status === 'completed';

  return (
    <div className="group relative flex flex-col rounded-2xl border border-[#242730] bg-[#14161a] hover:border-[#383d4c] transition-all duration-200 overflow-hidden shadow-sm hover:shadow-lg hover:shadow-black/50">
      {/* Banner */}
      <div className="relative h-44 sm:h-48 w-full overflow-hidden bg-[#181a20]">
        {fest.bannerUrl ? (
          <img
            src={fest.bannerUrl}
            alt={fest.name}
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300 ease-out"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#656c80] text-xs font-mono uppercase tracking-wider">
            Festival Showcase
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#14161a] via-[#14161a]/30 to-transparent" />
        
        {/* Status Tag */}
        <div className="absolute top-3.5 left-3.5">
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold uppercase tracking-wider backdrop-blur-md ${
              isPast
                ? 'bg-zinc-900/90 text-zinc-400 border border-zinc-700/60'
                : 'bg-[#ff4f1a]/95 text-white shadow-sm'
            }`}
          >
            {isPast ? 'Completed' : 'Upcoming Fest'}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-4">
        <div>
          {/* Org Name as clean kicker text */}
          <div className="text-[11px] font-medium uppercase tracking-wider text-[#ff4f1a] mb-1.5 flex items-center gap-1.5 truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-[#ff4f1a] shrink-0" />
            <span className="truncate">{fest.organizationName || 'Student Organization'}</span>
          </div>

          {/* Fest Name */}
          <h3 className="font-heading text-lg sm:text-xl font-bold text-white group-hover:text-[#ff4f1a] transition-colors leading-snug mb-2 line-clamp-1">
            {fest.name}
          </h3>

          {/* Description */}
          <p className="text-xs sm:text-sm text-[#9da3b4] line-clamp-2 leading-relaxed">
            {fest.description}
          </p>
        </div>

        {/* Footer Meta */}
        <div className="pt-3.5 border-t border-[#242730] flex items-center justify-between text-xs text-[#9da3b4]">
          <div className="flex items-center gap-1.5 min-w-0 pr-2 text-[#9da3b4]">
            <Calendar className="w-3.5 h-3.5 text-[#656c80] shrink-0" />
            <span className="truncate text-[11px] sm:text-xs">{formatDateRange(fest.startDate, fest.endDate)}</span>
          </div>

          <Link
            to={`/fests/${fest.id}`}
            className="inline-flex items-center gap-1 font-semibold text-white group-hover:text-[#ff4f1a] transition-colors shrink-0 text-xs"
          >
            Explore <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
};

interface EventCardProps {
  event: EventItem;
}

export const EventCard: React.FC<EventCardProps> = ({ event }) => {
  const deadlineInfo = getDeadlineText(event.registrationDeadline);
  const isCompleted = event.status === 'completed';

  return (
    <div className="group flex flex-col h-full rounded-2xl border border-[#242730] bg-[#14161a] hover:border-[#383d4c] transition-all duration-200 overflow-hidden shadow-sm hover:shadow-lg hover:shadow-black/50">
      {/* Event Header image or header tag */}
      <div className="relative h-36 sm:h-40 w-full overflow-hidden bg-[#181a20]">
        {event.bannerUrl ? (
          <img
            src={event.bannerUrl}
            alt={event.name}
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#656c80] text-xs font-mono uppercase tracking-wider">
            Competition Details
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#14161a] via-[#14161a]/30 to-transparent" />

        {/* Category tag */}
        <div className="absolute top-3.5 left-3.5">
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-[#1a1d24]/90 text-[#f4f5f7] border border-[#2e3442] backdrop-blur-md">
            {event.categoryName || 'Contest'}
          </span>
        </div>

        {/* Deadline/Status Pill */}
        <div className="absolute top-3.5 right-3.5">
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold backdrop-blur-md ${
              isCompleted
                ? 'bg-zinc-900/90 text-zinc-400 border border-zinc-700/60'
                : deadlineInfo.isClosed
                ? 'bg-amber-950/85 text-amber-300 border border-amber-800/50'
                : 'bg-[#ff4f1a]/95 text-white'
            }`}
          >
            <Clock className="w-3 h-3" />
            {isCompleted ? 'Event Ended' : deadlineInfo.label}
          </span>
        </div>
      </div>

      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between gap-3">
        <div>
          {/* Fest & Org breadcrumb */}
          <div className="text-xs text-[#9da3b4] mb-1.5 truncate">
            <span className="text-[#656c80]">Part of </span>
            <span className="text-white font-medium">{event.festName || 'Festival'}</span>
          </div>

          {/* Event Title */}
          <h3 className="font-heading text-base sm:text-lg font-bold text-white group-hover:text-[#ff4f1a] transition-colors leading-snug mb-2 line-clamp-1">
            {event.name}
          </h3>

          {/* Description */}
          <p className="text-xs sm:text-sm text-[#9da3b4] line-clamp-2 leading-relaxed mb-3">
            {event.description}
          </p>

          {/* Venue & Capacity */}
          <div className="space-y-1 text-xs text-[#9da3b4]">
            <div className="flex items-center gap-1.5 truncate">
              <MapPin className="w-3.5 h-3.5 text-[#ff4f1a] shrink-0" />
              <span className="truncate text-[11px] sm:text-xs">{event.venue}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#656c80] shrink-0" />
              <span className="text-[11px] sm:text-xs">{formatDateTime(event.startTime)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-[#656c80] shrink-0" />
              <span className="text-[11px] sm:text-xs text-[#656c80]">Capacity: <span className="text-[#9da3b4] font-medium">{event.capacity} seats</span></span>
            </div>
          </div>
        </div>

        {/* Action button */}
        <div className="pt-3.5 border-t border-[#242730] flex items-center justify-between">
          <span className="text-[11px] text-[#656c80] font-mono">
            {isCompleted ? 'Finalized' : deadlineInfo.isClosed ? 'Registration Closed' : 'Registration Open'}
          </span>
          <Link
            to={`/events/${event.id}`}
            className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#191b20] hover:bg-[#ff4f1a] text-white transition-colors"
          >
            Details <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export interface StatCardProps {
  label: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  description,
  icon,
  className = ''
}) => {
  return (
    <div className={`p-4 sm:p-5 rounded-2xl border border-[#242730] bg-[#14161a] space-y-2 flex flex-col justify-between transition-colors hover:border-[#383d4c] ${className}`}>
      <div className="flex justify-between items-center text-xs text-[#656c80]">
        <span className="font-mono uppercase tracking-wider text-[11px] font-semibold">{label}</span>
        {icon && <div className="text-[#9da3b4]">{icon}</div>}
      </div>
      <div>
        <div className="font-heading text-2xl sm:text-3xl font-extrabold text-white">
          {value}
        </div>
        {description && (
          <p className="text-[11px] text-[#9da3b4] mt-0.5 leading-snug">
            {description}
          </p>
        )}
      </div>
    </div>
  );
};

