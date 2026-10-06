import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Mail, Lock, User, ArrowRight, AlertCircle, Shield, Sparkles } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export const AuthPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialMode = searchParams.get('mode') === 'signup' ? 'signup' : 'signin';
  const redirectPath = searchParams.get('redirect') || '/dashboard';

  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { signInWithEmail, signUpWithEmail, signInWithGoogle, isAuthenticated, isOrganizer } = useAuth();

  // If already authenticated, redirect
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate(redirectPath);
    }
  }, [isAuthenticated, navigate, redirectPath]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      if (mode === 'signup') {
        if (!displayName.trim()) {
          throw new Error('Please enter your full name.');
        }
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters.');
        }
        await signUpWithEmail(email, password, displayName);
      } else {
        await signInWithEmail(email, password);
      }
      navigate(redirectPath);
    } catch (err: any) {
      console.error('Authentication Error:', err);
      let message = err.message || 'Authentication failed. Please verify your credentials.';
      if (message.includes('auth/invalid-credential') || message.includes('auth/wrong-password')) {
        message = 'Invalid email or password.';
      } else if (message.includes('auth/email-already-in-use')) {
        message = 'An account with this email already exists. Please sign in instead.';
      } else if (message.includes('auth/weak-password')) {
        message = 'Password is too weak. Please use at least 6 characters.';
      } else if (message.includes('auth/invalid-email')) {
        message = 'Please enter a valid email address.';
      }
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setLoading(true);
    try {
      await signInWithGoogle();
      navigate(redirectPath);
    } catch (err: any) {
      console.error('Google Auth Error:', err);
      setErrorMsg(err.message || 'Google Sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ff4f1a] to-[#ff6838] flex items-center justify-center font-heading font-black text-white text-xl shadow-lg shadow-[#ff4f1a]/20">
              F
            </div>
          </Link>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-white">
            {mode === 'signup' ? 'Create Festofy Account' : 'Welcome to Festofy'}
          </h1>
          <p className="text-xs text-[#9da3b4]">
            {mode === 'signup'
              ? 'Create a student account to explore events and register. Organizer access is granted through approved organizations.'
              : 'Sign in to access your registered events and organizer tools.'}
          </p>
        </div>

        {/* Auth Box */}
        <div className="rounded-2xl border border-[#242730] bg-[#14161a] p-6 sm:p-8 space-y-6 shadow-2xl">
          {/* Tab Selector */}
          <div className="grid grid-cols-2 p-1 bg-[#191b20] rounded-xl border border-[#2e3442]">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setErrorMsg(null);
              }}
              className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                mode === 'signin'
                  ? 'bg-[#ff4f1a] text-white shadow-sm'
                  : 'text-[#9da3b4] hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setErrorMsg(null);
              }}
              className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                mode === 'signup'
                  ? 'bg-[#ff4f1a] text-white shadow-sm'
                  : 'text-[#9da3b4] hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Google Sign In Button */}
          <div>
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl text-xs font-semibold bg-[#1e222b] hover:bg-[#282d39] text-white border border-[#2e3442] transition-colors disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
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
              <span>Continue with Google</span>
            </button>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-[#242730] w-full" />
            <span className="bg-[#14161a] px-3 text-[10px] text-[#656c80] uppercase tracking-wider">
              Or with email
            </span>
          </div>

          {/* Error notice */}
          {errorMsg && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-950/40 border border-red-900/50 text-red-200 text-xs">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#9da3b4]">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#656c80] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="Tanvir Ahmed"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full bg-[#191b20] border border-[#2e3442] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-[#656c80] focus:outline-none focus:border-[#ff4f1a]"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#9da3b4]">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#656c80] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="student@drmc.edu.bd"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#191b20] border border-[#2e3442] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-[#656c80] focus:outline-none focus:border-[#ff4f1a]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#9da3b4]">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#656c80] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#191b20] border border-[#2e3442] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-[#656c80] focus:outline-none focus:border-[#ff4f1a]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl text-xs font-semibold text-white bg-[#ff4f1a] hover:bg-[#ff6838] transition-colors shadow-lg shadow-[#ff4f1a]/20 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <span>{loading ? 'Authenticating...' : mode === 'signup' ? 'Create Account' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Security and Account Guarantee Notice */}
        <div className="text-center p-3 rounded-xl bg-[#121316] border border-[#242730] text-[11px] text-[#656c80] flex items-center justify-center gap-2">
          <Shield className="w-3.5 h-3.5 text-[#ff4f1a]" />
          <span>Festofy Student Account: Explore competitions, manage entry passes, and represent your campus.</span>
        </div>
      </div>
    </div>
  );
};
