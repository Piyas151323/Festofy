import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Terminal,
  Mail,
  Lock,
  ArrowRight,
  AlertCircle,
  Shield,
  Sparkles,
  Building2,
  Clock,
  Compass
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { getPostAuthDestination } from '../../utils/authUtils';

export const OrganizerLoginPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const redirectTarget = searchParams.get('redirect');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    signInWithEmail,
    signInWithGoogle,
    signInWithGoogleDemo,
    isAuthenticated,
    role,
    currentUser,
    loading: authLoading
  } = useAuth();

  useEffect(() => {
    document.title = 'Organizer Console Sign In · Festofy';
  }, []);

  // If already authenticated, redirect appropriately
  useEffect(() => {
    let mounted = true;
    async function redirectIfAuth() {
      if (!authLoading && isAuthenticated && currentUser) {
        if (redirectTarget) {
          navigate(redirectTarget, { replace: true });
        } else {
          const dest = await getPostAuthDestination(currentUser.uid, role);
          if (mounted) {
            navigate(dest, { replace: true });
          }
        }
      }
    }
    redirectIfAuth();
    return () => {
      mounted = false;
    };
  }, [isAuthenticated, authLoading, currentUser, role, redirectTarget, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const cred = await signInWithEmail(email.trim(), password);
      if (cred?.user) {
        if (redirectTarget) {
          navigate(redirectTarget, { replace: true });
        } else {
          const dest = await getPostAuthDestination(cred.user.uid);
          navigate(dest, { replace: true });
        }
      }
    } catch (err: any) {
      console.warn('Notice during organizer login:', err?.code || err?.message);
      let msg = err?.message || 'Failed to authenticate organizer account.';
      if (
        msg.includes('invalid-credential') ||
        msg.includes('wrong-password') ||
        msg.includes('user-not-found')
      ) {
        msg = 'Invalid email or password. If you have not registered your organization yet, please apply below.';
      }
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleOrganizerDemo = async () => {
    setErrorMsg(null);
    setLoading(true);
    try {
      const cred = await signInWithEmail('organizer@festofy.demo', 'FestofyOrganizerDemo2026!');
      if (cred?.user) {
        navigate('/organizer', { replace: true });
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Organizer demo login notice.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setLoading(true);
    try {
      const cred = await signInWithGoogle();
      if (cred?.user) {
        if (redirectTarget) {
          navigate(redirectTarget, { replace: true });
        } else {
          const dest = await getPostAuthDestination(cred.user.uid);
          navigate(dest, { replace: true });
        }
      }
    } catch (err: any) {
      if (
        err?.code !== 'auth/popup-closed-by-user' &&
        err?.code !== 'auth/cancelled-popup-request'
      ) {
        setErrorMsg(err?.message || 'Google sign-in encountered an issue.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Header Badge */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#2e3442] bg-[#14161a] text-xs font-semibold text-[#ff4f1a] uppercase tracking-wider">
            <Terminal className="w-3.5 h-3.5" /> Organizer Console
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-white">
            Organizer Sign In
          </h1>
          <p className="text-xs sm:text-sm text-[#9da3b4] max-w-sm mx-auto">
            Sign in with your organization email to manage festivals, events, and registrations.
          </p>
        </div>

        {/* Login Box */}
        <div className="rounded-3xl border border-[#242730] bg-[#14161a] p-6 sm:p-8 space-y-6 shadow-2xl">
          {errorMsg && (
            <div className="p-3.5 rounded-xl border border-red-500/30 bg-red-500/10 flex items-start gap-2.5 text-xs text-red-300">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-white">
                Organization / Lead Email
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
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-white">Password</label>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#656c80]" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#2e3442] bg-[#0e1013] text-sm text-white placeholder-[#656c80] focus:outline-none focus:border-[#ff4f1a]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-[#ff4f1a] hover:bg-[#ff6838] disabled:opacity-50 text-white text-xs font-bold transition-all shadow-lg shadow-[#ff4f1a]/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In to Organizer Console</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Instant Demo Organizer Button */}
          <div className="pt-2 border-t border-[#242730] space-y-2.5">
            <button
              type="button"
              onClick={handleOrganizerDemo}
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 text-xs font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Instant Organizer Demo (organizer@festofy.demo)</span>
            </button>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl border border-[#2e3442] bg-[#1e222b] hover:bg-[#252a34] text-white text-xs font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Continue with Google</span>
            </button>
          </div>

          {/* Join Festofy as Organizer Direct Link */}
          <div className="pt-2 border-t border-[#242730] text-center space-y-3">
            <p className="text-xs text-[#9da3b4]">
              Don't have an approved club or festival yet?
            </p>
            <Link
              to="/organizer/apply"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#ff4f1a]/10 hover:bg-[#ff4f1a]/20 border border-[#ff4f1a]/30 text-xs font-bold text-[#ff4f1a] transition-colors"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Join Festofy as Organizer &rarr;</span>
            </Link>

            <div className="pt-2">
              <Link
                to="/auth"
                className="text-[11px] text-[#656c80] hover:text-[#9da3b4] transition-colors block"
              >
                Participating in events as a student? Sign In to Student Portal &rarr;
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
