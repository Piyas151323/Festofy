import React, { useEffect, useState } from 'react';
import { Search, Filter, Layers } from 'lucide-react';
import { getPublishedEvents, getEventCategories } from '../../services/eventService';
import { EventItem, EventCategory } from '../../types';
import { EventCard } from '../../components/common/Cards';
import { CardSkeleton } from '../../components/common/LoadingSkeleton';
import { EmptyState, ErrorState } from '../../components/common/EmptyState';
import { PageHeader } from '../../components/common/PageHeader';

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
      <PageHeader
        title="Event Directory"
        documentTitle="Events"
        description="Discover hackathons, algorithmic speedruns, autonomous robotics, CTFs, and tech quizzes across collegiate festivals."
      />

      {/* Category Pills & Search */}
      <div className="space-y-4">
        {/* Search */}
        <div className="relative max-w-md">
          <label htmlFor="event-search-input" className="sr-only">
            Search events
          </label>
          <Search className="w-4 h-4 text-[#656c80] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id="event-search-input"
            type="text"
            placeholder="Search events, venues, or festival names..."
            aria-label="Search events, venues, or festival names"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#14161a] border border-[#242730] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-[#656c80] focus:outline-none focus:border-[#ff4f1a] transition-colors"
          />
        </div>

        {/* Category Pills */}
        <div
          role="group"
          aria-label="Filter events by category"
          className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none"
        >
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            aria-pressed={selectedCategory === 'all'}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
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
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                aria-pressed={active}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
                  active
                    ? 'bg-[#ff4f1a] text-white font-semibold'
                    : 'bg-[#14161a] text-[#9da3b4] hover:text-white border border-[#242730]'
                }`}
              >
                <span>{cat.name}</span>
                <span
                  className={`text-xs px-1.5 py-0.5 rounded ${
                    active ? 'bg-black/20 text-white' : 'bg-[#1e222b] text-[#656c80]'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Result Count and Clear Filters Indicator */}
        <div className="flex items-center justify-between text-xs text-[#9da3b4] pt-1">
          <span>
            Showing <strong className="text-white font-semibold">{filteredEvents.length}</strong> {filteredEvents.length === 1 ? 'event' : 'events'}
            {(searchQuery || selectedCategory !== 'all') && (
              <span className="text-[#656c80] ml-1">(filtered from {events.length})</span>
            )}
          </span>
          {(searchQuery || selectedCategory !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="text-xs font-semibold text-[#ff4f1a] hover:text-[#ff6838] transition-colors cursor-pointer"
            >
              Clear Filters
            </button>
          )}
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
          description={
            searchQuery || selectedCategory !== 'all'
              ? 'No competitions matched your current filter criteria. Try clearing your search keyword or switching category.'
              : 'Events created by organizers will be listed here.'
          }
          actionLabel={searchQuery || selectedCategory !== 'all' ? 'Clear All Filters' : undefined}
          onAction={
            searchQuery || selectedCategory !== 'all'
              ? () => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }
              : undefined
          }
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
