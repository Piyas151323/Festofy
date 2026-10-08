import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  Ticket,
  Compass,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  MapPin,
  Calendar,
  Layers,
  Building2,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { getStudentRegistrations } from '../../services/registrationService';
import { Registration } from '../../types';
import { RegistrationStatusBadge } from '../../components/registration/RegistrationStatusBadge';
import { formatDateTime } from '../../utils/dateUtils';

export const StudentDashboardPage: React.FC = () => {
  const { currentUser, loading: authLoading, role, isAdmin } = useAuth();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardData = useCallback(async () => {
    if (!currentUser?.uid) return;
    try {
      setLoading(true);
      setError(null);
      const data = await getStudentRegistrations(currentUser.uid);
      setRegistrations(data);
    } catch (err) {
      console.warn('Dashboard registrations notice:', err);
      setError("Couldn't load your registrations.");
    } finally {
      setLoading(false);
    }
  }, [currentUser?.uid]);

  useEffect(() => {
    if (!authLoading) {
      loadDashboardData();
    }
  }, [authLoading, loadDashboardData]);

  // In-memory calculations derived strictly from the authenticated student's registrations
  const stats = useMemo(() => {
    const total = registrations.length;
    const confirmed = registrations.filter((r) => r.status === 'confirmed').length;
    const pending = registrations.filter((r) => r.status === 'pending').length;

    const now = Date.now();
    const upcomingList = registrations
      .filter((r) => {
        // Exclude cancelled and completed registrations
        if (r.status === 'cancelled' || r.status === 'completed') return false;
        if (!r.startTime) return false;
        const time = new Date(r.startTime).getTime();
        return !isNaN(time) && time > now;
      })
      .sort((a, b) => {
        const timeA = new Date(a.startTime).getTime();
        const timeB = new Date(b.startTime).getTime();
        return timeA - timeB; // Earliest upcoming event first
      });

    return {
      total,
      confirmed,
      pending,
      upcomingCount: upcomingList.length,
      upcomingList,
      recentList: registrations.slice(0, 5)
    };
  }, [registrations]);

  const displayName = currentUser?.displayName?.trim();
  const greeting = displayName ? `Welcome back, ${displayName}` : 'Welcome back';

  // Loading skeleton state
  if (authLoading || (loading && registrations.length === 0 && !error)) {
    return (
      <div className="space-y-8 animate-pulse">
        {/* Header Skeleton */}
        <div className="rounded-2xl border border-[#242730] bg-[#14161a] p-6 sm:p-8 space-y-3">
          <div className="h-4 w-32 bg-[#1e222b] rounded" />
          <div className="h-8 w-64 bg-[#1e222b] rounded" />
          <div className="h-4 w-96 max-w-full bg-[#1e222b] rounded" />
        </div>

        {/* Stats Skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-5 rounded-2xl border border-[#242730] bg-[#14161a] space-y-3">
              <div className="h-8 w-8 rounded-lg bg-[#1e222b]" />
              <div className="h-7 w-12 bg-[#1e222b] rounded" />
              <div className="h-4 w-24 bg-[#1e222b] rounded" />
            </div>
          ))}
        </div>

        {/* Content Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-2xl border border-[#242730] bg-[#14161a] p-6 h-64" />
          <div className="rounded-2xl border border-[#242730] bg-[#14161a] p-6 h-64" />
        </div>
      </div>
    );
  }

  // Error state with retry
  if (error) {
    return (
      <div className="rounded-2xl border border-red-900/50 bg-[#14161a] p-8 sm:p-12 text-center space-y-4 max-w-2xl mx-auto my-12">
        <div className="w-12 h-12 rounded-2xl bg-red-950/60 border border-red-900/60 text-red-400 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h2 className="font-heading text-xl font-bold text-white">{error}</h2>
          <p className="text-xs text-[#9da3b4] max-w-md mx-auto">
            Unable to communicate with the registration service. Please verify your connection and try again.
          </p>
        </div>
        <div className="pt-2">
          <button
            type="button"
            onClick={loadDashboardData}
            disabled={loading}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#191b20] hover:bg-[#1e222b] border border-[#2e3442] hover:border-zinc-600 text-xs font-semibold text-white transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Try Again</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Platform Admin Superuser Notice Banner */}
      {isAdmin && (
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-red-950/40 via-[#181a22] to-[#121316] border border-red-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30 font-mono text-[10px] uppercase font-bold shrink-0">
              Admin View
            </span>
            <span className="text-[#d1d5db]">
              Platform administrator privileges active. You have full oversight across Student, Organizer, and Admin portals.
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              to="/admin"
              className="text-xs text-red-400 hover:text-red-300 font-mono font-medium underline transition-colors"
            >
              Admin Console →
            </Link>
            <Link
              to="/organizer"
              className="text-xs text-[#9da3b4] hover:text-white font-medium ml-2 transition-colors"
            >
              Organizer Console →
            </Link>
          </div>
        </div>
      )}

      {/* 1. Header / Welcome Banner */}
      <section aria-labelledby="dashboard-welcome-heading">
        <div className="rounded-3xl border border-[#242730] bg-[#14161a] p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-sm">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#191b20] border border-[#2e3442] text-[11px] font-semibold text-[#ff4f1a]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Student Command Center</span>
            </div>
            <h1 id="dashboard-welcome-heading" className="font-heading text-2xl sm:text-3xl font-extrabold text-white">
              {greeting}
            </h1>
            <p className="text-xs text-[#9da3b4] max-w-xl leading-relaxed">
              Keep track of your upcoming events and registrations.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={loadDashboardData}
              disabled={loading}
              title="Refresh registration data"
              aria-label="Refresh registration data"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#191b20] hover:bg-[#1e222b] border border-[#2e3442] hover:border-zinc-600 text-xs font-semibold text-[#d1d5db] hover:text-white transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <Link
              to="/events"
              className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#ff4f1a] hover:bg-[#ff6838] transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-[#ff4f1a]/20"
            >
              <Compass className="w-4 h-4" />
              <span>Explore Events</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 2. Quick Stats Grid */}
      <section aria-label="Registration Statistics">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Registrations */}
          <div className="p-5 rounded-2xl border border-[#242730] bg-[#14161a] flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-[#656c80] uppercase tracking-wider font-semibold">
                Total Registrations
              </span>
              <div className="w-8 h-8 rounded-xl bg-[#191b20] border border-[#2e3442] text-zinc-300 flex items-center justify-center">
                <CalendarCheck className="w-4 h-4 text-[#ff4f1a]" />
              </div>
            </div>
            <div>
              <div className="font-heading text-2xl sm:text-3xl font-bold text-white">
                {stats.total}
              </div>
              <p className="text-[11px] text-[#656c80] mt-0.5">
                Total registrations to date
              </p>
            </div>
          </div>

          {/* Confirmed Spots */}
          <div className="p-5 rounded-2xl border border-[#242730] bg-[#14161a] flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-[#656c80] uppercase tracking-wider font-semibold">
                Confirmed
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="font-heading text-2xl sm:text-3xl font-bold text-white">
                {stats.confirmed}
              </div>
              <p className="text-[11px] text-emerald-400/80 mt-0.5">
                Participation spots secured
              </p>
            </div>
          </div>

          {/* Pending Review */}
          <div className="p-5 rounded-2xl border border-[#242730] bg-[#14161a] flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-[#656c80] uppercase tracking-wider font-semibold">
                Pending
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="font-heading text-2xl sm:text-3xl font-bold text-white">
                {stats.pending}
              </div>
              <p className="text-[11px] text-amber-400/80 mt-0.5">
                Awaiting organizer approval
              </p>
            </div>
          </div>

          {/* Upcoming Events */}
          <div className="p-5 rounded-2xl border border-[#242730] bg-[#14161a] flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-[#656c80] uppercase tracking-wider font-semibold">
                Upcoming
              </span>
              <div className="w-8 h-8 rounded-xl bg-[#ff4f1a]/10 border border-[#ff4f1a]/20 text-[#ff4f1a] flex items-center justify-center">
                <Calendar className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="font-heading text-2xl sm:text-3xl font-bold text-white">
                {stats.upcomingCount}
              </div>
              <p className="text-[11px] text-[#ff4f1a]/90 mt-0.5">
                Upcoming events scheduled
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Empty State for Brand New Student with Zero Registrations */}
      {stats.total === 0 ? (
        <section aria-label="Getting Started">
          <div className="rounded-3xl border border-[#242730] bg-[#14161a] p-8 sm:p-12 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-[#191b20] border border-[#2e3442] text-[#ff4f1a] flex items-center justify-center mx-auto shadow-inner">
              <Compass className="w-7 h-7" />
            </div>
            <div className="space-y-1.5 max-w-md mx-auto">
              <h2 className="font-heading text-xl font-bold text-white">No registrations yet</h2>
              <p className="text-xs text-[#9da3b4] leading-relaxed">
                Find an event that interests you and register from its event page to start your festival journey.
              </p>
            </div>
            <div className="pt-2">
              <Link
                to="/events"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#ff4f1a] hover:bg-[#ff6838] text-xs font-semibold text-white transition-colors shadow-lg shadow-[#ff4f1a]/20"
              >
                <span>Explore Events</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      ) : (
        /* Main Dashboard 2-Column Grid */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* 4. Upcoming Events Section (Left, 2 columns on desktop) */}
          <section aria-labelledby="upcoming-events-heading" className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center gap-2.5">
                <Calendar className="w-4 h-4 text-[#ff4f1a]" />
                <h2 id="upcoming-events-heading" className="font-heading text-base font-bold text-white">
                  Upcoming Events
                </h2>
              </div>
              <span className="text-[11px] font-mono text-[#656c80] bg-[#191b20] px-2.5 py-0.5 rounded-lg border border-[#2e3442]">
                {stats.upcomingCount} {stats.upcomingCount === 1 ? 'Event' : 'Events'}
              </span>
            </div>

            {stats.upcomingCount === 0 ? (
              <div className="rounded-2xl border border-[#242730] bg-[#14161a] p-8 text-center space-y-3">
                <div className="w-10 h-10 rounded-xl bg-[#191b20] text-zinc-500 flex items-center justify-center mx-auto">
                  <Calendar className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-white">No upcoming registrations</h3>
                  <p className="text-xs text-[#9da3b4] max-w-sm mx-auto">
                    You have no scheduled events coming up. Explore events to secure your spot.
                  </p>
                </div>
                <div className="pt-1">
                  <Link
                    to="/events"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#191b20] hover:bg-[#1e222b] border border-[#2e3442] hover:border-zinc-700 text-xs font-semibold text-white transition-colors"
                  >
                    <span>Explore Events</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-3.5">
                {stats.upcomingList.map((reg) => (
                  <article
                    key={reg.id}
                    className="p-5 sm:p-6 rounded-2xl border border-[#242730] bg-[#14161a] hover:border-[#2e3442] transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 group"
                  >
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-heading font-bold text-sm sm:text-base text-white group-hover:text-[#ff4f1a] transition-colors">
                          {reg.eventName}
                        </h3>
                        {reg.categoryName && (
                          <span className="px-2 py-0.5 rounded bg-[#1e222b] text-[#d1d5db] border border-[#2e3442] text-[10px] font-mono">
                            {reg.categoryName}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#9da3b4]">
                        {reg.festName && (
                          <span className="text-white font-medium">{reg.festName}</span>
                        )}
                        {reg.venue && (
                          <span className="flex items-center gap-1 text-[11px]">
                            <MapPin className="w-3 h-3 text-[#ff4f1a] shrink-0" />
                            <span>{reg.venue}</span>
                          </span>
                        )}
                        {reg.startTime && (
                          <span className="flex items-center gap-1 text-[11px] text-white font-medium">
                            <Clock className="w-3 h-3 text-[#ff4f1a] shrink-0" />
                            <span>{formatDateTime(reg.startTime)}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:flex-col md:items-end gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-[#242730] shrink-0">
                      <div className="flex items-center gap-2">
                        <RegistrationStatusBadge status={reg.status} />
                        <div className="hidden sm:flex items-center gap-1 bg-[#191b20] px-2.5 py-1 rounded-lg border border-[#2e3442] font-mono text-[11px] text-zinc-300">
                          <Ticket className="w-3 h-3 text-[#ff4f1a]" />
                          <span>{reg.ticketCode}</span>
                        </div>
                      </div>

                      <Link
                        to={`/dashboard/registrations/${reg.id}`}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#191b20] hover:bg-[#ff4f1a] hover:text-white border border-[#2e3442] hover:border-[#ff4f1a] text-xs font-semibold text-[#d1d5db] transition-all cursor-pointer shadow-sm group/btn"
                      >
                        <span>View Registration</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          {/* Right Column: Quick Actions + Recent Registrations */}
          <div className="space-y-6">
            {/* 5. Quick Actions Section */}
            <section aria-labelledby="quick-actions-heading" className="space-y-3">
              <h2 id="quick-actions-heading" className="font-heading text-sm font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#ff4f1a]" />
                <span>Quick Actions</span>
              </h2>

              <div className="grid grid-cols-1 gap-2.5">
                <Link
                  to="/events"
                  className="p-3.5 rounded-xl border border-[#242730] bg-[#14161a] hover:bg-[#191b20] hover:border-[#2e3442] transition-colors flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#191b20] group-hover:bg-[#1e222b] text-[#ff4f1a] flex items-center justify-center">
                      <Compass className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <span className="text-xs font-semibold text-white block group-hover:text-[#ff4f1a] transition-colors">
                        Explore Events
                      </span>
                      <span className="text-[11px] text-[#656c80] block">
                        Browse all active festival events
                      </span>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#656c80] group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                </Link>

                <Link
                  to="/dashboard/registrations"
                  className="p-3.5 rounded-xl border border-[#242730] bg-[#14161a] hover:bg-[#191b20] hover:border-[#2e3442] transition-colors flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#191b20] group-hover:bg-[#1e222b] text-emerald-400 flex items-center justify-center">
                      <CalendarCheck className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <span className="text-xs font-semibold text-white block group-hover:text-emerald-400 transition-colors">
                        My Registrations
                      </span>
                      <span className="text-[11px] text-[#656c80] block">
                        View all your registrations
                      </span>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#656c80] group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                </Link>

                <Link
                  to="/dashboard/organizations/apply"
                  className="p-3.5 rounded-xl border border-[#242730] bg-[#14161a] hover:bg-[#191b20] hover:border-[#2e3442] transition-colors flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#191b20] group-hover:bg-[#1e222b] text-purple-400 flex items-center justify-center">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <span className="text-xs font-semibold text-white block group-hover:text-purple-400 transition-colors">
                        Start an Organization
                      </span>
                      <span className="text-[11px] text-[#656c80] block">
                        Apply to organize fests & events
                      </span>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#656c80] group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                </Link>
              </div>
            </section>

            {/* 6. Recent Registrations Section */}
            <section aria-labelledby="recent-registrations-heading" className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 id="recent-registrations-heading" className="font-heading text-sm font-bold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#ff4f1a]" />
                  <span>Recent Registrations</span>
                </h2>
                <Link
                  to="/dashboard/registrations"
                  className="text-[11px] text-[#ff4f1a] hover:underline font-semibold flex items-center gap-1"
                >
                  <span>View all</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              <div className="rounded-2xl border border-[#242730] bg-[#14161a] divide-y divide-[#242730] overflow-hidden">
                {stats.recentList.map((r) => {
                  const isCancelled = r.status === 'cancelled';
                  return (
                    <div key={r.id} className="p-3.5 space-y-1.5 hover:bg-[#17191e] transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          to={`/dashboard/registrations/${r.id}`}
                          className="text-xs font-semibold text-white hover:text-[#ff4f1a] transition-colors line-clamp-1"
                        >
                          {r.eventName}
                        </Link>
                        <RegistrationStatusBadge status={r.status} />
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-[#656c80]">
                        <span className={isCancelled ? 'line-through text-zinc-500' : ''}>
                          {r.ticketCode}
                        </span>
                        <span>{formatDateTime(r.registeredAt)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        </div>
      )}
    </div>
  );
};
