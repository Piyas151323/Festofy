import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  CalendarDays,
  Calendar,
  Clock,
  ArrowLeft,
  Building2,
  ExternalLink,
  Edit,
  Trash2,
  CheckCircle2,
  Archive,
  AlertCircle,
  Sparkles,
  Info,
  CalendarCheck,
  Layers,
  Lock,
  Flame,
  Plus
} from 'lucide-react';
import { useOrganizer } from '../../context/OrganizerContext';
import {
  getFestById,
  publishFest,
  completeFest,
  archiveFest,
  deleteDraftFest,
  getFestEventCount
} from '../../services/festService';
import { getFestEvents } from '../../services/eventService';
import { Fest, EventItem } from '../../types';
import { formatDateRange, formatDateTime } from '../../utils/dateUtils';

export const OrganizerFestDetailPage: React.FC = () => {
  const { festId } = useParams<{ festId: string }>();
  const navigate = useNavigate();
  const { activeOrganization, organizations } = useOrganizer();

  const [fest, setFest] = useState<Fest | null>(null);
  const [eventCount, setEventCount] = useState<number>(0);
  const [festEvents, setFestEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Dialog states for confirming lifecycle transitions
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const loadFestData = useCallback(async () => {
    if (!festId) return;
    try {
      setLoading(true);
      setErrorMsg(null);
      const data = await getFestById(festId);
      if (!data) {
        setErrorMsg('Festival not found.');
        return;
      }

      // Check organization membership
      const isMemberOfOrg = organizations.some(o => o.id === data.organizationId);
      if (!isMemberOfOrg) {
        setErrorMsg('You do not have permission to view festivals for this organization.');
        return;
      }

      setFest(data);

      const [count, eventsList] = await Promise.all([
        getFestEventCount(festId),
        getFestEvents(festId, true)
      ]);
      setEventCount(typeof data.eventCount === 'number' ? data.eventCount : count);
      setFestEvents(eventsList || []);
    } catch (err: any) {
      console.error('Failed to load festival detail:', err);
      setErrorMsg(err.message || 'Unable to retrieve festival records.');
    } finally {
      setLoading(false);
    }
  }, [festId, organizations]);

  useEffect(() => {
    loadFestData();
  }, [loadFestData]);

  // Lifecycle handlers
  const handlePublish = async () => {
    if (!festId) return;
    try {
      setActionLoading(true);
      setErrorMsg(null);
      await publishFest(festId);
      setSuccessMsg('Festival has been successfully published to public discovery!');
      setShowPublishConfirm(false);
      await loadFestData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to publish festival.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!festId) return;
    try {
      setActionLoading(true);
      setErrorMsg(null);
      await completeFest(festId);
      setSuccessMsg('Festival marked as completed.');
      setShowCompleteConfirm(false);
      await loadFestData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to mark festival as completed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleArchive = async () => {
    if (!festId) return;
    try {
      setActionLoading(true);
      setErrorMsg(null);
      await archiveFest(festId);
      setSuccessMsg('Festival successfully archived.');
      setShowArchiveConfirm(false);
      await loadFestData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to archive festival.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!festId) return;
    try {
      setActionLoading(true);
      setErrorMsg(null);
      await deleteDraftFest(festId);
      navigate('/organizer/fests');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to delete festival.');
      setShowDeleteConfirm(false);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center text-xs text-[#9da3b4] animate-pulse">
        Loading festival operations console...
      </div>
    );
  }

  if (errorMsg && !fest) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        <Link
          to="/organizer/fests"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#9da3b4] hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Festivals
        </Link>
        <div className="p-6 rounded-2xl bg-red-950/40 border border-red-900/60 text-red-200 text-xs">
          {errorMsg}
        </div>
      </div>
    );
  }

  if (!fest) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          to="/organizer/fests"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#9da3b4] hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Festivals List</span>
        </Link>

        {fest.status === 'published' && (
          <Link
            to={`/fests/${fest.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#ff4f1a] hover:underline"
          >
            <span>View Public Page</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>

      {/* Notifications */}
      {successMsg && (
        <div
          role="status"
          className="flex items-start justify-between gap-3 p-4 rounded-xl bg-emerald-950/40 border border-emerald-900/60 text-emerald-200 text-xs"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button
            onClick={() => setSuccessMsg(null)}
            className="text-emerald-400 hover:text-white text-xs cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {errorMsg && (
        <div
          role="alert"
          aria-live="assertive"
          className="flex items-start gap-3 p-4 rounded-xl bg-red-950/40 border border-red-900/60 text-red-200 text-xs"
        >
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed font-medium">{errorMsg}</div>
        </div>
      )}

      {/* Hero Header Card */}
      <div className="rounded-3xl border border-[#242730] bg-[#14161a] overflow-hidden shadow-2xl">
        {/* Banner Display */}
        {fest.bannerUrl ? (
          <div className="h-48 sm:h-64 w-full bg-[#181a20] relative overflow-hidden">
            <img
              src={fest.bannerUrl}
              alt={fest.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#14161a] via-[#14161a]/40 to-transparent" />
          </div>
        ) : (
          <div className="h-28 w-full bg-gradient-to-r from-[#191b20] to-[#14161a] border-b border-[#242730] flex items-center px-8 text-zinc-600">
            <CalendarDays className="w-12 h-12 opacity-25" />
          </div>
        )}

        <div className="p-6 sm:p-8 space-y-6">
          {/* Top metadata tags */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#191b20] border border-[#2e3442] text-xs font-semibold text-[#ff4f1a]">
                <Building2 className="w-3.5 h-3.5" />
                <span>{fest.organizationName || activeOrganization?.name || 'Club'}</span>
              </div>

              {/* Status Badge */}
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold font-mono uppercase tracking-wider border ${
                  fest.status === 'published'
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                    : fest.status === 'draft'
                    ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                    : fest.status === 'completed'
                    ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                    : 'bg-purple-500/15 text-purple-400 border-purple-500/30'
                }`}
              >
                {fest.status}
              </span>
            </div>

            {/* Quick Metrics */}
            <div className="flex items-center gap-4 text-xs font-mono text-[#9da3b4]">
              <div className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#ff4f1a]" />
                <span>{eventCount} Contests</span>
              </div>
            </div>
          </div>

          {/* Title & Dates */}
          <div className="space-y-2">
            <h1 className="font-heading text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              {fest.name}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-xs text-[#9da3b4]">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-[#ff4f1a]" />
                <span>{formatDateRange(fest.startDate, fest.endDate)}</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1.5 font-mono text-[11px]">
                <Clock className="w-3.5 h-3.5 text-zinc-500" />
                <span>Updated: {formatDateTime(fest.updatedAt || fest.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="p-5 rounded-2xl bg-[#191b20] border border-[#2e3442] space-y-2">
            <h3 className="text-xs font-mono uppercase tracking-wider text-[#656c80] font-semibold">
              Description & Highlights
            </h3>
            <p className="text-xs sm:text-sm text-[#d1d5db] whitespace-pre-wrap leading-relaxed">
              {fest.description}
            </p>
          </div>

          {/* Lifecycle Action Bar */}
          <div className="pt-4 border-t border-[#242730] flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs font-mono text-[#656c80]">
              Lifecycle Management:
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Draft state actions */}
              {fest.status === 'draft' && (
                <>
                  <Link
                    to={`/organizer/fests/${fest.id}/edit`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#191b20] hover:bg-[#1e222b] border border-[#2e3442] text-xs font-semibold text-white transition-colors"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Edit Details</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-950/30 hover:bg-red-900/40 border border-red-900/50 text-xs font-semibold text-red-300 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Draft</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPublishConfirm(true)}
                    className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#ff4f1a] hover:bg-[#ff6838] text-xs font-bold text-white shadow-lg shadow-[#ff4f1a]/25 transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Publish Fest</span>
                  </button>
                </>
              )}

              {/* Published state actions */}
              {fest.status === 'published' && (
                <>
                  <Link
                    to={`/organizer/fests/${fest.id}/edit`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#191b20] hover:bg-[#1e222b] border border-[#2e3442] text-xs font-semibold text-white transition-colors"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Edit Details</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => setShowCompleteConfirm(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white transition-colors cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Mark Completed</span>
                  </button>
                </>
              )}

              {/* Completed state actions */}
              {fest.status === 'completed' && (
                <button
                  type="button"
                  onClick={() => setShowArchiveConfirm(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#191b20] hover:bg-[#1e222b] border border-[#2e3442] text-xs font-semibold text-zinc-300 transition-colors cursor-pointer"
                >
                  <Archive className="w-3.5 h-3.5 text-purple-400" />
                  <span>Archive Festival</span>
                </button>
              )}

              {/* Archived state actions */}
              {fest.status === 'archived' && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#191b20] border border-[#2e3442] text-xs text-zinc-400 font-mono">
                  <Archive className="w-3.5 h-3.5 text-purple-400" />
                  <span>Archived Historical Record</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* FESTIVAL EVENTS MANAGEMENT AREA */}
      <div className="rounded-3xl border border-[#242730] bg-[#14161a] p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#242730]">
          <div>
            <div className="text-xs font-mono text-[#ff4f1a] uppercase tracking-wider mb-1">
              Festival Contests & Competitions
            </div>
            <h2 className="font-heading text-xl sm:text-2xl font-bold text-white">
              Scheduled Events ({festEvents.length})
            </h2>
          </div>

          <Link
            to={`/organizer/events/new?festId=${fest.id}`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#ff4f1a] hover:bg-[#ff6838] text-xs font-bold text-white transition-all shadow-lg shadow-[#ff4f1a]/20 self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Event to Festival</span>
          </Link>
        </div>

        {festEvents.length === 0 ? (
          <div className="p-8 rounded-2xl bg-[#191b20] border border-dashed border-[#2e3442] text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#14161a] border border-[#242730] text-[#ff4f1a] flex items-center justify-center mx-auto">
              <CalendarCheck className="w-6 h-6" />
            </div>

            <div className="space-y-1 max-w-md mx-auto">
              <h3 className="font-heading text-base font-bold text-white">
                No events created for this festival yet
              </h3>
              <p className="text-xs text-[#9da3b4] leading-relaxed">
                Add hackathons, coding contests, robotics challenges, or symposiums to this festival.
              </p>
            </div>

            <div className="pt-2">
              <Link
                to={`/organizer/events/new?festId=${fest.id}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#ff4f1a] hover:bg-[#ff6838] text-xs font-bold text-white transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create First Event</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#191b20] text-[#9da3b4] uppercase tracking-wider text-[10px] border-b border-[#242730]">
                <tr>
                  <th className="p-3.5">Event Name</th>
                  <th className="p-3.5">Venue</th>
                  <th className="p-3.5">Schedule</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Capacity</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#242730] text-white">
                {festEvents.map((evt) => (
                  <tr key={evt.id} className="hover:bg-[#1a1d24] transition-colors">
                    <td className="p-3.5">
                      <Link
                        to={`/organizer/events/${evt.id}`}
                        className="font-bold text-white hover:text-[#ff4f1a] transition-colors block"
                      >
                        {evt.name}
                      </Link>
                      {evt.categoryName && (
                        <span className="text-[10px] text-zinc-500 font-mono">
                          {evt.categoryName}
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 text-zinc-300">{evt.venue}</td>
                    <td className="p-3.5 text-zinc-400 font-mono text-[11px]">
                      {formatDateTime(evt.startTime)}
                    </td>
                    <td className="p-3.5">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${
                        evt.status === 'published'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : evt.status === 'completed'
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          : evt.status === 'cancelled'
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {evt.status}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono text-zinc-300">
                      {evt.currentRegistrations || 0} / {evt.capacity}
                    </td>
                    <td className="p-3.5 text-right">
                      <Link
                        to={`/organizer/events/${evt.id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#191b20] hover:bg-[#1e222b] text-zinc-300 hover:text-white border border-[#2e3442] text-[11px] font-medium transition-colors"
                      >
                        Manage
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CONFIRMATION DIALOGS */}
      {/* 1. Publish Dialog */}
      {showPublishConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-[#242730] bg-[#14161a] p-6 space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-[#ff4f1a]/15 text-[#ff4f1a] flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-heading text-lg font-bold text-white">Publish Festival?</h3>
              <p className="text-xs text-[#9da3b4] leading-relaxed">
                Publishing makes <strong>{fest.name}</strong> visible to all students across the public Fest Directory. Students will be able to discover your festival immediately.
              </p>
            </div>
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowPublishConfirm(false)}
                className="px-4 py-2 rounded-xl border border-[#2e3442] bg-[#191b20] text-xs font-semibold text-zinc-300"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handlePublish}
                className="px-5 py-2 rounded-xl bg-[#ff4f1a] text-xs font-bold text-white cursor-pointer"
              >
                {actionLoading ? 'Publishing...' : 'Confirm Publish'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Complete Dialog */}
      {showCompleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-[#242730] bg-[#14161a] p-6 space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/15 text-blue-400 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-heading text-lg font-bold text-white">Mark as Completed?</h3>
              <p className="text-xs text-[#9da3b4] leading-relaxed">
                This marks the festival as finished. Completed festivals remain visible for historical records, but routine operational changes are restricted.
              </p>
            </div>
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowCompleteConfirm(false)}
                className="px-4 py-2 rounded-xl border border-[#2e3442] bg-[#191b20] text-xs font-semibold text-zinc-300"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleComplete}
                className="px-5 py-2 rounded-xl bg-blue-600 text-xs font-bold text-white cursor-pointer"
              >
                {actionLoading ? 'Updating...' : 'Mark Completed'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Archive Dialog */}
      {showArchiveConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-[#242730] bg-[#14161a] p-6 space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/15 text-purple-400 flex items-center justify-center">
              <Archive className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-heading text-lg font-bold text-white">Archive Festival?</h3>
              <p className="text-xs text-[#9da3b4] leading-relaxed">
                Archived festivals are removed from the active public festival directory and preserved strictly for administrative and organizer historical records.
              </p>
            </div>
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowArchiveConfirm(false)}
                className="px-4 py-2 rounded-xl border border-[#2e3442] bg-[#191b20] text-xs font-semibold text-zinc-300"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleArchive}
                className="px-5 py-2 rounded-xl bg-purple-600 text-xs font-bold text-white cursor-pointer"
              >
                {actionLoading ? 'Archiving...' : 'Confirm Archive'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Delete Draft Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-[#242730] bg-[#14161a] p-6 space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-red-500/15 text-red-400 flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-heading text-lg font-bold text-white">Delete Draft Festival?</h3>
              <p className="text-xs text-[#9da3b4] leading-relaxed">
                Are you sure you want to permanently delete this draft festival? This action cannot be reversed. Only draft festivals without associated events can be deleted.
              </p>
            </div>
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 rounded-xl border border-[#2e3442] bg-[#191b20] text-xs font-semibold text-zinc-300"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleDelete}
                className="px-5 py-2 rounded-xl bg-red-600 text-xs font-bold text-white cursor-pointer"
              >
                {actionLoading ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
