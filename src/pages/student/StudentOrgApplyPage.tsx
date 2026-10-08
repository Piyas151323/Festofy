import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Building2,
  CheckCircle2,
  Clock,
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  FileText,
  School,
  Image,
  Sparkles,
  Info
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { createOrganizationRequest } from '../../services/organizationService';
import { Organization } from '../../types';
import { DirectImageUpload } from '../../components/common/DirectImageUpload';

export const StudentOrgApplyPage: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Form state
  const [name, setName] = useState('');
  const [institution, setInstitution] = useState('');
  const [description, setDescription] = useState('');
  const [logoUrl, setLogoUrl] = useState('');

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submittedOrg, setSubmittedOrg] = useState<Organization | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!currentUser?.uid) {
      setErrorMsg('You must be signed in to submit an organization application.');
      return;
    }

    const trimmedName = name.trim();
    if (!trimmedName || trimmedName.length < 2) {
      setErrorMsg('Organization name is required and must be at least 2 characters.');
      return;
    }

    if (trimmedName.length > 120) {
      setErrorMsg('Organization name must not exceed 120 characters.');
      return;
    }

    if (logoUrl.trim()) {
      const trimmedLogo = logoUrl.trim();
      if (!trimmedLogo.startsWith('http://') && !trimmedLogo.startsWith('https://')) {
        setErrorMsg('Logo URL must begin with http:// or https://');
        return;
      }
    }

    try {
      setIsSubmitting(true);
      const newOrg = await createOrganizationRequest(
        {
          name: trimmedName,
          institution: institution.trim() || undefined,
          description: description.trim() || undefined,
          logoUrl: logoUrl.trim() || undefined
        },
        currentUser.uid
      );

      setSubmittedOrg(newOrg);
    } catch (err: any) {
      console.warn('Notice submitting organization application:', err?.message || err);
      setErrorMsg(err.message || 'Unable to submit application. Please verify your details and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 1. Success Confirmation View
  if (submittedOrg) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6">
        <div className="rounded-3xl border border-[#242730] bg-[#14161a] p-6 sm:p-10 space-y-6 text-center shadow-2xl">
          {/* Header Icon */}
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
            <Clock className="w-8 h-8" />
          </div>

          <div className="space-y-2 max-w-md mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold font-mono uppercase tracking-wider">
              <span>Status: Pending Review</span>
            </div>
            <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-white">
              Organization Submitted
            </h1>
            <p className="text-xs sm:text-sm text-[#9da3b4] leading-relaxed">
              Your organization application for <span className="text-white font-semibold">{submittedOrg.name}</span> has been received and queued for review.
            </p>
          </div>

          {/* Details Card */}
          <div className="p-5 rounded-2xl bg-[#191b20] border border-[#2e3442] text-left space-y-3 max-w-lg mx-auto">
            <div className="flex items-center justify-between text-xs pb-2 border-b border-[#2e3442]">
              <span className="text-[#656c80] font-mono">Organization Name</span>
              <span className="font-semibold text-white truncate max-w-xs">{submittedOrg.name}</span>
            </div>

            {submittedOrg.institution && (
              <div className="flex items-center justify-between text-xs pb-2 border-b border-[#2e3442]">
                <span className="text-[#656c80] font-mono">Campus / Institution</span>
                <span className="text-[#d1d5db]">{submittedOrg.institution}</span>
              </div>
            )}

            <div className="flex items-center justify-between text-xs">
              <span className="text-[#656c80] font-mono">Application Status</span>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                Pending Approval
              </span>
            </div>
          </div>

          {/* Workflow Explanation */}
          <div className="p-4 rounded-2xl bg-[#121316] border border-[#242730] text-xs text-[#9da3b4] text-left space-y-2 max-w-lg mx-auto">
            <div className="flex items-center gap-2 text-white font-semibold">
              <Info className="w-4 h-4 text-[#ff4f1a] shrink-0" />
              <span>What happens next?</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Platform administrators review incoming club applications to verify student affiliation.
              Once approved, your account will be granted organizer permissions and you will be able to access the Organizer Console to manage festivals, publish schedules, and track registrations.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/dashboard/organizations"
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#ff4f1a] hover:bg-[#ff6838] text-xs font-semibold text-white transition-colors shadow-lg shadow-[#ff4f1a]/20 flex items-center justify-center gap-2"
            >
              <span>View My Requests</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            <Link
              to="/dashboard"
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#191b20] hover:bg-[#1e222b] border border-[#2e3442] text-xs font-semibold text-white transition-colors flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Dashboard</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 2. Organization Application Form
  return (
    <div className="max-w-2xl mx-auto py-6 sm:py-10 px-4 sm:px-6 space-y-6">
      {/* Breadcrumb Navigation */}
      <div>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#9da3b4] hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ff4f1a]/10 border border-[#ff4f1a]/20 text-[#ff4f1a] text-xs font-semibold font-mono">
          <Building2 className="w-3.5 h-3.5" />
          <span>Club Registration</span>
        </div>
        <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Start an Organization
        </h1>
        <p className="text-xs sm:text-sm text-[#9da3b4] leading-relaxed">
          Submit your college tech club, society, or festival committee for review. Once approved, you'll be able to publish festivals and organize competitions on Festofy.
        </p>
      </div>

      {/* Important Workflow Notice */}
      <div className="p-4 rounded-2xl bg-[#14161a] border border-[#242730] flex items-start gap-3 text-xs text-[#9da3b4]">
        <Info className="w-4 h-4 text-[#ff4f1a] shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-semibold text-white">Application & Review Process</div>
          <p className="text-[11px] leading-relaxed">
            Your account remains a student account while your application is under review. You can continue browsing events and participating in competitions without interruption.
          </p>
        </div>
      </div>

      {/* Error Notice */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-red-950/40 border border-red-900/50 flex items-center gap-3 text-xs text-red-200">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Form Container */}
      <div className="p-6 sm:p-8 rounded-3xl border border-[#242730] bg-[#14161a] shadow-xl">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Organization Name */}
          <div className="space-y-1.5">
            <label htmlFor="org-name" className="text-xs font-semibold text-white flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-[#ff4f1a]" />
              <span>Organization / Club Name <span className="text-[#ff4f1a]">*</span></span>
            </label>
            <input
              id="org-name"
              type="text"
              required
              maxLength={120}
              placeholder="e.g. Notre Dame College IT Club"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-[#191b20] border border-[#2e3442] text-xs text-white placeholder-[#656c80] focus:outline-none focus:border-[#ff4f1a]"
            />
            <p className="text-[11px] text-[#656c80]">
              The official name of your student club, society, or festival committee.
            </p>
          </div>

          {/* Institution / College Name */}
          <div className="space-y-1.5">
            <label htmlFor="org-institution" className="text-xs font-semibold text-white flex items-center gap-1.5">
              <School className="w-3.5 h-3.5 text-[#ff4f1a]" />
              <span>Institution or College Name (Optional)</span>
            </label>
            <input
              id="org-institution"
              type="text"
              maxLength={150}
              placeholder="e.g. Notre Dame College, Dhaka"
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-[#191b20] border border-[#2e3442] text-xs text-white placeholder-[#656c80] focus:outline-none focus:border-[#ff4f1a]"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label htmlFor="org-description" className="text-xs font-semibold text-white flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-[#ff4f1a]" />
              <span>About the Organization (Optional)</span>
            </label>
            <textarea
              id="org-description"
              rows={3}
              maxLength={2000}
              placeholder="Brief summary of your club's activities, history, and the events you plan to host..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-[#191b20] border border-[#2e3442] text-xs text-white placeholder-[#656c80] focus:outline-none focus:border-[#ff4f1a] resize-y"
            />
          </div>

          {/* Club Logo (Direct Upload, Presets, or Link) */}
          <DirectImageUpload
            value={logoUrl}
            onChange={setLogoUrl}
            label="Club / Organization Emblem or Logo"
            helperText="Direct image upload (PNG, JPG, SVG, WebP) or select an organization insignia"
            aspectRatio="logo"
          />

          {/* Form Actions */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[#242730]">
            <Link
              to="/dashboard/organizations"
              className="text-xs text-[#9da3b4] hover:text-white transition-colors"
            >
              View existing requests
            </Link>

            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#ff4f1a] hover:bg-[#ff6838] text-xs font-semibold text-white transition-colors shadow-lg shadow-[#ff4f1a]/20 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <span>{isSubmitting ? 'Submitting Application...' : 'Submit Organization'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
