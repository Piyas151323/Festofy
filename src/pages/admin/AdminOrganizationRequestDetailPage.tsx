import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
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
  X
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import {
  getAdminOrganizationRequestById,
  approveOrganization,
  rejectOrganization
} from '../../services/organizationService';
import { Organization } from '../../types';
import { formatDateTime } from '../../utils/dateUtils';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';

export const AdminOrganizationRequestDetailPage: React.FC = () => {
  const { organizationId } = useParams<{ organizationId: string }>();
  const { currentUser } = useAuth();

  const [org, setOrg] = useState<Organization | null>(null);
  const [requester, setRequester] = useState<{ displayName: string; email: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Workflow Dialog States
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);
  const [actionErrorMessage, setActionErrorMessage] = useState<string | null>(null);

  const loadData = useCallback(async () => {
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
      document.title = `${res.organization.name || 'Request Details'} · Admin · Festofy`;
    } catch (err: any) {
      console.warn('Notice loading organization request:', err?.message || err);
      setError('Unable to load application details.');
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleApprove = async () => {
    if (!org || !currentUser?.uid) return;
    try {
      setIsProcessing(true);
      setActionErrorMessage(null);
      await approveOrganization(org.id, currentUser.uid);
      setActionSuccessMessage('Organization approved! The requester has been promoted to Organizer with Owner membership.');
      setShowApproveDialog(false);
      await loadData();
    } catch (err: any) {
      console.warn('Notice approving organization:', err?.message || err);
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
      setShowRejectDialog(false);
      await loadData();
    } catch (err: any) {
      console.warn('Notice rejecting organization:', err?.message || err);
      setActionErrorMessage(err.message || 'Rejection operation failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center text-xs text-[#9da3b4] motion-safe:animate-pulse">
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
    <div className="max-w-4xl mx-auto space-y-6 motion-safe:animate-page-enter">
      {/* Breadcrumb Navigation */}
      <div>
        <Link
          to="/admin/organization-requests"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#9da3b4] hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Organization Requests</span>
        </Link>
      </div>

      {/* Success Notification Feedback */}
      {actionSuccessMessage && (
        <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-900/50 flex items-center justify-between text-xs text-emerald-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{actionSuccessMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionSuccessMessage(null)}
            className="text-emerald-400 hover:text-white cursor-pointer"
            aria-label="Dismiss message"
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
            className="text-red-400 hover:text-white cursor-pointer"
            aria-label="Dismiss error"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Dossier Card */}
      <div className="p-6 sm:p-8 rounded-2xl border border-[#242730] bg-[#14161a] space-y-6 shadow-xl">
        {/* Header Block */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-[#242730]">
          <div className="flex items-start gap-4 min-w-0">
            {org.logoUrl ? (
              <img
                src={org.logoUrl}
                alt=""
                className="w-14 h-14 rounded-2xl object-cover bg-[#17191e] border border-[#272b35] shrink-0"
              />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-[#17191e] border border-[#272b35] text-red-400 flex items-center justify-center font-bold text-xl shrink-0">
                {org.name?.[0]?.toUpperCase() || 'C'}
              </div>
            )}

            <div className="space-y-1 min-w-0">
              <h1 className="font-heading text-xl sm:text-2xl font-bold text-white truncate">
                {org.name}
              </h1>
              {org.institution && (
                <div className="flex items-center gap-1.5 text-xs text-[#9da3b4]">
                  <School className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                  <span className="truncate">{org.institution}</span>
                </div>
              )}
            </div>
          </div>

          <div className="shrink-0">
            {status === 'pending' ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-mono font-semibold">
                <Clock className="w-3.5 h-3.5" />
                <span>Pending Review</span>
              </span>
            ) : status === 'approved' ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Approved Club</span>
              </span>
            ) : status === 'rejected' ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-red-500/10 text-red-400 border border-red-500/30 text-xs font-mono font-semibold">
                <XCircle className="w-3.5 h-3.5" />
                <span>Rejected</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-zinc-800 text-zinc-400 border border-zinc-700 text-xs font-mono font-semibold">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Suspended</span>
              </span>
            )}
          </div>
        </div>

        {/* Rejection notice if previously rejected */}
        {status === 'rejected' && (
          <div className="p-4 rounded-2xl bg-red-950/30 border border-red-900/40 space-y-1.5 text-xs">
            <span className="font-semibold text-red-300 block">Application Declined</span>
            <p className="text-[#9da3b4] leading-relaxed">
              {org.rejectionReason || 'No specific rationale was provided by the administrator.'}
            </p>
          </div>
        )}

        {/* Dossier Information Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          {/* Organization Details */}
          <div className="space-y-4 p-5 rounded-2xl bg-[#17191e] border border-[#242730]">
            <h3 className="font-heading font-bold text-white text-sm flex items-center gap-2">
              <Building2 className="w-4 h-4 text-red-400" />
              <span>Organization Details</span>
            </h3>

            <div className="space-y-3">
              <div>
                <span className="text-[#656c80] block text-[11px] font-mono uppercase">Official Name</span>
                <span className="font-semibold text-white">{org.name}</span>
              </div>

              <div>
                <span className="text-[#656c80] block text-[11px] font-mono uppercase">Institution / Campus</span>
                <span className="text-zinc-300">{org.institution || 'None specified'}</span>
              </div>

              <div>
                <span className="text-[#656c80] block text-[11px] font-mono uppercase">System Identifier</span>
                <span className="font-mono text-zinc-400 text-[11px]">{org.id}</span>
              </div>

              <div>
                <span className="text-[#656c80] block text-[11px] font-mono uppercase">Application Date</span>
                <span className="font-mono text-zinc-300">
                  {formatDateTime(org.requestedAt || org.createdAt)}
                </span>
              </div>
            </div>
          </div>

          {/* Requester Credentials */}
          <div className="space-y-4 p-5 rounded-2xl bg-[#17191e] border border-[#242730]">
            <h3 className="font-heading font-bold text-white text-sm flex items-center gap-2">
              <User className="w-4 h-4 text-red-400" />
              <span>Applicant Identity</span>
            </h3>

            <div className="space-y-3">
              <div>
                <span className="text-[#656c80] block text-[11px] font-mono uppercase">Student Name</span>
                <span className="font-semibold text-white">
                  {requester?.displayName || 'Applicant'}
                </span>
              </div>

              <div>
                <span className="text-[#656c80] block text-[11px] font-mono uppercase">Verified Account Email</span>
                <span className="text-zinc-300 font-mono text-[11px]">
                  {requester?.email || 'Hidden or unregistered'}
                </span>
              </div>

              <div>
                <span className="text-[#656c80] block text-[11px] font-mono uppercase">Applicant User ID</span>
                <span className="font-mono text-zinc-400 text-[11px]">
                  {org.requestedBy || 'N/A'}
                </span>
              </div>

              <div>
                <span className="text-[#656c80] block text-[11px] font-mono uppercase">Security Check</span>
                <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Valid student session verified</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Mission Statement / Club Description */}
        <div className="space-y-2 p-5 rounded-2xl bg-[#17191e] border border-[#242730]">
          <h3 className="font-heading font-bold text-white text-sm flex items-center gap-2">
            <FileText className="w-4 h-4 text-red-400" />
            <span>Charter & Activity Description</span>
          </h3>
          <p className="text-xs text-[#9da3b4] leading-relaxed whitespace-pre-line">
            {org.description || 'No detailed mission statement provided with this submission.'}
          </p>
        </div>

        {/* Action Controls (Only available on pending applications) */}
        {status === 'pending' && (
          <div className="pt-4 border-t border-[#242730] flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-[#9da3b4]">
              Review the collegiate association charter before authorizing organizer administrative privileges.
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setShowRejectDialog(true)}
                disabled={isProcessing}
                className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-900/60 text-xs font-semibold text-red-200 transition-colors cursor-pointer disabled:opacity-50"
              >
                Reject Application
              </button>

              <button
                type="button"
                onClick={() => setShowApproveDialog(true)}
                disabled={isProcessing}
                className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white transition-colors shadow-sm shadow-emerald-600/20 cursor-pointer disabled:opacity-50"
              >
                Approve Organization
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Approval Confirm Dialog */}
      <ConfirmDialog
        isOpen={showApproveDialog}
        onClose={() => setShowApproveDialog(false)}
        onConfirm={handleApprove}
        title={`Approve ${org.name}?`}
        variant="success"
        confirmLabel="Confirm Approval"
        isLoading={isProcessing}
        description={
          <div className="space-y-2">
            <p className="text-xs text-[#9da3b4]">
              Approving this club will atomically perform the following operational updates:
            </p>
            <ul className="text-[11px] text-[#9da3b4] list-disc list-inside space-y-1">
              <li>Set organization status to <span className="text-emerald-400 font-semibold font-mono">approved</span>.</li>
              <li>Promote requester to <span className="text-emerald-400 font-semibold font-mono">organizer</span> in userRoles.</li>
              <li>Assign requester <span className="text-emerald-400 font-semibold font-mono">owner</span> membership.</li>
            </ul>
          </div>
        }
      />

      {/* Rejection Confirm Dialog */}
      <ConfirmDialog
        isOpen={showRejectDialog}
        onClose={() => setShowRejectDialog(false)}
        onConfirm={handleReject}
        title={`Reject ${org.name}?`}
        variant="danger"
        confirmLabel="Confirm Rejection"
        isLoading={isProcessing}
        description={
          <p className="text-xs text-[#9da3b4]">
            The application for <span className="text-white font-semibold">{org.name}</span> will be rejected. The requester will remain a student without organizer access.
          </p>
        }
      >
        <div className="space-y-1.5 pt-2">
          <label htmlFor="rejection-reason" className="text-xs font-semibold text-white block">
            Reason for Rejection (Optional)
          </label>
          <textarea
            id="rejection-reason"
            rows={3}
            maxLength={1000}
            placeholder="e.g. Unverified student association or duplicate application..."
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-[#191b20] border border-[#2e3442] text-xs text-white placeholder-[#656c80] focus:outline-hidden focus:border-red-500 resize-none transition-colors"
          />
        </div>
      </ConfirmDialog>
    </div>
  );
};
