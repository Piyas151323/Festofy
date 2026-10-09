import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  Mail,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Copy,
  Check,
  AlertCircle
} from 'lucide-react';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase/config';
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
  const [copied, setCopied] = useState(false);

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

  const handleUseDemoCredentials = async () => {
    setEmail('admin@festofy.demo');
    setPassword('FestofyAdminDemo2026!');
    setErrorMsg(null);
    setLoading(true);

    try {
      const cred = await signInWithEmailAndPassword(auth, 'admin@festofy.demo', 'FestofyAdminDemo2026!');
      const roleRef = doc(db, 'userRoles', cred.user.uid);
      const roleSnap = await getDoc(roleRef);

      if (!roleSnap.exists() || roleSnap.data()?.role !== 'admin') {
        await signOut(auth);
        throw new Error('Your account does not have platform administrator access.');
      }
      navigate(targetDestination, { replace: true });
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to authenticate admin demo credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCredentials = () => {
    navigator.clipboard.writeText('admin@festofy.demo | FestofyAdminDemo2026!');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
      const roleRef = doc(db, 'userRoles', cred.user.uid);
      const roleSnap = await getDoc(roleRef);

      if (!roleSnap.exists() || roleSnap.data()?.role !== 'admin') {
        // Not a platform administrator -> terminate session immediately
        await signOut(auth);
        throw new Error('Your account does not have platform administrator access.');
      }

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
        friendlyMessage = 'Password sign-in is disabled in this environment. Platform administrator account must be provisioned.';
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
              Sign in with your platform administrator account.
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
                  placeholder="admin@festofy.demo"
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

          {/* Demo Admin Access Card */}
          <div className="rounded-xl border border-red-950/60 bg-[#191416]/80 p-4 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 font-bold text-red-400">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Demo Admin Access</span>
              </div>
              <button
                type="button"
                onClick={handleCopyCredentials}
                className="text-[10px] text-[#9da3b4] hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
                aria-label="Copy demo credentials"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <div className="space-y-1.5 text-[11px] font-mono bg-[#100e10] p-2.5 rounded-lg border border-red-950/50">
              <div className="flex items-center justify-between">
                <span className="text-[#656c80]">Email:</span>
                <span className="text-zinc-200 select-all font-semibold">admin@festofy.demo</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#656c80]">Password:</span>
                <span className="text-zinc-200 select-all font-semibold">FestofyAdminDemo2026!</span>
              </div>
            </div>

            <button
              type="button"
              disabled={loading}
              onClick={handleUseDemoCredentials}
              className="w-full py-2 px-3 rounded-lg text-xs font-semibold text-red-300 bg-red-950/40 hover:bg-red-900/40 border border-red-800/40 transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5 text-red-400" />
              <span>{loading ? 'Signing In as Admin...' : '1-Click Sign In as Demo Admin'}</span>
            </button>
          </div>
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
