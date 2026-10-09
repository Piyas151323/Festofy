import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart3,
  TrendingUp,
  Users,
  Calendar,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Clock,
  RefreshCw,
  PieChart,
  Layers,
  Sparkles,
  UserCheck,
  XCircle,
  Percent,
  ChevronRight,
  Building2,
  AlertCircle,
  HelpCircle,
  ArrowUpRight,
  Flame,
  Check
} from 'lucide-react';
import { useOrganizer } from '../../context/OrganizerContext';
import { getOrganizationFests } from '../../services/festService';
import { getOrganizationEvents } from '../../services/eventService';
import { getOrganizationRegistrations } from '../../services/registrationService';
import { Fest, EventItem, Registration } from '../../types';
import { formatDateTime } from '../../utils/dateUtils';
import { PageHeader } from '../../components/common/PageHeader';

export const OrganizerAnalyticsPage: React.FC = () => {
  const { activeOrganization, loading: orgLoading } = useOrganizer();
  const [fests, setFests] = useState<Fest[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!activeOrganization) {
      setFests([]);
      setEvents([]);
      setRegistrations([]);
      setLoading(false);
      setErrorMsg(null);
      return;
    }

    try {
      setLoading(true);
      setErrorMsg(null);
      const [fData, eData, rData] = await Promise.all([
        getOrganizationFests(activeOrganization.id),
        getOrganizationEvents(activeOrganization.id),
        getOrganizationRegistrations(activeOrganization.id)
      ]);
      setFests(fData || []);
      setEvents(eData || []);
      setRegistrations(rData || []);
    } catch (err: any) {
      console.warn('Notice loading analytics data:', err);
      setErrorMsg(err?.message || 'Failed to retrieve workspace metrics. Please verify connectivity.');
    } finally {
      setLoading(false);
    }
  }, [activeOrganization]);

  useEffect(() => {
    if (!orgLoading) {
      loadData();
    }
  }, [activeOrganization, orgLoading, loadData]);

  // Derived Analytics Metrics computed strictly from authorized workspace dataset
  const metrics = useMemo(() => {
    const totalEvents = events.length;
    const totalRegistrations = registrations.length;

    // Status breakdown
    const confirmed = registrations.filter((r) => r.status === 'confirmed').length;
    const checkedIn = registrations.filter((r) => r.status === 'checked_in').length;
    const pending = registrations.filter((r) => r.status === 'pending').length;
    const cancelled = registrations.filter((r) => r.status === 'cancelled').length;
    const waitlisted = registrations.filter((r) => r.status === 'waitlisted').length;
    const completed = registrations.filter((r) => r.status === 'completed').length;

    // Active registrations strictly exclude cancelled ones
    const activeRegistrations = registrations.filter((r) => r.status !== 'cancelled').length;

    // Eligible audience for attendance: participants that reached confirmed or checked_in or completed status
    const attendanceEligible = confirmed + checkedIn + completed;
    const attendanceRate = attendanceEligible > 0
      ? Math.round((checkedIn / attendanceEligible) * 100)
      : null; // null represents meaningful undefined / zero-denominator

    // Registration type split (without double counting teams)
    const individualCount = registrations.filter(
      (r) => r.registrationType === 'individual' && r.status !== 'cancelled'
    ).length;
    const teamCount = registrations.filter(
      (r) => r.registrationType === 'team' && r.status !== 'cancelled'
    ).length;

    // Team members total individual headcount
    const totalTeamMembersCount = registrations
      .filter((r) => r.registrationType === 'team' && r.status !== 'cancelled')
      .reduce((acc, r) => acc + (r.teamMembers?.length || 1), 0);
    const totalIndividualParticipants = individualCount + totalTeamMembersCount;

    // Capacity metrics computed strictly over events that have capacity defined and > 0
    const eventsWithCapacity = events.filter((e) => typeof e.capacity === 'number' && e.capacity > 0);
    const totalCapacity = eventsWithCapacity.reduce((sum, e) => sum + (e.capacity || 0), 0);

    // Active registered seats across events with capacity (excluding cancelled)
    const totalSeatsAllocated = eventsWithCapacity.reduce((sum, e) => {
      // Use canonical event.currentRegistrations or active registrations count for this event
      const eventActiveRegs = registrations.filter(
        (r) => r.eventId === e.id && r.status !== 'cancelled'
      ).length;
      return sum + Math.max(e.currentRegistrations || 0, eventActiveRegs);
    }, 0);

    const utilizationRate = totalCapacity > 0
      ? Math.round((totalSeatsAllocated / totalCapacity) * 100)
      : 0;

    // Event-specific analytics
    const eventStats = events.map((e) => {
      const eRegs = registrations.filter((r) => r.eventId === e.id);
      const eActiveRegs = eRegs.filter((r) => r.status !== 'cancelled');
      const eConfirmed = eRegs.filter((r) => r.status === 'confirmed').length;
      const eCheckedIn = eRegs.filter((r) => r.status === 'checked_in').length;
      const ePending = eRegs.filter((r) => r.status === 'pending').length;
      const eCancelled = eRegs.filter((r) => r.status === 'cancelled').length;

      // Actual capacity count
      const activeCount = Math.max(e.currentRegistrations || 0, eActiveRegs.length);
      const cap = typeof e.capacity === 'number' && e.capacity > 0 ? e.capacity : null;
      const pct = cap ? Math.min(100, Math.round((activeCount / cap) * 100)) : null;

      // Event attendance rate
      const eEligible = eConfirmed + eCheckedIn;
      const eAttendancePct = eEligible > 0 ? Math.round((eCheckedIn / eEligible) * 100) : null;

      return {
        ...e,
        totalRegs: eRegs.length,
        activeCount,
        eConfirmed,
        eCheckedIn,
        ePending,
        eCancelled,
        cap,
        percent: pct,
        attendancePct: eAttendancePct
      };
    });

    // High capacity events (>= 80% filled)
    const highCapacityEvents = eventStats
      .filter((e) => e.percent !== null && e.percent >= 80)
      .sort((a, b) => (b.percent || 0) - (a.percent || 0));

    // Low capacity events (< 30% filled or 0 active registrations)
    const lowCapacityEvents = eventStats
      .filter((e) => e.percent !== null && e.percent < 30)
      .sort((a, b) => (a.percent || 0) - (b.percent || 0));

    // Grouping registrations by Festival
    const festStats = fests.map((f) => {
      const fEvents = events.filter((e) => e.festId === f.id);
      const fEventIds = new Set(fEvents.map((e) => e.id));
      const fRegs = registrations.filter((r) => fEventIds.has(r.eventId) || r.festId === f.id);
      const fActive = fRegs.filter((r) => r.status !== 'cancelled').length;
      const fConfirmed = fRegs.filter((r) => r.status === 'confirmed' || r.status === 'checked_in').length;
      const fCheckedIn = fRegs.filter((r) => r.status === 'checked_in').length;

      return {
        ...f,
        eventCount: fEvents.length,
        totalRegs: fRegs.length,
        activeRegs: fActive,
        confirmed: fConfirmed,
        checkedIn: fCheckedIn
      };
    }).sort((a, b) => b.activeRegs - a.activeRegs);

    return {
      totalEvents,
      totalCapacity,
      totalSeatsAllocated,
      totalRegistrations,
      activeRegistrations,
      confirmed,
      checkedIn,
      pending,
      cancelled,
      waitlisted,
      completed,
      attendanceRate,
      attendanceEligible,
      individualCount,
      teamCount,
      totalTeamMembersCount,
      totalIndividualParticipants,
      utilizationRate,
      eventStats,
      highCapacityEvents,
      lowCapacityEvents,
      festStats
    };
  }, [events, registrations, fests]);

  if (!activeOrganization) {
    return (
      <div className="rounded-3xl border border-[#242730] bg-[#14161a] p-8 sm:p-12 text-center space-y-4 max-w-2xl mx-auto my-12">
        <div className="w-14 h-14 rounded-2xl bg-[#191b20] border border-[#2e3442] text-amber-400 flex items-center justify-center mx-auto">
          <Building2 className="w-7 h-7" />
        </div>
        <div className="space-y-1.5 max-w-md mx-auto">
          <h2 className="font-heading text-xl font-bold text-white">No Active Workspace</h2>
          <p className="text-xs text-[#9da3b4] leading-relaxed">
            Please select an authorized organization from the top workspace switcher to view operational telemetry and analytics.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 1. Header */}
      <PageHeader
        title="Analytics & Insights"
        documentTitle="Analytics"
        description="Enrollment rates, check-in completion, capacity utilization, and festival performance."
        badge={
          <span className="text-xs font-mono text-[#ff4f1a] uppercase tracking-wider">
            {activeOrganization.name.toUpperCase()}
          </span>
        }
        actions={
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={loadData}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#191b20] hover:bg-[#1e222b] border border-[#2e3442] hover:border-zinc-700 text-xs font-semibold text-white transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <Link
              to="/organizer/participants"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#ff4f1a] hover:bg-[#ff6838] text-xs font-semibold text-white transition-colors shadow-sm"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Participants</span>
            </Link>
          </div>
        }
      />

      {/* Error state if query failed */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-red-950/40 border border-red-900/50 flex items-center justify-between gap-3 text-xs text-red-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button
            type="button"
            onClick={loadData}
            className="px-3 py-1 rounded-lg bg-red-900 hover:bg-red-800 text-white font-semibold transition-colors cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border border-[#242730] bg-[#14161a] p-16 text-center space-y-3 animate-pulse">
          <div className="w-8 h-8 rounded-full border-2 border-[#ff4f1a] border-t-transparent animate-spin mx-auto" />
          <p className="text-xs text-[#9da3b4] font-mono">
            Computing live analytics for {activeOrganization.name}...
          </p>
        </div>
      ) : (
        <>
          {/* 2. Top-Level Operational Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Active Registrations */}
            <div className="p-5 rounded-2xl border border-[#242730] bg-[#14161a] space-y-2 flex flex-col justify-between">
              <div className="flex justify-between items-center text-xs text-[#656c80]">
                <span className="font-mono uppercase tracking-wider text-[11px] font-semibold">Active Registrations</span>
                <Users className="w-4 h-4 text-[#ff4f1a]" />
              </div>
              <div>
                <div className="font-heading text-3xl font-extrabold text-white">
                  {metrics.activeRegistrations}
                </div>
                <p className="text-[11px] text-[#9da3b4] mt-1">
                  {metrics.totalRegistrations} total recorded • {metrics.cancelled} cancelled
                </p>
              </div>
              <div className="pt-2 border-t border-[#1e222b] text-[10px] text-zinc-400 flex items-center justify-between">
                <span>Pending review:</span>
                <span className="font-mono font-bold text-amber-400">{metrics.pending}</span>
              </div>
            </div>

            {/* Attendance Rate */}
            <div className="p-5 rounded-2xl border border-[#242730] bg-[#14161a] space-y-2 flex flex-col justify-between">
              <div className="flex justify-between items-center text-xs text-[#656c80]">
                <span className="font-mono uppercase tracking-wider text-[11px] font-semibold">Venue Attendance Rate</span>
                <UserCheck className="w-4 h-4 text-cyan-400" />
              </div>
              <div>
                <div className="font-heading text-3xl font-extrabold text-cyan-400">
                  {metrics.attendanceRate !== null ? `${metrics.attendanceRate}%` : 'N/A'}
                </div>
                <p className="text-[11px] text-[#9da3b4] mt-1">
                  {metrics.attendanceRate !== null ? (
                    <span>{metrics.checkedIn} checked in of {metrics.attendanceEligible} confirmed</span>
                  ) : (
                    <span>No confirmed participants yet</span>
                  )}
                </p>
              </div>
              <div className="pt-2 border-t border-[#1e222b] text-[10px] text-zinc-400 flex items-center justify-between">
                <span>Gate check-ins:</span>
                <span className="font-mono font-bold text-cyan-400">{metrics.checkedIn}</span>
              </div>
            </div>

            {/* Quota / Seat Utilization */}
            <div className="p-5 rounded-2xl border border-[#242730] bg-[#14161a] space-y-2 flex flex-col justify-between">
              <div className="flex justify-between items-center text-xs text-[#656c80]">
                <span className="font-mono uppercase tracking-wider text-[11px] font-semibold">Seat Quota Utilization</span>
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <div className="font-heading text-3xl font-extrabold text-white">
                  {metrics.utilizationRate}%
                </div>
                <div className="w-full bg-[#1e222b] rounded-full h-1.5 overflow-hidden my-1.5">
                  <div
                    className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, metrics.utilizationRate)}%` }}
                  />
                </div>
                <p className="text-[11px] text-[#9da3b4]">
                  {metrics.totalSeatsAllocated} / {metrics.totalCapacity} total seat quota
                </p>
              </div>
              <div className="pt-2 border-t border-[#1e222b] text-[10px] text-zinc-400 flex items-center justify-between">
                <span>Remaining seats:</span>
                <span className="font-mono font-bold text-white">
                  {Math.max(0, metrics.totalCapacity - metrics.totalSeatsAllocated)}
                </span>
              </div>
            </div>

            {/* Participation Breakdown */}
            <div className="p-5 rounded-2xl border border-[#242730] bg-[#14161a] space-y-2 flex flex-col justify-between">
              <div className="flex justify-between items-center text-xs text-[#656c80]">
                <span className="font-mono uppercase tracking-wider text-[11px] font-semibold">Participant Demographics</span>
                <Layers className="w-4 h-4 text-purple-400" />
              </div>
              <div>
                <div className="font-heading text-3xl font-extrabold text-purple-400">
                  {metrics.totalIndividualParticipants}
                </div>
                <p className="text-[11px] text-[#9da3b4] mt-1">
                  Total individual headcount
                </p>
              </div>
              <div className="pt-2 border-t border-[#1e222b] text-[10px] text-zinc-400 flex items-center justify-between">
                <span>Individual / Teams:</span>
                <span className="font-mono font-bold text-white">
                  {metrics.individualCount} ind. / {metrics.teamCount} teams
                </span>
              </div>
            </div>
          </div>

          {/* 3. Operational Highlights & Alerts (Approaching Capacity & Opportunities) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Approaching Capacity Alert */}
            <div className="p-5 rounded-2xl border border-[#242730] bg-[#14161a] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-red-400" />
                  <h3 className="font-heading text-sm font-bold text-white">
                    High Demand & Approaching Capacity (≥80%)
                  </h3>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] font-mono font-bold">
                  {metrics.highCapacityEvents.length} Events
                </span>
              </div>

              {metrics.highCapacityEvents.length === 0 ? (
                <p className="text-xs text-[#9da3b4] py-3 text-center">
                  No events currently exceeding 80% quota fulfillment.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {metrics.highCapacityEvents.slice(0, 3).map((evt) => (
                    <div
                      key={evt.id}
                      className="p-3 rounded-xl bg-[#191b20] border border-[#2e3442] flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0">
                        <div className="font-semibold text-white truncate">{evt.name}</div>
                        <div className="text-[11px] text-[#9da3b4]">
                          {evt.activeCount} of {evt.cap} seats occupied
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-lg bg-red-500/20 text-red-400 font-mono font-bold shrink-0">
                        {evt.percent}% full
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Low Registration Alert */}
            <div className="p-5 rounded-2xl border border-[#242730] bg-[#14161a] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <h3 className="font-heading text-sm font-bold text-white">
                    Low Registration Velocity (&lt;30%)
                  </h3>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-mono font-bold">
                  {metrics.lowCapacityEvents.length} Events
                </span>
              </div>

              {metrics.lowCapacityEvents.length === 0 ? (
                <p className="text-xs text-[#9da3b4] py-3 text-center">
                  All scheduled events have healthy registration activity.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {metrics.lowCapacityEvents.slice(0, 3).map((evt) => (
                    <div
                      key={evt.id}
                      className="p-3 rounded-xl bg-[#191b20] border border-[#2e3442] flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0">
                        <div className="font-semibold text-white truncate">{evt.name}</div>
                        <div className="text-[11px] text-[#9da3b4]">
                          {evt.activeCount} of {evt.cap} seats filled
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-400 font-mono font-bold shrink-0">
                        {evt.percent !== null ? `${evt.percent}%` : '0%'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 4. Status Spectrum & Festival Performance */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Status Breakdown (1/3) */}
            <div className="space-y-4">
              <div className="p-5 rounded-2xl border border-[#242730] bg-[#14161a] space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-heading font-bold text-sm text-white flex items-center gap-2">
                    <PieChart className="w-4 h-4 text-[#ff4f1a]" />
                    <span>Registration Status Breakdown</span>
                  </h3>
                  <span className="text-[11px] font-mono text-[#656c80]">
                    {metrics.totalRegistrations} total
                  </span>
                </div>

                <div className="space-y-2.5">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#191b20] border border-[#2e3442] text-xs">
                    <span className="flex items-center gap-2 text-white">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                      <span>Confirmed</span>
                    </span>
                    <span className="font-mono font-bold text-emerald-400">
                      {metrics.confirmed}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#191b20] border border-[#2e3442] text-xs">
                    <span className="flex items-center gap-2 text-white">
                      <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                      <span>Checked In</span>
                    </span>
                    <span className="font-mono font-bold text-cyan-400">
                      {metrics.checkedIn}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#191b20] border border-[#2e3442] text-xs">
                    <span className="flex items-center gap-2 text-white">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                      <span>Pending Approval</span>
                    </span>
                    <span className="font-mono font-bold text-amber-400">
                      {metrics.pending}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#191b20] border border-[#2e3442] text-xs">
                    <span className="flex items-center gap-2 text-white">
                      <span className="w-2.5 h-2.5 rounded-full bg-zinc-400" />
                      <span>Waitlisted</span>
                    </span>
                    <span className="font-mono font-bold text-zinc-300">
                      {metrics.waitlisted}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#191b20] border border-[#2e3442] text-xs">
                    <span className="flex items-center gap-2 text-white">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                      <span>Cancelled (Excluded from Active)</span>
                    </span>
                    <span className="font-mono font-bold text-red-400">
                      {metrics.cancelled}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Performance Grouped by Festival (2/3) */}
            <div className="lg:col-span-2 space-y-4">
              <div className="p-5 rounded-2xl border border-[#242730] bg-[#14161a] space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-heading font-bold text-sm text-white flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#ff4f1a]" />
                    <span>Tournament & Festival Performance</span>
                  </h3>
                  <span className="text-[11px] font-mono text-[#656c80]">
                    {fests.length} festivals
                  </span>
                </div>

                {metrics.festStats.length === 0 ? (
                  <p className="text-xs text-[#9da3b4] py-8 text-center">
                    No festival tournaments hosted by this organization yet.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {metrics.festStats.map((f) => (
                      <div
                        key={f.id}
                        className="p-4 rounded-xl bg-[#191b20] border border-[#2e3442] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-heading font-bold text-sm text-white truncate">
                              {f.name}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-[#14161a] text-zinc-300 border border-[#2e3442]">
                              {f.status}
                            </span>
                          </div>
                          <div className="text-[11px] text-[#9da3b4] flex items-center gap-3">
                            <span>{f.eventCount} competitions</span>
                            <span>•</span>
                            <span className="text-white font-medium">{f.activeRegs} active entries</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-xs font-mono self-end sm:self-auto">
                          <div className="text-right">
                            <span className="text-[10px] text-[#656c80] uppercase block">Check-ins</span>
                            <span className="font-bold text-cyan-400">{f.checkedIn}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-[#656c80] uppercase block">Confirmed</span>
                            <span className="font-bold text-emerald-400">{f.confirmed}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 5. Complete Event Quota & Capacity Utilization Manifest */}
          <div className="p-5 rounded-2xl border border-[#242730] bg-[#14161a] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#242730]">
              <div>
                <h3 className="font-heading font-bold text-base text-white flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-[#ff4f1a]" />
                  <span>Event Capacity & Registration Velocity Manifest</span>
                </h3>
                <p className="text-xs text-[#9da3b4]">
                  Full breakdown of active registrations, quota fulfillment, and attendance per competition.
                </p>
              </div>
              <span className="text-[11px] font-mono text-[#656c80]">
                {metrics.eventStats.length} events
              </span>
            </div>

            {metrics.eventStats.length === 0 ? (
              <p className="text-xs text-[#9da3b4] py-8 text-center">
                No events found for this workspace. Create your first competition in the Events tab.
              </p>
            ) : (
              <div className="space-y-4">
                {metrics.eventStats.map((evt) => (
                  <div
                    key={evt.id}
                    className="p-4 rounded-xl bg-[#191b20] border border-[#2e3442] space-y-2.5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-heading font-bold text-sm text-white truncate">
                            {evt.name}
                          </h4>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-[#14161a] text-zinc-300 border border-[#2e3442]">
                            {evt.status}
                          </span>
                        </div>
                        <div className="text-[11px] text-[#9da3b4] flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5">
                          {evt.festName && <span>Fest: {evt.festName}</span>}
                          <span>Reg. Deadline: {formatDateTime(evt.registrationDeadline)}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-xs font-mono self-start sm:self-auto">
                        <div className="text-right">
                          <span className="text-[10px] text-[#656c80] uppercase block">Capacity</span>
                          <span className="font-bold text-white">
                            {evt.activeCount} / {evt.cap !== null ? evt.cap : '∞'}
                            {evt.percent !== null && (
                              <span className="text-[#ff4f1a] ml-1">({evt.percent}%)</span>
                            )}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-[#656c80] uppercase block">Attendance</span>
                          <span className="font-bold text-cyan-400">
                            {evt.attendancePct !== null ? `${evt.attendancePct}%` : 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    {evt.percent !== null && (
                      <div className="w-full bg-[#14161a] rounded-full h-2 overflow-hidden border border-[#242730]">
                        <div
                          className={`h-2 rounded-full transition-all duration-500 ${
                            evt.percent >= 90
                              ? 'bg-red-500'
                              : evt.percent >= 75
                              ? 'bg-[#ff4f1a]'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${evt.percent}%` }}
                        />
                      </div>
                    )}

                    {/* Sub-metrics tags */}
                    <div className="flex flex-wrap items-center gap-2 text-[10px] text-zinc-400 font-mono pt-1">
                      <span className="px-2 py-0.5 rounded bg-[#14161a] border border-[#2e3442]">
                        Confirmed: <strong className="text-emerald-400">{evt.eConfirmed}</strong>
                      </span>
                      <span className="px-2 py-0.5 rounded bg-[#14161a] border border-[#2e3442]">
                        Checked-in: <strong className="text-cyan-400">{evt.eCheckedIn}</strong>
                      </span>
                      <span className="px-2 py-0.5 rounded bg-[#14161a] border border-[#2e3442]">
                        Pending: <strong className="text-amber-400">{evt.ePending}</strong>
                      </span>
                      <span className="px-2 py-0.5 rounded bg-[#14161a] border border-[#2e3442]">
                        Cancelled: <strong className="text-red-400">{evt.eCancelled}</strong>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
