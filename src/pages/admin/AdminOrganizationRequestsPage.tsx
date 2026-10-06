import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Inbox,
  Search,
  Filter,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  School,
  Building2
} from 'lucide-react';
import { getAdminOrganizationRequests } from '../../services/organizationService';
import { Organization, OrganizationStatus } from '../../types';
import { formatDateTime } from '../../utils/dateUtils';

export const AdminOrganizationRequestsPage: React.FC = () => {
  const [requests, setRequests] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [activeTab, setActiveTab] = useState<'pending' | 'all' | 'approved' | 'rejected' | 'suspended'>('pending');
  const [searchQuery, setSearchQuery] = useState('');

  const loadRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAdminOrganizationRequests('all');
      setRequests(data);
    } catch (err: any) {
      console.error('Failed to load organization requests:', err);
      setError('Unable to load organization applications. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

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
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-800 text-zinc-400 border border-zinc-700 text-[11px] font-mono font-semibold">
            <span className="capitalize">{status}</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#242730]">
        <div>
          <div className="text-xs font-mono text-red-500 uppercase tracking-wider mb-1">
            Verification Queue
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-white">
            Organization Applications
          </h1>
          <p className="text-xs text-[#9da3b4] mt-1">
            Review submitted student club applications, verify collegiate credentials, and authorize organizer privileges.
          </p>
        </div>

        <button
          type="button"
          onClick={loadRequests}
          disabled={loading}
          aria-label="Refresh applications"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#17191e] hover:bg-[#1f2229] border border-[#272b35] text-xs font-semibold text-zinc-300 hover:text-white transition-colors cursor-pointer disabled:opacity-50 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

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
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 bg-[#14161a] p-1.5 rounded-2xl border border-[#242730]">
          {(['pending', 'all', 'approved', 'rejected', 'suspended'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer capitalize ${
                activeTab === tab
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-[#9da3b4] hover:text-white hover:bg-[#1a1d24]'
              }`}
            >
              <span>{tab}</span>
              <span className="ml-1.5 text-[10px] opacity-75 font-mono">
                ({tabCounts[tab]})
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative min-w-[260px]">
          <Search className="w-4 h-4 text-[#656c80] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by club name or institution..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#14161a] border border-[#242730] text-xs text-white placeholder-[#656c80] focus:outline-none focus:border-red-500"
          />
        </div>
      </div>

      {/* Main Table / List */}
      {loading ? (
        <div className="rounded-2xl border border-[#242730] bg-[#14161a] p-12 text-center text-xs text-[#9da3b4] animate-pulse">
          Loading organization applications...
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="rounded-3xl border border-[#242730] bg-[#14161a] p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#17191e] border border-[#272b35] text-zinc-500 flex items-center justify-center mx-auto">
            <Inbox className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-heading text-base font-bold text-white">
              {searchQuery ? 'No matching organizations found' : `No ${activeTab} requests`}
            </h3>
            <p className="text-xs text-[#9da3b4] max-w-sm mx-auto">
              {searchQuery
                ? 'Try refining your search keyword or switching tabs.'
                : `No organization applications currently match the ${activeTab} status filter.`}
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-[#242730] bg-[#14161a] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#17191e] text-[#9da3b4] uppercase tracking-wider text-[10px] border-b border-[#242730]">
                <tr>
                  <th className="p-4">Organization Name</th>
                  <th className="p-4">Institution</th>
                  <th className="p-4">Requested Date</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Action</th>
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

                    <td className="p-4">
                      {getStatusBadge(org.status || 'approved')}
                    </td>

                    <td className="p-4 text-right">
                      <Link
                        to={`/admin/organization-requests/${org.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold text-xs transition-colors shadow-sm"
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
