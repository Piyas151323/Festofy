import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  ExternalLink,
  CalendarCheck2,
  Calendar,
  Clock,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Eye,
  Edit,
  Trash2,
  XCircle,
  Users,
  Building2,
  Layers,
  Sparkles
} from 'lucide-react';
import { useOrganizer } from '../../context/OrganizerContext';
import {
  getOrganizationEvents,
  publishEvent,
  completeEvent,
  cancelEvent,
  deleteDraftEvent
} from '../../services/eventService';
import { getOrganizationFests } from '../../services/festService';
import { EventItem, Fest, EventStatus } from '../../types';
import { formatDateTime } from '../../utils/dateUtils';

export const OrganizerEventsPage: React.FC = () => {
  const { activeOrganization, loading: orgLoading } = useOrganizer();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [fests, setFests] = useState<Fest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filters & search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | EventStatus>('all');
  const [festFilter, setFestFilter] = useState<string>('all');

  // Action dialog states
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [dialogType, setDialogType] = useState<'publish' | 'complete' | 'cancel' | 'delete' | null>(null);

  const loadData = async () => {
    if (!activeOrganization) {
      setEvents([]);
      setFests([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setErrorMsg(null);
      const [eventsData, festsData] = await Promise.all([
        getOrganizationEvents(activeOrganization.id),
        getOrganizationFests(activeOrganization.id)
      ]);
      setEvents(eventsData || []);
      setFests(festsData || []);
    } catch (err: any) {
      console.warn('Notice loading organization events:', err?.message || err);
      setErrorMsg(err.message || 'Unable to retrieve organization events.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!orgLoading) {
      loadData();
    }
  }, [activeOrganization, orgLoading]);

  // Filtered & sorted events
  const filteredEvents = useMemo(() => {
    return events.filter((evt) => {
      if (statusFilter !== 'all' && evt.status !== statusFilter) return false;
      if (festFilter !== 'all' && evt.festId !== festFilter) return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const nameMatch = evt.name?.toLowerCase().includes(query);
        const venueMatch = evt.venue?.toLowerCase().includes(query);
        const descMatch = evt.description?.toLowerCase().includes(query);
        const festMatch = evt.festName?.toLowerCase().includes(query);
        const catMatch = evt.categoryName?.toLowerCase().includes(query);
        if (!nameMatch && !venueMatch && !descMatch && !festMatch && !catMatch) return false;
      }
      return true;
    });
  }, [events, statusFilter, festFilter, searchQuery]);

  // Lifecycle confirmation actions
  const handleConfirmAction = async () => {
    if (!selectedEvent || !dialogType) return;
    try {
      setActionLoading(true);
      setErrorMsg(null);

      if (dialogType === 'publish') {
        await publishEvent(selectedEvent.id);
        setSuccessMsg(`Event "${selectedEvent.name}" has been published.`);
      } else if (dialogType === 'complete') {
        await completeEvent(selectedEvent.id);
        setSuccessMsg(`Event "${selectedEvent.name}" marked as completed.`);
      } else if (dialogType === 'cancel') {
        await cancelEvent(selectedEvent.id);
        setSuccessMsg(`Event "${selectedEvent.name}" has been cancelled.`);
      } else if (dialogType === 'delete') {
        await deleteDraftEvent(selectedEvent.id);
        setSuccessMsg(`Draft event "${selectedEvent.name}" has been deleted.`);
      }

      setDialogType(null);
      setSelectedEvent(null);
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update event state.');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: EventStatus) => {
    switch (status) {
      case 'published':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            Published
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <CheckCircle2 className="w-3 h-3" />
            Completed
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <XCircle className="w-3 h-3" />
            Cancelled
          </span>
        );
      case 'draft':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
            Draft
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#242730]">
        <div>
          <div className="text-xs font-mono text-[#ff4f1a] uppercase tracking-wider mb-1">
            {activeOrganization?.name || 'Workspace'} • Competitions
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-white">
            Managed Events & Competitions
          </h1>
          <p className="text-xs text-[#9da3b4] mt-1">
            Schedule hackathons, contests, workshops, enforce seat capacities, and control publishing.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/organizer/events/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#ff4f1a] hover:bg-[#ff6838] text-xs font-bold text-white transition-all shadow-lg shadow-[#ff4f1a]/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Event</span>
          </Link>
        </div>
      </div>

      {/* FEEDBACK BANNERS */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-3 text-rose-400 text-xs">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <div className="flex-1 leading-relaxed">{errorMsg}</div>
          <button
            onClick={() => setErrorMsg(null)}
            className="text-rose-400 hover:text-white text-xs underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3 text-emerald-400 text-xs">
          <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
          <div className="flex-1 leading-relaxed">{successMsg}</div>
          <button
            onClick={() => setSuccessMsg(null)}
            className="text-emerald-400 hover:text-white text-xs underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* CONTROLS / FILTERS BAR */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 p-4 rounded-2xl bg-[#14161a] border border-[#242730]">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by event, venue, or category..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#191b20] border border-[#2e3442] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#ff4f1a]"
            />
          </div>

          {/* Festival filter */}
          {fests.length > 0 && (
            <div className="sm:w-56">
              <select
                value={festFilter}
                onChange={(e) => setFestFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#191b20] border border-[#2e3442] text-xs text-zinc-300 focus:outline-none focus:border-[#ff4f1a]"
              >
                <option value="all">All Festivals ({fests.length})</option>
                {fests.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 lg:pb-0">
          {(['all', 'draft', 'published', 'completed', 'cancelled'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize whitespace-nowrap transition-colors cursor-pointer ${
                statusFilter === st
                  ? 'bg-[#ff4f1a] text-white shadow-sm'
                  : 'bg-[#191b20] hover:bg-[#1e222b] text-zinc-400 hover:text-white border border-[#2e3442]'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* TABLE / CONTENT */}
      {loading ? (
        <div className="rounded-2xl border border-[#242730] bg-[#14161a] p-12 text-center text-xs text-[#9da3b4] animate-pulse">
          Loading organization events...
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="rounded-2xl border border-[#242730] bg-[#14161a] p-12 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-[#191b20] border border-[#2e3442] text-zinc-500 flex items-center justify-center mx-auto">
            <CalendarCheck2 className="w-7 h-7" />
          </div>
          <div className="space-y-1 max-w-sm mx-auto">
            <h3 className="font-heading text-base font-bold text-white">
              {events.length === 0 ? 'No events created yet' : 'No matching events found'}
            </h3>
            <p className="text-xs text-[#9da3b4] leading-relaxed">
              {events.length === 0
                ? `Create contests, symposiums, or workshops under your organization's festivals to begin accepting student registrations.`
                : 'Try adjusting your search criteria or status filter to see other events.'}
            </p>
          </div>
          {events.length === 0 && (
            <div className="pt-2">
              <Link
                to="/organizer/events/new"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#ff4f1a] hover:bg-[#ff6838] text-xs font-bold text-white transition-all shadow-lg shadow-[#ff4f1a]/20 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create First Event</span>
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-[#242730] bg-[#14161a] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#191b20] text-[#9da3b4] uppercase tracking-wider text-[10px] border-b border-[#242730]">
                <tr>
                  <th className="p-4">Event Details</th>
                  <th className="p-4">Parent Festival</th>
                  <th className="p-4">Venue & Schedule</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Registrations</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#242730] text-white">
                {filteredEvents.map((evt) => {
                  const regCount = evt.currentRegistrations || 0;
                  const isFull = evt.capacity > 0 && regCount >= evt.capacity;
                  const percent = evt.capacity > 0 ? Math.min(100, Math.round((regCount / evt.capacity) * 100)) : 0;

                  return (
                    <tr key={evt.id} className="hover:bg-[#1a1d24] transition-colors">
                      {/* Name & Category */}
                      <td className="p-4">
                        <Link
                          to={`/organizer/events/${evt.id}`}
                          className="font-bold text-white hover:text-[#ff4f1a] transition-colors block text-sm"
                        >
                          {evt.name}
                        </Link>
                        <div className="flex items-center gap-2 mt-1">
                          {evt.categoryName && (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#191b20] text-[#9da3b4] border border-[#2e3442]">
                              {evt.categoryName}
                            </span>
                          )}
                          <span className="text-[10px] font-mono text-zinc-500 uppercase">
                            {evt.registrationType || 'individual'}
                          </span>
                        </div>
                      </td>

                      {/* Parent Festival */}
                      <td className="p-4 text-[#9da3b4]">
                        <Link
                          to={`/organizer/fests/${evt.festId}`}
                          className="hover:text-zinc-200 transition-colors inline-flex items-center gap-1.5"
                        >
                          <Building2 className="w-3.5 h-3.5 text-zinc-500" />
                          <span>{evt.festName || 'Festival'}</span>
                        </Link>
                      </td>

                      {/* Venue & Schedule */}
                      <td className="p-4 text-[#9da3b4] space-y-1">
                        <div className="text-zinc-300 font-medium">{evt.venue}</div>
                        <div className="font-mono text-[11px] text-zinc-500 flex items-center gap-1.5">
                          <Clock className="w-3 h-3" />
                          <span>{formatDateTime(evt.startTime)}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="p-4">{getStatusBadge(evt.status)}</td>

                      {/* Registrations */}
                      <td className="p-4">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px] font-mono">
                            <span className={isFull ? 'text-rose-400 font-bold' : 'text-zinc-300'}>
                              {regCount} / {evt.capacity}
                            </span>
                            <span className="text-zinc-500">{percent}%</span>
                          </div>
                          <div className="w-24 h-1.5 rounded-full bg-[#191b20] overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                isFull ? 'bg-rose-500' : percent > 80 ? 'bg-amber-500' : 'bg-[#ff4f1a]'
                              }`}
                              style={{ width: `${percent}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Manage / Details */}
                          <Link
                            to={`/organizer/events/${evt.id}`}
                            className="p-1.5 rounded-lg bg-[#191b20] hover:bg-[#1e222b] text-zinc-300 hover:text-white border border-[#2e3442] transition-colors"
                            title="Manage Event"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Link>

                          {/* Edit (if draft or published) */}
                          {(evt.status === 'draft' || evt.status === 'published') && (
                            <Link
                              to={`/organizer/events/${evt.id}/edit`}
                              className="p-1.5 rounded-lg bg-[#191b20] hover:bg-[#1e222b] text-zinc-300 hover:text-white border border-[#2e3442] transition-colors"
                              title="Edit Event"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </Link>
                          )}

                          {/* Publish (if draft) */}
                          {evt.status === 'draft' && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedEvent(evt);
                                setDialogType('publish');
                              }}
                              className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition-colors cursor-pointer"
                              title="Publish Event"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Complete (if published) */}
                          {evt.status === 'published' && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedEvent(evt);
                                setDialogType('complete');
                              }}
                              className="p-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 transition-colors cursor-pointer"
                              title="Mark Completed"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Cancel (if published or draft) */}
                          {(evt.status === 'published' || evt.status === 'draft') && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedEvent(evt);
                                setDialogType('cancel');
                              }}
                              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-rose-500/10 text-zinc-400 hover:text-rose-400 border border-[#2e3442] hover:border-rose-500/20 transition-colors cursor-pointer"
                              title="Cancel Event"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Delete draft (if draft and 0 registrations) */}
                          {evt.status === 'draft' && regCount === 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedEvent(evt);
                                setDialogType('delete');
                              }}
                              className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors cursor-pointer"
                              title="Delete Draft"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Public Page (if published/completed) */}
                          {(evt.status === 'published' || evt.status === 'completed') && (
                            <Link
                              to={`/events/${evt.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg bg-[#191b20] hover:bg-[#1e222b] text-zinc-400 hover:text-[#ff4f1a] border border-[#2e3442] transition-colors"
                              title="View Public Page"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CONFIRMATION DIALOG MODAL */}
      {dialogType && selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-[#242730] bg-[#14161a] p-6 space-y-4 shadow-2xl">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                dialogType === 'publish'
                  ? 'bg-emerald-500/15 text-emerald-400'
                  : dialogType === 'complete'
                  ? 'bg-blue-500/15 text-blue-400'
                  : dialogType === 'cancel'
                  ? 'bg-amber-500/15 text-amber-400'
                  : 'bg-rose-500/15 text-rose-400'
              }`}
            >
              {dialogType === 'publish' && <Sparkles className="w-6 h-6" />}
              {dialogType === 'complete' && <CheckCircle2 className="w-6 h-6" />}
              {dialogType === 'cancel' && <XCircle className="w-6 h-6" />}
              {dialogType === 'delete' && <Trash2 className="w-6 h-6" />}
            </div>

            <div className="space-y-1">
              <h3 className="font-heading text-lg font-bold text-white capitalize">
                {dialogType === 'publish' && 'Publish Event'}
                {dialogType === 'complete' && 'Mark Event Completed'}
                {dialogType === 'cancel' && 'Cancel Event'}
                {dialogType === 'delete' && 'Delete Draft Event'}
              </h3>
              <p className="text-xs text-[#9da3b4] leading-relaxed">
                {dialogType === 'publish' && (
                  <>
                    Are you sure you want to publish <strong>{selectedEvent.name}</strong>? It will immediately appear in the public event directory and students can begin registering.
                  </>
                )}
                {dialogType === 'complete' && (
                  <>
                    Mark <strong>{selectedEvent.name}</strong> as completed? Registrations will be closed and the event will be cataloged as finished.
                  </>
                )}
                {dialogType === 'cancel' && (
                  <>
                    Are you sure you want to cancel <strong>{selectedEvent.name}</strong>? Registrations will be closed immediately.
                  </>
                )}
                {dialogType === 'delete' && (
                  <>
                    Are you sure you want to permanently delete draft <strong>{selectedEvent.name}</strong>? The parent festival's event count will be updated. This action cannot be undone.
                  </>
                )}
              </p>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setDialogType(null);
                  setSelectedEvent(null);
                }}
                className="px-4 py-2 rounded-xl border border-[#2e3442] bg-[#191b20] text-xs font-semibold text-zinc-300 hover:text-white"
              >
                Back
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleConfirmAction}
                className={`px-5 py-2 rounded-xl text-xs font-bold text-white cursor-pointer disabled:opacity-50 ${
                  dialogType === 'publish'
                    ? 'bg-emerald-600 hover:bg-emerald-500'
                    : dialogType === 'complete'
                    ? 'bg-blue-600 hover:bg-blue-500'
                    : dialogType === 'cancel'
                    ? 'bg-amber-600 hover:bg-amber-500'
                    : 'bg-rose-600 hover:bg-rose-500'
                }`}
              >
                {actionLoading ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
