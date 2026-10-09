import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarCheck,
  Ticket,
  Calendar,
  MapPin,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  XCircle,
  Clock,
  Search,
  X,
  Compass,
  Filter
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { getStudentRegistrations } from '../../services/registrationService';
import { Registration } from '../../types';
import { RegistrationStatusBadge } from '../../components/registration/RegistrationStatusBadge';
import { formatDateTime } from '../../utils/dateUtils';
import { CardSkeleton } from '../../components/common/LoadingSkeleton';
import { DigitalPassModal } from '../../components/common/DigitalPassModal';
import { Printer } from 'lucide-react';
import { PageHeader } from '../../components/ui';

type FilterTab = 'all' | 'upcoming' | 'past' | 'cancelled';

export const StudentRegistrationsPage: React.FC = () => {
  const { currentUser, loading: authLoading } = useAuth();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPass, setSelectedPass] = useState<Registration | null>(null);

  // Client-side filter and search states
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const loadRegistrations = useCallback(async () => {
    if (!currentUser?.uid) return;
    try {
      setLoading(true);
      setError(null);
      const data = await getStudentRegistrations(currentUser.uid);
      setRegistrations(data);
    } catch (err: any) {
      console.warn('Student registrations notice:', err?.message || err);
      setError("Couldn't load your registrations.");
    } finally {
      setLoading(false);
    }
  }, [currentUser?.uid]);

  useEffect(() => {
    if (!authLoading) {
      loadRegistrations();
    }
  }, [currentUser?.uid, authLoading, loadRegistrations]);

  // Compute counts for each filter tab from the single fetched array
  const filterCounts = useMemo(() => {
    const now = Date.now();
    let upcoming = 0;
    let past = 0;
    let cancelled = 0;

    for (const r of registrations) {
      if (r.status === 'cancelled') {
        cancelled++;
      }
      const t = r.startTime ? new Date(r.startTime).getTime() : NaN;
      if (!isNaN(t)) {
        if (t > now && r.status !== 'cancelled') {
          upcoming++;
        } else if (t <= now) {
          past++;
        }
      }
    }

    return {
      all: registrations.length,
      upcoming,
      past,
      cancelled
    };
  }, [registrations]);

  // Filter, search, and sort registrations in memory
  const displayedRegistrations = useMemo(() => {
    const now = Date.now();
    const query = searchQuery.trim().toLowerCase();

    // 1. Filter by active tab
    const filteredByTab = registrations.filter((r) => {
      if (activeTab === 'all') return true;
      if (activeTab === 'cancelled') return r.status === 'cancelled';

      const t = r.startTime ? new Date(r.startTime).getTime() : NaN;
      if (activeTab === 'upcoming') {
        return !isNaN(t) && t > now && r.status !== 'cancelled';
      }
      if (activeTab === 'past') {
        return !isNaN(t) && t <= now;
      }
      return true;
    });

    // 2. Filter by search query (case-insensitive across event, fest, category, ticketCode, venue)
    const filteredBySearch = query
      ? filteredByTab.filter((r) => {
          const eventName = (r.eventName || '').toLowerCase();
          const festName = (r.festName || '').toLowerCase();
          const categoryName = (r.categoryName || '').toLowerCase();
          const ticketCode = (r.ticketCode || '').toLowerCase();
          const venue = (r.venue || '').toLowerCase();

          return (
            eventName.includes(query) ||
            festName.includes(query) ||
            categoryName.includes(query) ||
            ticketCode.includes(query) ||
            venue.includes(query)
          );
        })
      : filteredByTab;

    // 3. Sort based on current view requirements
    return [...filteredBySearch].sort((a, b) => {
      if (activeTab === 'upcoming') {
        // Earliest upcoming event first
        const tA = a.startTime ? new Date(a.startTime).getTime() : 0;
        const tB = b.startTime ? new Date(b.startTime).getTime() : 0;
        return tA - tB;
      }

      if (activeTab === 'past') {
        // Most recent past event first
        const tA = a.startTime ? new Date(a.startTime).getTime() : 0;
        const tB = b.startTime ? new Date(b.startTime).getTime() : 0;
        return tB - tA;
      }

      if (activeTab === 'cancelled') {
        // Most recently cancelled first (fallback to updatedAt or registeredAt)
        const dateA = a.cancelledAt || a.updatedAt || a.registeredAt || '';
        const dateB = b.cancelledAt || b.updatedAt || b.registeredAt || '';
        const tA = dateA ? new Date(dateA).getTime() : 0;
        const tB = dateB ? new Date(dateB).getTime() : 0;
        return tB - tA;
      }

      // Default / All: Most recently registered first
      const tA = a.registeredAt ? new Date(a.registeredAt).getTime() : 0;
      const tB = b.registeredAt ? new Date(b.registeredAt).getTime() : 0;
      return tB - tA;
    });
  }, [registrations, activeTab, searchQuery]);

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <PageHeader
        title="My Registrations"
        description="View and manage all your event registrations."
        actions={
          <button
            type="button"
            onClick={loadRegistrations}
            disabled={loading}
            title="Refresh registration records"
            aria-label="Refresh registration records"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#191b20] hover:bg-[#1e222b] border border-[#2e3442] hover:border-zinc-700 text-xs font-semibold text-[#d1d5db] hover:text-white transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        }
      />

      {/* 2. Controls Bar: Filter Tabs & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1">
        {/* Filter Tabs */}
        <div
          role="tablist"
          aria-label="Registration Filters"
          className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'all'}
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'all'
                ? 'bg-[#ff4f1a] text-white shadow-sm'
                : 'bg-[#14161a] hover:bg-[#191b20] text-[#9da3b4] hover:text-white border border-[#242730]'
            }`}
          >
            <span>All</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeTab === 'all'
                  ? 'bg-black/25 text-white'
                  : 'bg-[#1e222b] text-[#656c80]'
              }`}
            >
              {filterCounts.all}
            </span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'upcoming'}
            onClick={() => setActiveTab('upcoming')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'upcoming'
                ? 'bg-[#ff4f1a] text-white shadow-sm'
                : 'bg-[#14161a] hover:bg-[#191b20] text-[#9da3b4] hover:text-white border border-[#242730]'
            }`}
          >
            <span>Upcoming</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeTab === 'upcoming'
                  ? 'bg-black/25 text-white'
                  : 'bg-[#1e222b] text-[#656c80]'
              }`}
            >
              {filterCounts.upcoming}
            </span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'past'}
            onClick={() => setActiveTab('past')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'past'
                ? 'bg-[#ff4f1a] text-white shadow-sm'
                : 'bg-[#14161a] hover:bg-[#191b20] text-[#9da3b4] hover:text-white border border-[#242730]'
            }`}
          >
            <span>Past</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeTab === 'past'
                  ? 'bg-black/25 text-white'
                  : 'bg-[#1e222b] text-[#656c80]'
              }`}
            >
              {filterCounts.past}
            </span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'cancelled'}
            onClick={() => setActiveTab('cancelled')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'cancelled'
                ? 'bg-[#ff4f1a] text-white shadow-sm'
                : 'bg-[#14161a] hover:bg-[#191b20] text-[#9da3b4] hover:text-white border border-[#242730]'
            }`}
          >
            <span>Cancelled</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeTab === 'cancelled'
                  ? 'bg-black/25 text-white'
                  : 'bg-[#1e222b] text-[#656c80]'
              }`}
            >
              {filterCounts.cancelled}
            </span>
          </button>
        </div>

        {/* Client-side Search Input */}
        <div className="relative w-full md:w-72 shrink-0">
          <Search className="w-3.5 h-3.5 text-[#656c80] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search registrations..."
            aria-label="Search registrations"
            className="w-full pl-9 pr-8 py-2 rounded-xl bg-[#14161a] border border-[#242730] text-xs text-white placeholder-[#656c80] focus:outline-none focus:border-[#ff4f1a] transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              title="Clear search"
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#656c80] hover:text-white p-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 3. Error state with retry */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-950/40 border border-red-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-red-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error} Please check your connection and try again.</span>
          </div>
          <button
            type="button"
            onClick={loadRegistrations}
            className="px-3.5 py-1.5 rounded-lg bg-red-900/60 hover:bg-red-900 text-white font-semibold transition-colors self-start sm:self-auto cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* 4. Loading Skeleton */}
      {loading && registrations.length === 0 && !error ? (
        <CardSkeleton count={3} />
      ) : registrations.length === 0 ? (
        /* Empty State A: Brand new student with 0 registrations */
        <div className="rounded-3xl border border-[#242730] bg-[#14161a] p-8 sm:p-12 text-center space-y-4 my-6">
          <div className="w-12 h-12 rounded-2xl bg-[#191b20] border border-[#2e3442] text-[#ff4f1a] flex items-center justify-center mx-auto">
            <CalendarCheck className="w-6 h-6" />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h2 className="font-heading text-lg sm:text-xl font-bold text-white">
              No registrations yet
            </h2>
            <p className="text-xs text-[#9da3b4] leading-relaxed">
              Explore the event directory and register for an upcoming event to start your festival experience.
            </p>
          </div>
          <div className="pt-2">
            <Link
              to="/events"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#ff4f1a] hover:bg-[#ff6838] text-xs font-semibold text-white transition-colors shadow-md shadow-[#ff4f1a]/20"
            >
              <Compass className="w-4 h-4" />
              <span>Explore Events</span>
            </Link>
          </div>
        </div>
      ) : displayedRegistrations.length === 0 ? (
        /* Empty State B / C: Filter or Search returned 0 items */
        <div className="rounded-2xl border border-[#242730] bg-[#14161a] p-8 text-center space-y-3 my-4">
          <div className="w-10 h-10 rounded-xl bg-[#191b20] text-zinc-500 flex items-center justify-center mx-auto">
            <Filter className="w-5 h-5" />
          </div>
          <div className="space-y-1 max-w-sm mx-auto">
            <h3 className="font-heading text-base font-bold text-white">No registrations found</h3>
            <p className="text-xs text-[#9da3b4] leading-relaxed">
              {searchQuery
                ? `No event registrations matched your search "${searchQuery}".`
                : activeTab === 'upcoming'
                ? 'You have no upcoming event registrations scheduled.'
                : activeTab === 'past'
                ? 'You have no past event registrations.'
                : 'You have no cancelled event registrations.'}
            </p>
          </div>
          <div className="pt-2 flex justify-center gap-2">
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="px-4 py-2 rounded-xl bg-[#191b20] hover:bg-[#1e222b] border border-[#2e3442] hover:border-zinc-700 text-xs font-semibold text-white transition-colors cursor-pointer"
              >
                Clear Search
              </button>
            )}
            {activeTab !== 'all' && (
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className="px-4 py-2 rounded-xl bg-[#191b20] hover:bg-[#1e222b] border border-[#2e3442] hover:border-zinc-700 text-xs font-semibold text-white transition-colors cursor-pointer"
              >
                View All Registrations
              </button>
            )}
          </div>
        </div>
      ) : (
        /* 5. Registration Cards List */
        <div className="space-y-4">
          {displayedRegistrations.map((reg) => {
            const isCancelled = reg.status === 'cancelled';

            return (
              <article
                key={reg.id}
                className="p-5 sm:p-6 rounded-2xl bg-[#14161a] border border-[#242730] hover:border-[#2e3442] transition-all flex flex-col md:flex-row md:items-center justify-between gap-5 group"
              >
                <div className="space-y-2.5 flex-1 min-w-0">
                  {/* Event & Category Header */}
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-white font-heading font-bold text-base sm:text-lg group-hover:text-[#ff4f1a] transition-colors">
                      {reg.eventName || reg.eventId}
                    </h2>
                    {reg.categoryName && (
                      <span className="px-2 py-0.5 rounded bg-[#1e222b] text-[#d1d5db] border border-[#2e3442] text-[10px] font-mono">
                        {reg.categoryName}
                      </span>
                    )}
                    {reg.registrationType && (
                      <span className="px-2 py-0.5 rounded bg-[#191b20] text-[#656c80] text-[10px] font-mono uppercase">
                        {reg.registrationType === 'team' ? 'Team Entry' : 'Individual'}
                      </span>
                    )}
                  </div>

                  {/* Subtitle with Fest, Venue, and Scheduled Event Time */}
                  <div className="text-[#9da3b4] text-xs flex flex-wrap items-center gap-x-4 gap-y-1">
                    {reg.festName && (
                      <span className="text-white font-medium">{reg.festName}</span>
                    )}
                    {reg.venue && (
                      <span className="flex items-center gap-1 text-[11px]">
                        <MapPin className="w-3.5 h-3.5 text-[#ff4f1a] shrink-0" />
                        <span>{reg.venue}</span>
                      </span>
                    )}
                    {reg.startTime && (
                      <span className="flex items-center gap-1 text-[11px] text-zinc-300 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-[#ff4f1a] shrink-0" />
                        <span>{formatDateTime(reg.startTime)}</span>
                      </span>
                    )}
                  </div>

                  {/* Audit Timestamps & Lifecycle Info */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-[#656c80]">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#656c80]" />
                      <span>Registered: {formatDateTime(reg.registeredAt)}</span>
                    </span>
                    {isCancelled && reg.cancelledAt && (
                      <span className="flex items-center gap-1 text-zinc-400 font-medium">
                        <XCircle className="w-3 h-3 text-zinc-500" />
                        <span>Cancelled: {formatDateTime(reg.cancelledAt)}</span>
                      </span>
                    )}
                  </div>

                  {/* Team Roster Summary if applicable */}
                  {reg.registrationType === 'team' && reg.teamName && (
                    <div className="text-[11px] text-[#656c80]">
                      Team: <strong className="text-white">{reg.teamName}</strong>
                      {reg.teamMembers && ` (${reg.teamMembers.length} members)`}
                    </div>
                  )}
                </div>

                {/* Status, Ticket Pass, and Card Action */}
                <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end justify-between gap-3 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-[#242730]">
                  {/* Status Badge */}
                  <RegistrationStatusBadge status={reg.status} />

                  {/* Ticket Code Tag */}
                  <div className="flex items-center gap-1.5 bg-[#191b20] px-3 py-1.5 rounded-xl border border-[#2e3442]">
                    <Ticket
                      className={`w-3.5 h-3.5 ${
                        isCancelled ? 'text-zinc-500' : 'text-[#ff4f1a]'
                      }`}
                    />
                    <span
                      className={`font-mono text-xs font-bold tracking-wider ${
                        isCancelled ? 'text-zinc-500 line-through' : 'text-white'
                      }`}
                    >
                      {reg.ticketCode}
                    </span>
                  </div>

                  {/* Actions Row */}
                  <div className="flex items-center gap-2">
                    {!isCancelled && (
                      <button
                        type="button"
                        onClick={() => setSelectedPass(reg)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#191b20] hover:bg-[#252830] border border-[#2e3442] hover:border-[#ff4f1a]/50 text-xs font-semibold text-white transition-all cursor-pointer shadow-sm"
                        title="View & Print Digital Pass"
                      >
                        <Printer className="w-3.5 h-3.5 text-[#ff4f1a]" />
                        <span>Pass</span>
                      </button>
                    )}

                    {/* View Details Action */}
                    <Link
                      to={`/dashboard/registrations/${reg.id}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#191b20] hover:bg-[#ff4f1a] hover:text-white border border-[#2e3442] hover:border-[#ff4f1a] text-xs font-semibold text-[#d1d5db] transition-all cursor-pointer shadow-sm group/btn"
                    >
                      <span>Details</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Digital Pass Modal */}
      <DigitalPassModal
        registration={selectedPass}
        isOpen={selectedPass !== null}
        onClose={() => setSelectedPass(null)}
      />
    </div>
  );
};
