import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, ArrowLeft, Building2, Layers, Eye, EyeOff } from 'lucide-react';
import { getFestById } from '../../services/festService';
import { getPublishedEvents } from '../../services/eventService';
import { getOrganizationById } from '../../services/organizationService';
import { Fest, EventItem, Organization } from '../../types';
import { formatDateRange } from '../../utils/dateUtils';
import { getVisitorAccessDisplay } from '../../utils/visitorUtils';
import { EventCard } from '../../components/common/Cards';
import { PageContainer } from '../../components/common/PageContainer';
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
        document.title = `${fData.name || 'Festival'} · Festofy`;

        const [orgData, eventsData] = await Promise.all([
          getOrganizationById(fData.organizationId),
          getPublishedEvents(festId)
        ]);

        setOrg(orgData);
        setEvents(eventsData);
      } catch (err: any) {
        console.warn('Notice loading festival detail:', err?.message || err);
        setError('Unable to load festival details. Please verify your connection and try again.');
      } finally {
        setLoading(false);
      }
    }
    loadFestDetails();
  }, [festId]);

  if (loading) return <DetailSkeleton wide />;
  if (error || !fest) return <ErrorState message={error || 'Festival not found.'} />;

  return (
    <PageContainer className="space-y-6 sm:space-y-8">
      {/* Back button */}
      <Link
        to="/fests"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#9da3b4] hover:text-white transition-colors py-1"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Festivals
      </Link>

      {/* Hero Banner */}
      <div className="relative rounded-2xl overflow-hidden border border-[#242730] bg-[#14161a]">
        <div className="relative h-44 sm:h-60 lg:h-72 w-full overflow-hidden bg-[#181a20]">
          {fest.bannerUrl && (
            <img
              src={fest.bannerUrl}
              alt={fest.name}
              className="w-full h-full object-cover object-center"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#14161a] via-[#14161a]/40 to-transparent" />
        </div>

        <div className="px-4 pb-5 sm:px-8 sm:pb-6 relative -mt-10 sm:-mt-14 z-10 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#191b20]/90 border border-[#2e3442] text-xs font-semibold text-[#ff4f1a] backdrop-blur-md max-w-full">
              <Building2 className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{org?.name || fest.organizationName || 'Student Club'}</span>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#ff4f1a] text-white">
              {fest.status}
            </span>
          </div>

          <h1 className="font-heading text-2xl sm:text-4xl font-extrabold text-white tracking-tight break-words">
            {fest.name}
          </h1>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-1.5 text-sm text-[#9da3b4]">
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

      {/* Description (main) + Host (sidebar) */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_360px] gap-6 lg:gap-10 items-start">
        <section className="space-y-3 min-w-0 max-w-3xl">
          <h2 className="font-heading text-lg sm:text-xl font-bold text-white">
            About the Festival
          </h2>
          <p className="text-sm sm:text-[15px] text-[#9da3b4] leading-relaxed whitespace-pre-line break-words">
            {fest.description}
          </p>
        </section>

        <aside className="space-y-4 lg:sticky lg:top-20">
          <div className="rounded-2xl border border-[#242730] bg-[#14161a] p-5 space-y-3">
            <h3 className="font-heading text-xs font-semibold uppercase tracking-wider text-white">
              Host Organization
            </h3>
            <div className="flex items-center gap-3">
              {org?.logoUrl ? (
                <img
                  src={org.logoUrl}
                  alt={org.name}
                  className="w-11 h-11 rounded-xl object-cover border border-[#2e3442] shrink-0"
                />
              ) : (
                <div className="w-11 h-11 rounded-xl bg-[#1e222b] text-[#ff4f1a] font-bold flex items-center justify-center shrink-0">
                  {org?.name?.[0] || 'O'}
                </div>
              )}
              <div className="min-w-0">
                <div className="text-sm font-bold text-white truncate">{org?.name}</div>
                <div className="text-xs text-[#656c80]">Verified Student Club</div>
              </div>
            </div>
            {org?.description && (
              <p className="text-xs text-[#9da3b4] leading-relaxed">{org.description}</p>
            )}
          </div>

          <div className="rounded-2xl border border-[#242730] bg-[#14161a] p-5 space-y-3">
            <h3 className="font-heading text-xs font-semibold uppercase tracking-wider text-white">
              Festival at a Glance
            </h3>
            <dl className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between gap-3">
                <dt className="flex items-center gap-2 text-[#656c80]">
                  <Calendar className="w-3.5 h-3.5 text-[#ff4f1a]" /> Dates
                </dt>
                <dd className="font-semibold text-white text-right">
                  {formatDateRange(fest.startDate, fest.endDate)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="flex items-center gap-2 text-[#656c80]">
                  <Layers className="w-3.5 h-3.5 text-[#ff4f1a]" /> Events
                </dt>
                <dd className="font-semibold text-white">{events.length}</dd>
              </div>
              <div className="flex items-start justify-between gap-3 pt-2 border-t border-[#242730]">
                <dt className="flex items-center gap-2 text-[#656c80]">
                  {getVisitorAccessDisplay(null, fest).status === 'allowed' ? (
                    <Eye className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <EyeOff className="w-3.5 h-3.5 text-amber-400" />
                  )}
                  <span>Visitors</span>
                </dt>
                <dd className="text-right">
                  <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                    getVisitorAccessDisplay(null, fest).status === 'allowed'
                      ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800'
                      : 'bg-amber-950/60 text-amber-300 border border-amber-800'
                  }`}>
                    {getVisitorAccessDisplay(null, fest).badgeText}
                  </span>
                </dd>
              </div>
            </dl>
            <p className="text-[11px] text-[#9da3b4] pt-1 leading-tight border-t border-[#242730]">
              {getVisitorAccessDisplay(null, fest).description}
            </p>
          </div>
        </aside>
      </div>

      {/* Event Schedule / Contests in this Fest */}
      <section className="space-y-4 pt-5 sm:pt-6 border-t border-[#242730]">
        <div>
          <h2 className="font-heading text-xl sm:text-2xl font-bold text-white">
            Fest Schedule & Competitions
          </h2>
          <p className="text-xs text-[#9da3b4] mt-1">
            Select any event to view registration details and venue requirements.
          </p>
        </div>

        {events.length === 0 ? (
          <EmptyState
            title="No events scheduled yet"
            description="The organizers haven't published individual events for this fest yet."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 items-stretch">
            {events.map((evt) => (
              <EventCard key={evt.id} event={evt} />
            ))}
          </div>
        )}
      </section>
    </PageContainer>
  );
};
