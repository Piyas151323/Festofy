import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, MapPin, ArrowLeft, Building2, Share2, Layers, CheckCircle2 } from 'lucide-react';
import { getFestById } from '../../services/festService';
import { getPublishedEvents } from '../../services/eventService';
import { getOrganizationById } from '../../services/organizationService';
import { Fest, EventItem, Organization } from '../../types';
import { formatDateRange } from '../../utils/dateUtils';
import { EventCard } from '../../components/common/Cards';
import { DetailSkeleton, CardSkeleton } from '../../components/common/LoadingSkeleton';
import { ErrorState, EmptyState } from '../../components/common/EmptyState';

export const FestDetailPage: React.FC = () => {
  const { festId } = useParams<{ festId: string }>();
  const [fest, setFest] = useState<Fest | null>(null);
  const [org, setOrg] = useState<Organization | null>(null);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadFestDetails() {
      if (!festId) return;
      try {
        setLoading(true);
        setError(null);
        const fData = await getFestById(festId);
        if (!fData) {
          setError('Festival not found.');
          return;
        }

        // Public visibility gate: Only published or completed fests can be viewed publicly
        if (fData.status !== 'published' && fData.status !== 'completed') {
          if (fData.status === 'draft') {
            setError('This festival is currently in draft status and has not been published for public discovery.');
          } else if (fData.status === 'archived') {
            setError('This festival has been archived and is no longer available on the public directory.');
          } else {
            setError('This festival is not available for public viewing.');
          }
          return;
        }

        setFest(fData);

        const [orgData, eventsData] = await Promise.all([
          getOrganizationById(fData.organizationId),
          getPublishedEvents(festId)
        ]);

        setOrg(orgData);
        setEvents(eventsData);
      } catch (err: any) {
        console.error('Error fetching fest detail:', err);
        setError(err.message || 'Failed to load festival details.');
      } finally {
        setLoading(false);
      }
    }
    loadFestDetails();
  }, [festId]);

  if (loading) return <DetailSkeleton />;
  if (error || !fest) return <ErrorState message={error || 'Festival not found.'} />;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Back button */}
      <div>
        <Link
          to="/fests"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#9da3b4] hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Festivals
        </Link>
      </div>

      {/* Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden border border-[#242730] bg-[#14161a]">
        <div className="relative h-64 sm:h-96 w-full overflow-hidden bg-[#181a20]">
          {fest.bannerUrl && (
            <img
              src={fest.bannerUrl}
              alt={fest.name}
              className="w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0c0d0e] via-[#0c0d0e]/60 to-transparent" />
        </div>

        <div className="p-6 sm:p-10 relative -mt-20 z-10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Host Club Tag */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#191b20]/90 border border-[#2e3442] text-xs font-semibold text-[#ff4f1a] backdrop-blur-md">
              <Building2 className="w-3.5 h-3.5" />
              <span>{org?.name || fest.organizationName || 'Student Club'}</span>
            </div>

            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#ff4f1a] text-white">
              {fest.status}
            </span>
          </div>

          <h1 className="font-heading text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            {fest.name}
          </h1>

          <div className="flex flex-wrap items-center gap-6 text-sm text-[#9da3b4]">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#ff4f1a]" />
              <span>{formatDateRange(fest.startDate, fest.endDate)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#656c80]" />
              <span>{events.length} Competitions & Workshops</span>
            </div>
          </div>
        </div>
      </div>

      {/* Description & Host details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="font-heading text-xl font-bold text-white">
            About the Festival
          </h2>
          <p className="text-sm text-[#9da3b4] leading-relaxed whitespace-pre-line">
            {fest.description}
          </p>
        </div>

        <div className="rounded-2xl border border-[#242730] bg-[#14161a] p-6 space-y-4 h-fit">
          <h3 className="font-heading text-sm font-semibold uppercase tracking-wider text-white">
            Host Organization
          </h3>
          <div className="flex items-center gap-3">
            {org?.logoUrl ? (
              <img
                src={org.logoUrl}
                alt={org.name}
                className="w-12 h-12 rounded-xl object-cover border border-[#2e3442]"
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-[#1e222b] text-[#ff4f1a] font-bold flex items-center justify-center">
                {org?.name?.[0] || 'O'}
              </div>
            )}
            <div>
              <div className="text-sm font-bold text-white">{org?.name}</div>
              <div className="text-xs text-[#656c80]">Verified Student Club</div>
            </div>
          </div>
          <p className="text-xs text-[#9da3b4] leading-relaxed">
            {org?.description}
          </p>
        </div>
      </div>

      {/* Event Schedule / Contests in this Fest */}
      <div className="space-y-6 pt-6 border-t border-[#242730]">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-heading text-2xl font-bold text-white">
              Fest Schedule & Competitions
            </h2>
            <p className="text-xs text-[#9da3b4] mt-1">
              Select any event to view registration details and venue requirements.
            </p>
          </div>
        </div>

        {events.length === 0 ? (
          <EmptyState
            title="No events scheduled yet"
            description="The organizers haven't published individual events for this fest yet."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((evt) => (
              <EventCard key={evt.id} event={evt} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
