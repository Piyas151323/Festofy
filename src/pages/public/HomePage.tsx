import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Compass, UserCheck, BarChart2, CheckCircle2, Trophy, Flame } from 'lucide-react';
import { getPublishedFests } from '../../services/festService';
import { getPublishedEvents } from '../../services/eventService';
import { Fest, EventItem } from '../../types';
import { FestCard, EventCard } from '../../components/common/Cards';
import { CardSkeleton } from '../../components/common/LoadingSkeleton';
import { ErrorState, EmptyState } from '../../components/common/EmptyState';

export const HomePage: React.FC = () => {
  const [fests, setFests] = useState<Fest[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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
      {/* HERO SECTION */}
      <section className="relative overflow-hidden pt-16 sm:pt-24 pb-12 border-b border-[#242730] bg-gradient-to-b from-[#121316] via-[#090a0b] to-[#090a0b]">
        {/* Subtle background ambient glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-[#ff4f1a]/10 blur-[130px] rounded-full pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-8">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#191b20] border border-[#2e3442] text-[11px] font-semibold text-[#ff4f1a] uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-[#ff4f1a]" />
            EVENT OPERATIONS FOR STUDENT ORGANIZATIONS
          </div>

          {/* Large Title */}
          <h1 className="font-heading text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-none">
            FESTOFY
          </h1>

          {/* Tagline */}
          <div className="text-lg sm:text-2xl lg:text-3xl font-heading font-medium text-[#f4f5f7]">
            Plan. Discover. Participate.
          </div>

          {/* Supporting Copy */}
          <p className="max-w-2xl mx-auto text-xs sm:text-sm md:text-base text-[#9da3b4] leading-relaxed">
            One home for festivals, events, registrations and participants — built for the clubs that run them and the students who show up.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-2 sm:pt-4">
            <Link
              to="/fests"
              className="w-full sm:w-auto px-7 py-3 rounded-xl font-semibold text-xs sm:text-sm text-white bg-[#ff4f1a] hover:bg-[#ff6838] transition-all duration-200 shadow-lg shadow-[#ff4f1a]/20 flex items-center justify-center gap-2"
            >
              Explore Fests <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/events"
              className="w-full sm:w-auto px-7 py-3 rounded-xl font-semibold text-xs sm:text-sm text-[#f4f5f7] bg-[#14161a] hover:bg-[#1e222b] border border-[#2e3442] transition-colors flex items-center justify-center gap-2"
            >
              View Events
            </Link>
          </div>

          {/* Meta metrics badge */}
          <div className="pt-8 flex flex-wrap items-center justify-center gap-4 sm:gap-10 text-xs text-[#9da3b4] border-t border-[#242730]/60 max-w-2xl mx-auto">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Verified Campus Clubs</span>
            </div>
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-[#ff4f1a]" />
              <span>Instant Digital Entry Passes</span>
            </div>
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>Structured Competitions</span>
            </div>
          </div>
        </div>
      </section>

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

      {/* VALUE SECTION: Three concepts: Discover, Register, Manage */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#ff4f1a] mb-1">
            Engineered for Modern Clubs
          </div>
          <h2 className="font-heading text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            How Festofy Empowers Campus Operations
          </h2>
          <p className="text-sm text-[#9da3b4] mt-2">
            Eliminating fragmented spreadsheets, scattered Google Forms, and manual participant tracking.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1: Discover */}
          <div className="rounded-2xl border border-[#242730] bg-[#14161a] p-8 space-y-4 relative overflow-hidden group hover:border-[#383d4c] transition-all">
            <div className="w-12 h-12 rounded-xl bg-[#ff4f1a]/10 text-[#ff4f1a] flex items-center justify-center font-bold">
              <Compass className="w-6 h-6" />
            </div>
            <h3 className="font-heading text-xl font-bold text-white">
              Discover
            </h3>
            <p className="text-sm text-[#9da3b4] leading-relaxed">
              Explore collegiate festivals across Bangladesh. Filter by contest categories, check realistic schedules, and evaluate venue details in one unified directory.
            </p>
          </div>

          {/* Card 2: Register */}
          <div className="rounded-2xl border border-[#242730] bg-[#14161a] p-8 space-y-4 relative overflow-hidden group hover:border-[#383d4c] transition-all">
            <div className="w-12 h-12 rounded-xl bg-[#ff4f1a]/10 text-[#ff4f1a] flex items-center justify-center font-bold">
              <UserCheck className="w-6 h-6" />
            </div>
            <h3 className="font-heading text-xl font-bold text-white">
              Register
            </h3>
            <p className="text-sm text-[#9da3b4] leading-relaxed">
              Seamless participant registration with automated deadline enforcement. Student portal holds all your active registrations and digital passes.
            </p>
          </div>

          {/* Card 3: Manage */}
          <div className="rounded-2xl border border-[#242730] bg-[#14161a] p-8 space-y-4 relative overflow-hidden group hover:border-[#383d4c] transition-all">
            <div className="w-12 h-12 rounded-xl bg-[#ff4f1a]/10 text-[#ff4f1a] flex items-center justify-center font-bold">
              <BarChart2 className="w-6 h-6" />
            </div>
            <h3 className="font-heading text-xl font-bold text-white">
              Manage
            </h3>
            <p className="text-sm text-[#9da3b4] leading-relaxed">
              A high-precision organizer console. Manage festival timelines, track participant quotas, supervise team roles, and monitor live metrics effortlessly.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
