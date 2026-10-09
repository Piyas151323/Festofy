import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Building2,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  School,
  FileText,
  Mail,
  Lock,
  User,
  AlertCircle,
  HelpCircle,
  Clock,
  Compass
} from 'lucide-react';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase/config';
import { useAuth } from '../../hooks/useAuth';
import { createOrganizationRequest, getMyOrganizationRequests } from '../../services/organizationService';
import { DirectImageUpload } from '../../components/common/DirectImageUpload';
import { Organization } from '../../types';

export const OrganizerJoinPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, isAuthenticated, role, refreshUserRole } = useAuth();

  // Organization Form State
  const [name, setName] = useState('');
  const [institution, setInstitution] = useState('');
  const [description, setDescription] = useState('');
  const [logoUrl, setLogoUrl] = useState('');

  // Account Form State (For unauthenticated users)
  const [leadName, setLeadName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // UI State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [existingOrg, setExistingOrg] = useState<Organization | null>(null);
  const [loadingExisting, setLoadingExisting] = useState(false);

  useEffect(() => {
    document.title = 'Join Festofy as Organizer · Campus Event Operations';
  }, []);

  // If already authenticated, check if user already has an active or pending request
  useEffect(() => {
    let mounted = true;
    async function checkExisting() {
      if (!currentUser?.uid) return;
      try {
        setLoadingExisting(true);
        const requests = await getMyOrganizationRequests(currentUser.uid);
        if (mounted && requests.length > 0) {
          setExistingOrg(requests[0]);
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
  }, [currentUser?.uid]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      let activeUserId: string;

      if (!isAuthenticated || !currentUser) {
        // Unauthenticated direct organizer application:
        // Validate organizer account credentials
        const trimmedLeadName = leadName.trim();
        if (!trimmedLeadName || trimmedLeadName.length < 2) {
          throw new Error('Please enter the lead organizer or club president name.');
        }

        const trimmedEmail = email.trim();
        if (!trimmedEmail || !trimmedEmail.includes('@')) {
          throw new Error('Please enter a valid organization or lead email address.');
        }

        if (password.length < 6) {
          throw new Error('Account password must be at least 6 characters.');
        }

        // 1. Create Firebase Auth user directly
        const cred = await createUserWithEmailAndPassword(auth, trimmedEmail, password);
        activeUserId = cred.user.uid;

        // 2. Set Firebase Auth display name
        await updateProfile(cred.user, { displayName: trimmedLeadName }).catch(() => {});

        // 3. Initialize user document & userRoles document conforming to rules
        const now = new Date().toISOString();
        const userRef = doc(db, 'users', activeUserId);
        const roleRef = doc(db, 'userRoles', activeUserId);

        await Promise.all([
          setDoc(userRef, {
            displayName: trimmedLeadName,
            email: trimmedEmail,
            photoURL: '',
            createdAt: now,
            updatedAt: now
          }),
          setDoc(roleRef, {
            role: 'student',
            createdAt: now,
            updatedAt: now
          })
        ]);
      } else {
        activeUserId = currentUser.uid;
      }

      // 4. Submit Organization Application to Firestore
      await createOrganizationRequest(
        {
          name: trimmedName,
          institution: institution.trim() || undefined,
          description: description.trim() || undefined,
          logoUrl: logoUrl.trim() || undefined
        },
        activeUserId
      );

      // Refresh auth role state to detect pending org
      await refreshUserRole().catch(() => {});

      // 5. Navigate directly to Organizer Application Status Tracker
      navigate('/organizer/status', { replace: true });
    } catch (err: any) {
      console.warn('Notice submitting organizer registration:', err?.message || err);
      let msg = err?.message || 'Unable to submit organization application. Please try again.';
      if (msg.includes('auth/email-already-in-use')) {
        msg = 'An account with this email already exists. Please sign in to your organizer account below.';
      } else if (msg.includes('already have a pending application')) {
        msg = 'You already have a pending application for this club awaiting administrator review.';
      }
      setErrorMsg(msg);
      setIsSubmitting(false);
    }
  };

  // If user already has an approved organization
  if (role === 'organizer' && existingOrg && existingOrg.status === 'approved') {
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
          Launch your campus festivals, manage multi-category competitions, and issue digital participant passes. No student account required.
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
                ? `Applying with your authenticated account: ${currentUser.displayName} (${currentUser.email})`
                : 'Create your organizer credentials. You will use these to log directly into the Organizer Console.'}
            </p>
          </div>

          {isAuthenticated && currentUser ? (
            <div className="p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
                  {currentUser.displayName?.[0] || 'O'}
                </div>
                <div>
                  <p className="text-sm font-bold text-white">{currentUser.displayName}</p>
                  <p className="text-xs text-[#9da3b4]">{currentUser.email}</p>
                </div>
              </div>
              <span className="text-[11px] font-mono font-semibold px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                Ready to submit
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
                    placeholder="e.g. Tanvir Ahmed (Club President)"
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
            <Link to="/organizer/login" className="text-[#ff4f1a] hover:text-[#ff6838] font-semibold transition-colors">
              Organizer Console Sign In &rarr;
            </Link>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#ff4f1a] hover:bg-[#ff6838] disabled:opacity-50 text-white text-sm font-bold transition-all shadow-lg shadow-[#ff4f1a]/20 cursor-pointer flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Submitting Application...</span>
              </>
            ) : (
              <>
                <span>Submit Organization Application</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
