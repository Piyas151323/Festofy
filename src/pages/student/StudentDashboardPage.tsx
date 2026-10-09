import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarCheck,
  CheckCircle2,
  Clock,
  Compass,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  MapPin,
  Calendar,
  Ticket,
  Sparkles,
  ChevronRight,
  Shield
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { getStudentRegistrations } from '../../services/registrationService';
import { getPublishedEvents } from '../../services/eventService';
import { getUserProfile, calculateProfileCompletion } from '../../services/userService';
import { Registration, EventItem, UserProfile } from '../../types';
import { RegistrationStatusBadge } from '../../components/registration/RegistrationStatusBadge';
import { DigitalPassModal } from '../../components/common/DigitalPassModal';
import { StatCard } from '../../components/common/Cards';
import { formatDateTime } from '../../utils/dateUtils';

export const StudentDashboardPage: React.FC = () => {
  const { currentUser, loading: authLoading, isAdmin } = useAuth();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [recommendedEvents, setRecommendedEvents] = useState<EventItem[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPass, setSelectedPass] = useState<Registration | null>(null);

  const loadDashboardData = useCallback(async () => {
    if (!currentUser?.uid) return;
    try {
      setLoading(true);
      setError(null);

      const [regData, eventsData, userProf] = await Promise.all([
        getStudentRegistrations(currentUser.uid),
        getPublishedEvents().catch((err) => {
          console.warn('Notice loading published events:', err);
          return [] as EventItem[];
        }),
        getUserProfile(currentUser.uid).catch((err) => {
          console.warn('Notice loading user profile:', err);
          return null;
        })
      ]);

      setRegistrations(regData);
      setProfile(userProf);

      // Filter out events the student is already registered for
      const registeredEventIds = new Set(regData.map((r) => r.eventId));
      const now = Date.now();
      const availableEvents = (eventsData || []).filter((e) => {
        if (registeredEventIds.has(e.id)) return false;
        if (e.isRegistrationClosed) return false;
        const time = new Date(e.startTime).getTime();
        return !isNaN(time) && time > now;
      });

      // Match against user interests if available
      const interests = userProf?.interests || [];
      const sortedEvents = [...availableEvents].sort((a, b) => {
        const aMatches = interests.includes(a.categoryName || '') || (a.topics && a.topics.some((t) => interests.includes(t)));
        const bMatches = interests.includes(b.categoryName || '') || (b.topics && b.topics.some((t) => interests.includes(t)));
        if (aMatches && !bMatches) return -1;
        if (!aMatches && bMatches) return 1;
        return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
      });

      setRecommendedEvents(sortedEvents.slice(0, 3));
    } catch (err: any) {
      console.warn('Dashboard registrations notice:', err?.message || err);
      setError("Couldn't load your registrations.");
    } finally {
      setLoading(false);
    }
  }, [currentUser?.uid]);

  useEffect(() => {
    document.title = 'Dashboard · Festofy';
  }, []);

  useEffect(() => {
    if (!authLoading) {
      loadDashboardData();
    }
  }, [authLoading, loadDashboardData]);

  // Derived in-memory calculations
  const { stats, nextUpRegistration } = useMemo(() => {
    const total = registrations.length;
    const confirmed = registrations.filter((r) => r.status === 'confirmed').length;
    const pending = registrations.filter((r) => r.status === 'pending').length;

    const now = Date.now();
    const upcomingList = registrations
      .filter((r) => {
        if (r.status === 'cancelled' || r.status === 'completed') return false;
        if (!r.startTime) return false;
        const time = new Date(r.startTime).getTime();
        return !isNaN(time) && time > now;
      })
      .sort((a, b) => {
        const timeA = new Date(a.startTime).getTime();
        const timeB = new Date(b.startTime).getTime();
        return timeA - timeB;
      });

    const nextUp = upcomingList.length > 0 ? upcomingList[0] : null;

    return {
      stats: {
        total,
        confirmed,
        pending,
        upcomingCount: upcomingList.length,
        recentList: registrations.slice(0, 4)
      },
      nextUpRegistration: nextUp
    };
  }, [registrations]);

  const profileCompletion = useMemo(() => {
    return calculateProfileCompletion(profile || currentUser);
  }, [profile, currentUser]);

  const displayName = currentUser?.displayName?.trim();
  const greeting = displayName ? `Welcome back, ${displayName}` : 'Welcome back';

  // Loading skeleton state
  if (authLoading || (loading && registrations.length === 0 && !error)) {
    return (
      <div className="space-y-6 motion-safe:animate-pulse">
        {/* Header Skeleton */}
        <div className="rounded-2xl border border-[#242730] bg-[#14161a] p-5 sm:p-6 flex justify-between items-center">
          <div className="space-y-2">
            <div className="h-6 w-48 bg-[#1e222b] rounded-lg" />
            <div className="h-4 w-72 bg-[#1e222b] rounded-md" />
          </div>
          <div className="h-9 w-28 bg-[#1e222b] rounded-xl" />
        </div>

        {/* Stats Skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-4 rounded-2xl border border-[#242730] bg-[#14161a] h-24" />
          ))}
        </div>

        {/* Next Up Skeleton */}
        <div className="rounded-2xl border border-[#242730] bg-[#14161a] p-6 h-36" />
      </div>
    );
  }

  // Error state with retry
  if (error) {
    return (
      <div className="rounded-2xl border border-red-900/40 bg-[#14161a] p-8 text-center space-y-4 max-w-lg mx-auto my-8">
        <div className="w-12 h-12 rounded-2xl bg-red-950/60 border border-red-900/60 text-red-400 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h2 className="font-heading text-lg font-bold text-white">{error}</h2>
          <p className="text-xs text-[#9da3b4]">
            Unable to connect to the registration service. Please verify your connection.
          </p>
        </div>
        <button
          type="button"
          onClick={loadDashboardData}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#191b20] hover:bg-[#1e222b] border border-[#2e3442] text-xs font-semibold text-white transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Try Again</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 motion-safe:animate-page-enter">
      {/* Superuser Admin Inline Notice */}
      {isAdmin && (
        <aside aria-label="Administrator privilege notice" className="px-3.5 py-2 rounded-xl bg-[#14161a] border border-red-500/30 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-red-400">
            <Shield className="w-3.5 h-3.5 shrink-0" />
            <span className="font-medium text-[#d1d5db]">
              Admin privileges active. Full system oversight enabled.
            </span>
          </div>
          <div className="flex items-center gap-3 font-mono text-[11px]">
            <Link to="/admin" className="text-red-400 hover:text-red-300 underline transition-colors">
              Admin Console →
            </Link>
            <Link to="/organizer" className="text-[#9da3b4] hover:text-white transition-colors">
              Organizer Console →
            </Link>
          </div>
        </aside>
      )}

      {/* Slim Profile Completion Row (hidden when 100%) */}
      {profileCompletion.percentage < 100 && (
        <aside aria-label="Profile completion progress">
          <Link
            to="/dashboard/profile"
            className="group flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 px-4 py-2.5 rounded-xl border border-[#242730] bg-[#14161a] hover:border-[#323744] transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-xs font-semibold text-white truncate">
                Profile completion: {profileCompletion.percentage}%
              </span>
              <span className="hidden sm:inline text-xs text-[#9da3b4]">
                Complete {profileCompletion.missingFields[0] || 'details'} to streamline event registrations
              </span>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <div className="w-24 sm:w-32 h-1.5 bg-[#1e222b] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#ff4f1a] rounded-full transition-all duration-300"
                  style={{ width: `${profileCompletion.percentage}%` }}
                />
              </div>
              <span className="text-[11px] font-semibold text-[#ff4f1a] flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                Finish <ChevronRight className="w-3 h-3" />
              </span>
            </div>
          </Link>
        </aside>
      )}

      {/* 1. Compact Header */}
      <header className="rounded-2xl border border-[#242730] bg-[#14161a] p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-xl sm:text-2xl font-bold text-white">
            {greeting}
          </h1>
          <p className="text-xs text-[#9da3b4] mt-0.5">
            Your event registrations, digital passes, and festival schedule.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={loadDashboardData}
            disabled={loading}
            title="Refresh dashboard"
            aria-label="Refresh dashboard"
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-[#191b20] hover:bg-[#1e222b] border border-[#2e3442] text-xs font-semibold text-[#d1d5db] hover:text-white transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <Link
            to="/events"
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#ff4f1a] hover:bg-[#ff6838] transition-colors shadow-sm shadow-[#ff4f1a]/20"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Explore Events</span>
          </Link>
        </div>
      </header>

      {/* 2. "Next up" Section (Nearest Upcoming Registration) */}
      {nextUpRegistration && (
        <section aria-labelledby="next-up-heading">
          <div className="rounded-2xl border border-[#242730] bg-[#14161a] p-4 sm:p-5 hover:border-[#323744] transition-colors">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#ff4f1a]" />
                <h2 id="next-up-heading" className="text-xs font-mono font-semibold uppercase tracking-wider text-[#ff4f1a]">
                  Next Up
                </h2>
              </div>
              <RegistrationStatusBadge status={nextUpRegistration.status} />
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1.5 min-w-0">
                <Link
                  to={`/dashboard/registrations/${nextUpRegistration.id}`}
                  className="font-heading text-base sm:text-lg font-bold text-white hover:text-[#ff4f1a] transition-colors truncate block"
                >
                  {nextUpRegistration.eventName}
                </Link>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#9da3b4]">
                  {nextUpRegistration.festName && (
                    <span className="text-zinc-300 font-medium">{nextUpRegistration.festName}</span>
                  )}
                  {nextUpRegistration.startTime && (
                    <span className="flex items-center gap-1 text-white font-medium">
                      <Clock className="w-3 h-3 text-[#ff4f1a]" />
                      <span>{formatDateTime(nextUpRegistration.startTime)}</span>
                    </span>
                  )}
                  {nextUpRegistration.venue && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-[#656c80]" />
                      <span>{nextUpRegistration.venue}</span>
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-[#242730]">
                {/* Direct View Pass button when applicable */}
                {['confirmed', 'checked_in', 'pending'].includes(nextUpRegistration.status) && (
                  <button
                    type="button"
                    onClick={() => setSelectedPass(nextUpRegistration)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#ff4f1a] hover:bg-[#ff6838] text-xs font-semibold text-white transition-colors cursor-pointer shadow-xs"
                  >
                    <Ticket className="w-3.5 h-3.5" />
                    <span>View Pass</span>
                  </button>
                )}
                <Link
                  to={`/dashboard/registrations/${nextUpRegistration.id}`}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#191b20] hover:bg-[#1e222b] border border-[#2e3442] text-xs font-semibold text-[#d1d5db] hover:text-white transition-colors"
                >
                  <span>Details</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 3. Compact Statistics (2 columns on mobile, 4 on desktop) */}
      <section aria-label="Registration Statistics">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard
            label="Confirmed"
            value={stats.confirmed}
            description="Active participant spots"
            icon={<CheckCircle2 className="w-4 h-4 text-emerald-400" />}
          />
          <StatCard
            label="Upcoming"
            value={stats.upcomingCount}
            description="Scheduled events"
            icon={<Calendar className="w-4 h-4 text-[#ff4f1a]" />}
          />
          <StatCard
            label="Pending"
            value={stats.pending}
            description="Awaiting organizer review"
            icon={<Clock className="w-4 h-4 text-amber-400" />}
          />
          <StatCard
            label="Total Registrations"
            value={stats.total}
            description="All-time entries"
            icon={<CalendarCheck className="w-4 h-4 text-zinc-400" />}
          />
        </div>
      </section>

      {/* Main Grid: Recent Registrations & Recommended Events */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* 4. Recent Registrations (2 columns on desktop) */}
        <section aria-labelledby="recent-registrations-heading" className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 id="recent-registrations-heading" className="font-heading text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <CalendarCheck className="w-4 h-4 text-[#ff4f1a]" />
              <span>Recent Registrations</span>
            </h2>
            <Link
              to="/dashboard/registrations"
              className="text-xs font-semibold text-[#ff4f1a] hover:text-[#ff6838] transition-colors flex items-center gap-1"
            >
              <span>View all</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {stats.total === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#242730] bg-[#14161a] p-8 text-center space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#191b20] text-[#ff4f1a] flex items-center justify-center mx-auto">
                <Compass className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">No registrations yet</h3>
                <p className="text-xs text-[#9da3b4] mt-0.5 max-w-sm mx-auto">
                  Explore active festivals and competitions to secure your spots.
                </p>
              </div>
              <Link
                to="/events"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#ff4f1a] hover:bg-[#ff6838] text-xs font-semibold text-white transition-colors"
              >
                <span>Find Events</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="rounded-2xl border border-[#242730] bg-[#14161a] divide-y divide-[#242730] overflow-hidden">
              {stats.recentList.map((reg) => (
                <div
                  key={reg.id}
                  className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#17191e] transition-colors"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/dashboard/registrations/${reg.id}`}
                        className="text-xs sm:text-sm font-semibold text-white hover:text-[#ff4f1a] transition-colors truncate"
                      >
                        {reg.eventName}
                      </Link>
                      {reg.categoryName && (
                        <span className="hidden sm:inline px-1.5 py-0.5 rounded bg-[#1e222b] text-[#9da3b4] border border-[#2e3442] text-[10px] font-mono">
                          {reg.categoryName}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#656c80]">
                      <span className="font-mono">{reg.ticketCode}</span>
                      {reg.startTime && <span>{formatDateTime(reg.startTime)}</span>}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#242730]">
                    <RegistrationStatusBadge status={reg.status} />
                    <Link
                      to={`/dashboard/registrations/${reg.id}`}
                      className="text-xs text-[#9da3b4] hover:text-white p-1 rounded-lg hover:bg-[#1e222b] transition-colors"
                      aria-label={`View details for ${reg.eventName}`}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 5. Recommended Events (1 column on desktop) */}
        <section aria-labelledby="recommended-events-heading" className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 id="recommended-events-heading" className="font-heading text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#ff4f1a]" />
              <span>Recommended Events</span>
            </h2>
            <Link
              to="/events"
              className="text-xs text-[#9da3b4] hover:text-white transition-colors"
            >
              Browse
            </Link>
          </div>

          {recommendedEvents.length === 0 ? (
            <div className="rounded-2xl border border-[#242730] bg-[#14161a] p-6 text-center space-y-2">
              <p className="text-xs text-[#9da3b4]">
                No new events to recommend right now. Check back soon for new announcements!
              </p>
              <Link
                to="/fests"
                className="inline-block text-xs text-[#ff4f1a] hover:underline font-semibold"
              >
                Explore Festivals →
              </Link>
            </div>
          ) : (
            <div className="space-y-2.5">
              {recommendedEvents.map((event) => (
                <Link
                  key={event.id}
                  to={`/events/${event.id}`}
                  className="group block p-3.5 rounded-xl border border-[#242730] bg-[#14161a] hover:border-[#383d4c] transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-xs font-semibold text-white group-hover:text-[#ff4f1a] transition-colors line-clamp-1">
                      {event.name}
                    </h3>
                    {event.categoryName && (
                      <span className="px-1.5 py-0.5 rounded bg-[#191b20] text-[#9da3b4] border border-[#2e3442] text-[10px] font-mono shrink-0">
                        {event.categoryName}
                      </span>
                    )}
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[#656c80]">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-[#ff4f1a]" />
                      <span>{formatDateTime(event.startTime)}</span>
                    </span>
                    {event.venue && (
                      <span className="flex items-center gap-1 truncate">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate">{event.venue}</span>
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>

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
