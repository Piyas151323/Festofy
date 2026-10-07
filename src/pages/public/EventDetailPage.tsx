import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Calendar,
  MapPin,
  Clock,
  Users,
  ArrowLeft,
  ArrowRight,
  Building2,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  CalendarX,
  Info,
  Lock
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { getEventById } from '../../services/eventService';
import { getFestById } from '../../services/festService';
import { getOrganizationById } from '../../services/organizationService';
import { EventItem, Fest, Organization } from '../../types';
import { formatDateTime, getDeadlineText } from '../../utils/dateUtils';
import { DetailSkeleton } from '../../components/common/LoadingSkeleton';
import { ErrorState } from '../../components/common/EmptyState';

export const EventDetailPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [event, setEvent] = useState<EventItem | null>(null);
  const [fest, setFest] = useState<Fest | null>(null);
  const [org, setOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      if (!eventId) return;
      try {
        setLoading(true);
        setError(null);
        const eData = await getEventById(eventId);
        if (!eData) {
          setError('Event not found in Firestore.');
          return;
        }
        setEvent(eData);

        const [festData, orgData] = await Promise.all([
          getFestById(eData.festId),
          getOrganizationById(eData.organizationId)
        ]);

        setFest(festData);
        setOrg(orgData);
      } catch (err: any) {
        console.error('Error loading event detail:', err);
        setError(err.message || 'Failed to load event details.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [eventId]);

  if (loading) return <DetailSkeleton />;
  if (error || !event) return <ErrorState message={error || 'Event not found.'} />;

  // Canonical Public Visibility Policy (Phase 5.2.2):
  // Event must have status === 'published' AND festStatus === 'published'
  const isParentFestPublished = fest ? fest.status === 'published' : true;
  const isPubliclyVisible = event.status === 'published' && event.festStatus === 'published' && isParentFestPublished;

  if (!isPubliclyVisible) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto">
          <Lock className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h2 className="font-heading text-lg font-bold text-white">Event Not Publicly Available</h2>
          <p className="text-xs text-[#9da3b4] leading-relaxed">
            This event is currently private or not published. Direct URL navigation cannot access unpublished content.
          </p>
        </div>
        <div className="pt-2">
          <Link
            to="/events"
            className="px-4 py-2 rounded-xl bg-[#191b20] border border-[#2e3442] text-xs font-semibold text-zinc-300 hover:text-white"
          >
            Browse Public Events
          </Link>
        </div>
      </div>
    );
  }

  const isCompleted = event.status === 'completed';
  const isPast = isCompleted;
  const isCancelled = event.status === 'cancelled';
  const isDraft = event.status === 'draft';
  const isPastDeadline = new Date(event.registrationDeadline).getTime() < Date.now();
  const isClosed = event.isRegistrationClosed || isPastDeadline || isCompleted || isCancelled || isDraft;
  const isFull = (event.capacity ?? 0) > 0 && (event.currentRegistrations ?? 0) >= (event.capacity ?? 0);
  const canRegister = !isClosed && !isFull && event.status === 'published';

  const handleRegisterClick = () => {
    if (!isAuthenticated) {
      navigate(`/auth?redirect=/events/${event.id}/register`);
    } else {
      navigate(`/events/${event.id}/register`);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Navigation Breadcrumb */}
      <div>
        <Link
          to="/events"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#9da3b4] hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Events
        </Link>
      </div>

      {/* Main Card */}
      <div className="rounded-3xl border border-[#242730] bg-[#14161a] overflow-hidden">
        {/* Banner */}
        <div className="relative h-64 sm:h-80 w-full overflow-hidden bg-[#181a20]">
          {event.bannerUrl && (
            <img
              src={event.bannerUrl}
              alt={event.name}
              className="w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#14161a] via-[#14161a]/50 to-transparent" />

          <div className="absolute top-6 left-6 flex items-center gap-2">
            <span className="px-3 py-1 rounded-md text-xs font-semibold bg-[#1e222b]/90 text-white border border-[#2e3442] backdrop-blur-md">
              {event.categoryName || 'Competition'}
            </span>
            <span
              className={`px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider backdrop-blur-md ${
                isPast
                  ? 'bg-zinc-800 text-zinc-300'
                  : 'bg-[#ff4f1a] text-white'
              }`}
            >
              {isPast ? 'Completed' : 'Published'}
            </span>
          </div>
        </div>

        {/* Content Details */}
        <div className="p-6 sm:p-10 space-y-8">
          <div>
            {fest && (
              <div className="text-xs text-[#9da3b4] mb-2 flex items-center gap-1.5">
                <span>Featured in festival:</span>
                <Link
                  to={`/fests/${fest.id}`}
                  className="text-[#ff4f1a] hover:underline font-semibold flex items-center gap-1"
                >
                  {fest.name} <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            )}
            <h1 className="font-heading text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              {event.name}
            </h1>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-5 rounded-2xl bg-[#191b20] border border-[#242730]">
            <div className="space-y-1">
              <div className="text-xs text-[#656c80] flex items-center gap-1.5 font-medium">
                <Calendar className="w-3.5 h-3.5 text-[#ff4f1a]" /> Start Date & Time
              </div>
              <div className="text-xs font-semibold text-white">
                {formatDateTime(event.startTime)}
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-xs text-[#656c80] flex items-center gap-1.5 font-medium">
                <MapPin className="w-3.5 h-3.5 text-[#ff4f1a]" /> Venue / Hall
              </div>
              <div className="text-xs font-semibold text-white truncate" title={event.venue}>
                {event.venue}
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-xs text-[#656c80] flex items-center gap-1.5 font-medium">
                <Clock className="w-3.5 h-3.5 text-[#ff4f1a]" /> Reg. Deadline
              </div>
              <div className="text-xs font-semibold text-white">
                {formatDateTime(event.registrationDeadline)}
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-xs text-[#656c80] flex items-center gap-1.5 font-medium">
                <Users className="w-3.5 h-3.5 text-[#ff4f1a]" /> Capacity
              </div>
              <div className="text-xs font-semibold text-white">
                {event.capacity} Student Seats
              </div>
            </div>
          </div>

          {/* Registration Entry Action Card */}
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#191b20] to-[#121316] border border-[#2e3442] space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-mono uppercase tracking-wider font-bold text-[#ff4f1a]">
                    Registration Status
                  </span>
                  {event.registrationType && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#242730] text-[#d1d5db]">
                      {event.registrationType === 'both'
                        ? 'Individual or Team'
                        : event.registrationType === 'team'
                        ? `Team (${event.minTeamSize || 2}-${event.maxTeamSize || 4} members)`
                        : 'Individual Entry'}
                    </span>
                  )}
                  {event.requiresApproval && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
                      Approval Required
                    </span>
                  )}
                </div>

                <div className="text-sm font-semibold text-white">
                  {canRegister ? (
                    <span>Registrations Open • Reserve your participation credential</span>
                  ) : isCompleted ? (
                    <span className="text-zinc-400">Competition Concluded</span>
                  ) : isCancelled ? (
                    <span className="text-red-400">Event Cancelled</span>
                  ) : isFull ? (
                    <span className="text-amber-400">Capacity Filled</span>
                  ) : (
                    <span className="text-zinc-400">Registration Currently Closed</span>
                  )}
                </div>

                {/* Capacity breakdown */}
                {event.capacity ? (
                  <p className="text-xs text-[#9da3b4]">
                    {event.currentRegistrations ?? 0} / {event.capacity} spots filled
                    {canRegister && (
                      <span className="text-emerald-400 ml-1 font-semibold">
                        ({Math.max(0, event.capacity - (event.currentRegistrations ?? 0))} remaining)
                      </span>
                    )}
                  </p>
                ) : null}
              </div>

              {/* Action Button */}
              <div className="self-start sm:self-center">
                {canRegister ? (
                  <button
                    type="button"
                    onClick={handleRegisterClick}
                    className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-heading text-xs font-bold text-white bg-[#ff4f1a] hover:bg-[#ff6838] transition-all shadow-lg shadow-[#ff4f1a]/20 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Register Now</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="w-full sm:w-auto px-6 py-3 rounded-xl text-xs font-semibold text-zinc-500 bg-[#1e222b] border border-[#2e3442] cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isCompleted ? (
                      <>
                        <Lock className="w-4 h-4" />
                        <span>Event Completed</span>
                      </>
                    ) : isCancelled ? (
                      <>
                        <CalendarX className="w-4 h-4" />
                        <span>Event Cancelled</span>
                      </>
                    ) : isFull ? (
                      <>
                        <Users className="w-4 h-4" />
                        <span>Registration Full</span>
                      </>
                    ) : isPastDeadline ? (
                      <>
                        <Clock className="w-4 h-4" />
                        <span>Registration Closed</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        <span>Registration Not Available</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-3">
            <h3 className="font-heading text-lg font-bold text-white">
              Event Overview & Instructions
            </h3>
            <p className="text-sm text-[#9da3b4] leading-relaxed whitespace-pre-line">
              {event.description}
            </p>
          </div>

          {/* Registration & Credential Verification Notice */}
          <div className="p-6 rounded-2xl border border-[#2e3442] bg-[#121316] space-y-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#ff4f1a]" />
              <h4 className="font-heading text-sm font-bold text-white">
                Registration & Credential Verification
              </h4>
            </div>
            <p className="text-xs text-[#9da3b4] leading-relaxed">
              Registrations for this competition are secured through Festofy verified student accounts. Once registered, your official ticket pass and credential will be accessible anytime from your My Registrations dashboard.
            </p>
            <div className="flex flex-wrap gap-2 pt-1 text-[11px] text-[#656c80] font-mono">
              <span className="bg-[#1c1f26] px-2 py-1 rounded">Category: {event.categoryName || 'Competition'}</span>
              <span className="bg-[#1c1f26] px-2 py-1 rounded">Venue: {event.venue}</span>
              <span className="bg-[#1c1f26] px-2 py-1 rounded">Status: {event.status}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
