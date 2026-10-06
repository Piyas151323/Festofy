import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Plus,
  RefreshCw,
  ExternalLink,
  School,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { getMyOrganizationRequests } from '../../services/organizationService';
import { Organization, OrganizationStatus } from '../../types';
import { formatDateTime } from '../../utils/dateUtils';

export const StudentOrgRequestsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [requests, setRequests] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  const fetchRequests = async () => {
    if (!currentUser?.uid) {
      setRequests([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await getMyOrganizationRequests(currentUser.uid);
      setRequests(data);
    } catch (err) {
      console.error('Failed to load organization requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [currentUser]);

  const filteredRequests = requests.filter((r) => {
    if (activeTab === 'all') return true;
    return r.status === activeTab;
  });

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
            <span>Not Approved</span>
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
          <div className="text-xs font-mono text-[#ff4f1a] uppercase tracking-wider mb-1">
            Student Operations
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-white">
            My Organization Requests
          </h1>
          <p className="text-xs text-[#9da3b4] mt-1">
            Track the status of your club organization applications and administrator reviews.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={fetchRequests}
            disabled={loading}
            aria-label="Refresh requests"
            className="p-2 rounded-xl bg-[#191b20] hover:bg-[#1e222b] border border-[#2e3442] text-zinc-300 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <Link
            to="/dashboard/organizations/apply"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#ff4f1a] hover:bg-[#ff6838] text-xs font-semibold text-white transition-colors shadow-md shadow-[#ff4f1a]/20"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Organization</span>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      {requests.length > 0 && (
        <div className="flex items-center gap-2 border-b border-[#242730] pb-2 text-xs">
          {(['all', 'pending', 'approved', 'rejected'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer capitalize ${
                activeTab === tab
                  ? 'bg-[#191b20] text-white font-semibold border border-[#2e3442]'
                  : 'text-[#9da3b4] hover:text-white'
              }`}
            >
              {tab === 'all' ? `All Requests (${requests.length})` : tab}
            </button>
          ))}
        </div>
      )}

      {/* Requests List */}
      {loading ? (
        <div className="rounded-2xl border border-[#242730] bg-[#14161a] p-12 text-center text-xs text-[#9da3b4] animate-pulse">
          Loading organization applications...
        </div>
      ) : requests.length === 0 ? (
        <div className="rounded-3xl border border-[#242730] bg-[#14161a] p-10 sm:p-14 text-center space-y-4 max-w-lg mx-auto my-6">
          <div className="w-14 h-14 rounded-2xl bg-[#191b20] border border-[#2e3442] text-zinc-500 flex items-center justify-center mx-auto">
            <Building2 className="w-7 h-7" />
          </div>
          <div className="space-y-1.5">
            <h2 className="font-heading text-lg font-bold text-white">No organization requests yet</h2>
            <p className="text-xs text-[#9da3b4] leading-relaxed max-w-sm mx-auto">
              Want to host collegiate tech festivals and manage student competitions? Submit your club application for administrative approval.
            </p>
          </div>
          <div className="pt-2">
            <Link
              to="/dashboard/organizations/apply"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#ff4f1a] hover:bg-[#ff6838] text-xs font-semibold text-white transition-colors shadow-lg shadow-[#ff4f1a]/20"
            >
              <Plus className="w-4 h-4" />
              <span>Create Organization</span>
            </Link>
          </div>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="p-8 rounded-2xl border border-[#242730] bg-[#14161a] text-center text-xs text-[#9da3b4]">
          No requests in <span className="font-semibold text-white capitalize">{activeTab}</span> status.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredRequests.map((req) => (
            <article
              key={req.id}
              className="p-5 rounded-2xl border border-[#242730] bg-[#14161a] hover:border-[#2e3442] transition-colors space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {req.logoUrl ? (
                      <img
                        src={req.logoUrl}
                        alt=""
                        className="w-10 h-10 rounded-xl object-cover bg-[#191b20] border border-[#2e3442] shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-[#191b20] border border-[#2e3442] text-[#ff4f1a] flex items-center justify-center font-bold text-base shrink-0">
                        {req.name?.[0]?.toUpperCase() || 'C'}
                      </div>
                    )}
                    <div className="min-w-0">
                      <h3 className="font-heading font-bold text-base text-white truncate">
                        {req.name}
                      </h3>
                      {req.institution && (
                        <div className="flex items-center gap-1 text-[11px] text-[#9da3b4] truncate mt-0.5">
                          <School className="w-3 h-3 shrink-0 text-[#ff4f1a]" />
                          <span>{req.institution}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>{getStatusBadge(req.status)}</div>
                </div>

                {req.description && (
                  <p className="text-xs text-[#9da3b4] line-clamp-2 leading-relaxed">
                    {req.description}
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-[#242730] flex items-center justify-between text-[11px] text-[#656c80]">
                <span>Submitted: {formatDateTime(req.requestedAt || req.createdAt)}</span>
                {req.status === 'pending' && (
                  <span className="text-amber-400 font-mono text-[10px]">Awaiting review</span>
                )}
                {req.status === 'approved' && (
                  <Link
                    to="/organizer"
                    className="inline-flex items-center gap-1 text-[#ff4f1a] hover:underline font-semibold"
                  >
                    <span>Organizer Console</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};
