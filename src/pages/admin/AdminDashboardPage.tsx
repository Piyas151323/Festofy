import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Inbox,
  School,
  Search,
  X
} from 'lucide-react';
import {
  getAdminOrganizationStats,
  getAdminOrganizationRequests
} from '../../services/organizationService';
import { Organization } from '../../types';
import { formatDateTime } from '../../utils/dateUtils';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/Cards';

export const AdminDashboardPage: React.FC = () => {
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    suspended: 0,
    total: 0
  });
  const [pendingRequests, setPendingRequests] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [statsData, pendingData] = await Promise.all([
        getAdminOrganizationStats(),
        getAdminOrganizationRequests('pending')
      ]);
      setStats(statsData);
      setPendingRequests(pendingData);
    } catch (err: any) {
      console.warn('Notice loading admin dashboard data:', err?.message || err);
      setError('Unable to load administrative overview. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    document.title = 'Admin Dashboard · Festofy';
    loadData();
  }, [loadData]);

  const filteredPending = useMemo(() => {
    if (!searchQuery.trim()) return pendingRequests;
    const q = searchQuery.toLowerCase().trim();
    return pendingRequests.filter((org) => {
      return (
        org.name.toLowerCase().includes(q) ||
        (org.institution && org.institution.toLowerCase().includes(q)) ||
        (org.description && org.description.toLowerCase().includes(q))
      );
    });
  }, [pendingRequests, searchQuery]);

  return (
    <div className="space-y-6 motion-safe:animate-page-enter">
      {/* 1. Header */}
      <PageHeader
        title="Admin Governance"
        documentTitle="Admin Dashboard · Festofy"
        description="Platform oversight for student club verification, organizer approval, and festival network operations."
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadData}
              disabled={loading}
              aria-label="Refresh overview"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#17191e] hover:bg-[#1f2229] border border-[#272b35] text-xs font-semibold text-zinc-300 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <Link
              to="/admin/organization-requests"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-semibold text-white transition-colors shadow-sm shadow-red-600/20"
            >
              <Inbox className="w-3.5 h-3.5" />
              <span>All Requests ({stats.total})</span>
            </Link>
          </div>
        }
      />

      {/* Error Notice */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-950/40 border border-red-900/50 flex items-center justify-between text-xs text-red-200">
          <span>{error}</span>
          <button
            type="button"
            onClick={loadData}
            className="px-3 py-1 rounded-lg bg-red-900 hover:bg-red-800 text-white font-semibold cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* 2. Key Metrics Grid */}
      <section aria-label="Organization Telemetry">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard
            label="Pending Review"
            value={stats.pending}
            description="Applications awaiting decision"
            icon={<Clock className="w-4 h-4 text-amber-400" />}
          />
          <StatCard
            label="Approved Clubs"
            value={stats.approved}
            description="Active in public directory"
            icon={<CheckCircle2 className="w-4 h-4 text-emerald-400" />}
          />
          <StatCard
            label="Rejected"
            value={stats.rejected}
            description="Declined submissions"
            icon={<XCircle className="w-4 h-4 text-red-400" />}
          />
          <StatCard
            label="Suspended"
            value={stats.suspended}
            description="Paused club operations"
            icon={<AlertTriangle className="w-4 h-4 text-zinc-400" />}
          />
        </div>
      </section>

      {/* 3. Main Operational Surface: Pending Organization Requests Queue */}
      <section aria-labelledby="pending-queue-heading" className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <h2 id="pending-queue-heading" className="font-heading text-base font-bold text-white">
              Pending Organization Applications
            </h2>
            <span className="text-[11px] font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-lg">
              {stats.pending} pending
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick search filter */}
            {pendingRequests.length > 0 && (
              <div className="relative w-full sm:w-56">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#656c80]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter pending..."
                  className="w-full pl-8 pr-7 py-1.5 bg-[#14161a] border border-[#242730] rounded-xl text-xs text-white placeholder-[#656c80] focus:outline-hidden focus:border-red-500 transition-colors"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[#656c80] hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
            <Link
              to="/admin/organization-requests"
              className="text-xs text-red-400 hover:underline font-semibold flex items-center gap-1 shrink-0"
            >
              <span>View all</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-[#242730] bg-[#14161a] p-12 text-center text-xs text-[#9da3b4] motion-safe:animate-pulse">
            Loading pending applications queue...
          </div>
        ) : filteredPending.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#242730] bg-[#14161a] p-8 sm:p-10 text-center space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#17191e] border border-[#272b35] text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="font-heading text-sm font-bold text-white">
                {searchQuery ? 'No matching pending requests' : 'All caught up!'}
              </h3>
              <p className="text-xs text-[#9da3b4] max-w-sm mx-auto">
                {searchQuery
                  ? `No pending submissions match "${searchQuery}".`
                  : 'No organization applications are currently awaiting administrative review.'}
              </p>
            </div>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="px-3.5 py-1.5 rounded-xl bg-[#191b20] hover:bg-[#1e222b] text-xs font-semibold text-white border border-[#2e3442] transition-colors"
              >
                Clear Filter
              </button>
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-[#242730] bg-[#14161a] overflow-hidden">
            {/* Mobile View (< 768px): Responsive Cards */}
            <div className="md:hidden divide-y divide-[#242730]">
              {filteredPending.map((org) => (
                <div key={org.id} className="p-4 space-y-3 hover:bg-[#17191e] transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h4 className="font-heading text-sm font-bold text-white truncate">
                        {org.name}
                      </h4>
                      {org.institution && (
                        <span className="flex items-center gap-1 text-[11px] text-[#9da3b4] mt-0.5">
                          <School className="w-3 h-3 text-zinc-500 shrink-0" />
                          <span className="truncate">{org.institution}</span>
                        </span>
                      )}
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 shrink-0">
                      Pending
                    </span>
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
                  {filteredPending.map((org) => (
                    <tr key={org.id} className="hover:bg-[#181a20] transition-colors">
                      <td className="p-4">
                        <div className="font-semibold text-white">{org.name}</div>
                        {org.description && (
                          <div className="text-[11px] text-[#9da3b4] line-clamp-1 max-w-xs">
                            {org.description}
                          </div>
                        )}
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
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                          Pending Review
                        </span>
                      </td>

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
      </section>
    </div>
  );
};
