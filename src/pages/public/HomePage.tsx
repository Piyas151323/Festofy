import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { getPublishedFests } from '../../services/festService';
import { getPublishedEvents } from '../../services/eventService';
import { Fest, EventItem } from '../../types';
import { FestCard, EventCard } from '../../components/common/Cards';
import { CardSkeleton } from '../../components/common/LoadingSkeleton';
import { ErrorState, EmptyState } from '../../components/common/EmptyState';
import { FestofyPortal } from '../../components/home/FestofyPortal';

export const HomePage: React.FC = () => {
  const [fests, setFests] = useState<Fest[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'Home · Festofy';
    let mounted = true;
    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        const [festsData, eventsData] = await Promise.all([
          getPublishedFests(),
          getPublishedEvents()
        ]);

        if (mounted) {
          setFests(festsData.slice(0, 3));
          setEvents(eventsData.slice(0, 6));
        }
      } catch (err: any) {
        console.warn('Notice loading homepage data:', err?.message || err);
        if (mounted) {
          setError('Unable to load live festivals right now. Please refresh to try again.');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadData();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="space-y-24 pb-16">
      {/* PORTAL HERO: scroll-driven FESTOFY intro + feature reveal */}
      <FestofyPortal />

      {/* FESTIVALS SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-[#ff4f1a] mb-1">
              Curated Directory
            </div>
            <h2 className="font-heading text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Featured Festivals
            </h2>
            <p className="text-sm text-[#9da3b4] mt-1">
              Flagship inter-collegiate summits, national carnivals, and innovation gatherings.
            </p>
          </div>

          <Link
            to="/fests"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#ff4f1a] hover:text-[#ff6838] transition-colors"
          >
            All Festivals <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <CardSkeleton count={3} />
        ) : error ? (
          <ErrorState message={error} />
        ) : fests.length === 0 ? (
          <EmptyState
            title="No published festivals yet"
            description="Festivals will appear here once organizations publish them to Firestore."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {fests.map((fest) => (
              <FestCard key={fest.id} fest={fest} />
            ))}
          </div>
        )}
      </section>

      {/* FEATURED EVENTS SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-[#ff4f1a] mb-1">
              Active Competitions & Workshops
            </div>
            <h2 className="font-heading text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Upcoming Events
            </h2>
            <p className="text-sm text-[#9da3b4] mt-1">
              Programming contests, robotics challenges, hackathons, and design sprints.
            </p>
          </div>

          <Link
            to="/events"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#ff4f1a] hover:text-[#ff6838] transition-colors"
          >
            Explore All Events <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <CardSkeleton count={6} />
        ) : error ? (
          <ErrorState message={error} />
        ) : events.length === 0 ? (
          <EmptyState
            title="No events found"
            description="Events created by organizers will be listed here."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((evt) => (
              <EventCard key={evt.id} event={evt} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
