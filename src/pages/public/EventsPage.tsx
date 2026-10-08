import React, { useEffect, useState } from 'react';
import { Search, Filter, Layers } from 'lucide-react';
import { getPublishedEvents, getEventCategories } from '../../services/eventService';
import { EventItem, EventCategory } from '../../types';
import { EventCard } from '../../components/common/Cards';
import { CardSkeleton } from '../../components/common/LoadingSkeleton';
import { EmptyState, ErrorState } from '../../components/common/EmptyState';

export const EventsPage: React.FC = () => {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [categories, setCategories] = useState<EventCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    async function loadEventsData() {
      try {
        setLoading(true);
        setError(null);
        const [evts, cats] = await Promise.all([
          getPublishedEvents(),
          getEventCategories()
        ]);
        setEvents(evts);
        setCategories(cats);
      } catch (err: any) {
        console.warn('Notice loading events directory:', err?.message || err);
        setError('Unable to load event competitions. Please check your connection and try again.');
      } finally {
        setLoading(false);
      }
    }
    loadEventsData();
  }, []);

  const filteredEvents = events.filter((evt) => {
    const matchesCategory =
      selectedCategory === 'all' || evt.categoryId === selectedCategory;

    const matchesSearch =
      evt.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evt.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evt.venue.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (evt.festName && evt.festName.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCategory && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="text-xs font-semibold uppercase tracking-wider text-[#ff4f1a]">
          Competitions & Challenges
        </div>
        <h1 className="font-heading text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Event Directory
        </h1>
        <p className="text-sm text-[#9da3b4] max-w-2xl">
          Discover hackathons, algorithmic speedruns, autonomous robotics, CTFs, and tech quizzes across collegiate festivals.
        </p>
      </div>

      {/* Category Pills & Search */}
      <div className="space-y-4">
        {/* Search */}
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-[#656c80] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search events, venues, or festival names..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#14161a] border border-[#242730] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-[#656c80] focus:outline-none focus:border-[#ff4f1a] transition-colors"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              selectedCategory === 'all'
                ? 'bg-[#ff4f1a] text-white font-semibold'
                : 'bg-[#14161a] text-[#9da3b4] hover:text-white border border-[#242730]'
            }`}
          >
            All Categories ({events.length})
          </button>
          {categories.map((cat) => {
            const count = events.filter((e) => e.categoryId === cat.id).length;
            const active = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  active
                    ? 'bg-[#ff4f1a] text-white font-semibold'
                    : 'bg-[#14161a] text-[#9da3b4] hover:text-white border border-[#242730]'
                }`}
              >
                <span>{cat.name}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded ${
                    active ? 'bg-black/20 text-white' : 'bg-[#1e222b] text-[#656c80]'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <CardSkeleton count={6} />
      ) : error ? (
        <ErrorState message={error} />
      ) : filteredEvents.length === 0 ? (
        <EmptyState
          title="No events found"
          description="Try changing your search keywords or choosing a different category."
          actionLabel="Reset Filters"
          onAction={() => {
            setSearchQuery('');
            setSelectedCategory('all');
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
};
