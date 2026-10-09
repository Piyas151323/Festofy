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
  Lock,
  CreditCard,
  Tag,
  Eye,
  EyeOff,
  MessageCircle
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { getEventById } from '../../services/eventService';
import { getFestById } from '../../services/festService';
import { getOrganizationById } from '../../services/organizationService';
import { EventItem, Fest, Organization } from '../../types';
import { formatDateTime, getDeadlineText } from '../../utils/dateUtils';
import { getVisitorAccessDisplay } from '../../utils/visitorUtils';
import { buildWhatsAppLink } from '../../utils/phoneUtils';
import { DetailSkeleton } from '../../components/common/LoadingSkeleton';
import { ErrorState } from '../../components/common/EmptyState';
import { PageContainer } from '../../components/common/PageContainer';

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
        document.title = `${eData.name || 'Event Details'} · Festofy`;

        const [festData, orgData] = await Promise.all([
          getFestById(eData.festId),
          getOrganizationById(eData.organizationId)
        ]);

        setFest(festData);
        setOrg(orgData);
      } catch (err: any) {
        console.warn('Notice loading event detail:', err?.message || err);
        setError('Unable to load event details. Please verify your connection and try again.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [eventId]);

  if (loading) return <DetailSkeleton wide />;
  if (error || !event) {
    return (
      <PageContainer className="py-12">
        <div className="max-w-md mx-auto text-center space-y-4 p-8 rounded-2xl border border-[#242730] bg-[#14161a]">
          <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-400 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="font-heading text-lg font-bold text-white">Event Not Found</h2>
          <p className="text-xs text-[#9da3b4] leading-relaxed">
            {error || 'The requested event could not be found or may have been removed.'}
          </p>
          <div className="pt-2">
            <Link
              to="/events"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#191b20] border border-[#2e3442] text-xs font-semibold text-white hover:border-[#ff4f1a] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Event Directory
            </Link>
          </div>
        </div>
      </PageContainer>
    );
  }

  // Canonical Public Visibility Policy:
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
  const deadlineInfo = getDeadlineText(event.registrationDeadline);

  const handleRegisterClick = () => {
    if (!isAuthenticated) {
      navigate(`/auth?redirect=/events/${event.id}/register`);
    } else {
      navigate(`/events/${event.id}/register`);
    }
  };

  const statusTitle = canRegister ? (
    <span>Registrations Open</span>
  ) : isCompleted ? (
    <span className="text-zinc-400">Competition Concluded</span>
  ) : isCancelled ? (
    <span className="text-red-400">Event Cancelled</span>
  ) : isFull ? (
    <span className="text-amber-400">Capacity Filled</span>
  ) : (
    <span className="text-zinc-400">Registration Currently Closed</span>
  );

  return (
    <PageContainer className="space-y-5 sm:space-y-6 pb-24 lg:pb-6">
      {/* Navigation Breadcrumb */}
      <Link
        to="/events"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#9da3b4] hover:text-white transition-colors py-1"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Events
      </Link>

      {/* Hero */}
      <div className="rounded-2xl border border-[#242730] bg-[#14161a] overflow-hidden">
        <div className="relative h-44 sm:h-60 lg:h-72 w-full overflow-hidden bg-[#181a20]">
          {event.bannerUrl && (
            <img
              src={event.bannerUrl}
              alt={event.name}
              className="w-full h-full object-cover object-center"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#14161a] via-[#14161a]/40 to-transparent" />

          <div className="absolute top-3 left-3 sm:top-5 sm:left-5 flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-md text-xs font-semibold bg-[#1e222b]/90 text-white border border-[#2e3442] backdrop-blur-md">
              {event.categoryName || 'Competition'}
            </span>
            <span
              className={`px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider backdrop-blur-md ${
                isPast ? 'bg-zinc-800 text-zinc-300' : 'bg-[#ff4f1a] text-white'
              }`}
            >
              {isPast ? 'Completed' : 'Published'}
            </span>
          </div>
        </div>

        <div className="px-4 pb-5 sm:px-8 sm:pb-6 pt-1 space-y-1.5">
          {fest && (
            <div className="text-xs text-[#9da3b4] flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
              <span>Featured in festival:</span>
              <Link
                to={`/fests/${fest.id}`}
                className="text-[#ff4f1a] hover:underline font-semibold inline-flex items-center gap-1"
              >
                {fest.name} <ExternalLink className="w-3 h-3 shrink-0" />
              </Link>
            </div>
          )}
          <h1 className="font-heading text-2xl sm:text-4xl font-extrabold text-white tracking-tight break-words">
            {event.name}
          </h1>
        </div>
      </div>

      {/* Body: sidebar comes first in the DOM so registration is near the top on mobile,
          and is moved to the right column on desktop. */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_380px] gap-5 lg:gap-8 items-start">
        <aside className="space-y-4 lg:col-start-2 lg:row-start-1 lg:sticky lg:top-20">
          {/* Registration panel */}
          <div className="p-5 rounded-2xl bg-[#191b20] border border-[#2e3442] space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-mono uppercase tracking-wider font-bold text-[#ff4f1a]">
                Registration Status
              </span>
              {event.registrationType && (
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#242730] text-[#d1d5db]">
                  {event.registrationType === 'both'
                    ? 'Individual or Team'
                    : event.registrationType === 'team'
                    ? `Team (${event.minTeamSize || 2}-${event.maxTeamSize || 4} members)`
                    : 'Individual Entry'}
                </span>
              )}
              {event.requiresApproval && (
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
                  Approval Required
                </span>
              )}
            </div>

            <div className="space-y-1">
              <div className="text-base font-semibold text-white">{statusTitle}</div>
              {/* Fee Notice */}
              <div className="pt-1 pb-1">
                <div className="flex items-center justify-between text-xs py-1.5 px-3 rounded-xl bg-[#14161a] border border-[#242730]">
                  <span className="text-[#656c80] flex items-center gap-1 font-mono">
                    <CreditCard className="w-3.5 h-3.5 text-[#ff4f1a]" />
                    Registration Fee:
                  </span>
                  <span className="font-heading font-bold text-white">
                    {event.isPaid
                      ? `৳${event.baseFee || 0} BDT`
                      : 'Free Entry (৳0)'}
                  </span>
                </div>
                {event.participantCategories && event.participantCategories.length > 0 && (
                  <div className="mt-2 space-y-1 text-xs text-[#9da3b4]">
                    <span className="text-xs uppercase font-mono text-[#656c80] block">
                      Eligible Categories:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {event.participantCategories.map((c) => (
                        <span
                          key={c.id}
                          className="px-2 py-0.5 rounded bg-[#14161a] border border-[#242730] text-xs text-zinc-300 font-mono"
                        >
                          {c.name}
                          {c.fee !== undefined ? ` (৳${c.fee})` : ''}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              {canRegister && (
                <p className="text-xs text-[#9da3b4]">Reserve your participation credential.</p>
              )}
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

            {canRegister ? (
              <button
                type="button"
                onClick={handleRegisterClick}
                className="w-full min-h-11 px-6 py-3 rounded-xl font-heading text-sm font-bold text-white bg-[#ff4f1a] hover:bg-[#ff6838] transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#ff4f1a]/20"
              >
                <span>Register Now</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <div className="space-y-2.5">
                <button
                  type="button"
                  disabled
                  className="w-full min-h-11 px-6 py-3 rounded-xl text-xs font-semibold text-zinc-500 bg-[#1e222b] border border-[#2e3442] cursor-not-allowed flex items-center justify-center gap-2"
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

                {/* Explicit Explanation of Unavailable Status */}
                <div className="p-3 rounded-xl bg-[#14161a] border border-[#2e3442] text-xs text-[#9da3b4] space-y-1">
                  <div className="font-semibold text-zinc-300 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-[#ff4f1a]" />
                    <span>Registration Status</span>
                  </div>
                  <p className="text-xs leading-relaxed">
                    {isCompleted
                      ? 'This competition has concluded. New registrations are closed.'
                      : isCancelled
                      ? 'This event has been cancelled by the host organization.'
                      : isFull
                      ? `All ${event.capacity} seats have been reserved. Capacity limit has been reached.`
                      : isPastDeadline
                      ? `The registration deadline passed on ${formatDateTime(event.registrationDeadline)}.`
                      : event.isRegistrationClosed
                      ? 'The organizer has closed new registrations for this event.'
                      : event.status !== 'published'
                      ? 'This event is not published yet and is not accepting participants.'
                      : 'Registrations are currently closed.'}
                  </p>
                </div>
              </div>
            )}

            {/* Direct WhatsApp Contact Organizer Button */}
            {event.organizerWhatsApp && (
              <a
                href={buildWhatsAppLink(event.organizerWhatsApp, event.name)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full min-h-10 px-4 py-2.5 rounded-xl text-xs font-semibold text-emerald-300 bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-800/80 transition-colors flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                <MessageCircle className="w-4 h-4 text-emerald-400" />
                <span>Contact Organizer on WhatsApp</span>
              </a>
            )}
          </div>

          {/* Compact metadata panel */}
          <dl className="p-5 rounded-2xl bg-[#14161a] border border-[#242730] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-x-6 gap-y-3.5">
            <div className="space-y-0.5 min-w-0">
              <dt className="text-xs text-[#656c80] flex items-center gap-1.5 font-medium">
                <Calendar className="w-3.5 h-3.5 text-[#ff4f1a]" /> Start Date & Time
              </dt>
              <dd className="text-sm font-semibold text-white">{formatDateTime(event.startTime)}</dd>
            </div>
            <div className="space-y-0.5 min-w-0">
              <dt className="text-xs text-[#656c80] flex items-center gap-1.5 font-medium">
                <MapPin className="w-3.5 h-3.5 text-[#ff4f1a]" /> Venue / Hall
              </dt>
              <dd className="text-sm font-semibold text-white break-words">{event.venue}</dd>
            </div>
            <div className="space-y-0.5 min-w-0">
              <dt className="text-xs text-[#656c80] flex items-center gap-1.5 font-medium">
                <Clock className="w-3.5 h-3.5 text-[#ff4f1a]" /> Reg. Deadline
              </dt>
              <dd className="text-sm font-semibold text-white">{formatDateTime(event.registrationDeadline)}</dd>
            </div>
            <div className="space-y-0.5 min-w-0">
              <dt className="text-xs text-[#656c80] flex items-center gap-1.5 font-medium">
                <Users className="w-3.5 h-3.5 text-[#ff4f1a]" /> Capacity
              </dt>
              <dd className="text-sm font-semibold text-white">{event.capacity} Student Seats</dd>
            </div>
            <div className="space-y-1 min-w-0 pt-2 border-t border-[#242730]">
              <dt className="text-xs text-[#656c80] flex items-center gap-1.5 font-medium">
                {getVisitorAccessDisplay(event, fest).status === 'allowed' ? (
                  <Eye className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <EyeOff className="w-3.5 h-3.5 text-amber-400" />
                )}
                <span>Visitor Policy</span>
              </dt>
              <dd className="text-xs font-semibold">
                <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold font-mono ${
                  getVisitorAccessDisplay(event, fest).status === 'allowed'
                    ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800'
                    : 'bg-amber-950/60 text-amber-300 border border-amber-800'
                }`}>
                  {getVisitorAccessDisplay(event, fest).badgeText}
                </span>
              </dd>
              <p className="text-xs text-[#9da3b4] leading-relaxed">
                {getVisitorAccessDisplay(event, fest).description}
              </p>
            </div>
          </dl>
        </aside>

        <div className="space-y-5 min-w-0 lg:col-start-1 lg:row-start-1">
          {/* Description */}
          <section className="space-y-2.5">
            <h2 className="font-heading text-lg font-bold text-white">
              Event Overview & Instructions
            </h2>
            <p className="text-sm sm:text-[15px] text-[#9da3b4] leading-relaxed whitespace-pre-line break-words max-w-3xl">
              {event.description}
            </p>
          </section>

          {/* Registration & Credential Verification Notice */}
          <div className="p-4 sm:p-5 rounded-2xl border border-[#2e3442] bg-[#121316] space-y-2.5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#ff4f1a] shrink-0" />
              <h3 className="font-heading text-sm font-bold text-white">
                Registration & Credential Verification
              </h3>
            </div>
            <p className="text-xs text-[#9da3b4] leading-relaxed">
              Registrations for this competition are secured through Festofy verified student accounts. Once registered, your official ticket pass and credential will be accessible anytime from your My Registrations dashboard.
            </p>
            <div className="flex flex-wrap gap-2 text-xs text-[#656c80] font-mono">
              <span className="bg-[#1c1f26] px-2 py-1 rounded">Category: {event.categoryName || 'Competition'}</span>
              <span className="bg-[#1c1f26] px-2 py-1 rounded break-words">Venue: {event.venue}</span>
              <span className="bg-[#1c1f26] px-2 py-1 rounded">Status: {event.status}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Fixed Bottom Action Bar */}
      {canRegister && (
        <div className="fixed bottom-0 inset-x-0 z-30 lg:hidden border-t border-[#242730] bg-[#14161a]/95 backdrop-blur-md px-4 py-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] shadow-2xl">
          <div className="flex items-center justify-between gap-3 max-w-lg mx-auto">
            <div className="min-w-0">
              <div className="text-xs font-mono text-[#ff4f1a] uppercase tracking-wider font-semibold">
                {event.isPaid ? `৳${event.baseFee || 0} BDT` : 'Free Entry (৳0)'}
              </div>
              <div className="text-xs text-[#9da3b4] truncate flex items-center gap-1 mt-0.5">
                <Clock className="w-3.5 h-3.5 shrink-0 text-[#656c80]" />
                <span className="truncate">{deadlineInfo.label}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleRegisterClick}
              className="px-5 py-2.5 rounded-xl font-heading text-xs font-bold text-white bg-[#ff4f1a] hover:bg-[#ff6838] transition-colors shrink-0 flex items-center gap-1.5 shadow-md shadow-[#ff4f1a]/20 cursor-pointer"
            >
              <span>Register Now</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </PageContainer>
  );
};
