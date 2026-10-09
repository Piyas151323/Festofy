import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  CalendarCheck,
  Ticket,
  Calendar,
  MapPin,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  Clock,
  Search,
  X,
  Compass,
  Printer,
  Copy,
  Check
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { getStudentRegistrations } from '../../services/registrationService';
import { Registration } from '../../types';
import { RegistrationStatusBadge } from '../../components/registration/RegistrationStatusBadge';
import { formatDateTime } from '../../utils/dateUtils';
import { CardSkeleton } from '../../components/common/LoadingSkeleton';
import { DigitalPassModal } from '../../components/common/DigitalPassModal';
import { PageHeader } from '../../components/common/PageHeader';
import { QRCodeSVG } from '../../components/common/QRCodeSVG';

export type FilterTab = 'upcoming' | 'passes' | 'past' | 'cancelled' | 'all';

interface StudentRegistrationsPageProps {
  defaultTab?: FilterTab;
}

export const StudentRegistrationsPage: React.FC<StudentRegistrationsPageProps> = ({
  defaultTab
}) => {
  const { currentUser, loading: authLoading } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromQuery = searchParams.get('tab') as FilterTab | null;

  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPass, setSelectedPass] = useState<Registration | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Determine active tab prioritizing URL query param, then prop, then default 'upcoming'
  const [activeTab, setActiveTab] = useState<FilterTab>(() => {
    if (tabFromQuery && ['upcoming', 'passes', 'past', 'cancelled', 'all'].includes(tabFromQuery)) {
      return tabFromQuery;
    }
    return defaultTab || 'upcoming';
  });

  const [searchQuery, setSearchQuery] = useState<string>('');

  // Sync tab with URL query parameter when clicked
  const handleTabChange = (newTab: FilterTab) => {
    setActiveTab(newTab);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('tab', newTab);
      return next;
    });
  };

  useEffect(() => {
    if (tabFromQuery && ['upcoming', 'passes', 'past', 'cancelled', 'all'].includes(tabFromQuery)) {
      setActiveTab(tabFromQuery);
    }
  }, [tabFromQuery]);

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

  // Compute counts for each filter tab
  const filterCounts = useMemo(() => {
    const now = Date.now();
    let upcoming = 0;
    let passes = 0;
    let past = 0;
    let cancelled = 0;

    for (const r of registrations) {
      if (r.status === 'cancelled') {
        cancelled++;
      } else {
        // Active passes: non-cancelled registrations
        passes++;
      }

      const t = r.startTime ? new Date(r.startTime).getTime() : NaN;
      if (!isNaN(t)) {
        if (t > now && r.status !== 'cancelled' && r.status !== 'completed') {
          upcoming++;
        } else if (t <= now || r.status === 'completed') {
          past++;
        }
      } else if (r.status === 'completed') {
        past++;
      }
    }

    return {
      all: registrations.length,
      upcoming,
      passes,
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
      if (activeTab === 'passes') return r.status !== 'cancelled';

      const t = r.startTime ? new Date(r.startTime).getTime() : NaN;
      if (activeTab === 'upcoming') {
        return !isNaN(t) && t > now && r.status !== 'cancelled' && r.status !== 'completed';
      }
      if (activeTab === 'past') {
        return r.status === 'completed' || (!isNaN(t) && t <= now);
      }
      return true;
    });

    // 2. Filter by search query
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
        const tA = a.startTime ? new Date(a.startTime).getTime() : 0;
        const tB = b.startTime ? new Date(b.startTime).getTime() : 0;
        return tA - tB;
      }

      if (activeTab === 'past') {
        const tA = a.startTime ? new Date(a.startTime).getTime() : 0;
        const tB = b.startTime ? new Date(b.startTime).getTime() : 0;
        return tB - tA;
      }

      if (activeTab === 'cancelled') {
        const dateA = a.cancelledAt || a.updatedAt || a.registeredAt || '';
        const dateB = b.cancelledAt || b.updatedAt || b.registeredAt || '';
        const tA = dateA ? new Date(dateA).getTime() : 0;
        const tB = dateB ? new Date(dateB).getTime() : 0;
        return tB - tA;
      }

      const tA = a.registeredAt ? new Date(a.registeredAt).getTime() : 0;
      const tB = b.registeredAt ? new Date(b.registeredAt).getTime() : 0;
      return tB - tA;
    });
  }, [registrations, activeTab, searchQuery]);

  const handleCopyCode = (code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handlePrintCard = (reg: Registration, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedPass(reg);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  return (
    <div className="space-y-6 motion-safe:animate-page-enter">
      {/* 1. Page Header */}
      <PageHeader
        title="My Registrations"
        description="View your upcoming events, digital gate passes, and past festival participation."
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

      {/* 2. Controls Bar: Tabs & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1">
        {/* Navigation Tabs */}
        <div
          role="tablist"
          aria-label="Registration Filters"
          className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'upcoming'}
            onClick={() => handleTabChange('upcoming')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'upcoming'
                ? 'bg-[#ff4f1a] text-white shadow-sm'
                : 'bg-[#14161a] hover:bg-[#191b20] text-[#9da3b4] hover:text-white border border-[#242730]'
            }`}
          >
            <span>Upcoming</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeTab === 'upcoming' ? 'bg-black/25 text-white' : 'bg-[#1e222b] text-[#656c80]'
              }`}
            >
              {filterCounts.upcoming}
            </span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'passes'}
            onClick={() => handleTabChange('passes')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'passes'
                ? 'bg-[#ff4f1a] text-white shadow-sm'
                : 'bg-[#14161a] hover:bg-[#191b20] text-[#9da3b4] hover:text-white border border-[#242730]'
            }`}
          >
            <Ticket className="w-3 h-3" />
            <span>Passes</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeTab === 'passes' ? 'bg-black/25 text-white' : 'bg-[#1e222b] text-[#656c80]'
              }`}
            >
              {filterCounts.passes}
            </span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'past'}
            onClick={() => handleTabChange('past')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'past'
                ? 'bg-[#ff4f1a] text-white shadow-sm'
                : 'bg-[#14161a] hover:bg-[#191b20] text-[#9da3b4] hover:text-white border border-[#242730]'
            }`}
          >
            <span>Past</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeTab === 'past' ? 'bg-black/25 text-white' : 'bg-[#1e222b] text-[#656c80]'
              }`}
            >
              {filterCounts.past}
            </span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'cancelled'}
            onClick={() => handleTabChange('cancelled')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'cancelled'
                ? 'bg-[#ff4f1a] text-white shadow-sm'
                : 'bg-[#14161a] hover:bg-[#191b20] text-[#9da3b4] hover:text-white border border-[#242730]'
            }`}
          >
            <span>Cancelled</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeTab === 'cancelled' ? 'bg-black/25 text-white' : 'bg-[#1e222b] text-[#656c80]'
              }`}
            >
              {filterCounts.cancelled}
            </span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'all'}
            onClick={() => handleTabChange('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'all'
                ? 'bg-[#ff4f1a] text-white shadow-sm'
                : 'bg-[#14161a] hover:bg-[#191b20] text-[#9da3b4] hover:text-white border border-[#242730]'
            }`}
          >
            <span>All</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeTab === 'all' ? 'bg-black/25 text-white' : 'bg-[#1e222b] text-[#656c80]'
              }`}
            >
              {filterCounts.all}
            </span>
          </button>
        </div>

        {/* Search input */}
        <div className="relative w-full md:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#656c80]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search registrations..."
            aria-label="Search registrations"
            className="w-full pl-8 pr-7 py-1.5 bg-[#14161a] border border-[#242730] rounded-xl text-xs text-white placeholder-[#656c80] focus:outline-hidden focus:border-[#ff4f1a] transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[#656c80] hover:text-white"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 3. Error Banner */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-950/40 border border-red-900/50 flex items-center justify-between text-xs text-red-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={loadRegistrations}
            className="px-3 py-1 rounded-lg bg-red-900 hover:bg-red-800 text-white font-semibold cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* 4. Content Area */}
      {loading ? (
        <CardSkeleton count={3} />
      ) : displayedRegistrations.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#242730] bg-[#14161a] p-8 sm:p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-[#191b20] text-zinc-500 flex items-center justify-center mx-auto">
            {activeTab === 'passes' ? <Ticket className="w-6 h-6 text-[#ff4f1a]" /> : <Calendar className="w-6 h-6 text-[#ff4f1a]" />}
          </div>
          <div className="space-y-1 max-w-sm mx-auto">
            <h3 className="text-sm font-semibold text-white">
              {searchQuery
                ? 'No matching registrations found'
                : activeTab === 'upcoming'
                ? 'No upcoming events scheduled'
                : activeTab === 'passes'
                ? 'No active digital passes'
                : activeTab === 'past'
                ? 'No past participation records'
                : activeTab === 'cancelled'
                ? 'No cancelled registrations'
                : 'No registrations yet'}
            </h3>
            <p className="text-xs text-[#9da3b4]">
              {searchQuery
                ? `No results match "${searchQuery}". Try a different keyword.`
                : 'Explore active competitions and festivals to join.'}
            </p>
          </div>
          {searchQuery ? (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="px-4 py-2 rounded-xl bg-[#191b20] hover:bg-[#1e222b] border border-[#2e3442] text-xs font-semibold text-white transition-colors"
            >
              Clear Search
            </button>
          ) : (
            <Link
              to="/events"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#ff4f1a] hover:bg-[#ff6838] text-xs font-semibold text-white transition-colors"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Explore Events</span>
            </Link>
          )}
        </div>
      ) : activeTab === 'passes' ? (
        /* Passes View: QR cards grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayedRegistrations.map((reg) => (
            <div
              key={reg.id}
              onClick={() => setSelectedPass(reg)}
              className="group rounded-2xl border border-[#242730] bg-[#14161a] hover:border-[#383d4c] p-5 space-y-4 transition-colors cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#242730]">
                  <div className="min-w-0">
                    <span className="text-[10px] font-mono text-[#ff4f1a] uppercase font-bold tracking-wider block truncate">
                      {reg.festName || 'Festival'}
                    </span>
                    <h3 className="font-heading text-base font-bold text-white group-hover:text-[#ff4f1a] transition-colors truncate">
                      {reg.eventName}
                    </h3>
                  </div>
                  <RegistrationStatusBadge status={reg.status} />
                </div>

                <div className="pt-3 flex items-center gap-4">
                  <div className="p-1.5 rounded-xl bg-white border border-zinc-200 shrink-0">
                    <QRCodeSVG
                      value={`${reg.ticketCode}::${reg.id}`}
                      size={72}
                      className="mx-auto"
                    />
                  </div>

                  <div className="space-y-1.5 text-xs min-w-0 flex-1">
                    <div>
                      <span className="text-[#656c80] block text-[10px] uppercase font-mono">
                        Ticket Code
                      </span>
                      <div className="font-mono text-sm font-bold tracking-wider text-white flex items-center gap-2">
                        <span>{reg.ticketCode}</span>
                        <button
                          type="button"
                          onClick={(e) => handleCopyCode(reg.ticketCode, e)}
                          className="p-1 rounded bg-[#191b20] hover:bg-[#252830] border border-[#2e3442] text-[#9da3b4] hover:text-white transition-colors"
                          title="Copy ticket code"
                          aria-label={`Copy ticket code ${reg.ticketCode}`}
                        >
                          {copiedCode === reg.ticketCode ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-0.5 text-[#9da3b4] text-[11px]">
                      {reg.startTime && (
                        <div className="flex items-center gap-1.5 truncate">
                          <Clock className="w-3 h-3 text-[#ff4f1a] shrink-0" />
                          <span className="truncate">{formatDateTime(reg.startTime)}</span>
                        </div>
                      )}
                      {reg.venue && (
                        <div className="flex items-center gap-1.5 truncate">
                          <MapPin className="w-3 h-3 text-[#656c80] shrink-0" />
                          <span className="truncate">{reg.venue}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-[#242730] flex items-center justify-between gap-2 text-xs">
                <span className="text-[11px] text-[#656c80] truncate">
                  {reg.registrationType === 'team' ? `Team: ${reg.teamName || 'Squad'}` : 'Individual'}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => handlePrintCard(reg, e)}
                    className="p-1.5 rounded-lg bg-[#191b20] hover:bg-[#252830] border border-[#2e3442] text-[#9da3b4] hover:text-white transition-colors"
                    title="Print pass"
                    aria-label="Print pass"
                  >
                    <Printer className="w-3.5 h-3.5" />
                  </button>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#ff4f1a]">
                    Pass <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Standard View: Registrations list */
        <div className="space-y-3">
          {displayedRegistrations.map((reg) => (
            <article
              key={reg.id}
              className="p-4 sm:p-5 rounded-2xl border border-[#242730] bg-[#14161a] hover:border-[#383d4c] transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    to={`/dashboard/registrations/${reg.id}`}
                    className="font-heading font-bold text-sm sm:text-base text-white hover:text-[#ff4f1a] transition-colors truncate"
                  >
                    {reg.eventName}
                  </Link>
                  {reg.categoryName && (
                    <span className="px-2 py-0.5 rounded bg-[#1e222b] text-[#9da3b4] border border-[#2e3442] text-[10px] font-mono">
                      {reg.categoryName}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#9da3b4]">
                  {reg.festName && (
                    <span className="text-zinc-300 font-medium">{reg.festName}</span>
                  )}
                  {reg.startTime && (
                    <span className="flex items-center gap-1 text-[11px] text-white font-medium">
                      <Clock className="w-3 h-3 text-[#ff4f1a] shrink-0" />
                      <span>{formatDateTime(reg.startTime)}</span>
                    </span>
                  )}
                  {reg.venue && (
                    <span className="flex items-center gap-1 text-[11px]">
                      <MapPin className="w-3 h-3 text-[#656c80] shrink-0" />
                      <span>{reg.venue}</span>
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between md:flex-col md:items-end gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-[#242730] shrink-0">
                <div className="flex items-center gap-2">
                  <RegistrationStatusBadge status={reg.status} />
                  <div className="flex items-center gap-1 bg-[#191b20] px-2.5 py-1 rounded-lg border border-[#2e3442] font-mono text-[11px] text-zinc-300">
                    <Ticket className="w-3 h-3 text-[#ff4f1a]" />
                    <span>{reg.ticketCode}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {['confirmed', 'checked_in', 'pending'].includes(reg.status) && (
                    <button
                      type="button"
                      onClick={() => setSelectedPass(reg)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#191b20] hover:bg-[#1e222b] border border-[#2e3442] text-xs font-semibold text-[#d1d5db] hover:text-white transition-colors cursor-pointer"
                    >
                      <Ticket className="w-3 h-3 text-[#ff4f1a]" />
                      <span>Pass</span>
                    </button>
                  )}
                  <Link
                    to={`/dashboard/registrations/${reg.id}`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#191b20] hover:bg-[#ff4f1a] hover:text-white border border-[#2e3442] hover:border-[#ff4f1a] text-xs font-semibold text-[#d1d5db] transition-colors"
                  >
                    <span>Details</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Digital Pass Modal */}
      {selectedPass && (
        <DigitalPassModal
          registration={selectedPass}
          isOpen={Boolean(selectedPass)}
          onClose={() => setSelectedPass(null)}
        />
      )}
    </div>
  );
};
