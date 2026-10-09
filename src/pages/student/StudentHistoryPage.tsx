import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  History,
  Calendar,
  Clock,
  MapPin,
  Ticket,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  UserCheck,
  CreditCard,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  Clock3,
  CalendarDays
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { getStudentRegistrations } from '../../services/registrationService';
import { Registration, RegistrationStatus } from '../../types';
import { formatDateTime } from '../../utils/dateUtils';
import { RegistrationStatusBadge } from '../../components/registration/RegistrationStatusBadge';
import { PageHeader } from '../../components/ui';

export const StudentHistoryPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters and Sort
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | 'upcoming' | 'past' | 'last30'>('all');
  const [sortBy, setSortBy] = useState<'registeredAt' | 'eventDate'>('registeredAt');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  const loadHistory = async () => {
    if (!currentUser?.uid) return;
    try {
      setLoading(true);
      setError(null);
      const data = await getStudentRegistrations(currentUser.uid);
      setRegistrations(data);
    } catch (err) {
      console.warn('Notice loading student registration history:', err);
      setError('Could not load participation history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [currentUser]);

  // Tab counts
  const tabCounts = useMemo(() => {
    const now = Date.now();
    const total = registrations.length;
    const upcoming = registrations.filter(
      r => r.startTime && new Date(r.startTime).getTime() > now && r.status !== 'cancelled' && r.status !== 'completed'
    ).length;
    const completed = registrations.filter(r => r.status === 'completed').length;
    const checkedIn = registrations.filter(r => r.status === 'checked_in').length;
    const confirmed = registrations.filter(r => r.status === 'confirmed').length;
    const waitlisted = registrations.filter(r => r.status === 'pending' || r.status === 'waitlisted').length;
    const cancelled = registrations.filter(r => r.status === 'cancelled').length;

    return { total, upcoming, completed, checkedIn, confirmed, waitlisted, cancelled };
  }, [registrations]);

  // Filtered & Sorted list
  const filteredList = useMemo(() => {
    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

    return registrations
      .filter((r) => {
        // Tab filtering
        if (activeTab === 'upcoming') {
          if (!r.startTime || new Date(r.startTime).getTime() <= now || r.status === 'cancelled' || r.status === 'completed') {
            return false;
          }
        } else if (activeTab === 'completed' && r.status !== 'completed') {
          return false;
        } else if (activeTab === 'checked_in' && r.status !== 'checked_in') {
          return false;
        } else if (activeTab === 'confirmed' && r.status !== 'confirmed') {
          return false;
        } else if (activeTab === 'waitlisted' && r.status !== 'pending' && r.status !== 'waitlisted') {
          return false;
        } else if (activeTab === 'cancelled' && r.status !== 'cancelled') {
          return false;
        }

        // Date Range filtering
        if (dateFilter === 'upcoming') {
          if (!r.startTime || new Date(r.startTime).getTime() <= now) return false;
        } else if (dateFilter === 'past') {
          if (!r.startTime || new Date(r.startTime).getTime() > now) return false;
        } else if (dateFilter === 'last30') {
          const regTime = new Date(r.registeredAt).getTime();
          if (isNaN(regTime) || regTime < thirtyDaysAgo) return false;
        }

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchEvent = r.eventName.toLowerCase().includes(q);
          const matchFest = r.festName?.toLowerCase().includes(q);
          const matchTicket = r.ticketCode.toLowerCase().includes(q);
          const matchCategory = r.categoryName?.toLowerCase().includes(q);
          const matchTrx = r.paymentTransactionId?.toLowerCase().includes(q);
          if (!matchEvent && !matchFest && !matchTicket && !matchCategory && !matchTrx) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        let timeA = 0;
        let timeB = 0;

        if (sortBy === 'registeredAt') {
          timeA = new Date(a.registeredAt).getTime();
          timeB = new Date(b.registeredAt).getTime();
        } else {
          timeA = a.startTime ? new Date(a.startTime).getTime() : 0;
          timeB = b.startTime ? new Date(b.startTime).getTime() : 0;
        }

        return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
      });
  }, [registrations, activeTab, dateFilter, searchQuery, sortBy, sortOrder]);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <PageHeader
        title="Participation History"
        description="Permanent record of your event registrations, challenges, check-in timestamps, and receipts."
        actions={
          <button
            type="button"
            onClick={loadHistory}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#191b20] hover:bg-[#1e222b] border border-[#2e3442] text-xs font-semibold text-white transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        }
      />

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#242730] pb-3">
        {[
          { id: 'all', label: 'All History', count: tabCounts.total },
          { id: 'upcoming', label: 'Upcoming Events', count: tabCounts.upcoming },
          { id: 'confirmed', label: 'Confirmed Spots', count: tabCounts.confirmed },
          { id: 'checked_in', label: 'Checked In', count: tabCounts.checkedIn },
          { id: 'completed', label: 'Completed', count: tabCounts.completed },
          { id: 'waitlisted', label: 'Waitlisted / Review', count: tabCounts.waitlisted },
          { id: 'cancelled', label: 'Cancelled', count: tabCounts.cancelled }
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === tab.id
                ? 'bg-[#ff4f1a] text-white shadow-md shadow-[#ff4f1a]/20'
                : 'bg-[#14161a] text-[#9da3b4] border border-[#242730] hover:text-white hover:bg-[#191b20]'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${
                activeTab === tab.id ? 'bg-black/20 text-white' : 'bg-[#1e222b] text-zinc-400'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search and Sort Control Bar */}
      <div className="p-4 rounded-2xl bg-[#14161a] border border-[#242730] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#656c80] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search events, festivals, ticket codes, or transaction IDs..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#191b20] border border-[#2e3442] text-xs text-white placeholder-[#656c80] focus:outline-none focus:border-[#ff4f1a]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Date Filter Dropdown */}
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as any)}
            className="px-3 py-2 rounded-xl bg-[#191b20] border border-[#2e3442] text-xs text-white focus:outline-none focus:border-[#ff4f1a]"
          >
            <option value="all">All Dates</option>
            <option value="upcoming">Upcoming Schedule Only</option>
            <option value="past">Past Events Only</option>
            <option value="last30">Registered in Last 30 Days</option>
          </select>

          {/* Sort By Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 rounded-xl bg-[#191b20] border border-[#2e3442] text-xs text-white focus:outline-none focus:border-[#ff4f1a]"
          >
            <option value="registeredAt">Sort by Registration Date</option>
            <option value="eventDate">Sort by Event Schedule</option>
          </select>

          <button
            type="button"
            onClick={() => setSortOrder(prev => (prev === 'desc' ? 'asc' : 'desc'))}
            className="px-3 py-2 rounded-xl bg-[#191b20] border border-[#2e3442] text-xs font-semibold text-zinc-300 hover:text-white cursor-pointer"
            title="Toggle sort direction"
          >
            {sortOrder === 'desc' ? 'Newest ↓' : 'Oldest ↑'}
          </button>
        </div>
      </div>

      {/* Record list */}
      {loading ? (
        <div className="p-12 rounded-3xl bg-[#14161a] border border-[#242730] text-center text-xs text-[#9da3b4] animate-pulse">
          Loading historical participation records...
        </div>
      ) : filteredList.length === 0 ? (
        <div className="p-12 rounded-3xl bg-[#14161a] border border-[#242730] text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#191b20] border border-[#2e3442] text-zinc-500 flex items-center justify-center mx-auto">
            <History className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-heading text-base font-bold text-white">
              No matching activity found
            </h3>
            <p className="text-xs text-[#9da3b4] max-w-sm mx-auto">
              {searchQuery || activeTab !== 'all' || dateFilter !== 'all'
                ? 'Try adjusting your search query, status tab, or date range filter.'
                : 'As you participate in festivals and competitions, full history records will be preserved here permanently.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredList.map((reg) => {
            const isCompleted = reg.status === 'completed';
            const isCheckedIn = reg.status === 'checked_in';
            const isCancelled = reg.status === 'cancelled';
            const hasFee = typeof reg.appliedFee === 'number' && reg.appliedFee > 0;

            return (
              <div
                key={reg.id}
                className="p-5 sm:p-6 rounded-3xl bg-[#14161a] border border-[#242730] hover:border-[#2e3442] transition-colors flex flex-col md:flex-row md:items-center justify-between gap-5"
              >
                <div className="space-y-2.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-heading text-base font-bold text-white">
                      {reg.eventName}
                    </h3>
                    <RegistrationStatusBadge status={reg.status} />
                    {reg.categoryName && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#191b20] border border-[#2e3442] text-zinc-300">
                        {reg.categoryName}
                      </span>
                    )}
                    {reg.participantCategory && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#ff4f1a]/10 text-[#ff4f1a] border border-[#ff4f1a]/30">
                        Category: {reg.participantCategory}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-[#9da3b4]">
                    {reg.festName && (
                      <span className="text-white font-medium">{reg.festName}</span>
                    )}
                    {reg.startTime && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-[#ff4f1a]" />
                        <span>Event Date: {formatDateTime(reg.startTime)}</span>
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-[#656c80] font-mono text-[11px]">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Registered: {formatDateTime(reg.registeredAt)}</span>
                    </span>
                    {reg.venue && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-[#ff4f1a]" />
                        <span>{reg.venue}</span>
                      </span>
                    )}
                  </div>

                  {/* Payment & Gate Stamp Badges */}
                  <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#191b20] border border-[#2e3442] font-mono text-zinc-300">
                      <Ticket className="w-3.5 h-3.5 text-[#ff4f1a]" />
                      <span>Pass: {reg.ticketCode}</span>
                    </div>

                    {/* Payment badge */}
                    {hasFee ? (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/40 border border-emerald-800/50 text-emerald-300 font-mono">
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Paid ৳{reg.appliedFee}</span>
                        {reg.paymentMethod && (
                          <span className="uppercase text-[9px] px-1 bg-emerald-900/60 rounded">
                            {reg.paymentMethod}
                          </span>
                        )}
                        {reg.paymentTransactionId && (
                          <span className="text-[10px] text-emerald-400/80">
                            (Trx: {reg.paymentTransactionId})
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#191b20] border border-[#2e3442] text-zinc-400 font-mono">
                        <span>Free Entry (৳0)</span>
                      </div>
                    )}

                    {/* Gate check-in stamp */}
                    {isCheckedIn && reg.checkedInAt && (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-950/50 border border-cyan-800/60 text-cyan-300 font-mono">
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Gate Verified: {new Date(reg.checkedInAt).toLocaleTimeString()}</span>
                      </div>
                    )}

                    {/* Cancelled note */}
                    {isCancelled && reg.cancelledAt && (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-950/40 border border-red-800/50 text-red-300 text-[10px]">
                        <span>Released seat on {new Date(reg.cancelledAt).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action button */}
                <div className="shrink-0 flex items-center justify-end">
                  <Link
                    to={`/dashboard/registrations/${reg.id}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#191b20] hover:bg-[#ff4f1a] hover:text-white border border-[#2e3442] hover:border-[#ff4f1a] text-xs font-semibold text-[#d1d5db] transition-all shadow-sm cursor-pointer"
                  >
                    <span>View Pass & Ledger</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
