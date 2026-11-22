import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  ShieldCheck,
  Lock,
  Mail,
  User,
  ArrowLeft,
  ArrowRight,
  Copy,
  Check,
  AlertCircle,
  CheckCircle2,
  UserPlus,
  LogIn
} from 'lucide-react';
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  getIdToken,
  reload,
  signOut
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../../lib/firebase/config';
import { useAuth } from '../../hooks/useAuth';
import { sanitizeInternalRedirect } from '../../utils/authUtils';
import { EmailVerificationScreen } from '../../components/auth/EmailVerificationScreen';
import { AuthSyncErrorScreen } from '../../components/auth/AuthSyncErrorScreen';

interface AdminLoginPageProps {
  redirectPath?: string;
}

interface PendingPromotionState {
  email: string;
  uid: string;
  method: 'email' | 'google';
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({ redirectPath }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    isAuthenticated,
    needsEmailVerification,
    authError,
    role,
    currentUser,
    loading: authLoading,
    signUpWithEmail,
    signOutUser
  } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [pendingPromotion, setPendingPromotion] = useState<PendingPromotionState | null>(null);
  const [copiedUid, setCopiedUid] = useState(false);

  const queryRedirect = new URLSearchParams(location.search).get('redirect');
  const targetDestination = sanitizeInternalRedirect(
    redirectPath || queryRedirect || (location.state as any)?.from,
    '/admin'
  );

  // If verified & authoritative Firestore role === 'admin', redirect to target admin destination
  React.useEffect(() => {
    document.title = needsEmailVerification
      ? 'Verify Admin Email · Festofy'
      : mode === 'signup'
        ? 'Admin Sign Up · Festofy'
        : 'Admin Sign In · Festofy';
    if (!authLoading && isAuthenticated && !needsEmailVerification && !authError && role === 'admin') {
      navigate(targetDestination, { replace: true });
    }
  }, [
    isAuthenticated,
    authLoading,
    needsEmailVerification,
    authError,
    role,
    navigate,
    targetDestination,
    mode
  ]);

  const switchMode = (nextMode: 'signin' | 'signup') => {
    setMode(nextMode);
    setErrorMsg(null);
    setPendingPromotion(null);
    setPassword('');
    setConfirmPassword('');
  };

  const handleCopyPendingEmail = (value: string) => {
    navigator.clipboard.writeText(value);
    setCopiedUid(true);
    setTimeout(() => setCopiedUid(false), 2000);
  };

  /**
   * Authoritative Firestore role verification — runs strictly AFTER email verification.
   */
  const verifyAdminRoleOrSignOut = async (uid: string): Promise<boolean> => {
    const roleRef = doc(db, 'userRoles', uid);
    const roleSnap = await getDoc(roleRef);
    if (!roleSnap.exists() || roleSnap.data()?.role !== 'admin') {
      return false;
    }
    return true;
  };

  const handleGoogleAdminAuth = async () => {
    setErrorMsg(null);
    setPendingPromotion(null);
    setLoading(true);
    try {
      const cred = await signInWithPopup(auth, googleProvider);

      // Verification gate: do not query userRoles or grant admin access until emailVerified === true
      if (!cred.user.emailVerified) {
        return;
      }

      await getIdToken(cred.user, true);
      const uid = cred.user.uid;
      const isAdmin = await verifyAdminRoleOrSignOut(uid);

      if (isAdmin) {
        navigate(targetDestination, { replace: true });
        return;
      }

      if (mode === 'signup') {
        const userEmail = cred.user.email || '';
        await signOut(auth);
        setPendingPromotion({
          email: userEmail,
          uid,
          method: 'google'
        });
        return;
      }

      await signOut(auth);
      throw new Error('Your account does not have platform administrator access.');
    } catch (err: any) {
      if (
        err?.code === 'auth/popup-closed-by-user' ||
        err?.code === 'auth/cancelled-popup-request'
      ) {
        setErrorMsg(null);
      } else {
        setErrorMsg(err?.message || 'Unable to authenticate with Google right now.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setPendingPromotion(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMsg('Please enter your administrator email.');
      return;
    }

    if (!password) {
      setErrorMsg('Please enter your password.');
      return;
    }

    setLoading(true);

    try {
      // 1. Authenticate through Firebase Authentication
      const cred = await signInWithEmailAndPassword(auth, trimmedEmail, password);
      await reload(cred.user).catch(() => {});

      // 2. Verification gate: unverified accounts must verify email before Firestore role check
      if (!cred.user.emailVerified) {
        setPassword('');
        return;
      }

      await getIdToken(cred.user, true);

      // 3. Authoritative role check: Verify Firestore userRoles/{uid}.role === 'admin'
      const uid = cred.user.uid;
      const isAdmin = await verifyAdminRoleOrSignOut(uid);

      if (!isAdmin) {
        await signOut(auth);
        throw new Error('Your account does not have platform administrator access.');
      }

      // 4. Verified platform admin -> navigate to target admin destination
      navigate(targetDestination, { replace: true });
    } catch (err: any) {
      let friendlyMessage = 'Unable to sign in right now. Please try again.';

      if (err.message === 'Your account does not have platform administrator access.') {
        friendlyMessage = err.message;
      } else if (
        err.code === 'auth/invalid-credential' ||
        err.code === 'auth/wrong-password' ||
        err.code === 'auth/user-not-found' ||
        err.code === 'auth/invalid-email'
      ) {
        friendlyMessage = 'Invalid admin credentials.';
      } else if (err.code === 'auth/user-disabled') {
        friendlyMessage = 'Admin account is disabled.';
      } else if (err.code === 'auth/operation-not-allowed' || err.message?.includes('operation-not-allowed')) {
        friendlyMessage = 'Password sign-in is disabled in this environment. Use Google Sign-In or contact an administrator.';
      }

      setErrorMsg(friendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setPendingPromotion(null);

    const trimmedName = displayName.trim();
    const trimmedEmail = email.trim();

    if (trimmedName.length < 2) {
      setErrorMsg('Please enter your full name (at least 2 characters).');
      return;
    }
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      // Use shared verification lifecycle (zero Firestore reads/writes before email verification)
      await signUpWithEmail(trimmedEmail, password, trimmedName);
      setPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      let friendlyMessage = 'Unable to create account right now. Please try again.';

      if (err.code === 'auth/email-already-in-use') {
        friendlyMessage =
          'An account with this email already exists. Switch to Sign In or ask an existing admin to promote your email.';
      } else if (err.code === 'auth/weak-password') {
        friendlyMessage = 'Password is too weak. Please use at least 6 characters.';
      } else if (err.code === 'auth/invalid-email') {
        friendlyMessage = 'Please enter a valid email address.';
      } else if (err.code === 'auth/operation-not-allowed' || err.message?.includes('operation-not-allowed')) {
        friendlyMessage = 'Email/password registration is disabled. Use Sign Up with Google below.';
      } else if (err?.message) {
        friendlyMessage = err.message;
      }

      setErrorMsg(friendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifiedCallback = async () => {
    const active = auth.currentUser;
    if (!active) return;

    try {
      const uid = active.uid;
      const isAdmin = await verifyAdminRoleOrSignOut(uid);
      if (isAdmin) {
        navigate(targetDestination, { replace: true });
        return;
      }

      const verifiedEmail = active.email || '';
      await signOut(auth);
      if (mode === 'signup') {
        setPendingPromotion({
          email: verifiedEmail,
          uid,
          method: 'email'
        });
      } else {
        setErrorMsg('Your account does not have platform administrator access.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Unable to verify administrator privileges right now.');
    }
  };

  if (needsEmailVerification) {
    return (
      <div className="min-h-screen bg-[#090a0b] text-[#f4f5f7]">
        <EmailVerificationScreen
          title="Verify Your Email Address"
          subtitle="Verify your email address before Festofy checks your administrator role in Firestore."
          onVerified={handleVerifiedCallback}
        />
      </div>
    );
  }

  if (authError) {
    return (
      <div className="min-h-screen bg-[#090a0b] text-[#f4f5f7]">
        <AuthSyncErrorScreen error={authError} />
      </div>
    );
  }

  // Already signed in as a verified non-admin user visiting /admin/login
  if (!authLoading && isAuthenticated && currentUser && role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#090a0b] text-[#f4f5f7] px-4 py-12">
        <div className="w-full max-w-md rounded-2xl border border-[#242730] bg-[#14161a] p-6 sm:p-8 text-center space-y-5 shadow-2xl">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <h1 className="font-heading text-xl font-bold text-white">
              Administrator Access Required
            </h1>
            <p className="text-xs text-[#9da3b4] leading-relaxed">
              You are currently signed in as <span className="text-white font-semibold">{currentUser.email}</span> ({role}). This account does not hold an administrator role in Firestore.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2.5">
            <button
              type="button"
              onClick={() => signOutUser()}
              className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-xs font-bold text-white transition-colors cursor-pointer"
            >
              Sign Out & Switch Account
            </button>
            <Link
              to={role === 'organizer' ? '/organizer' : '/dashboard'}
              className="flex-1 py-2.5 px-4 rounded-xl bg-[#1e222b] hover:bg-[#252a34] border border-[#2e3442] text-xs font-semibold text-white transition-colors"
            >
              Return to Portal
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#090a0b] text-[#f4f5f7] px-4 py-12 selection:bg-red-600 selection:text-white">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-red-600 to-red-700 text-white shadow-xl shadow-red-600/20 ring-1 ring-red-500/30">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <h1 className="font-heading text-2xl sm:text-3xl font-black text-white tracking-tight">
              Admin Console
            </h1>
            <p className="text-xs text-[#9da3b4] mt-1 max-w-xs mx-auto">
              {mode === 'signup'
                ? 'Register and verify your email to request platform administrator access.'
                : 'Sign in with your verified platform administrator account.'}
            </p>
          </div>
        </div>

        {/* Auth Box */}
        <div className="rounded-2xl border border-[#242730] bg-[#14161a] p-6 sm:p-8 space-y-6 shadow-2xl">
          {/* Sign In / Sign Up Mode Toggle */}
          <div
            role="tablist"
            aria-label="Admin authentication mode"
            className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-[#101216] border border-[#242730]"
          >
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'signin'}
              onClick={() => switchMode('signin')}
              className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                mode === 'signin'
                  ? 'bg-[#1e222b] text-white shadow-sm border border-[#2e3442]'
                  : 'text-[#9da3b4] hover:text-white'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'signup'}
              onClick={() => switchMode('signup')}
              className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                mode === 'signup'
                  ? 'bg-[#1e222b] text-white shadow-sm border border-[#2e3442]'
                  : 'text-[#9da3b4] hover:text-white'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Sign Up</span>
            </button>
          </div>

          {/* Pending Admin Promotion Confirmation */}
          {pendingPromotion && (
            <div
              role="status"
              aria-live="polite"
              className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-800/50 space-y-3 text-xs"
            >
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold text-emerald-200">
                    Email Verified — Pending Admin Promotion
                  </div>
                  <p className="text-emerald-100/80 leading-relaxed">
                    For security, new accounts remain standard student accounts until an existing administrator promotes your email under{' '}
                    <span className="font-semibold text-white">Admin Console → Platform Administrators</span>.
                  </p>
                </div>
              </div>

              <div className="rounded-lg bg-[#101216] border border-emerald-900/50 p-2.5 space-y-1 font-mono text-[11px]">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[#9da3b4]">Email:</span>
                  <button
                    type="button"
                    onClick={() => handleCopyPendingEmail(pendingPromotion.email)}
                    className="text-white font-semibold hover:text-emerald-300 flex items-center gap-1 cursor-pointer truncate"
                    title="Copy email"
                  >
                    <span className="truncate">{pendingPromotion.email}</span>
                    {copiedUid ? (
                      <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                    ) : (
                      <Copy className="w-3 h-3 text-[#656c80] shrink-0" />
                    )}
                  </button>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[#9da3b4]">UID:</span>
                  <span className="text-zinc-400 truncate">{pendingPromotion.uid}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setEmail(pendingPromotion.email);
                  switchMode('signin');
                }}
                className="w-full py-2 px-3 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-600/40 text-emerald-200 font-semibold transition-colors cursor-pointer"
              >
                Already Promoted? Switch to Sign In
              </button>
            </div>
          )}

          {/* Error Notice */}
          {errorMsg && (
            <div
              role="alert"
              aria-live="assertive"
              className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-950/40 border border-red-900/50 text-red-200 text-xs"
            >
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{errorMsg}</span>
            </div>
          )}

          {/* Sign In OR Sign Up Form */}
          {mode === 'signin' ? (
            <form onSubmit={handleSignInSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="admin-email"
                  className="block text-xs font-semibold text-[#9da3b4]"
                >
                  Administrator Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#656c80] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="admin-email"
                    type="email"
                    required
                    autoComplete="username"
                    placeholder="admin@institution.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#191b20] border border-[#2e3442] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-[#656c80] focus:outline-none focus:border-red-500 transition-colors font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="admin-password"
                  className="block text-xs font-semibold text-[#9da3b4]"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#656c80] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="admin-password"
                    type="password"
                    required
                    autoComplete="current-password"
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#191b20] border border-[#2e3442] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-[#656c80] focus:outline-none focus:border-red-500 transition-colors font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 transition-colors shadow-lg shadow-red-600/25 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                <span>{loading ? 'Signing in...' : 'Sign In'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignUpSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="admin-signup-name"
                  className="block text-xs font-semibold text-[#9da3b4]"
                >
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#656c80] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="admin-signup-name"
                    type="text"
                    required
                    autoComplete="name"
                    placeholder="Your Name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full bg-[#191b20] border border-[#2e3442] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-[#656c80] focus:outline-none focus:border-red-500 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="admin-signup-email"
                  className="block text-xs font-semibold text-[#9da3b4]"
                >
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#656c80] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="admin-signup-email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#191b20] border border-[#2e3442] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-[#656c80] focus:outline-none focus:border-red-500 transition-colors font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="admin-signup-password"
                  className="block text-xs font-semibold text-[#9da3b4]"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#656c80] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="admin-signup-password"
                    type="password"
                    required
                    minLength={6}
                    autoComplete="new-password"
                    placeholder="Min. 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#191b20] border border-[#2e3442] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-[#656c80] focus:outline-none focus:border-red-500 transition-colors font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="admin-signup-confirm"
                  className="block text-xs font-semibold text-[#9da3b4]"
                >
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#656c80] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="admin-signup-confirm"
                    type="password"
                    required
                    minLength={6}
                    autoComplete="new-password"
                    placeholder="Repeat password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-[#191b20] border border-[#2e3442] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-[#656c80] focus:outline-none focus:border-red-500 transition-colors font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 transition-colors shadow-lg shadow-red-600/25 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>{loading ? 'Creating Account...' : 'Create Account & Verify Email'}</span>
              </button>

              <p className="text-[11px] text-[#9da3b4] text-center leading-relaxed">
                New accounts require email verification and promotion by an existing administrator before entering the console.
              </p>
            </form>
          )}

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#242730]" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-wider font-mono">
              <span className="bg-[#14161a] px-2.5 text-[#656c80]">or</span>
            </div>
          </div>

          <button
            type="button"
            disabled={loading}
            onClick={handleGoogleAdminAuth}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-[#191b20] hover:bg-[#1f2229] border border-[#2e3442] transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96z"
              />
            </svg>
            <span>{mode === 'signup' ? 'Sign up with Google' : 'Continue with Google'}</span>
          </button>
        </div>

        {/* Back to Festofy link */}
        <div className="text-center">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs text-[#9da3b4] hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Festofy</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
