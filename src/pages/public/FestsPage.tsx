import React, { useEffect, useState } from 'react';
import { Search, Filter, Calendar } from 'lucide-react';
import { getPublishedFests } from '../../services/festService';
import { Fest } from '../../types';
import { FestCard } from '../../components/common/Cards';
import { CardSkeleton } from '../../components/common/LoadingSkeleton';
import { EmptyState, ErrorState } from '../../components/common/EmptyState';

export const FestsPage: React.FC = () => {
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
        console.error('Failed to load festivals:', err);
        setError(err.message || 'Error fetching festivals from Firestore');
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="text-xs font-semibold uppercase tracking-wider text-[#ff4f1a]">
          Directory
        </div>
        <h1 className="font-heading text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Festival Directory
        </h1>
        <p className="text-sm text-[#9da3b4] max-w-2xl">
          Browse major technology carnivals, innovation summits, and collegiate festivals hosted by verified student organizations.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-[#14161a] border border-[#242730]">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-[#656c80] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search festivals or host organizations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#191b20] border border-[#2e3442] rounded-lg pl-10 pr-4 py-2 text-xs text-white placeholder-[#656c80] focus:outline-none focus:border-[#ff4f1a] transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-[#656c80] hidden sm:inline">Status:</span>
          {(['all', 'published', 'completed'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
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

      {/* Results */}
      {loading ? (
        <CardSkeleton count={6} />
      ) : error ? (
        <ErrorState message={error} />
      ) : filteredFests.length === 0 ? (
        <EmptyState
          title="No festivals matched your query"
          description="Try clearing your search filters or check back later."
          actionLabel="Clear Filters"
          onAction={() => {
            setSearchQuery('');
            setStatusFilter('all');
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFests.map((fest) => (
            <FestCard key={fest.id} fest={fest} />
          ))}
        </div>
      )}
    </div>
  );
};
