import React, { useEffect, useState } from 'react';
import { Search, Filter, Calendar } from 'lucide-react';
import { getPublishedFests } from '../../services/festService';
import { Fest } from '../../types';
import { FestCard } from '../../components/common/Cards';
import { CardSkeleton } from '../../components/common/LoadingSkeleton';
import { EmptyState, ErrorState } from '../../components/common/EmptyState';
import { PageHeader } from '../../components/common/PageHeader';

export const FestsPage: React.FC<{ embedded?: boolean }> = ({ embedded = false }) => {
  const [fests, setFests] = useState<Fest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'completed'>('all');

  useEffect(() => {
    async function loadFests() {
      try {
        setLoading(true);
        setError(null);
        const data = await getPublishedFests();
        setFests(data);
      } catch (err: any) {
        console.warn('Notice loading festivals:', err?.message || err);
        setError('Unable to load festival directory. Please check your connection and try again.');
      } finally {
        setLoading(false);
      }
    }
    loadFests();
  }, []);

  const filteredFests = fests.filter((fest) => {
    const matchesSearch =
      fest.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fest.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (fest.organizationName && fest.organizationName.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      statusFilter === 'all' ? true : fest.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className={embedded ? '@container px-4 py-5 space-y-6' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8'}>
      {/* Header */}
      <PageHeader
        title="Festival Directory"
        documentTitle="Festivals"
        description="Browse major technology carnivals, innovation summits, and collegiate festivals hosted by verified student organizations."
      />

      {/* Filter and Search Bar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-[#14161a] border border-[#242730]">
          <div className="relative w-full sm:w-96">
            <label htmlFor="fest-search-input" className="sr-only">
              Search festivals
            </label>
            <Search className="w-4 h-4 text-[#656c80] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="fest-search-input"
              type="text"
              placeholder="Search festivals or host organizations..."
              aria-label="Search festivals or host organizations"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#191b20] border border-[#2e3442] rounded-lg pl-10 pr-4 py-2 text-xs text-white placeholder-[#656c80] focus:outline-none focus:border-[#ff4f1a] transition-colors"
            />
          </div>

          <div
            role="group"
            aria-label="Filter festivals by status"
            className="flex items-center gap-2 w-full sm:w-auto"
          >
            <span className="text-xs text-[#656c80] hidden sm:inline">Status:</span>
            {(['all', 'published', 'completed'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                aria-pressed={statusFilter === st}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors cursor-pointer ${
                  statusFilter === st
                    ? 'bg-[#ff4f1a] text-white font-semibold'
                    : 'bg-[#191b20] text-[#9da3b4] hover:text-white border border-[#2e3442]'
                }`}
              >
                {st === 'published' ? 'Active / Upcoming' : st}
              </button>
            ))}
          </div>
        </div>

        {/* Result count & clear action */}
        <div className="flex items-center justify-between text-xs text-[#9da3b4] px-1">
          <span>
            Showing <strong className="text-white font-semibold">{filteredFests.length}</strong> {filteredFests.length === 1 ? 'festival' : 'festivals'}
            {(searchQuery || statusFilter !== 'all') && (
              <span className="text-[#656c80] ml-1">(filtered from {fests.length})</span>
            )}
          </span>
          {(searchQuery || statusFilter !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
              }}
              className="text-xs font-semibold text-[#ff4f1a] hover:text-[#ff6838] transition-colors cursor-pointer"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <CardSkeleton count={6} />
      ) : error ? (
        <ErrorState message={error} />
      ) : filteredFests.length === 0 ? (
        <EmptyState
          title="No festivals matched your query"
          description={
            searchQuery || statusFilter !== 'all'
              ? 'No festivals matched your search or status filter. Try clearing your search filters.'
              : 'Festivals published by student organizations will appear here.'
          }
          actionLabel={searchQuery || statusFilter !== 'all' ? 'Clear All Filters' : undefined}
          onAction={
            searchQuery || statusFilter !== 'all'
              ? () => {
                  setSearchQuery('');
                  setStatusFilter('all');
                }
              : undefined
          }
        />
      ) : (
        <div className={embedded ? 'grid grid-cols-1 @2xl:grid-cols-2 @5xl:grid-cols-3 gap-6' : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'}>
          {filteredFests.map((fest) => (
            <FestCard key={fest.id} fest={fest} />
          ))}
        </div>
      )}
    </div>
  );
};
