import React, { useEffect, useState, useMemo } from 'react';
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
  Sparkles
} from 'lucide-react';
import { useOrganizer } from '../../context/OrganizerContext';
import { getOrganizationFests } from '../../services/festService';
import { getOrganizationEvents } from '../../services/eventService';
import { getOrganizationRegistrations } from '../../services/registrationService';
import { Fest, EventItem, Registration } from '../../types';

export const OrganizerAnalyticsPage: React.FC = () => {
  const { activeOrganization, loading: orgLoading } = useOrganizer();
  const [fests, setFests] = useState<Fest[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    if (!activeOrganization) {
      setFests([]);
      setEvents([]);
      setRegistrations([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [fData, eData, rData] = await Promise.all([
        getOrganizationFests(activeOrganization.id),
        getOrganizationEvents(activeOrganization.id),
        getOrganizationRegistrations(activeOrganization.id)
      ]);
      setFests(fData || []);
      setEvents(eData || []);
      setRegistrations(rData || []);
    } catch (err) {
      console.error('Failed to load analytics data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!orgLoading) {
      loadData();
    }
  }, [activeOrganization, orgLoading]);

  // Derived Analytics Metrics
  const metrics = useMemo(() => {
    const totalEvents = events.length;
    const totalCapacity = events.reduce((sum, e) => sum + (e.capacity || 0), 0);
    const totalRegistrations = registrations.length;

    const confirmed = registrations.filter((r) => r.status === 'confirmed').length;
    const checkedIn = registrations.filter((r) => r.status === 'checked_in').length;
    const waitlisted = registrations.filter((r) => r.status === 'waitlisted').length;
    const cancelled = registrations.filter((r) => r.status === 'cancelled').length;
    const pending = registrations.filter((r) => r.status === 'pending').length;

    const individualCount = registrations.filter((r) => r.registrationType === 'individual').length;
    const teamCount = registrations.filter((r) => r.registrationType === 'team').length;

    const utilizationRate =
      totalCapacity > 0 ? Math.round((totalRegistrations / totalCapacity) * 100) : 0;

    // Events sorted by capacity utilization
    const eventStats = events.map((e) => {
      const eRegs = registrations.filter((r) => r.eventId === e.id);
      const count = Math.max(e.currentRegistrations || 0, eRegs.length);
      const cap = e.capacity || 1;
      const pct = Math.min(100, Math.round((count / cap) * 100));
      return {
        ...e,
        computedCount: count,
        percent: pct
      };
    }).sort((a, b) => b.percent - a.percent);

    return {
      totalEvents,
      totalCapacity,
      totalRegistrations,
      confirmed,
      checkedIn,
      waitlisted,
      cancelled,
      pending,
      individualCount,
      teamCount,
      utilizationRate,
      eventStats
    };
  }, [events, registrations]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#242730]">
        <div>
          <div className="text-xs font-mono text-[#ff4f1a] uppercase tracking-wider mb-1">
            {activeOrganization?.name || 'Workspace'} • Analytics
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-white">
            Operations Analytics & Insights
          </h1>
          <p className="text-xs text-[#9da3b4] mt-1">
            Real-time enrollment velocity, seat quota utilization, and participant demographics.
          </p>
        </div>

        <button
          type="button"
          onClick={loadData}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#191b20] hover:bg-[#1e222b] border border-[#2e3442] text-xs font-semibold text-white transition-colors cursor-pointer disabled:opacity-50 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-[#242730] bg-[#14161a] p-12 text-center text-xs text-[#9da3b4] animate-pulse">
          Computing real-time workspace analytics...
        </div>
      ) : (
        <>
          {/* Top Metrics Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl border border-[#242730] bg-[#14161a] space-y-2">
              <div className="flex justify-between items-center text-xs text-[#656c80]">
                <span className="font-mono uppercase tracking-wider text-[11px]">Seat Utilization</span>
                <TrendingUp className="w-4 h-4 text-[#ff4f1a]" />
              </div>
              <div className="font-heading text-3xl font-bold text-white">
                {metrics.utilizationRate}%
              </div>
              <div className="w-full bg-[#1e222b] rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-[#ff4f1a] h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, metrics.utilizationRate)}%` }}
                />
              </div>
              <p className="text-[11px] text-[#9da3b4]">
                {metrics.totalRegistrations} registered of {metrics.totalCapacity} total capacity
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-[#242730] bg-[#14161a] space-y-2">
              <div className="flex justify-between items-center text-xs text-[#656c80]">
                <span className="font-mono uppercase tracking-wider text-[11px]">Active Contests</span>
                <Activity className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="font-heading text-3xl font-bold text-white">
                {metrics.totalEvents}
              </div>
              <p className="text-[11px] text-emerald-400 font-medium">
                Across {fests.length} festival tournaments
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-[#242730] bg-[#14161a] space-y-2">
              <div className="flex justify-between items-center text-xs text-[#656c80]">
                <span className="font-mono uppercase tracking-wider text-[11px]">Confirmed Entries</span>
                <CheckCircle2 className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="font-heading text-3xl font-bold text-cyan-400">
                {metrics.confirmed + metrics.checkedIn}
              </div>
              <p className="text-[11px] text-[#9da3b4]">
                {metrics.checkedIn} already checked in at venue
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-[#242730] bg-[#14161a] space-y-2">
              <div className="flex justify-between items-center text-xs text-[#656c80]">
                <span className="font-mono uppercase tracking-wider text-[11px]">Participation Split</span>
                <Users className="w-4 h-4 text-purple-400" />
              </div>
              <div className="font-heading text-3xl font-bold text-white">
                {metrics.teamCount} <span className="text-sm font-normal text-[#656c80]">Teams</span>
              </div>
              <p className="text-[11px] text-[#9da3b4]">
                {metrics.individualCount} individual registrations
              </p>
            </div>
          </div>

          {/* Status Breakdown & Event Quotas */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Event Capacity Distribution */}
            <div className="lg:col-span-2 space-y-4">
              <div className="p-5 rounded-2xl border border-[#242730] bg-[#14161a] space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-heading font-bold text-sm text-white flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-[#ff4f1a]" />
                    <span>Event Quota Fulfillment</span>
                  </h3>
                  <span className="text-[11px] font-mono text-[#656c80]">
                    Ranked by capacity filled
                  </span>
                </div>

                {metrics.eventStats.length === 0 ? (
                  <p className="text-xs text-[#9da3b4] py-6 text-center">
                    No events scheduled yet for this organization.
                  </p>
                ) : (
                  <div className="space-y-3.5">
                    {metrics.eventStats.map((evt) => (
                      <div key={evt.id} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <div className="font-semibold text-white truncate max-w-xs">
                            {evt.name}
                          </div>
                          <div className="font-mono text-[11px] text-[#9da3b4]">
                            <span className="text-white font-bold">{evt.computedCount}</span> / {evt.capacity}{' '}
                            <span className="text-[#ff4f1a] font-semibold ml-1">({evt.percent}%)</span>
                          </div>
                        </div>
                        <div className="w-full bg-[#1e222b] rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-2 rounded-full transition-all duration-500 ${
                              evt.percent >= 90
                                ? 'bg-red-500'
                                : evt.percent >= 70
                                ? 'bg-[#ff4f1a]'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${evt.percent}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Registration Status Spectrum */}
            <div className="space-y-4">
              <div className="p-5 rounded-2xl border border-[#242730] bg-[#14161a] space-y-4">
                <h3 className="font-heading font-bold text-sm text-white flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-[#ff4f1a]" />
                  <span>Registration Status Spectrum</span>
                </h3>

                <div className="space-y-3">
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
                      <span>Waitlisted</span>
                    </span>
                    <span className="font-mono font-bold text-amber-400">
                      {metrics.waitlisted}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#191b20] border border-[#2e3442] text-xs">
                    <span className="flex items-center gap-2 text-white">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                      <span>Cancelled</span>
                    </span>
                    <span className="font-mono font-bold text-red-400">
                      {metrics.cancelled}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#191b20] border border-[#2e3442] text-xs">
                    <span className="flex items-center gap-2 text-white">
                      <span className="w-2.5 h-2.5 rounded-full bg-zinc-400" />
                      <span>Pending</span>
                    </span>
                    <span className="font-mono font-bold text-zinc-400">
                      {metrics.pending}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
