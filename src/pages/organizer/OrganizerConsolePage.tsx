import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Users,
  Clock,
  ShieldCheck,
  Plus,
  Activity,
  MapPin,
  RefreshCw,
  Sparkles,
  Building2,
  Ticket,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  CalendarCheck
} from 'lucide-react';
import { useOrganizer } from '../../context/OrganizerContext';
import { useAuth } from '../../hooks/useAuth';
import { getOrganizationFests } from '../../services/festService';
import { getOrganizationEvents } from '../../services/eventService';
import { getOrganizationRegistrations } from '../../services/registrationService';
import { Fest, EventItem, Registration } from '../../types';
import { formatDateTime } from '../../utils/dateUtils';
import { RegistrationStatusBadge } from '../../components/registration/RegistrationStatusBadge';

export const OrganizerConsolePage: React.FC = () => {
  const { activeOrganization, loading: orgLoading, error: orgError, refetchOrganizations } = useOrganizer();
  const { role, isAdmin } = useAuth();

  const [fests, setFests] = useState<Fest[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const loadDashboardData = useCallback(async () => {
    if (!activeOrganization) {
      setFests([]);
      setEvents([]);
      setRegistrations([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setFetchError(null);

      const [fData, eData, rData] = await Promise.all([
        getOrganizationFests(activeOrganization.id),
        getOrganizationEvents(activeOrganization.id),
        getOrganizationRegistrations(activeOrganization.id)
      ]);

      setFests(fData || []);
      setEvents(eData || []);
      setRegistrations(rData || []);
    } catch (err: any) {
      console.warn('Notice fetching organizer dashboard data:', err?.message || err);
      setFetchError('Unable to load organization workspace data. Please verify your connection.');
    } finally {
      setLoading(false);
    }
  }, [activeOrganization]);

  useEffect(() => {
    if (!orgLoading) {
      loadDashboardData();
    }
  }, [orgLoading, loadDashboardData]);

  // Derived statistics strictly organization-scoped
  const stats = useMemo(() => {
    const totalFests = fests.length;
    const activeFests = fests.filter((f) => f.status === 'published').length;
    const completedFests = fests.filter((f) => f.status === 'completed').length;
    const draftFests = fests.filter((f) => f.status === 'draft').length;

    const totalEvents = events.length;
    const publishedEvents = events.filter((e) => e.status === 'published').length;

    const now = Date.now();
    const upcomingEvents = events
      .filter((e) => {
        if (e.status === 'cancelled' || e.status === 'completed') return false;
        const time = new Date(e.startTime).getTime();
        return !isNaN(time) && time > now;
      })
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    const totalCapacity = events.reduce((sum, e) => sum + (e.capacity || 0), 0);
    // Real registrations count using atomic counter on events and registration records
    const eventCountSum = events.reduce((sum, e) => sum + (e.currentRegistrations || 0), 0);
    const totalRegistrations = Math.max(eventCountSum, registrations.length);

    return {
      totalFests,
      activeFests,
      completedFests,
      draftFests,
      totalEvents,
      publishedEvents,
      upcomingEvents,
      totalCapacity,
      totalRegistrations
    };
  }, [fests, events, registrations]);

  // 1. Loading State
  if (orgLoading || (loading && !activeOrganization)) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="rounded-3xl border border-[#242730] bg-[#14161a] p-6 sm:p-8 space-y-3">
          <div className="h-4 w-40 bg-[#1e222b] rounded" />
          <div className="h-8 w-64 bg-[#1e222b] rounded" />
          <div className="h-4 w-96 max-w-full bg-[#1e222b] rounded" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-5 rounded-2xl border border-[#242730] bg-[#14161a] h-28" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-2xl border border-[#242730] bg-[#14161a] h-80" />
          <div className="rounded-2xl border border-[#242730] bg-[#14161a] h-80" />
        </div>
      </div>
    );
  }

  // 2. No Organization Linked State
  if (!activeOrganization) {
    if (isAdmin) {
      return (
        <div className="rounded-3xl border border-[#242730] bg-[#14161a] p-8 sm:p-12 text-center space-y-4 max-w-2xl mx-auto my-12">
          <div className="w-14 h-14 rounded-2xl bg-red-600/10 border border-red-500/30 text-red-400 flex items-center justify-center mx-auto">
            <Building2 className="w-7 h-7" />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] font-mono uppercase font-semibold">
              Platform Administrator Oversight
            </div>
            <h2 className="font-heading text-xl font-bold text-white">No Active Organizations</h2>
            <p className="text-xs text-[#9da3b4] leading-relaxed">
              You are logged in with root administrator privileges. There are no approved club workspaces registered yet, or applications are currently pending review.
            </p>
          </div>
          <div className="pt-2 flex flex-wrap justify-center gap-3">
            <Link
              to="/admin/organization-requests"
              className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-semibold text-white transition-colors shadow-sm"
            >
              Review Organization Requests
            </Link>
            <Link
              to="/admin"
              className="px-5 py-2.5 rounded-xl bg-[#191b20] hover:bg-[#1e222b] border border-[#2e3442] text-xs font-semibold text-white transition-colors"
            >
              Admin Dashboard
            </Link>
          </div>
        </div>
      );
    }

    return (
      <div className="rounded-3xl border border-[#242730] bg-[#14161a] p-8 sm:p-12 text-center space-y-4 max-w-2xl mx-auto my-12">
        <div className="w-14 h-14 rounded-2xl bg-[#191b20] border border-[#2e3442] text-amber-400 flex items-center justify-center mx-auto">
          <Building2 className="w-7 h-7" />
        </div>
        <div className="space-y-1.5 max-w-md mx-auto">
          <h2 className="font-heading text-xl font-bold text-white">No Organizations Assigned</h2>
          <p className="text-xs text-[#9da3b4] leading-relaxed">
            Your authenticated account is not currently linked to an authorized club or festival organization. Please reach out to your club administrator or festival director.
          </p>
        </div>
        <div className="pt-2 flex justify-center gap-3">
          <button
            type="button"
            onClick={refetchOrganizations}
            className="px-5 py-2.5 rounded-xl bg-[#191b20] hover:bg-[#1e222b] border border-[#2e3442] text-xs font-semibold text-white transition-colors cursor-pointer"
          >
            Retry Verification
          </button>
          <Link
            to="/dashboard"
            className="px-5 py-2.5 rounded-xl bg-[#ff4f1a] hover:bg-[#ff6838] text-xs font-semibold text-white transition-colors"
          >
            Return to Student Portal
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Admin Superuser Notification Banner */}
      {isAdmin && (
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-red-950/40 via-[#181a22] to-[#121316] border border-red-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30 font-mono text-[10px] uppercase font-bold shrink-0">
              Admin Mode
            </span>
            <span className="text-[#d1d5db]">
              Platform administrator privileges active. Managing workspace for <span className="text-white font-semibold">{activeOrganization.name}</span>.
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
              to="/dashboard"
              className="text-xs text-[#9da3b4] hover:text-white font-medium ml-2 transition-colors"
            >
              Student Portal →
            </Link>
          </div>
        </div>
      )}

      {/* 1. Header / Workspace Cockpit */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#242730]">
        <div className="space-y-1">
          <div className="text-xs font-mono text-[#ff4f1a] uppercase tracking-wider flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#ff4f1a] animate-pulse" />
            <span>OPERATIONS DESK • {activeOrganization.name.toUpperCase()}</span>
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Organizer Command Center
          </h1>
          <p className="text-xs text-[#9da3b4]">
            Real-time management cockpit for club festivals, event timelines, and participant operations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={loadDashboardData}
            disabled={loading}
            title="Refresh workspace telemetry"
            aria-label="Refresh workspace telemetry"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#191b20] hover:bg-[#1e222b] border border-[#2e3442] hover:border-zinc-700 text-xs font-semibold text-[#d1d5db] hover:text-white transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <Link
            to="/organizer/fests"
            className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#ff4f1a] hover:bg-[#ff6838] transition-colors flex items-center gap-1.5 shadow-md shadow-[#ff4f1a]/20"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Manage Fests</span>
          </Link>
        </div>
      </div>

      {/* Error Banner if any */}
      {fetchError && (
        <div className="p-4 rounded-2xl bg-red-950/40 border border-red-900/50 flex items-center justify-between gap-3 text-xs text-red-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{fetchError}</span>
          </div>
          <button
            type="button"
            onClick={loadDashboardData}
            className="px-3 py-1 rounded-lg bg-red-900 hover:bg-red-800 text-white font-semibold transition-colors cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* 2. High-Level KPI Statistics Grid (Organization Scoped) */}
      <section aria-label="Organization Telemetry">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Fests */}
          <div className="p-5 rounded-2xl border border-[#242730] bg-[#14161a] space-y-2 flex flex-col justify-between">
            <div className="flex justify-between items-center text-xs text-[#656c80]">
              <span className="font-mono uppercase tracking-wider text-[11px] font-semibold">Total Fests</span>
              <Calendar className="w-4 h-4 text-[#ff4f1a]" />
            </div>
            <div>
              <div className="font-heading text-2xl sm:text-3xl font-extrabold text-white">
                {stats.totalFests}
              </div>
              <p className="text-[11px] text-[#9da3b4] mt-0.5">
                {stats.activeFests} published • {stats.draftFests} drafts
              </p>
            </div>
          </div>

          {/* Published / Active Fests */}
          <div className="p-5 rounded-2xl border border-[#242730] bg-[#14161a] space-y-2 flex flex-col justify-between">
            <div className="flex justify-between items-center text-xs text-[#656c80]">
              <span className="font-mono uppercase tracking-wider text-[11px] font-semibold">Published Fests</span>
              <Sparkles className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <div className="font-heading text-2xl sm:text-3xl font-extrabold text-white">
                {stats.activeFests}
              </div>
              <p className="text-[11px] text-emerald-400 font-medium mt-0.5">
                Active in public directory
              </p>
            </div>
          </div>

          {/* Total Events */}
          <div className="p-5 rounded-2xl border border-[#242730] bg-[#14161a] space-y-2 flex flex-col justify-between">
            <div className="flex justify-between items-center text-xs text-[#656c80]">
              <span className="font-mono uppercase tracking-wider text-[11px] font-semibold">Total Events</span>
              <Activity className="w-4 h-4 text-[#ff4f1a]" />
            </div>
            <div>
              <div className="font-heading text-2xl sm:text-3xl font-extrabold text-white">
                {stats.totalEvents}
              </div>
              <p className="text-[11px] text-[#9da3b4] mt-0.5">
                {stats.upcomingEvents.length} upcoming competitions
              </p>
            </div>
          </div>

          {/* Total Registrations */}
          <div className="p-5 rounded-2xl border border-[#242730] bg-[#14161a] space-y-2 flex flex-col justify-between">
            <div className="flex justify-between items-center text-xs text-[#656c80]">
              <span className="font-mono uppercase tracking-wider text-[11px] font-semibold">Total Registrations</span>
              <Users className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <div className="font-heading text-2xl sm:text-3xl font-extrabold text-white">
                {stats.totalRegistrations}
              </div>
              <p className="text-[11px] text-[#9da3b4] mt-0.5">
                {stats.totalCapacity > 0 ? (
                  <span>
                    {Math.round((stats.totalRegistrations / stats.totalCapacity) * 100)}% of {stats.totalCapacity} total seats filled
                  </span>
                ) : (
                  <span>Active student enrollments</span>
                )}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Main Dashboard 2-Column Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column (2/3 width): Upcoming Events */}
        <section aria-labelledby="upcoming-events-heading" className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between pb-1">
            <div className="flex items-center gap-2">
              <CalendarCheck className="w-4 h-4 text-[#ff4f1a]" />
              <h2 id="upcoming-events-heading" className="font-heading text-base font-bold text-white">
                Upcoming Events & Competitions
              </h2>
            </div>
            <Link
              to="/organizer/events"
              className="text-xs text-[#ff4f1a] hover:underline font-semibold flex items-center gap-1"
            >
              <span>View all events</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {stats.upcomingEvents.length === 0 ? (
            <div className="rounded-2xl border border-[#242730] bg-[#14161a] p-8 text-center space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#191b20] text-zinc-500 flex items-center justify-center mx-auto">
                <Calendar className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-white">No upcoming events yet</h3>
                <p className="text-xs text-[#9da3b4] max-w-sm mx-auto">
                  Fest and event management will appear here as you schedule upcoming competitions.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3.5">
              {stats.upcomingEvents.slice(0, 5).map((evt) => (
                <article
                  key={evt.id}
                  className="p-5 rounded-2xl border border-[#242730] bg-[#14161a] hover:border-[#2e3442] transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-heading font-bold text-sm sm:text-base text-white">
                        {evt.name}
                      </h3>
                      {evt.categoryName && (
                        <span className="px-2 py-0.5 rounded bg-[#1e222b] text-[#d1d5db] border border-[#2e3442] text-[10px] font-mono">
                          {evt.categoryName}
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded bg-[#191b20] text-emerald-400 border border-[#2e3442] text-[10px] font-mono uppercase">
                        {evt.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#9da3b4]">
                      {evt.festName && (
                        <span className="text-white font-medium">{evt.festName}</span>
                      )}
                      {evt.venue && (
                        <span className="flex items-center gap-1 text-[11px]">
                          <MapPin className="w-3 h-3 text-[#ff4f1a] shrink-0" />
                          <span>{evt.venue}</span>
                        </span>
                      )}
                      {evt.startTime && (
                        <span className="flex items-center gap-1 text-[11px] text-white font-medium">
                          <Clock className="w-3 h-3 text-[#ff4f1a] shrink-0" />
                          <span>{formatDateTime(evt.startTime)}</span>
                        </span>
                      )}
                    </div>

                    <div className="text-[11px] text-[#656c80] flex items-center gap-2">
                      <span>Reg. Deadline: {formatDateTime(evt.registrationDeadline)}</span>
                    </div>
                  </div>

                  <div className="flex flex-row md:flex-col items-center md:items-end justify-between gap-2 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-[#242730]">
                    <div className="text-right">
                      <span className="text-[10px] font-mono text-[#656c80] uppercase block">Reserved Seats</span>
                      <span className="font-heading font-bold text-sm text-white">
                        {evt.currentRegistrations ?? 0}
                        {evt.capacity ? ` / ${evt.capacity}` : ''}
                      </span>
                    </div>
                    <Link
                      to={`/events/${evt.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-[#ff4f1a] hover:underline font-semibold"
                    >
                      <span>Public Page</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Right Column (1/3 width): Workspace Summary & Recent Registrations */}
        <div className="space-y-6">
          {/* Workspace Information */}
          <section aria-labelledby="workspace-summary-heading" className="space-y-3">
            <h2 id="workspace-summary-heading" className="font-heading text-sm font-bold text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#ff4f1a]" />
              <span>Workspace Profile</span>
            </h2>

            <div className="p-4 rounded-2xl border border-[#242730] bg-[#14161a] space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#ff4f1a]/20 border border-[#ff4f1a]/30 text-[#ff4f1a] flex items-center justify-center font-bold text-base">
                  {activeOrganization.name?.[0]?.toUpperCase() || 'O'}
                </div>
                <div className="min-w-0">
                  <div className="font-heading text-sm font-bold text-white truncate">
                    {activeOrganization.name}
                  </div>
                  <span className="text-[10px] text-emerald-400 font-mono">
                    Authorized Club Organization
                  </span>
                </div>
              </div>

              <p className="text-xs text-[#9da3b4] leading-relaxed line-clamp-3">
                {activeOrganization.description || 'Student-run technology organization hosting inter-collegiate festival tournaments.'}
              </p>

              <div className="pt-2 border-t border-[#242730] flex items-center justify-between text-[11px]">
                <span className="text-[#656c80] font-mono">Organization ID:</span>
                <span className="font-mono text-zinc-300">{activeOrganization.id}</span>
              </div>
            </div>
          </section>

          {/* Recent Registrations Manifest */}
          <section aria-labelledby="recent-registrations-heading" className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 id="recent-registrations-heading" className="font-heading text-sm font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-[#ff4f1a]" />
                <span>Recent Registrations</span>
              </h2>
              <Link
                to="/organizer/participants"
                className="text-[11px] text-[#ff4f1a] hover:underline font-semibold flex items-center gap-1"
              >
                <span>Participants</span>
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            {registrations.length === 0 ? (
              <div className="p-5 rounded-2xl border border-[#242730] bg-[#14161a] text-center space-y-2">
                <Ticket className="w-5 h-5 text-zinc-500 mx-auto" />
                <p className="text-xs text-[#9da3b4]">
                  No registrations recorded yet. Student entries will appear here in real-time.
                </p>
              </div>
            ) : (
              <div className="rounded-2xl border border-[#242730] bg-[#14161a] divide-y divide-[#242730] overflow-hidden">
                {registrations.slice(0, 5).map((reg) => (
                  <div key={reg.id} className="p-3.5 space-y-1.5 hover:bg-[#17191e] transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-white truncate">
                          {reg.eventName || 'Event Entry'}
                        </div>
                        <div className="text-[11px] text-[#9da3b4] truncate">
                          {reg.studentName || reg.teamName || 'Student Participant'}
                        </div>
                      </div>
                      <RegistrationStatusBadge status={reg.status} />
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-[#656c80] font-mono">
                      <span>{reg.ticketCode}</span>
                      <span>{formatDateTime(reg.registeredAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};
