import React, { useEffect, useState } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Clock,
  Ticket,
  User,
  Users,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  Building2,
  Sparkles,
  AlertCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Printer,
  QrCode
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import {
  getRegistrationById,
  cancelRegistrationAtomic,
  CancellationError
} from '../../services/registrationService';
import { Registration } from '../../types';
import { RegistrationStatusBadge } from '../../components/registration/RegistrationStatusBadge';
import { formatDateTime } from '../../utils/dateUtils';
import { DetailSkeleton } from '../../components/common/LoadingSkeleton';
import { DigitalPassModal } from '../../components/common/DigitalPassModal';

export const StudentRegistrationDetailPage: React.FC = () => {
  const { registrationId } = useParams<{ registrationId: string }>();
  const location = useLocation();
  const { currentUser, loading: authLoading } = useAuth();

  const [registration, setRegistration] = useState<Registration | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cancellation modal & state
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showPassModal, setShowPassModal] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  const isJustRegistered = location.state?.justRegistered === true;

  const loadRegistration = async () => {
    if (!registrationId) {
      setError('Registration not found');
      setLoading(false);
      return;
    }

    if (!currentUser?.uid) return;

    try {
      setLoading(true);
      setError(null);
      const data = await getRegistrationById(registrationId);

      // Security check: Must exist and belong to the authenticated student
      if (!data || data.userId !== currentUser.uid) {
        setError('Registration not found');
        return;
      }

      setRegistration(data);
    } catch (err) {
      console.warn('Notice loading registration details:', err);
      // Generic defense-in-depth error message
      setError('Registration not found');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      loadRegistration();
    }
  }, [registrationId, currentUser?.uid, authLoading]);

  const handleOpenCancelModal = () => {
    setCancellationReason('');
    setCancelError(null);
    setShowCancelModal(true);
  };

  const handleCloseCancelModal = () => {
    if (cancelling) return;
    setShowCancelModal(false);
    setCancelError(null);
  };

  const handleConfirmCancellation = async () => {
    if (!registration || !currentUser?.uid) return;

    try {
      setCancelling(true);
      setCancelError(null);

      const res = await cancelRegistrationAtomic(
        registration.id,
        currentUser.uid,
        cancellationReason
      );

      setRegistration(res.registration);
      setSuccessBanner(res.message);
      setShowCancelModal(false);
    } catch (err: any) {
      console.warn('Notice cancelling registration:', err);
      if (err instanceof CancellationError) {
        setCancelError(err.message);
      } else {
        setCancelError(
          err?.message ||
            'Something went wrong while cancelling your registration. Please try again.'
        );
      }
    } finally {
      setCancelling(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <DetailSkeleton />
      </div>
    );
  }

  if (error || !registration) {
    return (
      <div className="max-w-3xl mx-auto py-12 space-y-6">
        <div>
          <Link
            to="/dashboard/registrations"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#9da3b4] hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to My Registrations
          </Link>
        </div>

        <div className="rounded-3xl border border-[#242730] bg-[#14161a] p-8 sm:p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-zinc-800 text-zinc-400 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h2 className="font-heading text-xl sm:text-2xl font-bold text-white">
              Registration not found
            </h2>
            <p className="text-xs text-[#9da3b4] max-w-md mx-auto">
              This registration could not be found or you do not have permission to view it under your current account.
            </p>
          </div>
          <div className="pt-4 flex justify-center gap-3">
            <Link
              to="/dashboard/registrations"
              className="px-5 py-2.5 rounded-xl bg-[#191b20] border border-[#2e3442] hover:border-zinc-700 text-xs font-semibold text-white transition-colors"
            >
              Back to My Registrations
            </Link>
            <Link
              to="/events"
              className="px-5 py-2.5 rounded-xl bg-[#ff4f1a] hover:bg-[#ff6838] text-xs font-semibold text-white transition-colors"
            >
              Explore Events
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isConfirmed = registration.status === 'confirmed';
  const isPending = registration.status === 'pending';
  const isCancelled = registration.status === 'cancelled';
  const isEligibleForCancellation = isConfirmed || isPending;
  const customAnswers = Object.entries(registration.registrationData || {});

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Navigation Breadcrumb & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs flex-wrap">
          <Link
            to="/dashboard/registrations"
            className="inline-flex items-center gap-1.5 font-semibold text-[#9da3b4] hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>My Registrations</span>
          </Link>
          <span className="text-[#4b5563]">/</span>
          <span className="text-zinc-300 font-medium truncate max-w-[200px] sm:max-w-md">
            {registration.eventName}
          </span>
        </nav>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {!isCancelled && (
            <button
              type="button"
              onClick={() => setShowPassModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#ff4f1a]/15 hover:bg-[#ff4f1a]/25 border border-[#ff4f1a]/40 text-xs font-semibold text-[#ff4f1a] hover:text-[#ff6838] transition-colors cursor-pointer"
            >
              <Ticket className="w-3.5 h-3.5" />
              <span>View & Print Pass</span>
            </button>
          )}

          {isEligibleForCancellation && (
            <button
              type="button"
              onClick={handleOpenCancelModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-red-950/40 hover:bg-red-900/50 border border-red-900/50 text-xs font-semibold text-red-300 transition-colors cursor-pointer"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Cancel Registration</span>
            </button>
          )}
        </div>
      </div>

      {/* Success Notification Banner */}
      {successBanner && (
        <div className="p-4 rounded-2xl bg-emerald-950/50 border border-emerald-900/60 flex items-center justify-between gap-3 text-xs text-emerald-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-medium">{successBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessBanner(null)}
            className="text-emerald-400 hover:text-emerald-300 font-bold px-2 py-0.5 text-xs cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Post-Registration / Status Banner */}
      <div className="rounded-3xl border border-[#242730] bg-[#14161a] p-6 sm:p-8 space-y-4 shadow-xl">
        <div className="flex items-start gap-4">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
              isCancelled
                ? 'bg-zinc-800 text-zinc-400 border-zinc-700'
                : isConfirmed
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                : isPending
                ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                : 'bg-[#ff4f1a]/15 text-[#ff4f1a] border-[#ff4f1a]/30'
            }`}
          >
            {isCancelled ? (
              <XCircle className="w-6 h-6" />
            ) : (
              <CheckCircle2 className="w-6 h-6" />
            )}
          </div>
          <div className="space-y-1">
            <span
              className={`text-[10px] font-mono uppercase tracking-wider font-bold ${
                isCancelled ? 'text-zinc-500' : 'text-[#ff4f1a]'
              }`}
            >
              {isCancelled
                ? 'Cancelled Registration'
                : isJustRegistered
                ? 'Registration Submitted'
                : 'Registration Record'}
            </span>
            <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-white">
              {isCancelled
                ? 'Registration Cancelled'
                : isConfirmed
                ? 'Registration Confirmed'
                : isPending
                ? 'Registration Submitted (Pending Review)'
                : `Registration ${registration.status}`}
            </h1>
            <p className="text-xs text-[#9da3b4] leading-relaxed">
              {isCancelled
                ? registration.cancelledAt
                  ? `This registration was cancelled on ${formatDateTime(registration.cancelledAt)}. Your seat has been released.`
                  : 'This registration has been cancelled. Your seat has been released.'
                : isConfirmed
                ? 'Your registration is confirmed. Keep your ticket code handy for festival entry.'
                : isPending
                ? 'Your application was received and is currently under organizer review.'
                : `Current lifecycle status: ${registration.status}.`}
            </p>
          </div>
        </div>

        {/* Cancellation Reason Callout if available */}
        {isCancelled && registration.cancellationReason && (
          <div className="p-3.5 rounded-2xl bg-[#191b20] border border-[#2e3442] text-xs text-[#9da3b4] space-y-1">
            <span className="text-[10px] uppercase font-mono text-[#656c80] block font-semibold">
              Cancellation Reason
            </span>
            <p className="text-white font-medium">{registration.cancellationReason}</p>
          </div>
        )}

        {/* Prominent Ticket Pass Credential Card */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-[#191b20] to-[#121316] border border-[#2e3442] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-[#656c80] uppercase tracking-wider block">
              Official Ticket Code
            </span>
            <div
              className={`font-mono text-2xl sm:text-3xl font-black tracking-wider ${
                isCancelled ? 'text-zinc-500 line-through' : 'text-[#ff4f1a]'
              }`}
            >
              {registration.ticketCode}
            </div>
            <div className="text-[11px] text-[#656c80] font-mono break-all">
              Registration ID: {registration.id}
            </div>
          </div>

          <div className="flex flex-col items-start sm:items-end gap-2">
            <span className="text-[10px] font-mono text-[#656c80] uppercase tracking-wider block">
              Current Status
            </span>
            <RegistrationStatusBadge status={registration.status} showDescription={true} />
            <div className="text-[11px] text-[#656c80] space-y-0.5 text-left sm:text-right">
              <div>Submitted: {formatDateTime(registration.registeredAt)}</div>
              {registration.cancelledAt && (
                <div className="text-zinc-400">
                  Cancelled: {formatDateTime(registration.cancelledAt)}
                </div>
              )}
            </div>

            {!isCancelled && (
              <button
                type="button"
                onClick={() => setShowPassModal(true)}
                className="mt-1 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#191b20] hover:bg-[#252830] border border-[#2e3442] hover:border-[#ff4f1a]/50 text-xs font-semibold text-white transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-[#ff4f1a]" />
                <span>View / Print Pass</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Event Information Snapshot */}
        <div className="rounded-3xl border border-[#242730] bg-[#14161a] p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[#242730]">
            <Calendar className="w-5 h-5 text-[#ff4f1a]" />
            <h3 className="font-heading text-sm font-bold text-white">
              Event Information
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-[#656c80] block text-[11px]">Event Title</span>
              <span className="text-white font-semibold text-sm">{registration.eventName}</span>
            </div>

            {registration.festName && (
              <div>
                <span className="text-[#656c80] block text-[11px]">Festival</span>
                <span className="text-[#d1d5db] font-medium">{registration.festName}</span>
              </div>
            )}

            {registration.categoryName && (
              <div>
                <span className="text-[#656c80] block text-[11px]">Category</span>
                <span className="px-2 py-0.5 rounded bg-[#1e222b] text-white border border-[#2e3442] text-[10px] font-medium inline-block">
                  {registration.categoryName}
                </span>
              </div>
            )}

            <div>
              <span className="text-[#656c80] block text-[11px]">Venue / Location</span>
              <div className="text-white font-medium flex items-center gap-1.5 pt-0.5">
                <MapPin className="w-3.5 h-3.5 text-[#ff4f1a] shrink-0" />
                <span>{registration.venue}</span>
              </div>
            </div>

            <div>
              <span className="text-[#656c80] block text-[11px]">Date & Time</span>
              <div className="text-white font-medium flex items-center gap-1.5 pt-0.5">
                <Clock className="w-3.5 h-3.5 text-[#ff4f1a] shrink-0" />
                <span>{formatDateTime(registration.startTime)}</span>
              </div>
              {registration.endTime && (
                <div className="text-[#9da3b4] text-[11px] pl-5">
                  Until: {formatDateTime(registration.endTime)}
                </div>
              )}
            </div>

            {registration.organizationName && (
              <div>
                <span className="text-[#656c80] block text-[11px]">Organizing Club</span>
                <div className="text-[#d1d5db] font-medium flex items-center gap-1.5 pt-0.5">
                  <Building2 className="w-3.5 h-3.5 text-[#656c80]" />
                  <span>{registration.organizationName}</span>
                </div>
              </div>
            )}

            <div className="pt-2">
              <Link
                to={`/events/${registration.eventId}`}
                className="inline-flex items-center gap-1 text-xs text-[#ff4f1a] hover:underline font-semibold"
              >
                <span>View Public Event Page</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Participant & Team Information */}
        <div className="rounded-3xl border border-[#242730] bg-[#14161a] p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[#242730]">
            {registration.registrationType === 'team' ? (
              <Users className="w-5 h-5 text-[#ff4f1a]" />
            ) : (
              <User className="w-5 h-5 text-[#ff4f1a]" />
            )}
            <h3 className="font-heading text-sm font-bold text-white">
              {registration.registrationType === 'team' ? 'Team & Participant Data' : 'Participant Profile'}
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-[#656c80] block text-[11px]">Registration Type</span>
              <span className="font-mono uppercase font-semibold text-[#ff4f1a] text-xs">
                {registration.registrationType === 'team' ? 'Team Entry' : 'Individual Entry'}
              </span>
            </div>

            {registration.registrationType === 'team' && registration.teamName && (
              <div className="p-3 rounded-xl bg-[#191b20] border border-[#2e3442]">
                <span className="text-[#656c80] block text-[10px] uppercase font-mono">Team Name</span>
                <span className="text-white font-bold text-sm">{registration.teamName}</span>
              </div>
            )}

            <div>
              <span className="text-[#656c80] block text-[11px]">
                {registration.registrationType === 'team' ? 'Team Leader / Primary Registrant' : 'Student Name'}
              </span>
              <span className="text-white font-semibold text-sm">{registration.studentName}</span>
            </div>

            <div>
              <span className="text-[#656c80] block text-[11px]">Email Address</span>
              <span className="text-[#d1d5db] font-mono text-[11px]">{registration.studentEmail}</span>
            </div>

            {registration.studentPhone && (
              <div>
                <span className="text-[#656c80] block text-[11px]">Phone</span>
                <span className="text-[#d1d5db]">{registration.studentPhone}</span>
              </div>
            )}

            {registration.institution && (
              <div>
                <span className="text-[#656c80] block text-[11px]">Institution</span>
                <span className="text-[#d1d5db]">{registration.institution}</span>
              </div>
            )}

            {registration.studentId && (
              <div>
                <span className="text-[#656c80] block text-[11px]">Student ID / Roll</span>
                <span className="text-white font-mono">{registration.studentId}</span>
              </div>
            )}

            {/* Team Roster List */}
            {registration.registrationType === 'team' && registration.teamMembers && registration.teamMembers.length > 0 && (
              <div className="pt-2 border-t border-[#242730] space-y-2">
                <span className="text-[#656c80] block text-[11px] font-semibold">
                  Team Members ({registration.teamMembers.length})
                </span>
                <div className="space-y-1.5">
                  {registration.teamMembers.map((m, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-[#191b20] border border-[#2e3442] flex flex-col sm:flex-row sm:items-center justify-between text-[11px] gap-1"
                    >
                      <div className="font-medium text-white">
                        {idx + 1}. {m.name}
                        {m.role && <span className="text-[#656c80] ml-1">({m.role})</span>}
                      </div>
                      <div className="text-[#9da3b4] font-mono text-[10px]">{m.email}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dynamic Questionnaire Responses if any */}
      {customAnswers.length > 0 && (
        <div className="rounded-3xl border border-[#242730] bg-[#14161a] p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[#242730]">
            <Sparkles className="w-5 h-5 text-[#ff4f1a]" />
            <h3 className="font-heading text-sm font-bold text-white">
              Event Questionnaire Responses
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {customAnswers.map(([key, val]) => (
              <div key={key} className="p-3.5 rounded-xl bg-[#191b20] border border-[#242730] space-y-1">
                <span className="text-[#656c80] block text-[10px] font-mono uppercase tracking-wider">
                  {key}
                </span>
                <span className="text-white font-medium block">
                  {Array.isArray(val)
                    ? val.join(', ')
                    : typeof val === 'boolean'
                    ? val ? 'Yes / Agreed' : 'No'
                    : String(val || '(None)')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer Navigation & Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 rounded-3xl bg-[#14161a] border border-[#242730]">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <Link
            to="/dashboard/registrations"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#191b20] border border-[#2e3442] hover:border-zinc-700 text-xs font-semibold text-white text-center transition-colors"
          >
            Back to My Registrations
          </Link>

          <Link
            to="/dashboard/history"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#191b20] border border-[#2e3442] hover:border-[#ff4f1a] hover:text-[#ff4f1a] text-xs font-semibold text-zinc-300 text-center transition-colors"
          >
            Back to History
          </Link>

          {isEligibleForCancellation && (
            <button
              type="button"
              onClick={handleOpenCancelModal}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-red-950/40 hover:bg-red-900/50 border border-red-900/50 text-xs font-semibold text-red-300 text-center transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Cancel Registration</span>
            </button>
          )}
        </div>

        <Link
          to="/events"
          className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#ff4f1a] hover:bg-[#ff6838] text-xs font-semibold text-white text-center transition-colors shadow-lg shadow-[#ff4f1a]/20"
        >
          Explore Events
        </Link>
      </div>

      {/* Cancellation Confirmation Dialog Modal */}
      {showCancelModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="bg-[#14161a] border border-[#242730] rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-heading text-lg font-bold text-white">
                  Cancel this registration?
                </h3>
                <p className="text-xs text-[#9da3b4] leading-relaxed">
                  This will release your reserved seat for <strong className="text-white">{registration.eventName}</strong>. This action cannot be undone.
                </p>
              </div>
            </div>

            {/* Optional Reason Form Field */}
            <div className="space-y-1.5">
              <label
                htmlFor="cancelReason"
                className="block text-xs font-semibold text-[#9da3b4]"
              >
                Why are you cancelling? <span className="text-[#656c80] font-normal">(Optional)</span>
              </label>
              <textarea
                id="cancelReason"
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                maxLength={500}
                rows={3}
                disabled={cancelling}
                placeholder="e.g., Schedule conflict, unable to attend..."
                className="w-full rounded-xl bg-[#191b20] border border-[#2e3442] px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#ff4f1a] resize-none disabled:opacity-50"
              />
              <span className="text-[10px] text-[#656c80] block text-right">
                {cancellationReason.length}/500
              </span>
            </div>

            {/* Cancellation Error Banner if any */}
            {cancelError && (
              <div className="p-3.5 rounded-xl bg-red-950/60 border border-red-900 flex items-start gap-2.5 text-xs text-red-200">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{cancelError}</span>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={handleCloseCancelModal}
                disabled={cancelling}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#191b20] border border-[#2e3442] hover:border-zinc-700 text-xs font-semibold text-white transition-colors cursor-pointer disabled:opacity-50"
              >
                Keep Registration
              </button>

              <button
                type="button"
                onClick={handleConfirmCancellation}
                disabled={cancelling}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-xs font-semibold text-white transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-lg shadow-red-900/20"
              >
                {cancelling ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Cancelling...</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Cancel Registration</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Digital Event Pass & QR Modal */}
      <DigitalPassModal
        registration={registration}
        isOpen={showPassModal}
        onClose={() => setShowPassModal(false)}
      />
    </div>
  );
};

