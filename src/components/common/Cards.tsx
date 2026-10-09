import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Users, Clock, ArrowRight } from 'lucide-react';
import { Fest, EventItem } from '../../types';
import { formatDateRange, formatDateTime, getDeadlineText } from '../../utils/dateUtils';

interface FestCardProps {
  fest: Fest;
}

export const FestCard: React.FC<FestCardProps> = ({ fest }) => {
  const isPast = fest.status === 'completed';

  return (
    <article className="group relative flex flex-col rounded-2xl border border-[#242730] bg-[#14161a] hover:border-[#383d4c] transition-colors duration-200 overflow-hidden shadow-sm">
      {/* Banner */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#181a20]">
        {fest.bannerUrl ? (
          <>
            <img
              src={fest.bannerUrl}
              alt=""
              aria-hidden="true"
              className="w-full h-full object-cover transition-opacity duration-200"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#14161a] via-[#14161a]/30 to-transparent pointer-events-none" />
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-br from-[#181a20] to-[#121316] text-[#656c80]">
            <Calendar className="w-8 h-8 text-[#ff4f1a]/40 mb-2" />
            <span className="text-xs font-mono uppercase tracking-wider text-[#9da3b4]">
              {fest.organizationName || 'Festival Showcase'}
            </span>
          </div>
        )}

        {/* Status Tag */}
        <div className="absolute top-3.5 left-3.5 z-20">
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wider backdrop-blur-md ${
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
          <div className="text-xs font-medium uppercase tracking-wider text-[#ff4f1a] mb-1.5 flex items-center gap-1.5 truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-[#ff4f1a] shrink-0" />
            <span className="truncate">{fest.organizationName || 'Student Organization'}</span>
          </div>

          {/* Fest Name (Primary Stretched Link) */}
          <h3 className="font-heading text-lg sm:text-xl font-bold text-white group-hover:text-[#ff4f1a] transition-colors leading-snug mb-2 line-clamp-1">
            <Link
              to={`/fests/${fest.id}`}
              className="focus:outline-none focus-visible:underline after:absolute after:inset-0 after:z-10"
            >
              {fest.name}
            </Link>
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
            <span className="truncate text-xs">{formatDateRange(fest.startDate, fest.endDate)}</span>
          </div>

          <span
            aria-hidden="true"
            className="inline-flex items-center gap-1 font-semibold text-white group-hover:text-[#ff4f1a] transition-colors shrink-0 text-xs"
          >
            Explore <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </span>
        </div>
      </div>
    </article>
  );
};

interface EventCardProps {
  event: EventItem;
}

export const EventCard: React.FC<EventCardProps> = ({ event }) => {
  const deadlineInfo = getDeadlineText(event.registrationDeadline);
  const isCompleted = event.status === 'completed';

  return (
    <article className="group relative flex flex-col h-full rounded-2xl border border-[#242730] bg-[#14161a] hover:border-[#383d4c] transition-colors duration-200 overflow-hidden shadow-sm">
      {/* Event Header image or fallback */}
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-[#181a20]">
        {event.bannerUrl ? (
          <>
            <img
              src={event.bannerUrl}
              alt=""
              aria-hidden="true"
              className="w-full h-full object-cover transition-opacity duration-200"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#14161a] via-[#14161a]/30 to-transparent pointer-events-none" />
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-br from-[#181a20] to-[#121316] text-[#656c80]">
            <Clock className="w-7 h-7 text-[#ff4f1a]/40 mb-1.5" />
            <span className="text-xs font-mono uppercase tracking-wider text-[#9da3b4]">
              {event.categoryName || 'Competition Event'}
            </span>
          </div>
        )}

        {/* Category tag */}
        <div className="absolute top-3.5 left-3.5 z-20">
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-[#1a1d24]/90 text-[#f4f5f7] border border-[#2e3442] backdrop-blur-md">
            {event.categoryName || 'Contest'}
          </span>
        </div>

        {/* Deadline/Status Pill */}
        <div className="absolute top-3.5 right-3.5 z-20">
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold backdrop-blur-md ${
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

          {/* Event Title (Primary Stretched Link) */}
          <h3 className="font-heading text-base sm:text-lg font-bold text-white group-hover:text-[#ff4f1a] transition-colors leading-snug mb-2 line-clamp-1">
            <Link
              to={`/events/${event.id}`}
              className="focus:outline-none focus-visible:underline after:absolute after:inset-0 after:z-10"
            >
              {event.name}
            </Link>
          </h3>

          {/* Description */}
          <p className="text-xs sm:text-sm text-[#9da3b4] line-clamp-2 leading-relaxed mb-3">
            {event.description || 'No description provided.'}
          </p>

          {/* Venue & Capacity */}
          <div className="space-y-1 text-xs text-[#9da3b4]">
            <div className="flex items-center gap-1.5 truncate">
              <MapPin className="w-3.5 h-3.5 text-[#ff4f1a] shrink-0" />
              <span className="truncate text-xs">{event.venue || 'Venue TBA'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#656c80] shrink-0" />
              <span className="text-xs">{formatDateTime(event.startTime)}</span>
            </div>
            {event.capacity ? (
              <div className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#656c80] shrink-0" />
                <span className="text-xs text-[#656c80]">
                  Capacity: <span className="text-[#9da3b4] font-medium">{event.capacity} seats</span>
                </span>
              </div>
            ) : null}
          </div>
        </div>

        {/* Action footer */}
        <div className="pt-3.5 border-t border-[#242730] flex items-center justify-between text-xs">
          <span className="text-xs text-[#656c80] font-mono">
            {isCompleted ? 'Finalized' : deadlineInfo.isClosed ? 'Registration Closed' : 'Registration Open'}
          </span>
          <span
            aria-hidden="true"
            className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#191b20] group-hover:bg-[#ff4f1a] text-white transition-colors"
          >
            Details <ArrowRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </article>
  );
};

export interface EventRowProps {
  event: EventItem;
}

export const EventRow: React.FC<EventRowProps> = ({ event }) => {
  const deadlineInfo = getDeadlineText(event.registrationDeadline);
  const isCompleted = event.status === 'completed';

  const dateObj = new Date(event.startTime);
  const monthStr = !isNaN(dateObj.getTime())
    ? dateObj.toLocaleString('en-US', { month: 'short' }).toUpperCase()
    : 'EVENT';
  const dayStr = !isNaN(dateObj.getTime())
    ? dateObj.getDate()
    : '••';

  return (
    <article className="group relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl border border-[#242730] bg-[#14161a] hover:border-[#383d4c] transition-colors duration-200">
      <div className="flex items-start gap-3.5 min-w-0 flex-1">
        {/* Date block */}
        <div className="shrink-0 flex flex-col items-center justify-center w-12 h-13 rounded-xl bg-[#191b20] border border-[#2e3442] text-center">
          <span className="text-[10px] font-bold tracking-wider text-[#ff4f1a] uppercase">
            {monthStr}
          </span>
          <span className="font-heading text-base font-extrabold text-white leading-none">
            {dayStr}
          </span>
        </div>

        {/* Details */}
        <div className="min-w-0 space-y-1 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="px-2 py-0.5 rounded bg-[#1e222b] text-zinc-300 font-medium border border-[#2e3442]">
              {event.categoryName || 'Competition'}
            </span>
            {event.festName && (
              <span className="text-[#656c80] truncate">
                in <span className="text-zinc-300">{event.festName}</span>
              </span>
            )}
          </div>

          <h3 className="font-heading text-base font-bold text-white group-hover:text-[#ff4f1a] transition-colors leading-snug truncate">
            <Link
              to={`/events/${event.id}`}
              className="focus:outline-none focus-visible:underline after:absolute after:inset-0 after:z-10"
            >
              {event.name}
            </Link>
          </h3>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#9da3b4]">
            <div className="flex items-center gap-1 truncate">
              <MapPin className="w-3.5 h-3.5 text-[#ff4f1a] shrink-0" />
              <span className="truncate">{event.venue}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-[#656c80] shrink-0" />
              <span>{formatDateTime(event.startTime)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right meta & action */}
      <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#242730]">
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold ${
            isCompleted
              ? 'bg-zinc-800 text-zinc-400'
              : deadlineInfo.isClosed
              ? 'bg-amber-950/80 text-amber-300 border border-amber-800/40'
              : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/40'
          }`}
        >
          {isCompleted ? 'Concluded' : deadlineInfo.isClosed ? 'Closed' : 'Open'}
        </span>

        <span
          aria-hidden="true"
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#191b20] group-hover:bg-[#ff4f1a] text-white text-xs font-semibold transition-colors"
        >
          <span>View</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </article>
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
        <span className="font-mono uppercase tracking-wider text-xs font-semibold">{label}</span>
        {icon && <div className="text-[#9da3b4]">{icon}</div>}
      </div>
      <div>
        <div className="font-heading text-2xl sm:text-3xl font-extrabold text-white">
          {value}
        </div>
        {description && (
          <p className="text-xs text-[#9da3b4] mt-0.5 leading-snug">
            {description}
          </p>
        )}
      </div>
    </div>
  );
};
