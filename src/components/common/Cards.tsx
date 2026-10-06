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
    <div className="group relative flex flex-col rounded-2xl border border-[#242730] bg-[#14161a] hover:border-[#383d4c] transition-all duration-300 overflow-hidden shadow-sm hover:shadow-xl hover:shadow-black/40">
      {/* Banner */}
      <div className="relative h-48 w-full overflow-hidden bg-[#1a1d24]">
        {fest.bannerUrl ? (
          <img
            src={fest.bannerUrl}
            alt={fest.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#656c80] text-sm">
            Fest Banner
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#14161a] via-[#14161a]/30 to-transparent" />
        
        {/* Status Badge */}
        <div className="absolute top-4 left-4">
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
              isPast
                ? 'bg-zinc-800/90 text-zinc-300 border border-zinc-700'
                : 'bg-[#ff4f1a]/90 text-white shadow-sm'
            }`}
          >
            {isPast ? 'Completed' : 'Upcoming Fest'}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 flex-1 flex flex-col justify-between">
        <div>
          {/* Org Name */}
          <div className="text-xs font-medium uppercase tracking-wider text-[#ff4f1a] mb-2 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#ff4f1a]" />
            {fest.organizationName || 'Student Organization'}
          </div>

          {/* Fest Name */}
          <h3 className="font-heading text-xl font-bold text-white group-hover:text-[#ff4f1a] transition-colors leading-tight mb-2.5 line-clamp-1">
            {fest.name}
          </h3>

          {/* Description */}
          <p className="text-sm text-[#9da3b4] line-clamp-2 leading-relaxed mb-4">
            {fest.description}
          </p>
        </div>

        {/* Footer Meta */}
        <div className="pt-4 border-t border-[#242730] flex items-center justify-between text-xs text-[#9da3b4]">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#656c80]" />
            <span>{formatDateRange(fest.startDate, fest.endDate)}</span>
          </div>

          <Link
            to={`/fests/${fest.id}`}
            className="inline-flex items-center gap-1 font-semibold text-white group-hover:text-[#ff4f1a] transition-colors"
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
    <div className="group flex flex-col rounded-2xl border border-[#242730] bg-[#14161a] hover:border-[#383d4c] transition-all duration-300 overflow-hidden shadow-sm hover:shadow-xl hover:shadow-black/40">
      {/* Event Header image or header tag */}
      <div className="relative h-44 w-full overflow-hidden bg-[#1a1d24]">
        {event.bannerUrl ? (
          <img
            src={event.bannerUrl}
            alt={event.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#656c80] text-sm">
            Event Banner
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#14161a] via-[#14161a]/30 to-transparent" />

        {/* Category tag */}
        <div className="absolute top-4 left-4">
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-[#1e222b]/90 text-[#f4f5f7] border border-[#2e3442] backdrop-blur-sm">
            {event.categoryName || 'Contest'}
          </span>
        </div>

        {/* Deadline/Status Pill */}
        <div className="absolute top-4 right-4">
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold backdrop-blur-sm ${
              isCompleted
                ? 'bg-zinc-900/90 text-zinc-400 border border-zinc-700'
                : deadlineInfo.isClosed
                ? 'bg-amber-950/80 text-amber-300 border border-amber-800/50'
                : 'bg-[#ff4f1a]/90 text-white'
            }`}
          >
            <Clock className="w-3 h-3" />
            {isCompleted ? 'Event Ended' : deadlineInfo.label}
          </span>
        </div>
      </div>

      <div className="p-6 flex-1 flex flex-col justify-between">
        <div>
          {/* Fest & Org breadcrumb */}
          <div className="text-xs text-[#9da3b4] mb-2 truncate">
            <span className="text-[#656c80]">Part of </span>
            <span className="text-[#f4f5f7] font-medium">{event.festName || 'Festival'}</span>
          </div>

          {/* Event Title */}
          <h3 className="font-heading text-lg font-bold text-white group-hover:text-[#ff4f1a] transition-colors leading-tight mb-2 line-clamp-1">
            {event.name}
          </h3>

          {/* Description */}
          <p className="text-sm text-[#9da3b4] line-clamp-2 leading-relaxed mb-4">
            {event.description}
          </p>

          {/* Venue & Capacity */}
          <div className="space-y-1.5 text-xs text-[#9da3b4] mb-4">
            <div className="flex items-center gap-2 truncate">
              <MapPin className="w-3.5 h-3.5 text-[#ff4f1a] shrink-0" />
              <span className="truncate">{event.venue}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-[#656c80] shrink-0" />
              <span>{formatDateTime(event.startTime)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-3.5 h-3.5 text-[#656c80] shrink-0" />
              <span>Capacity: {event.capacity} seats</span>
            </div>
          </div>
        </div>

        {/* Action button */}
        <div className="pt-4 border-t border-[#242730] flex items-center justify-between">
          <span className="text-xs text-[#656c80] font-mono">
            {isCompleted ? 'Finalized' : 'Registration Open'}
          </span>
          <Link
            to={`/events/${event.id}`}
            className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#1e222b] hover:bg-[#ff4f1a] text-white transition-colors"
          >
            Details <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
};
