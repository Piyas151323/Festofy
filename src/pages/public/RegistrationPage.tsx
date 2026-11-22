import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CalendarX } from 'lucide-react';
import { getEventById } from '../../services/eventService';
import { getFestById } from '../../services/festService';
import { EventItem, Fest } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { DetailSkeleton } from '../../components/common/LoadingSkeleton';
import { ErrorState } from '../../components/common/EmptyState';
import { RegistrationForm } from '../../components/registration/RegistrationForm';
import { EmailVerificationScreen } from '../../components/auth/EmailVerificationScreen';
import { AuthSyncErrorScreen } from '../../components/auth/AuthSyncErrorScreen';
import { formatDateTime } from '../../utils/dateUtils';

export const RegistrationPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const {
    isAuthenticated,
    firebaseUser,
    needsEmailVerification,
    authError,
    loading: authLoading
  } = useAuth();

  const [event, setEvent] = useState<EventItem | null>(null);
  const [fest, setFest] = useState<Fest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Redirect signed-out visitors to sign in; keep unverified users here on verification gate
  useEffect(() => {
    if (!authLoading && !firebaseUser && eventId) {
      navigate(`/auth?redirect=${encodeURIComponent(`/events/${eventId}/register`)}`, { replace: true });
    }
  }, [authLoading, firebaseUser, eventId, navigate]);

  // Load event details only after verification & auth sync succeed
  useEffect(() => {
    async function loadEventData() {
      if (!eventId) return;
      try {
        setLoading(true);
        setError(null);
        const eventData = await getEventById(eventId);
        if (!eventData) {
          setError('Event not found.');
          return;
        }
        setEvent(eventData);
        document.title = `${eventData.name ? `Register: ${eventData.name}` : 'Event Registration'} · Festofy`;

        if (eventData.festId) {
          const festData = await getFestById(eventData.festId);
          setFest(festData);
        }
      } catch (err: any) {
        console.warn('Notice loading event for registration:', err?.message || err);
        setError('Unable to load registration details. Please verify your connection and try again.');
      } finally {
        setLoading(false);
      }
    }

    if (isAuthenticated) {
      loadEventData();
    }
  }, [eventId, isAuthenticated]);

  if (authLoading || (loading && isAuthenticated)) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10">
        <DetailSkeleton />
      </div>
    );
  }

  if (needsEmailVerification) {
    return (
      <EmailVerificationScreen
        title="Verify Your Email to Register"
        subtitle="Confirm your email address before completing event registration or receiving your digital pass."
      />
    );
  }

  if (authError || (!isAuthenticated && firebaseUser)) {
    return <AuthSyncErrorScreen error={authError} />;
  }

  if (error || !event) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10">
        <ErrorState message={error || 'Event could not be located.'} />
      </div>
    );
  }

  // Check event registration availability
  const isPastDeadline =
    new Date(event.registrationDeadline).getTime() <= Date.now();
  const isStarted =
    new Date(event.startTime).getTime() <= Date.now();
  const isClosed =
    event.isRegistrationClosed ||
    isPastDeadline ||
    isStarted ||
    event.status !== 'published' ||
    event.festStatus !== 'published';

  if (isClosed) {
    let reasonTitle = 'Registration Closed';
    let reasonDesc = `The registration deadline for this event closed on ${formatDateTime(
      event.registrationDeadline
    )}.`;

    if (event.status === 'completed') {
      reasonTitle = 'Event Completed';
      reasonDesc = 'This event has concluded. New registrations are no longer accepted.';
    } else if (event.status === 'cancelled') {
      reasonTitle = 'Event Cancelled';
      reasonDesc = 'This competition has been cancelled by the event organizers.';
    }

    return (
      <div className="mx-auto w-full min-w-0 max-w-4xl space-y-4 px-4 py-4 sm:space-y-6 sm:px-6 sm:py-10 lg:px-8">
        <div>
          <Link
            to={`/events/${event.id}`}
            className="-ml-1 inline-flex min-h-11 items-center gap-1.5 rounded-lg px-1 text-xs font-semibold text-[#9da3b4] transition-colors hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Event
          </Link>
        </div>

        <div className="rounded-3xl border border-[#242730] bg-[#14161a] p-6 sm:p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-zinc-800 text-zinc-400 flex items-center justify-center mx-auto">
            <CalendarX className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h2 className="font-heading text-xl sm:text-2xl font-bold text-white">
              {reasonTitle}
            </h2>
            <p className="text-xs text-[#9da3b4] max-w-md mx-auto">
              {reasonDesc}
            </p>
          </div>
          <div className="flex flex-col items-stretch justify-center gap-3 pt-4 sm:flex-row">
            <Link
              to={`/events/${event.id}`}
              className="px-5 py-2.5 rounded-xl bg-[#191b20] border border-[#2e3442] hover:border-zinc-700 text-xs font-semibold text-white transition-colors"
            >
              View Event Information
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

  return (
    <div className="mx-auto w-full min-w-0 max-w-4xl space-y-4 px-4 py-4 sm:space-y-8 sm:px-6 sm:py-10 lg:px-8">
      {/* Navigation Breadcrumb */}
      <div>
        <Link
          to={`/events/${event.id}`}
          className="-ml-1 inline-flex min-h-11 items-center gap-1.5 rounded-lg px-1 text-xs font-semibold text-[#9da3b4] transition-colors hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Event
        </Link>
      </div>

      {/* Main Registration Form */}
      <RegistrationForm event={event} fest={fest} />
    </div>
  );
};
