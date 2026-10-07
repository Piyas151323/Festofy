import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertCircle, Calendar, CalendarX, CheckCircle } from 'lucide-react';
import { getEventById } from '../../services/eventService';
import { getFestById } from '../../services/festService';
import { EventItem, Fest } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { DetailSkeleton } from '../../components/common/LoadingSkeleton';
import { ErrorState, EmptyState } from '../../components/common/EmptyState';
import { RegistrationForm } from '../../components/registration/RegistrationForm';
import { formatDateTime } from '../../utils/dateUtils';

export const RegistrationPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [event, setEvent] = useState<EventItem | null>(null);
  const [fest, setFest] = useState<Fest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Authentication requirement: Redirect unauthenticated students to sign in
  useEffect(() => {
    if (!authLoading && !isAuthenticated && eventId) {
      navigate(`/auth?redirect=/events/${eventId}/register`, { replace: true });
    }
  }, [authLoading, isAuthenticated, eventId, navigate]);

  // Load event details
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

        if (eventData.festId) {
          const festData = await getFestById(eventData.festId);
          setFest(festData);
        }
      } catch (err: any) {
        console.error('Failed to load event for registration:', err);
        setError(err.message || 'Failed to load event details.');
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        <div>
          <Link
            to={`/events/${event.id}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#9da3b4] hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Event
          </Link>
        </div>

        <div className="rounded-3xl border border-[#242730] bg-[#14161a] p-8 sm:p-12 text-center space-y-4">
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
          <div className="pt-4 flex justify-center gap-3">
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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Navigation Breadcrumb */}
      <div>
        <Link
          to={`/events/${event.id}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#9da3b4] hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Event
        </Link>
      </div>

      {/* Main Registration Form */}
      <RegistrationForm event={event} fest={fest} />
    </div>
  );
};
