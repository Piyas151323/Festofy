import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  User,
  Mail,
  School,
  FileText,
  Calendar,
  AlertCircle,
  ShieldCheck,
  Check,
  X,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import {
  getAdminOrganizationRequestById,
  approveOrganization,
  rejectOrganization
} from '../../services/organizationService';
import { Organization, OrganizationStatus } from '../../types';
import { formatDateTime } from '../../utils/dateUtils';

export const AdminOrganizationRequestDetailPage: React.FC = () => {
  const { organizationId } = useParams<{ organizationId: string }>();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [org, setOrg] = useState<Organization | null>(null);
  const [requester, setRequester] = useState<{ displayName: string; email: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Workflow Modal States
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);
  const [actionErrorMessage, setActionErrorMessage] = useState<string | null>(null);

  const loadData = async () => {
    if (!organizationId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await getAdminOrganizationRequestById(organizationId);
      if (!res) {
        setError('Organization request not found.');
        return;
      }
      setOrg(res.organization);
      setRequester(res.requesterProfile || null);
    } catch (err: any) {
      console.error('Failed to load organization request:', err);
      setError('Unable to load application details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [organizationId]);

  const handleApprove = async () => {
    if (!org || !currentUser?.uid) return;
    try {
      setIsProcessing(true);
      setActionErrorMessage(null);
      await approveOrganization(org.id, currentUser.uid);
      setActionSuccessMessage('Organization approved! The requester has been promoted to Organizer with Owner membership.');
      setShowApproveModal(false);
      await loadData();
    } catch (err: any) {
      console.error('Approval failed:', err);
      setActionErrorMessage(err.message || 'Approval operation failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!org || !currentUser?.uid) return;
    try {
      setIsProcessing(true);
      setActionErrorMessage(null);
      await rejectOrganization(org.id, currentUser.uid, rejectionReason);
      setActionSuccessMessage('Application rejected. The requester remains a student.');
      setShowRejectModal(false);
      await loadData();
    } catch (err: any) {
      console.error('Rejection failed:', err);
      setActionErrorMessage(err.message || 'Rejection operation failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center text-xs text-[#9da3b4] animate-pulse">
        Loading organization application dossier...
      </div>
    );
  }

  if (error || !org) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center space-y-4">
        <div className="p-6 rounded-2xl border border-[#242730] bg-[#14161a] space-y-3">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto" />
          <h2 className="font-heading text-lg font-bold text-white">Application Not Found</h2>
          <p className="text-xs text-[#9da3b4]">{error || 'The requested organization could not be located.'}</p>
          <div className="pt-2">
            <Link
              to="/admin/organization-requests"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#17191e] border border-[#272b35] text-xs font-semibold text-white"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Requests</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const status = org.status || 'approved';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div>
        <Link
          to="/admin/organization-requests"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#9da3b4] hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Organization Requests</span>
        </Link>
      </div>

      {/* Success Notification */}
      {actionSuccessMessage && (
        <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-900/50 flex items-center justify-between text-xs text-emerald-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{actionSuccessMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionSuccessMessage(null)}
            className="text-emerald-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Action Error Notification */}
      {actionErrorMessage && (
        <div className="p-4 rounded-2xl bg-red-950/40 border border-red-900/50 flex items-center justify-between text-xs text-red-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{actionErrorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionErrorMessage(null)}
            className="text-red-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Dossier Card */}
      <div className="p-6 sm:p-8 rounded-3xl border border-[#242730] bg-[#14161a] space-y-6 shadow-xl">
        {/* Header Block */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-[#242730]">
          <div className="flex items-start gap-4">
            {org.logoUrl ? (
              <img
                src={org.logoUrl}
                alt=""
                className="w-16 h-16 rounded-2xl object-cover bg-[#17191e] border border-[#272b35] shrink-0"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-[#17191e] border border-[#272b35] text-red-400 flex items-center justify-center font-bold text-2xl shrink-0">
                {org.name?.[0]?.toUpperCase() || 'C'}
              </div>
            )}
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-heading text-xl sm:text-2xl font-extrabold text-white">
                  {org.name}
                </h1>
                {status === 'pending' && (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                    Pending Review
                  </span>
                )}
                {status === 'approved' && (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    Approved
                  </span>
                )}
                {status === 'rejected' && (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-red-500/15 text-red-400 border border-red-500/30">
                    Rejected
                  </span>
                )}
                {status === 'suspended' && (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-zinc-800 text-zinc-400 border border-zinc-700">
                    Suspended
                  </span>
                )}
              </div>

              {org.institution && (
                <div className="flex items-center gap-1.5 text-xs text-[#9da3b4]">
                  <School className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  <span>{org.institution}</span>
                </div>
              )}

              <div className="text-[11px] text-[#656c80] font-mono">
                Organization ID: <span className="text-zinc-300">{org.id}</span>
              </div>
            </div>
          </div>

          {/* Top Status Badge / Timestamp */}
          <div className="text-left sm:text-right text-xs text-[#656c80] space-y-1 shrink-0">
            <div>Submitted: {formatDateTime(org.requestedAt || org.createdAt)}</div>
            <div>Updated: {formatDateTime(org.updatedAt)}</div>
          </div>
        </div>

        {/* Rejection Note if rejected */}
        {status === 'rejected' && org.rejectionReason && (
          <div className="p-4 rounded-2xl bg-red-950/30 border border-red-900/50 space-y-1">
            <div className="text-xs font-semibold text-red-300 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <span>Administrative Rejection Reason:</span>
            </div>
            <p className="text-xs text-red-200 pl-5 leading-relaxed">{org.rejectionReason}</p>
          </div>
        )}

        {/* 2-Column Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column: Organization Profile */}
          <div className="space-y-4">
            <h2 className="text-xs font-semibold text-red-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" />
              <span>Organization Details</span>
            </h2>

            <div className="p-4 rounded-2xl bg-[#17191e] border border-[#272b35] space-y-3 text-xs">
              <div>
                <span className="text-[#656c80] block text-[11px]">Description</span>
                <p className="text-zinc-200 mt-0.5 leading-relaxed">
                  {org.description || 'No description provided by applicant.'}
                </p>
              </div>

              {org.logoUrl && (
                <div className="pt-2 border-t border-[#272b35]">
                  <span className="text-[#656c80] block text-[11px]">Logo Asset</span>
                  <a
                    href={org.logoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-red-400 hover:underline flex items-center gap-1 mt-0.5 truncate"
                  >
                    <span>View original logo asset</span>
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Requester Information */}
          <div className="space-y-4">
            <h2 className="text-xs font-semibold text-red-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              <span>Applicant Dossier</span>
            </h2>

            <div className="p-4 rounded-2xl bg-[#17191e] border border-[#272b35] space-y-3 text-xs">
              <div>
                <span className="text-[#656c80] block text-[11px]">Applicant Name</span>
                <span className="font-semibold text-white">
                  {requester?.displayName || 'Student Applicant'}
                </span>
              </div>

              <div>
                <span className="text-[#656c80] block text-[11px]">Contact Email</span>
                <span className="text-zinc-300 font-mono">
                  {requester?.email || 'Registered student email'}
                </span>
              </div>

              <div className="pt-2 border-t border-[#272b35]">
                <span className="text-[#656c80] block text-[11px]">Firebase User UID</span>
                <span className="text-zinc-400 font-mono text-[11px] break-all">
                  {org.requestedBy || 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Administrative Action Bar */}
        <div className="pt-6 border-t border-[#242730] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-[#9da3b4]">
            {status === 'pending' ? (
              <span>Reviewing this application authorizes the requester to publish events.</span>
            ) : status === 'approved' ? (
              <span className="text-emerald-400 font-medium flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Club verified and registered with owner privileges.</span>
              </span>
            ) : (
              <span className="text-red-400 font-medium flex items-center gap-1.5">
                <XCircle className="w-4 h-4" />
                <span>Application is concluded in rejected status.</span>
              </span>
            )}
          </div>

          {/* Action Buttons for Pending */}
          {status === 'pending' && (
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setShowRejectModal(true)}
                disabled={isProcessing}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-900/60 text-xs font-semibold text-red-200 transition-colors cursor-pointer disabled:opacity-50"
              >
                Reject Application
              </button>

              <button
                type="button"
                onClick={() => setShowApproveModal(true)}
                disabled={isProcessing}
                className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white transition-colors shadow-md shadow-emerald-600/20 cursor-pointer disabled:opacity-50"
              >
                Approve Organization
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Approve Confirmation */}
      {showApproveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="max-w-md w-full p-6 rounded-3xl border border-[#242730] bg-[#14161a] space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Check className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="font-heading text-lg font-bold text-white">
                Approve {org.name}?
              </h3>
              <p className="text-xs text-[#9da3b4] leading-relaxed">
                Approving this club will atomically perform three operations:
              </p>
              <ul className="text-[11px] text-[#9da3b4] list-disc list-inside space-y-1 pt-1">
                <li>Set organization status to <span className="text-emerald-400 font-semibold font-mono">approved</span>.</li>
                <li>Promote requester to <span className="text-emerald-400 font-semibold font-mono">organizer</span> in userRoles.</li>
                <li>Assign requester <span className="text-emerald-400 font-semibold font-mono">owner</span> in organizationMembers.</li>
              </ul>
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowApproveModal(false)}
                disabled={isProcessing}
                className="px-4 py-2 rounded-xl bg-[#17191e] border border-[#272b35] text-xs font-semibold text-zinc-300 hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleApprove}
                disabled={isProcessing}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white transition-colors shadow-md shadow-emerald-600/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <span>{isProcessing ? 'Processing Approval...' : 'Confirm Approval'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Reject Confirmation */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="max-w-md w-full p-6 rounded-3xl border border-[#242730] bg-[#14161a] space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center">
              <X className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="font-heading text-lg font-bold text-white">
                Reject Application?
              </h3>
              <p className="text-xs text-[#9da3b4] leading-relaxed">
                The application for <span className="text-white font-semibold">{org.name}</span> will be rejected. The requester will remain a student and will not receive organizer access.
              </p>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="rejection-reason" className="text-xs font-semibold text-white">
                Reason for Rejection (Optional)
              </label>
              <textarea
                id="rejection-reason"
                rows={3}
                maxLength={1000}
                placeholder="e.g. Unverified student association or duplicate application..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#191b20] border border-[#2e3442] text-xs text-white placeholder-[#656c80] focus:outline-none focus:border-red-500 resize-none"
              />
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                disabled={isProcessing}
                className="px-4 py-2 rounded-xl bg-[#17191e] border border-[#272b35] text-xs font-semibold text-zinc-300 hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleReject}
                disabled={isProcessing}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-semibold text-white transition-colors shadow-md shadow-red-600/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <span>{isProcessing ? 'Rejecting...' : 'Confirm Rejection'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
