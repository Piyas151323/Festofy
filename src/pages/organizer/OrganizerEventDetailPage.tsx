import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  CalendarCheck2,
  Calendar,
  Clock,
  Building2,
  Users,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Edit,
  Trash2,
  XCircle,
  ExternalLink,
  ShieldCheck,
  UserCheck,
  Layers,
  MapPin,
  Lock,
  ListOrdered
} from 'lucide-react';
import { useOrganizer } from '../../context/OrganizerContext';
import {
  getEventById,
  publishEvent,
  completeEvent,
  cancelEvent,
  deleteDraftEvent
} from '../../services/eventService';
import { getFestById } from '../../services/festService';
import { EventItem, Fest, EventStatus } from '../../types';
import { formatDateTime } from '../../utils/dateUtils';

export const OrganizerEventDetailPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { organizations, loading: orgLoading } = useOrganizer();

  const [event, setEvent] = useState<EventItem | null>(null);
  const [fest, setFest] = useState<Fest | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Confirmation dialogs
  const [confirmDialog, setConfirmDialog] = useState<'publish' | 'complete' | 'cancel' | 'delete' | null>(null);

  const loadEventData = useCallback(async () => {
    if (!eventId) return;
    try {
      setLoading(true);
      setErrorMsg(null);
      const evtData = await getEventById(eventId);
      if (!evtData) {
        setErrorMsg('Event not found.');
        return;
      }

      // Check organization membership
      const isMember = organizations.some(o => o.id === evtData.organizationId);
      if (!isMember) {
        setErrorMsg('You do not have permission to view events for this organization.');
        return;
      }

      setEvent(evtData);

      if (evtData.festId) {
        const festData = await getFestById(evtData.festId);
        setFest(festData);
      }
    } catch (err: any) {
      console.error('Failed to load event detail:', err);
      setErrorMsg(err.message || 'Unable to retrieve event information.');
    } finally {
      setLoading(false);
    }
  }, [eventId, organizations]);

  useEffect(() => {
    if (!orgLoading) {
      loadEventData();
    }
  }, [loadEventData, orgLoading]);

  // Lifecycle action handler
  const handleLifecycleAction = async () => {
    if (!event || !confirmDialog) return;
    try {
      setActionLoading(true);
      setErrorMsg(null);

      if (confirmDialog === 'publish') {
        await publishEvent(event.id);
        setSuccessMsg('Event successfully published to the public directory!');
        setConfirmDialog(null);
        await loadEventData();
      } else if (confirmDialog === 'complete') {
        await completeEvent(event.id);
        setSuccessMsg('Event marked as completed. Registrations are closed.');
        setConfirmDialog(null);
        await loadEventData();
      } else if (confirmDialog === 'cancel') {
        await cancelEvent(event.id);
        setSuccessMsg('Event has been cancelled. Registrations are closed.');
        setConfirmDialog(null);
        await loadEventData();
      } else if (confirmDialog === 'delete') {
        await deleteDraftEvent(event.id);
        setConfirmDialog(null);
        navigate('/organizer/events');
        return;
      }
    } catch (err: any) {
      console.error('Lifecycle execution error:', err);
      setErrorMsg(err.message || 'Failed to update event state.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-12 text-center text-xs text-[#9da3b4] animate-pulse">
        Loading event details and manifest status...
      </div>
    );
  }

  if (errorMsg && !event) {
    return (
      <div className="max-w-2xl mx-auto p-8 rounded-2xl bg-[#14161a] border border-[#242730] text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h2 className="font-heading text-lg font-bold text-white">Event Unavailable</h2>
          <p className="text-xs text-[#9da3b4]">{errorMsg}</p>
        </div>
        <div className="pt-2">
          <Link
            to="/organizer/events"
            className="px-4 py-2 rounded-xl bg-[#191b20] border border-[#2e3442] text-xs font-semibold text-zinc-300"
          >
            Return to Events
          </Link>
        </div>
      </div>
    );
  }

  if (!event) return null;

  const regCount = event.currentRegistrations || 0;
  const isFull = event.capacity > 0 && regCount >= event.capacity;
  const percent = event.capacity > 0 ? Math.min(100, Math.round((regCount / event.capacity) * 100)) : 0;
  const isDeadlinePassed = new Date(event.registrationDeadline).getTime() < Date.now();

  const getStatusBadge = (status: EventStatus) => {
    switch (status) {
      case 'published':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            Published
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Completed
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <XCircle className="w-3.5 h-3.5" />
            Cancelled
          </span>
        );
      case 'draft':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            Draft
          </span>
        );
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* HEADER & TOP NAV */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#242730]">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 mb-2">
            <Link to="/organizer/events" className="hover:text-white transition-colors flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Events</span>
            </Link>
            <span>/</span>
            {fest ? (
              <Link to={`/organizer/fests/${fest.id}`} className="text-[#ff4f1a] hover:underline">
                {fest.name}
              </Link>
            ) : (
              <span>Festival</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <h1 className="font-heading text-2xl sm:text-3xl font-bold text-white">
              {event.name}
            </h1>
            {getStatusBadge(event.status)}
          </div>
        </div>

        {/* TOP ACTIONS */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Edit (draft or published) */}
          {(event.status === 'draft' || event.status === 'published') && (
            <Link
              to={`/organizer/events/${event.id}/edit`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#191b20] hover:bg-[#1e222b] text-xs font-semibold text-zinc-300 hover:text-white border border-[#2e3442] transition-colors"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>Edit Event</span>
            </Link>
          )}

          {/* Publish (draft) */}
          {event.status === 'draft' && (
            <button
              type="button"
              onClick={() => setConfirmDialog('publish')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition-colors shadow-lg shadow-emerald-600/20 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Publish Event</span>
            </button>
          )}

          {/* Mark Complete (published) */}
          {event.status === 'published' && (
            <button
              type="button"
              onClick={() => setConfirmDialog('complete')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition-colors shadow-lg shadow-blue-600/20 cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Mark Completed</span>
            </button>
          )}

          {/* Cancel (published or draft) */}
          {(event.status === 'published' || event.status === 'draft') && (
            <button
              type="button"
              onClick={() => setConfirmDialog('cancel')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#191b20] hover:bg-rose-500/10 text-xs font-semibold text-zinc-400 hover:text-rose-400 border border-[#2e3442] hover:border-rose-500/20 transition-colors cursor-pointer"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Cancel</span>
            </button>
          )}

          {/* Delete Draft (draft with 0 participants) */}
          {event.status === 'draft' && regCount === 0 && (
            <button
              type="button"
              onClick={() => setConfirmDialog('delete')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-xs font-semibold text-rose-400 border border-rose-500/20 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Draft</span>
            </button>
          )}

          {/* Public Page (published or completed) */}
          {(event.status === 'published' || event.status === 'completed') && (
            <Link
              to={`/events/${event.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#191b20] hover:bg-[#1e222b] text-xs font-semibold text-zinc-300 hover:text-white border border-[#2e3442] transition-colors"
            >
              <span>Public Page</span>
              <ExternalLink className="w-3.5 h-3.5 text-zinc-500" />
            </Link>
          )}
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

      {/* STATS / CAPACITY CARD */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Registrations Progress */}
        <div className="p-6 rounded-2xl bg-[#14161a] border border-[#242730] space-y-3 md:col-span-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-mono text-[#ff4f1a] uppercase tracking-wider">
              <Users className="w-4 h-4" />
              <span>Seat Quota & Participant Manifest</span>
            </div>
            <Link
              to={`/organizer/participants?event=${event.id}`}
              className="text-xs font-semibold text-[#ff4f1a] hover:underline inline-flex items-center gap-1"
            >
              <span>View Roster</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>

          <div className="flex items-baseline justify-between pt-1">
            <div className="flex items-baseline gap-2">
              <span className="font-heading text-3xl font-bold text-white">{regCount}</span>
              <span className="text-xs text-zinc-500">/ {event.capacity} registered attendees</span>
            </div>
            <span className="font-mono text-xs font-semibold text-zinc-400">{percent}% filled</span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2 rounded-full bg-[#191b20] overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isFull ? 'bg-rose-500' : percent > 80 ? 'bg-amber-500' : 'bg-[#ff4f1a]'
              }`}
              style={{ width: `${percent}%` }}
            ></div>
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-1 text-[11px] text-[#9da3b4]">
            <span className="flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-zinc-500" />
              <span>Format: <strong className="text-zinc-300 capitalize">{event.registrationType || 'individual'}</strong></span>
            </span>
            {event.registrationType === 'team' && (
              <span>Team Size: <strong className="text-zinc-300">{event.minTeamSize || 2} - {event.maxTeamSize || 4} members</strong></span>
            )}
            {event.requiresApproval && (
              <span className="text-amber-400 font-medium">• Approval Required</span>
            )}
            {event.isRegistrationClosed && (
              <span className="text-rose-400 font-medium">• Registration Locked</span>
            )}
          </div>
        </div>

        {/* Schedule & Venue Card */}
        <div className="p-6 rounded-2xl bg-[#14161a] border border-[#242730] space-y-4">
          <div className="text-xs font-mono text-zinc-500 uppercase tracking-wider">
            Schedule & Location
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-[#ff4f1a] shrink-0 mt-0.5" />
              <div>
                <div className="text-zinc-500 text-[11px]">Venue</div>
                <div className="font-semibold text-white">{event.venue}</div>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Calendar className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-zinc-500 text-[11px]">Starts</div>
                <div className="font-mono text-zinc-300 text-[11px]">{formatDateTime(event.startTime)}</div>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Clock className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-zinc-500 text-[11px]">Registration Deadline</div>
                <div className={`font-mono text-[11px] ${isDeadlinePassed ? 'text-rose-400' : 'text-zinc-300'}`}>
                  {formatDateTime(event.registrationDeadline)}
                  {isDeadlinePassed && ' (Passed)'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* DESCRIPTION & DETAILS */}
      <div className="p-6 rounded-2xl bg-[#14161a] border border-[#242730] space-y-4">
        <div className="flex items-center gap-2 text-xs font-mono text-[#ff4f1a] uppercase tracking-wider">
          <Layers className="w-4 h-4" />
          <span>Description & Guidelines</span>
        </div>

        <div className="text-xs text-[#9da3b4] leading-relaxed whitespace-pre-wrap">
          {event.description}
        </div>
      </div>

      {/* CUSTOM FORM QUESTIONS PREVIEW */}
      {event.customFormFields && event.customFormFields.length > 0 && (
        <div className="p-6 rounded-2xl bg-[#14161a] border border-[#242730] space-y-4">
          <div className="flex items-center gap-2 text-xs font-mono text-[#ff4f1a] uppercase tracking-wider">
            <ListOrdered className="w-4 h-4" />
            <span>Registration Form Questions ({event.customFormFields.length})</span>
          </div>

          <div className="space-y-2">
            {event.customFormFields.map((field, idx) => (
              <div
                key={field.id}
                className="p-3.5 rounded-xl bg-[#191b20] border border-[#2e3442] flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-zinc-500 text-[11px]">Q{idx + 1}</span>
                  <span className="font-semibold text-white">{field.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-[#14161a] text-zinc-400 font-mono text-[10px]">
                    {field.type}
                  </span>
                  {field.required ? (
                    <span className="text-[10px] text-[#ff4f1a] font-bold">Required</span>
                  ) : (
                    <span className="text-[10px] text-zinc-500">Optional</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CONFIRMATION DIALOG MODAL */}
      {confirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-[#242730] bg-[#14161a] p-6 space-y-4 shadow-2xl">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                confirmDialog === 'publish'
                  ? 'bg-emerald-500/15 text-emerald-400'
                  : confirmDialog === 'complete'
                  ? 'bg-blue-500/15 text-blue-400'
                  : confirmDialog === 'cancel'
                  ? 'bg-amber-500/15 text-amber-400'
                  : 'bg-rose-500/15 text-rose-400'
              }`}
            >
              {confirmDialog === 'publish' && <Sparkles className="w-6 h-6" />}
              {confirmDialog === 'complete' && <CheckCircle2 className="w-6 h-6" />}
              {confirmDialog === 'cancel' && <XCircle className="w-6 h-6" />}
              {confirmDialog === 'delete' && <Trash2 className="w-6 h-6" />}
            </div>

            <div className="space-y-1">
              <h3 className="font-heading text-lg font-bold text-white capitalize">
                {confirmDialog === 'publish' && 'Publish Event'}
                {confirmDialog === 'complete' && 'Mark as Completed'}
                {confirmDialog === 'cancel' && 'Cancel Event'}
                {confirmDialog === 'delete' && 'Delete Draft Event'}
              </h3>
              <p className="text-xs text-[#9da3b4] leading-relaxed">
                {confirmDialog === 'publish' && (
                  <>
                    Publishing <strong>{event.name}</strong> makes it discoverable across the student portal. Eligible students will be able to register immediately.
                  </>
                )}
                {confirmDialog === 'complete' && (
                  <>
                    Marking <strong>{event.name}</strong> as completed will conclude active registration and archive contest operations.
                  </>
                )}
                {confirmDialog === 'cancel' && (
                  <>
                    Are you sure you want to cancel <strong>{event.name}</strong>? Registrations will be locked immediately.
                  </>
                )}
                {confirmDialog === 'delete' && (
                  <>
                    Are you sure you want to permanently delete draft <strong>{event.name}</strong>? Parent festival event counts will be decremented.
                  </>
                )}
              </p>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmDialog(null)}
                className="px-4 py-2 rounded-xl border border-[#2e3442] bg-[#191b20] text-xs font-semibold text-zinc-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleLifecycleAction}
                className={`px-5 py-2 rounded-xl text-xs font-bold text-white cursor-pointer disabled:opacity-50 ${
                  confirmDialog === 'publish'
                    ? 'bg-emerald-600 hover:bg-emerald-500'
                    : confirmDialog === 'complete'
                    ? 'bg-blue-600 hover:bg-blue-500'
                    : confirmDialog === 'cancel'
                    ? 'bg-amber-600 hover:bg-amber-500'
                    : 'bg-rose-600 hover:bg-rose-500'
                }`}
              >
                {actionLoading ? 'Updating...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
