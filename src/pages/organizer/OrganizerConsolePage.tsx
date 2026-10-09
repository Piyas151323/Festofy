import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Users,
  Clock,
  Plus,
  RefreshCw,
  Building2,
  Ticket,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  CalendarCheck,
  CheckCircle2,
  MapPin,
  AlertTriangle,
  Flame,
  UserCog
} from 'lucide-react';
import { useOrganizer } from '../../context/OrganizerContext';
import { useAuth } from '../../hooks/useAuth';
import { getOrganizationFests } from '../../services/festService';
import { getOrganizationEvents } from '../../services/eventService';
import { getOrganizationRegistrations } from '../../services/registrationService';
import { Fest, EventItem, Registration } from '../../types';
import { formatDateTime, getDeadlineText } from '../../utils/dateUtils';
import { RegistrationStatusBadge } from '../../components/registration/RegistrationStatusBadge';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/Cards';

export const OrganizerConsolePage: React.FC = () => {
  const { activeOrganization, loading: orgLoading, refetchOrganizations } = useOrganizer();
  const { isAdmin } = useAuth();

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

    // Status metrics
    const confirmed = registrations.filter((r) => r.status === 'confirmed').length;
    const checkedIn = registrations.filter((r) => r.status === 'checked_in').length;
    const pending = registrations.filter((r) => r.status === 'pending').length;

    // Attendance rate
    const attendanceEligible = confirmed + checkedIn;
    const attendanceRate = attendanceEligible > 0
      ? Math.round((checkedIn / attendanceEligible) * 100)
      : null;

    // Events approaching capacity (>= 80%)
    const approachingCapacityEvents = events.filter((e) => {
      if (!e.capacity || e.capacity <= 0) return false;
      const count = e.currentRegistrations || 0;
      return (count / e.capacity) >= 0.8;
    });

    // Registration deadlines approaching within next 72 hours
    const approachingDeadlines = events.filter((e) => {
      if (e.isRegistrationClosed || e.status === 'cancelled' || e.status === 'completed') return false;
      const dTime = new Date(e.registrationDeadline).getTime();
      return !isNaN(dTime) && dTime > now && (dTime - now) <= (72 * 60 * 60 * 1000);
    });

    return {
      totalFests,
      activeFests,
      totalEvents,
      publishedEvents,
      upcomingEvents,
      totalRegistrations: registrations.length,
      confirmed,
      checkedIn,
      pending,
      attendanceRate,
      approachingCapacityEvents,
      approachingDeadlines
    };
  }, [fests, events, registrations]);

  // Needs Attention items
  const attentionItems = useMemo(() => {
    const items: {
      id: string;
      title: string;
      description: string;
      link: string;
      badgeText: string;
      badgeVariant: 'warning' | 'danger' | 'info';
    }[] = [];

    // 1. Pending participant reviews
    if (stats.pending > 0) {
      items.push({
        id: 'pending-reviews',
        title: `${stats.pending} pending registration review${stats.pending === 1 ? '' : 's'}`,
        description: 'New participant submissions awaiting your confirmation.',
        link: '/organizer/participants',
        badgeText: 'Pending Review',
        badgeVariant: 'warning'
      });
    }

    // 2. Events at or above 80% capacity
    stats.approachingCapacityEvents.forEach((evt) => {
      const percentage = Math.round(((evt.currentRegistrations || 0) / (evt.capacity || 1)) * 100);
      items.push({
        id: `capacity-${evt.id}`,
        title: `"${evt.name}" is at ${percentage}% capacity`,
        description: `${evt.currentRegistrations || 0} of ${evt.capacity} seats reserved. Consider expanding capacity.`,
        link: `/organizer/events/${evt.id}`,
        badgeText: `${percentage}% Full`,
        badgeVariant: 'danger'
      });
    });

    // 3. Deadlines within next 72 hours
    stats.approachingDeadlines.forEach((evt) => {
      items.push({
        id: `deadline-${evt.id}`,
        title: `Registration closing soon for "${evt.name}"`,
        description: `Deadline: ${formatDateTime(evt.registrationDeadline)} (${getDeadlineText(evt.registrationDeadline).label}).`,
        link: `/organizer/events/${evt.id}`,
        badgeText: 'Closing Soon',
        badgeVariant: 'info'
      });
    });

    return items;
  }, [stats]);

  // 1. Loading Skeleton
  if (orgLoading || (loading && !activeOrganization)) {
    return (
      <div className="space-y-6 motion-safe:animate-pulse">
        <div className="rounded-2xl border border-[#242730] bg-[#14161a] p-5 sm:p-6 space-y-2">
          <div className="h-6 w-36 bg-[#1e222b] rounded-lg" />
          <div className="h-4 w-64 bg-[#1e222b] rounded-md" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-4 rounded-2xl border border-[#242730] bg-[#14161a] h-24" />
          ))}
        </div>
        <div className="rounded-2xl border border-[#242730] bg-[#14161a] h-64" />
      </div>
    );
  }

  // 2. No Organization Linked State
  if (!activeOrganization) {
    if (isAdmin) {
      return (
        <div className="rounded-2xl border border-[#242730] bg-[#14161a] p-8 sm:p-10 text-center space-y-4 max-w-xl mx-auto my-8">
          <div className="w-12 h-12 rounded-xl bg-red-600/10 border border-red-500/30 text-red-400 flex items-center justify-center mx-auto">
            <Building2 className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase text-red-400 font-semibold">
              Platform Administrator Oversight
            </span>
            <h2 className="font-heading text-lg font-bold text-white">No Active Organizations</h2>
            <p className="text-xs text-[#9da3b4]">
              No approved organization workspaces are currently available or pending review.
            </p>
          </div>
          <div className="pt-2 flex flex-wrap justify-center gap-2.5">
            <Link
              to="/admin/organization-requests"
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-semibold text-white transition-colors"
            >
              Review Organization Requests
            </Link>
            <Link
              to="/admin"
              className="px-4 py-2 rounded-xl bg-[#191b20] hover:bg-[#1e222b] border border-[#2e3442] text-xs font-semibold text-white transition-colors"
            >
              Admin Dashboard
            </Link>
          </div>
        </div>
      );
    }

    return (
      <div className="rounded-2xl border border-[#242730] bg-[#14161a] p-8 text-center space-y-4 max-w-xl mx-auto my-8">
        <div className="w-12 h-12 rounded-xl bg-[#191b20] border border-[#2e3442] text-amber-400 flex items-center justify-center mx-auto">
          <Building2 className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h2 className="font-heading text-lg font-bold text-white">No Organizations Assigned</h2>
          <p className="text-xs text-[#9da3b4]">
            Your account is not currently linked to an approved club organization.
          </p>
        </div>
        <div className="pt-2 flex justify-center gap-2.5">
          <button
            type="button"
            onClick={refetchOrganizations}
            className="px-4 py-2 rounded-xl bg-[#191b20] hover:bg-[#1e222b] border border-[#2e3442] text-xs font-semibold text-white transition-colors cursor-pointer"
          >
            Retry Verification
          </button>
          <Link
            to="/organizer/apply"
            className="px-4 py-2 rounded-xl bg-[#ff4f1a] hover:bg-[#ff6838] text-xs font-semibold text-white transition-colors"
          >
            Apply to Organize
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 motion-safe:animate-page-enter">
      {/* 1. Page Header (Titled Overview with Active Organization name, no decorative pulsing dot) */}
      <PageHeader
        title="Overview"
        documentTitle="Overview · Organizer · Festofy"
        description={`Festival and competition operations for ${activeOrganization.name}.`}
        badge={
          <span className="text-xs font-mono font-semibold text-[#ff4f1a] uppercase tracking-wider">
            {activeOrganization.name}
          </span>
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={loadDashboardData}
              disabled={loading}
              title="Refresh workspace overview"
              aria-label="Refresh workspace overview"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#191b20] hover:bg-[#1e222b] border border-[#2e3442] text-xs font-semibold text-[#d1d5db] hover:text-white transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <Link
              to="/organizer/events/new"
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-[#ff4f1a] hover:bg-[#ff6838] transition-colors flex items-center gap-1.5 shadow-sm shadow-[#ff4f1a]/20"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Event</span>
            </Link>
          </div>
        }
      />

      {/* Error notice if fetch failed */}
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

      {/* 2. Needs Attention Panel (Only shown when there are actionable items) */}
      {attentionItems.length > 0 && (
        <section aria-labelledby="needs-attention-heading" className="rounded-2xl border border-[#2e3442] bg-[#14161a] p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <h2 id="needs-attention-heading" className="font-heading text-sm font-bold text-white">
                Needs Attention
              </h2>
            </div>
            <span className="text-[11px] font-mono text-[#9da3b4] bg-[#191b20] px-2 py-0.5 rounded-lg border border-[#2e3442]">
              {attentionItems.length} {attentionItems.length === 1 ? 'item' : 'items'}
            </span>
          </div>

          <div className="space-y-2">
            {attentionItems.map((item) => (
              <Link
                key={item.id}
                to={item.link}
                className="group flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-[#191b20] hover:bg-[#1e222b] border border-[#282c37] hover:border-[#383d4c] transition-colors"
              >
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono uppercase font-semibold ${
                        item.badgeVariant === 'danger'
                          ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                          : item.badgeVariant === 'warning'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                      }`}
                    >
                      {item.badgeText}
                    </span>
                    <span className="text-xs font-semibold text-white group-hover:text-[#ff4f1a] transition-colors truncate">
                      {item.title}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#9da3b4] truncate">{item.description}</p>
                </div>

                <div className="flex items-center gap-1 text-[11px] font-semibold text-[#ff4f1a] shrink-0 group-hover:translate-x-0.5 transition-transform self-end sm:self-center">
                  <span>Review</span>
                  <ChevronRight className="w-3 h-3" />
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 3. Exactly Four Distinct KPI Metrics (Compact 2-col mobile, 4-col desktop) */}
      <section aria-label="Key Performance Indicators">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard
            label="Active Festivals"
            value={stats.activeFests}
            description={`${stats.totalFests} festival${stats.totalFests === 1 ? '' : 's'} managed`}
            icon={<Calendar className="w-4 h-4 text-[#ff4f1a]" />}
          />
          <StatCard
            label="Active Competitions"
            value={stats.publishedEvents}
            description={`${stats.upcomingEvents.length} scheduled event${stats.upcomingEvents.length === 1 ? '' : 's'}`}
            icon={<CalendarCheck className="w-4 h-4 text-emerald-400" />}
          />
          <StatCard
            label="Total Registrations"
            value={stats.totalRegistrations}
            description={`${stats.confirmed} confirmed • ${stats.pending} pending`}
            icon={<Users className="w-4 h-4 text-amber-400" />}
          />
          <StatCard
            label="Checked-In Attendees"
            value={stats.checkedIn}
            description={stats.attendanceRate !== null ? `${stats.attendanceRate}% check-in rate` : 'On-site check-ins logged'}
            icon={<CheckCircle2 className="w-4 h-4 text-cyan-400" />}
          />
        </div>
      </section>

      {/* 4. Main 2-Column Content: Upcoming Events & Recent Registrations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column (2 columns on desktop): Upcoming Events */}
        <section aria-labelledby="upcoming-events-heading" className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 id="upcoming-events-heading" className="font-heading text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <CalendarCheck className="w-4 h-4 text-[#ff4f1a]" />
              <span>Upcoming Competitions</span>
            </h2>
            <Link
              to="/organizer/events"
              className="text-xs font-semibold text-[#ff4f1a] hover:underline flex items-center gap-1"
            >
              <span>Manage all</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {stats.upcomingEvents.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#242730] bg-[#14161a] p-8 text-center space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#191b20] text-zinc-500 flex items-center justify-center mx-auto">
                <Calendar className="w-5 h-5 text-[#ff4f1a]" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-white">No upcoming events scheduled</h3>
                <p className="text-xs text-[#9da3b4] max-w-sm mx-auto">
                  Create a competition or challenge under your active festivals to start accepting registrations.
                </p>
              </div>
              <div className="pt-1">
                <Link
                  to="/organizer/events/new"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#ff4f1a] hover:bg-[#ff6838] text-xs font-semibold text-white transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Event</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.upcomingEvents.slice(0, 5).map((evt) => (
                <article
                  key={evt.id}
                  className="p-4 sm:p-5 rounded-2xl border border-[#242730] bg-[#14161a] hover:border-[#383d4c] transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        to={`/organizer/events/${evt.id}`}
                        className="font-heading font-bold text-sm sm:text-base text-white hover:text-[#ff4f1a] transition-colors truncate"
                      >
                        {evt.name}
                      </Link>
                      {evt.categoryName && (
                        <span className="px-2 py-0.5 rounded bg-[#1e222b] text-[#9da3b4] border border-[#2e3442] text-[10px] font-mono">
                          {evt.categoryName}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#9da3b4]">
                      {evt.festName && <span className="text-zinc-300 font-medium">{evt.festName}</span>}
                      {evt.startTime && (
                        <span className="flex items-center gap-1 text-[11px] text-white font-medium">
                          <Clock className="w-3 h-3 text-[#ff4f1a] shrink-0" />
                          <span>{formatDateTime(evt.startTime)}</span>
                        </span>
                      )}
                      {evt.venue && (
                        <span className="flex items-center gap-1 text-[11px]">
                          <MapPin className="w-3 h-3 text-[#656c80] shrink-0" />
                          <span>{evt.venue}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:flex-col md:items-end gap-2 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-[#242730]">
                    <div className="text-left md:text-right">
                      <span className="text-[10px] font-mono text-[#656c80] uppercase block">Seats</span>
                      <span className="font-heading font-bold text-sm text-white">
                        {evt.currentRegistrations ?? 0}
                        {evt.capacity ? ` / ${evt.capacity}` : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/events/${evt.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-[#656c80] hover:text-[#ff4f1a] transition-colors"
                      >
                        <span>Public</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                      <Link
                        to={`/organizer/events/${evt.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#191b20] hover:bg-[#1e222b] border border-[#2e3442] text-xs font-semibold text-white transition-colors"
                      >
                        <span>Manage</span>
                        <ChevronRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Right Column (1 column on desktop): Recent Registrations */}
        <div className="space-y-6">
          <section aria-labelledby="recent-registrations-heading" className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 id="recent-registrations-heading" className="font-heading text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-[#ff4f1a]" />
                <span>Recent Registrations</span>
              </h2>
              <Link
                to="/organizer/participants"
                className="text-xs font-semibold text-[#ff4f1a] hover:underline flex items-center gap-1"
              >
                <span>View all</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {registrations.length === 0 ? (
              <div className="p-5 rounded-2xl border border-[#242730] bg-[#14161a] text-center space-y-2">
                <Ticket className="w-5 h-5 text-zinc-500 mx-auto" />
                <p className="text-xs text-[#9da3b4]">
                  No participant registrations logged yet.
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

          {/* Quick links to Organization Profile */}
          <div className="p-4 rounded-2xl border border-[#242730] bg-[#14161a] space-y-2 text-xs">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#656c80] block">
              Workspace Actions
            </span>
            <div className="flex flex-col gap-1.5">
              <Link
                to="/organizer/participants"
                className="p-2.5 rounded-xl bg-[#191b20] hover:bg-[#1e222b] text-white flex items-center justify-between transition-colors font-medium"
              >
                <span>Participant Check-in & QR Scanner</span>
                <ChevronRight className="w-3.5 h-3.5 text-[#656c80]" />
              </Link>
              <Link
                to="/organizer/profile"
                className="p-2.5 rounded-xl bg-[#191b20] hover:bg-[#1e222b] text-white flex items-center justify-between transition-colors font-medium"
              >
                <span>Edit Organization Profile</span>
                <UserCog className="w-3.5 h-3.5 text-[#ff4f1a]" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
