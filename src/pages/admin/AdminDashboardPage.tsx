import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldAlert,
  ShieldCheck,
  Building2,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Inbox,
  School,
  ExternalLink
} from 'lucide-react';
import {
  getAdminOrganizationStats,
  getAdminOrganizationRequests
} from '../../services/organizationService';
import { Organization } from '../../types';
import { formatDateTime } from '../../utils/dateUtils';
import { PageHeader } from '../../components/common/PageHeader';

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

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [statsData, pendingData] = await Promise.all([
        getAdminOrganizationStats(),
        getAdminOrganizationRequests('pending')
      ]);
      setStats(statsData);
      setPendingRequests(pendingData.slice(0, 5));
    } catch (err: any) {
      console.warn('Notice loading admin dashboard data:', err?.message || err);
      setError('Unable to load administrative overview. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <PageHeader
        title="Admin Dashboard"
        description="Platform-level governance for student club verifications, organizer authorizations, and festival networks."
        actions={
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={loadData}
              disabled={loading}
              aria-label="Refresh overview"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#17191e] hover:bg-[#1f2229] border border-[#272b35] text-xs font-semibold text-zinc-300 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            <Link
              to="/admin/organization-requests"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-semibold text-white transition-colors shadow-md shadow-red-600/20"
            >
              <Inbox className="w-3.5 h-3.5" />
              <span>Review Requests ({stats.pending})</span>
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

      {/* Statistics Cards */}
      <section aria-label="Organization Telemetry">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Pending Requests */}
          <div className="p-5 rounded-2xl border border-amber-500/20 bg-[#14161a] space-y-2 flex flex-col justify-between">
            <div className="flex justify-between items-center text-xs text-[#656c80]">
              <span className="font-mono uppercase tracking-wider text-[11px] font-semibold text-amber-400">
                Pending Requests
              </span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <div className="font-heading text-2xl sm:text-3xl font-extrabold text-amber-400">
                {stats.pending}
              </div>
              <p className="text-[11px] text-[#9da3b4] mt-0.5">
                Awaiting administrative review
              </p>
            </div>
          </div>

          {/* Approved Organizations */}
          <div className="p-5 rounded-2xl border border-emerald-500/20 bg-[#14161a] space-y-2 flex flex-col justify-between">
            <div className="flex justify-between items-center text-xs text-[#656c80]">
              <span className="font-mono uppercase tracking-wider text-[11px] font-semibold text-emerald-400">
                Approved Clubs
              </span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <div className="font-heading text-2xl sm:text-3xl font-extrabold text-emerald-400">
                {stats.approved}
              </div>
              <p className="text-[11px] text-[#9da3b4] mt-0.5">
                Active in public directory
              </p>
            </div>
          </div>

          {/* Rejected Applications */}
          <div className="p-5 rounded-2xl border border-red-500/20 bg-[#14161a] space-y-2 flex flex-col justify-between">
            <div className="flex justify-between items-center text-xs text-[#656c80]">
              <span className="font-mono uppercase tracking-wider text-[11px] font-semibold text-red-400">
                Rejected
              </span>
              <XCircle className="w-4 h-4 text-red-400" />
            </div>
            <div>
              <div className="font-heading text-2xl sm:text-3xl font-extrabold text-red-400">
                {stats.rejected}
              </div>
              <p className="text-[11px] text-[#9da3b4] mt-0.5">
                Declined club applications
              </p>
            </div>
          </div>

          {/* Suspended Clubs */}
          <div className="p-5 rounded-2xl border border-[#242730] bg-[#14161a] space-y-2 flex flex-col justify-between">
            <div className="flex justify-between items-center text-xs text-[#656c80]">
              <span className="font-mono uppercase tracking-wider text-[11px] font-semibold text-zinc-400">
                Suspended
              </span>
              <AlertTriangle className="w-4 h-4 text-zinc-400" />
            </div>
            <div>
              <div className="font-heading text-2xl sm:text-3xl font-extrabold text-zinc-300">
                {stats.suspended}
              </div>
              <p className="text-[11px] text-[#9da3b4] mt-0.5">
                Paused club operations
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pending Requests Queue Preview */}
      <section aria-labelledby="pending-queue-heading" className="space-y-4">
        <div className="flex items-center justify-between pb-1">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <h2 id="pending-queue-heading" className="font-heading text-base font-bold text-white">
              Pending Organization Applications
            </h2>
          </div>
          <Link
            to="/admin/organization-requests"
            className="text-xs text-red-400 hover:underline font-semibold flex items-center gap-1"
          >
            <span>View all ({stats.pending})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-[#242730] bg-[#14161a] p-12 text-center text-xs text-[#9da3b4] animate-pulse">
            Loading pending applications queue...
          </div>
        ) : pendingRequests.length === 0 ? (
          <div className="rounded-2xl border border-[#242730] bg-[#14161a] p-10 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#17191e] border border-[#272b35] text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-heading text-base font-bold text-white">All caught up!</h3>
              <p className="text-xs text-[#9da3b4] max-w-sm mx-auto">
                No pending organization applications currently require administrative verification.
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
                  {pendingRequests.map((org) => (
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
      </section>
    </div>
  );
};
