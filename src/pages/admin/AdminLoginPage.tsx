import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  ShieldCheck,
  Lock,
  Mail,
  ArrowLeft,
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import { signInWithEmailAndPassword, signInWithPopup, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../../lib/firebase/config';
import { useAuth } from '../../hooks/useAuth';

interface AdminLoginPageProps {
  redirectPath?: string;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({ redirectPath }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, role } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Intended destination: prop, query param, location state, or fallback to /admin
  const queryRedirect = new URLSearchParams(location.search).get('redirect');
  const targetDestination = redirectPath || queryRedirect || (location.state as any)?.from || '/admin';

  // If already authenticated as admin, redirect immediately
  React.useEffect(() => {
    document.title = 'Admin Sign In · Festofy';
    if (isAuthenticated && role === 'admin') {
      navigate(targetDestination, { replace: true });
    }
  }, [isAuthenticated, role, navigate, targetDestination]);

  const verifyAdminRoleOrSignOut = async (uid: string) => {
    const roleRef = doc(db, 'userRoles', uid);
    const roleSnap = await getDoc(roleRef);

    if (!roleSnap.exists() || roleSnap.data()?.role !== 'admin') {
      await signOut(auth);
      throw new Error('Your account does not have platform administrator access.');
    }
  };

  const handleGoogleAdminSignIn = async () => {
    setErrorMsg(null);
    setLoading(true);

    try {
      const cred = await signInWithPopup(auth, googleProvider);
      await verifyAdminRoleOrSignOut(cred.user.uid);
      navigate(targetDestination, { replace: true });
    } catch (err: any) {
      if (
        err?.code === 'auth/popup-closed-by-user' ||
        err?.code === 'auth/cancelled-popup-request'
      ) {
        setErrorMsg('Google sign-in popup was closed. Please try again.');
      } else {
        setErrorMsg(err?.message || 'Unable to verify administrator access with Google.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

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
      // 1. Authenticate through standard Firebase Authentication
      const cred = await signInWithEmailAndPassword(auth, trimmedEmail, password);

      // 2. Authoritative role check: Verify Firestore userRoles/{uid}.role === 'admin'
      await verifyAdminRoleOrSignOut(cred.user.uid);

      // 3. User is verified platform admin -> navigate to target admin destination
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
        friendlyMessage = 'Password sign-in is disabled in this environment. Use Google sign-in with an authorized administrator account.';
      }

      setErrorMsg(friendlyMessage);
    } finally {
      setLoading(false);
    }
  };

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
              Sign in with your verified platform administrator account.
            </p>
          </div>
        </div>

        {/* Login Box */}
        <div className="rounded-2xl border border-[#242730] bg-[#14161a] p-6 sm:p-8 space-y-6 shadow-2xl">
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

          {/* Google Admin Sign-In */}
          <button
            type="button"
            onClick={handleGoogleAdminSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl text-xs font-semibold bg-[#1e222b] hover:bg-[#282d39] text-white border border-red-500/30 hover:border-red-500 transition-all shadow-md shadow-black/40 disabled:opacity-50 cursor-pointer"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{loading ? 'Verifying Admin...' : 'Continue with Google'}</span>
          </button>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-[#242730] w-full" />
            <span className="bg-[#14161a] px-3 text-[10px] text-[#656c80] uppercase tracking-wider">
              Or with email
            </span>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
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

          <p className="text-[11px] text-[#656c80] text-center leading-relaxed">
            Access is restricted to accounts assigned <span className="font-mono text-zinc-400">role: "admin"</span> in Firestore <span className="font-mono text-zinc-400">userRoles</span>.
          </p>
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
