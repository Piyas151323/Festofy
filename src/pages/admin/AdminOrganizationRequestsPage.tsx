import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Inbox,
  Search,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  School,
  X,
  Building2
} from 'lucide-react';
import { getAdminOrganizationRequests } from '../../services/organizationService';
import { Organization, OrganizationStatus } from '../../types';
import { formatDateTime } from '../../utils/dateUtils';
import { PageHeader } from '../../components/common/PageHeader';

export const AdminOrganizationRequestsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const statusParam = searchParams.get('status') as OrganizationStatus | 'all' | null;

  const [requests, setRequests] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [activeTab, setActiveTab] = useState<'pending' | 'all' | 'approved' | 'rejected' | 'suspended'>(() => {
    if (statusParam && ['pending', 'all', 'approved', 'rejected', 'suspended'].includes(statusParam)) {
      return statusParam;
    }
    return 'pending';
  });
  const [searchQuery, setSearchQuery] = useState('');

  const loadRequests = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAdminOrganizationRequests('all');
      setRequests(data);
    } catch (err: any) {
      console.warn('Notice loading organization requests:', err?.message || err);
      setError('Unable to load organization applications. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    document.title = 'Organization Requests · Admin · Festofy';
    loadRequests();
  }, [loadRequests]);

  const handleTabChange = (tab: 'pending' | 'all' | 'approved' | 'rejected' | 'suspended') => {
    setActiveTab(tab);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('status', tab);
      return next;
    });
  };

  const filteredRequests = useMemo(() => {
    return requests.filter((org) => {
      // Tab status filter
      if (activeTab !== 'all') {
        const orgStatus = org.status || 'approved';
        if (orgStatus !== activeTab) return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const nameMatch = org.name.toLowerCase().includes(q);
        const instMatch = org.institution?.toLowerCase().includes(q);
        const descMatch = org.description?.toLowerCase().includes(q);
        if (!nameMatch && !instMatch && !descMatch) return false;
      }

      return true;
    });
  }, [requests, activeTab, searchQuery]);

  // Counts for tabs
  const tabCounts = useMemo(() => {
    let pending = 0;
    let approved = 0;
    let rejected = 0;
    let suspended = 0;

    for (const r of requests) {
      const st = r.status || 'approved';
      if (st === 'pending') pending++;
      else if (st === 'approved') approved++;
      else if (st === 'rejected') rejected++;
      else if (st === 'suspended') suspended++;
    }

    return {
      all: requests.length,
      pending,
      approved,
      rejected,
      suspended
    };
  }, [requests]);

  const getStatusBadge = (status: OrganizationStatus) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[11px] font-mono font-semibold">
            <Clock className="w-3 h-3 shrink-0" />
            <span>Pending Review</span>
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[11px] font-mono font-semibold">
            <CheckCircle2 className="w-3 h-3 shrink-0" />
            <span>Approved</span>
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-500/10 text-red-400 border border-red-500/30 text-[11px] font-mono font-semibold">
            <XCircle className="w-3 h-3 shrink-0" />
            <span>Rejected</span>
          </span>
        );
      case 'suspended':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-800 text-zinc-400 border border-zinc-700 text-[11px] font-mono font-semibold">
            <AlertTriangle className="w-3 h-3 shrink-0" />
            <span>Suspended</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-800 text-zinc-400 border border-zinc-700 text-[11px] font-mono font-semibold capitalize">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 motion-safe:animate-page-enter">
      {/* Header */}
      <PageHeader
        title="Organization Applications"
        documentTitle="Organization Requests · Admin · Festofy"
        description="Review submitted student club applications, verify collegiate credentials, and authorize organizer privileges."
        actions={
          <button
            type="button"
            onClick={loadRequests}
            disabled={loading}
            aria-label="Refresh applications"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#17191e] hover:bg-[#1f2229] border border-[#272b35] text-xs font-semibold text-zinc-300 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        }
      />

      {/* Error Notice */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-950/40 border border-red-900/50 flex items-center justify-between text-xs text-red-200">
          <span>{error}</span>
          <button
            type="button"
            onClick={loadRequests}
            className="px-3 py-1 rounded-lg bg-red-900 hover:bg-red-800 text-white font-semibold cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Filter Tabs and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Tabs */}
        <div
          role="tablist"
          aria-label="Organization status tabs"
          className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none"
        >
          {(['pending', 'all', 'approved', 'rejected', 'suspended'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={activeTab === tab}
              onClick={() => handleTabChange(tab)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer capitalize whitespace-nowrap ${
                activeTab === tab
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'bg-[#14161a] hover:bg-[#191b20] text-[#9da3b4] hover:text-white border border-[#242730]'
              }`}
            >
              <span>{tab}</span>
              <span className="ml-1.5 text-[10px] opacity-80 font-mono">
                ({tabCounts[tab]})
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64">
          <Search className="w-3.5 h-3.5 text-[#656c80] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search club or school..."
            aria-label="Search organizations"
            className="w-full pl-8 pr-7 py-1.5 rounded-xl bg-[#14161a] border border-[#242730] text-xs text-white placeholder-[#656c80] focus:outline-hidden focus:border-red-500 transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[#656c80] hover:text-white"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Table / List */}
      {loading ? (
        <div className="rounded-2xl border border-[#242730] bg-[#14161a] p-12 text-center text-xs text-[#9da3b4] motion-safe:animate-pulse">
          Loading organization applications...
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#242730] bg-[#14161a] p-8 sm:p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#17191e] border border-[#272b35] text-zinc-500 flex items-center justify-center mx-auto">
            <Inbox className="w-6 h-6" />
          </div>
          <div className="space-y-1 max-w-sm mx-auto">
            <h3 className="font-heading text-sm sm:text-base font-bold text-white">
              {searchQuery ? 'No matching organizations found' : `No ${activeTab} requests`}
            </h3>
            <p className="text-xs text-[#9da3b4]">
              {searchQuery
                ? `No submissions match "${searchQuery}". Try a different keyword.`
                : `No organization applications currently match the ${activeTab} status filter.`}
            </p>
          </div>
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="px-4 py-2 rounded-xl bg-[#191b20] hover:bg-[#1e222b] text-xs font-semibold text-white border border-[#2e3442] transition-colors"
            >
              Clear Search
            </button>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-[#242730] bg-[#14161a] overflow-hidden">
          {/* Mobile View (< 768px): Responsive Cards */}
          <div className="md:hidden divide-y divide-[#242730]">
            {filteredRequests.map((org) => (
              <div key={org.id} className="p-4 space-y-3 hover:bg-[#17191e] transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {org.logoUrl ? (
                      <img
                        src={org.logoUrl}
                        alt=""
                        className="w-10 h-10 rounded-xl object-cover bg-[#17191e] border border-[#272b35] shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-[#17191e] border border-[#272b35] text-red-400 flex items-center justify-center font-bold text-sm shrink-0">
                        {org.name?.[0]?.toUpperCase() || 'C'}
                      </div>
                    )}
                    <div className="min-w-0">
                      <h4 className="font-heading text-sm font-bold text-white truncate">
                        {org.name}
                      </h4>
                      {org.institution && (
                        <span className="flex items-center gap-1 text-[11px] text-[#9da3b4] mt-0.5 truncate">
                          <School className="w-3 h-3 text-zinc-500 shrink-0" />
                          <span className="truncate">{org.institution}</span>
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0">{getStatusBadge(org.status || 'approved')}</div>
                </div>

                {org.description && (
                  <p className="text-xs text-[#9da3b4] line-clamp-2 leading-relaxed">
                    {org.description}
                  </p>
                )}

                <div className="flex items-center justify-between text-[11px] text-[#656c80] pt-2 border-t border-[#242730]">
                  <span className="font-mono">
                    {formatDateTime(org.requestedAt || org.createdAt)}
                  </span>
                  <Link
                    to={`/admin/organization-requests/${org.id}`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-xs transition-colors shadow-xs"
                  >
                    <span>Review</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop View (>= 768px): Structured Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#17191e] text-[#9da3b4] uppercase tracking-wider text-[10px] border-b border-[#242730]">
                <tr>
                  <th className="p-4 font-semibold">Organization Name</th>
                  <th className="p-4 font-semibold">Institution</th>
                  <th className="p-4 font-semibold">Requested Date</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#242730] text-white">
                {filteredRequests.map((org) => (
                  <tr key={org.id} className="hover:bg-[#181a20] transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {org.logoUrl ? (
                          <img
                            src={org.logoUrl}
                            alt=""
                            className="w-8 h-8 rounded-lg object-cover bg-[#17191e] border border-[#272b35] shrink-0"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-[#17191e] border border-[#272b35] text-red-400 flex items-center justify-center font-bold text-xs shrink-0">
                            {org.name?.[0]?.toUpperCase() || 'C'}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="font-semibold text-white truncate max-w-xs sm:max-w-md">
                            {org.name}
                          </div>
                          {org.description && (
                            <div className="text-[11px] text-[#9da3b4] line-clamp-1 max-w-xs sm:max-w-md">
                              {org.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="p-4 text-[#9da3b4]">
                      {org.institution ? (
                        <span className="flex items-center gap-1.5">
                          <School className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                          <span>{org.institution}</span>
                        </span>
                      ) : (
                        <span className="text-zinc-600 italic">None specified</span>
                      )}
                    </td>

                    <td className="p-4 text-[#9da3b4] font-mono text-[11px]">
                      {formatDateTime(org.requestedAt || org.createdAt)}
                    </td>

                    <td className="p-4">{getStatusBadge(org.status || 'approved')}</td>

                    <td className="p-4 text-right">
                      <Link
                        to={`/admin/organization-requests/${org.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-xs transition-colors shadow-xs"
                      >
                        <span>Review</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
