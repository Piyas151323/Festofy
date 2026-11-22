import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Building2,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  School,
  Mail,
  Lock,
  User,
  AlertCircle,
  Clock
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { createOrganizationRequest, getMyOrganizationRequests } from '../../services/organizationService';
import { DirectImageUpload } from '../../components/common/DirectImageUpload';
import { EmailVerificationScreen } from '../../components/auth/EmailVerificationScreen';
import { AuthSyncErrorScreen } from '../../components/auth/AuthSyncErrorScreen';
import { Organization } from '../../types';

const ORG_DRAFT_STORAGE_KEY = 'festofy_organizer_apply_draft';

interface OrganizerDraft {
  name: string;
  institution: string;
  description: string;
  logoUrl: string;
  leadName: string;
  email: string;
}

function loadOrganizerDraft(): Partial<OrganizerDraft> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.sessionStorage.getItem(ORG_DRAFT_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

function saveOrganizerDraft(draft: OrganizerDraft) {
  if (typeof window === 'undefined') return;
  try {
    // Store non-sensitive application metadata only — never store passwords
    window.sessionStorage.setItem(ORG_DRAFT_STORAGE_KEY, JSON.stringify(draft));
  } catch {
    // Ignore storage quota errors
  }
}

function clearOrganizerDraft() {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.removeItem(ORG_DRAFT_STORAGE_KEY);
  } catch {
    // Ignore storage errors
  }
}

export const OrganizerJoinPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    currentUser,
    firebaseUser,
    isAuthenticated,
    needsEmailVerification,
    authError,
    loading: authLoading,
    role,
    signUpWithEmail,
    refreshUserRole
  } = useAuth();

  const initialDraft = loadOrganizerDraft();

  // Organization Form State (non-sensitive fields preserved across verification)
  const [name, setName] = useState(initialDraft.name || '');
  const [institution, setInstitution] = useState(initialDraft.institution || '');
  const [description, setDescription] = useState(initialDraft.description || '');
  const [logoUrl, setLogoUrl] = useState(initialDraft.logoUrl || '');

  // Account Form State (For unauthenticated applicants)
  const [leadName, setLeadName] = useState(initialDraft.leadName || '');
  const [email, setEmail] = useState(initialDraft.email || '');
  const [password, setPassword] = useState('');

  // UI State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [existingOrg, setExistingOrg] = useState<Organization | null>(null);
  const [loadingExisting, setLoadingExisting] = useState(false);

  useEffect(() => {
    document.title = needsEmailVerification
      ? 'Verify Organizer Email · Festofy'
      : 'Join Festofy as Organizer · Campus Event Operations';
  }, [needsEmailVerification]);

  // Persist non-sensitive form fields across email verification & page refreshes
  useEffect(() => {
    if (!name && !institution && !description && !logoUrl && !leadName && !email) return;
    saveOrganizerDraft({
      name,
      institution,
      description,
      logoUrl,
      leadName,
      email
    });
  }, [name, institution, description, logoUrl, leadName, email]);

  // Check existing requests only once user is authenticated and email-verified
  useEffect(() => {
    let mounted = true;
    async function checkExisting() {
      if (!isAuthenticated || !currentUser?.uid) {
        if (mounted) {
          setExistingOrg(null);
          setLoadingExisting(false);
        }
        return;
      }
      try {
        setLoadingExisting(true);
        const requests = await getMyOrganizationRequests(currentUser.uid);
        if (!mounted) return;
        const activeOrPending =
          requests.find((r) => r.status === 'approved') ||
          requests.find((r) => r.status === 'pending') ||
          requests[0] ||
          null;
        setExistingOrg(activeOrPending);
        if (activeOrPending && (activeOrPending.status === 'approved' || activeOrPending.status === 'pending')) {
          clearOrganizerDraft();
        }
      } catch (err) {
        console.warn('Notice checking existing requests:', err);
      } finally {
        if (mounted) setLoadingExisting(false);
      }
    }
    checkExisting();
    return () => {
      mounted = false;
    };
  }, [isAuthenticated, currentUser?.uid]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || loadingExisting) return;
    setErrorMsg(null);

    // 1. Validate Organization Data
    const trimmedName = name.trim();
    if (!trimmedName || trimmedName.length < 2) {
      setErrorMsg('Organization or club name is required (minimum 2 characters).');
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

    setIsSubmitting(true);

    try {
      // 2. If signed-out, use the shared email-verification signup flow and pause before any Firestore writes
      if (!firebaseUser) {
        const trimmedLeadName = leadName.trim();
        if (!trimmedLeadName || trimmedLeadName.length < 2) {
          throw new Error('Please enter the lead organizer or club president name.');
        }

        const trimmedEmail = email.trim();
        if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
          throw new Error('Please enter a valid organization or lead email address.');
        }

        if (password.length < 6) {
          throw new Error('Account password must be at least 6 characters.');
        }

        // Persist non-sensitive form fields only; clear password immediately
        saveOrganizerDraft({
          name: trimmedName,
          institution: institution.trim(),
          description: description.trim(),
          logoUrl: logoUrl.trim(),
          leadName: trimmedLeadName,
          email: trimmedEmail
        });
        const enteredPassword = password;
        setPassword('');

        await signUpWithEmail(trimmedEmail, enteredPassword, trimmedLeadName);
        setIsSubmitting(false);
        return;
      }

      if (!isAuthenticated || !currentUser) {
        throw new Error('Please verify your email address before submitting your application.');
      }

      // 3. Enforce single pending application per account
      const currentRequests = await getMyOrganizationRequests(currentUser.uid);
      const pendingExisting = currentRequests.find((req) => req.status === 'pending');
      if (pendingExisting) {
        setExistingOrg(pendingExisting);
        clearOrganizerDraft();
        throw new Error('You already have a pending application awaiting administrator review.');
      }
      const approvedExisting = currentRequests.find((req) => req.status === 'approved');
      if (approvedExisting) {
        setExistingOrg(approvedExisting);
        clearOrganizerDraft();
        throw new Error('Your account already manages an approved organization.');
      }

      // 4. Submit Organization Application to Firestore (user is verified & initialized)
      await createOrganizationRequest(
        {
          name: trimmedName,
          institution: institution.trim() || undefined,
          description: description.trim() || undefined,
          logoUrl: logoUrl.trim() || undefined
        },
        currentUser.uid
      );

      clearOrganizerDraft();
      await refreshUserRole().catch(() => {});
      navigate('/organizer/status', { replace: true });
    } catch (err: any) {
      console.warn('Notice submitting organizer registration:', err?.message || err);
      let msg = err?.message || 'Unable to submit organization application. Please try again.';
      if (msg.includes('auth/email-already-in-use')) {
        msg = 'An account with this email already exists. Please sign in to your account below to resume and submit this application.';
      } else if (msg.includes('already have a pending application')) {
        msg = 'You already have a pending application awaiting administrator review.';
      }
      setErrorMsg(msg);
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-8 h-8 rounded-full border-2 border-[#ff4f1a] border-t-transparent animate-spin" />
        <p className="text-xs text-[#9da3b4] font-mono">Preparing organizer onboarding...</p>
      </div>
    );
  }

  // Gate on email verification before any Firestore initialization or application submission
  if (needsEmailVerification) {
    return (
      <EmailVerificationScreen
        title="Verify Your Email to Resume Application"
        subtitle={
          name.trim()
            ? `Your club details for "${name.trim()}" are saved in this tab. Verify your email below to resume and submit your application.`
            : 'Verify your email address below before submitting your organization application.'
        }
      />
    );
  }

  if (authError) {
    return <AuthSyncErrorScreen error={authError} />;
  }

  // If user already has an approved organization
  if ((role === 'organizer' || existingOrg?.status === 'approved') && existingOrg) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 sm:px-6">
        <div className="rounded-3xl border border-[#242730] bg-[#14161a] p-8 text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h1 className="font-heading text-2xl font-bold text-white">
              Approved Organization Active
            </h1>
            <p className="text-sm text-[#9da3b4] max-w-md mx-auto">
              Your account is already authorized as an organizer for{' '}
              <span className="font-semibold text-white">{existingOrg.name}</span>. You can manage your festivals and events directly in the Organizer Console.
            </p>
          </div>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/organizer"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#ff4f1a] hover:bg-[#ff6838] text-white text-xs font-bold transition-colors shadow-lg shadow-[#ff4f1a]/20"
            >
              Open Organizer Console &rarr;
            </Link>
            <Link
              to="/organizer/fests/new"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#1e222b] hover:bg-[#252a34] text-white text-xs font-semibold border border-[#2e3442] transition-colors"
            >
              Create New Festival
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // If user already has a pending organization request
  if (existingOrg && existingOrg.status === 'pending') {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 sm:px-6">
        <div className="rounded-3xl border border-[#242730] bg-[#14161a] p-8 text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
            <Clock className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold font-mono uppercase tracking-wider">
              Pending Review
            </div>
            <h1 className="font-heading text-2xl font-bold text-white">
              Application Under Review
            </h1>
            <p className="text-sm text-[#9da3b4] max-w-md mx-auto">
              You have already submitted an organization application for{' '}
              <span className="font-semibold text-white">{existingOrg.name}</span>. Administrators are reviewing your club credentials.
            </p>
          </div>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/organizer/status"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#ff4f1a] hover:bg-[#ff6838] text-white text-xs font-bold transition-colors shadow-lg shadow-[#ff4f1a]/20"
            >
              Track Application Status & Onboarding &rarr;
            </Link>
            <Link
              to="/events"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#1e222b] hover:bg-[#252a34] text-white text-xs font-semibold border border-[#2e3442] transition-colors"
            >
              Explore Public Events
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 sm:py-12 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Page Hero Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#2e3442] bg-[#14161a] text-xs font-semibold text-[#ff4f1a] uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" /> Direct Organizer Onboarding
        </div>
        <h1 className="font-heading text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Join Festofy as Organizer
        </h1>
        <p className="text-sm sm:text-base text-[#9da3b4] max-w-2xl mx-auto leading-relaxed">
          Launch your campus festivals, manage multi-category competitions, and issue digital participant passes. Verify your email once, then submit your club charter for admin approval.
        </p>
      </div>

      {/* Feature Highlights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl border border-[#242730] bg-[#121418] space-y-2">
          <div className="w-8 h-8 rounded-lg bg-[#ff4f1a]/10 text-[#ff4f1a] flex items-center justify-center">
            <Building2 className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-semibold text-white">Dedicated Operations Hub</h3>
          <p className="text-xs text-[#9da3b4] leading-relaxed">
            Manage full festival schedules, venues, rules, eligibility categories, and team registrations in a dedicated console.
          </p>
        </div>

        <div className="p-4 rounded-2xl border border-[#242730] bg-[#121418] space-y-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-semibold text-white">Verified Club Branding</h3>
          <p className="text-xs text-[#9da3b4] leading-relaxed">
            Host verified festivals backed by institutional affiliations, official club badges, and secure participant check-ins.
          </p>
        </div>

        <div className="p-4 rounded-2xl border border-[#242730] bg-[#121418] space-y-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-semibold text-white">Live Status Tracking</h3>
          <p className="text-xs text-[#9da3b4] leading-relaxed">
            Track administrator review progress in real time with immediate onboarding checklists and festival planning kits.
          </p>
        </div>
      </div>

      {/* Main Application Form */}
      <form onSubmit={handleSubmit} className="rounded-3xl border border-[#242730] bg-[#14161a] p-6 sm:p-10 space-y-8 shadow-2xl">
        {errorMsg && (
          <div className="p-4 rounded-2xl border border-red-500/30 bg-red-500/10 flex items-start gap-3 text-red-300 text-xs sm:text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-400" />
            <div className="space-y-1">
              <p className="font-semibold">Unable to process application</p>
              <p className="text-red-300/90">{errorMsg}</p>
            </div>
          </div>
        )}

        {/* Section 1: Organization Information */}
        <div className="space-y-4">
          <div className="border-b border-[#242730] pb-3">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#ff4f1a]" />
              1. Organization & Club Information
            </h2>
            <p className="text-xs text-[#9da3b4] mt-0.5">
              Provide official club details for public festival listings and administrator verification.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-semibold text-white">
                Organization / Club Name <span className="text-[#ff4f1a]">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. DRMC IT Club, BUET Robotics Society, NSU ACM Chapter"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#2e3442] bg-[#0e1013] text-sm text-white placeholder-[#656c80] focus:outline-none focus:border-[#ff4f1a]"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-semibold text-white">
                Academic Institution / Host Organization
              </label>
              <div className="relative">
                <School className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#656c80]" />
                <input
                  type="text"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  placeholder="e.g. Dhaka Residential Model College, Dhaka, Bangladesh"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#2e3442] bg-[#0e1013] text-sm text-white placeholder-[#656c80] focus:outline-none focus:border-[#ff4f1a]"
                />
              </div>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-semibold text-white">
                Club Mission & Festival Focus
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what kinds of events your club hosts (e.g. annual national science carnivals, programming contests, robotics battles, design sprints)..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#2e3442] bg-[#0e1013] text-sm text-white placeholder-[#656c80] focus:outline-none focus:border-[#ff4f1a]"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-semibold text-white">
                Organization Logo
              </label>
              <DirectImageUpload
                value={logoUrl}
                onChange={setLogoUrl}
                aspectRatio="logo"
                label="Club Logo"
                helperText="Upload official club emblem or paste direct image URL"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Lead Organizer Account */}
        <div className="space-y-4">
          <div className="border-b border-[#242730] pb-3">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <User className="w-5 h-5 text-[#ff4f1a]" />
              2. Organizer Account & Credentials
            </h2>
            <p className="text-xs text-[#9da3b4] mt-0.5">
              {isAuthenticated && currentUser
                ? `Verified account ready: ${currentUser.displayName} (${currentUser.email})`
                : 'Create your account and verify your email address before submitting your club application.'}
            </p>
          </div>

          {isAuthenticated && currentUser ? (
            <div className="p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold shrink-0">
                  {currentUser.displayName?.[0] || 'O'}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-white truncate">{currentUser.displayName}</p>
                  <p className="text-xs text-[#9da3b4] truncate">{currentUser.email}</p>
                </div>
              </div>
              <span className="text-[11px] font-mono font-semibold px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shrink-0">
                Verified · Ready to submit
              </span>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-semibold text-white">
                  Lead Organizer / President Name <span className="text-[#ff4f1a]">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#656c80]" />
                  <input
                    type="text"
                    required
                    value={leadName}
                    onChange={(e) => setLeadName(e.target.value)}
                    placeholder="e.g. Club President Full Name"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#2e3442] bg-[#0e1013] text-sm text-white placeholder-[#656c80] focus:outline-none focus:border-[#ff4f1a]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-white">
                  Organization / Lead Email <span className="text-[#ff4f1a]">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#656c80]" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="club@institution.edu or organizer email"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#2e3442] bg-[#0e1013] text-sm text-white placeholder-[#656c80] focus:outline-none focus:border-[#ff4f1a]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-white">
                  Password <span className="text-[#ff4f1a]">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#656c80]" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#2e3442] bg-[#0e1013] text-sm text-white placeholder-[#656c80] focus:outline-none focus:border-[#ff4f1a]"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Submit Action */}
        <div className="pt-2 border-t border-[#242730] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-[#9da3b4] text-center sm:text-left">
            Already registered?{' '}
            <Link
              to={`/organizer/login?redirect=${encodeURIComponent('/organizer/apply')}`}
              className="text-[#ff4f1a] hover:text-[#ff6838] font-semibold transition-colors"
            >
              Sign In to Resume &rarr;
            </Link>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || loadingExisting}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#ff4f1a] hover:bg-[#ff6838] disabled:opacity-50 text-white text-sm font-bold transition-all shadow-lg shadow-[#ff4f1a]/20 cursor-pointer flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>{firebaseUser ? 'Submitting Application...' : 'Creating Account...'}</span>
              </>
            ) : loadingExisting ? (
              <span>Checking existing applications...</span>
            ) : firebaseUser ? (
              <>
                <span>Submit Organization Application</span>
                <ArrowRight className="w-4 h-4" />
              </>
            ) : (
              <>
                <span>Continue & Verify Email</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
