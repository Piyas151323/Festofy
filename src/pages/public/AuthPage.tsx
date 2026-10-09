import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  Mail,
  Lock,
  User,
  ArrowRight,
  AlertCircle,
  Shield,
  Sparkles,
  Eye,
  EyeOff,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface AuthErrorState {
  summary: string;
  fieldErrors?: {
    displayName?: string;
    email?: string;
    password?: string;
  };
  actionType?: 'switch_signup' | 'use_google' | null;
}

export const AuthPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialMode = searchParams.get('mode') === 'signup' ? 'signup' : 'signin';

  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [authError, setAuthError] = useState<AuthErrorState | null>(null);

  const {
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    isAuthenticated,
    role,
    loading: authLoading,
  } = useAuth();

  // If already authenticated and auth finished loading, redirect to intended or role-appropriate dashboard
  React.useEffect(() => {
    if (!authLoading && isAuthenticated) {
      if (searchParams.get('redirect')) {
        navigate(searchParams.get('redirect')!, { replace: true });
      } else {
        const target = role === 'admin' ? '/admin' : role === 'organizer' ? '/organizer' : '/dashboard';
        navigate(target, { replace: true });
      }
    }
  }, [isAuthenticated, authLoading, role, navigate, searchParams]);

  const getPostLoginDestination = (userRole: string) => {
    const requested = searchParams.get('redirect');
    if (requested) return requested;
    if (userRole === 'admin') return '/admin';
    if (userRole === 'organizer') return '/organizer';
    return '/dashboard';
  };

  const validateInputs = (): AuthErrorState | null => {
    const fieldErrors: AuthErrorState['fieldErrors'] = {};

    if (mode === 'signup' && !displayName.trim()) {
      fieldErrors.displayName = 'Please enter your full name.';
    }

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      fieldErrors.email = 'Please enter your email address.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      fieldErrors.email = 'Please enter a valid email address.';
    }

    if (!password) {
      fieldErrors.password = 'Please enter your password.';
    } else if (password.length < 6) {
      fieldErrors.password = 'Password must be at least 6 characters.';
    }

    if (Object.keys(fieldErrors).length > 0) {
      return {
        summary: 'Please correct the highlighted fields below.',
        fieldErrors,
      };
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    const clientValidation = validateInputs();
    if (clientValidation) {
      setAuthError(clientValidation);
      return;
    }

    setLoading(true);

    try {
      if (mode === 'signup') {
        await signUpWithEmail(email.trim(), password, displayName.trim());
        navigate(getPostLoginDestination('student'));
      } else {
        await signInWithEmail(email.trim(), password);
      }
    } catch (err: any) {
      const isOpNotAllowed =
        err?.code === 'auth/operation-not-allowed' ||
        err?.message?.includes('auth/operation-not-allowed') ||
        err?.message?.includes('operation-not-allowed');

      const isInvalidCreds =
        [
          'auth/invalid-credential',
          'auth/wrong-password',
          'auth/user-not-found',
        ].includes(err?.code) ||
        (err?.message &&
          (err.message.includes('auth/invalid-credential') ||
            err.message.includes('auth/wrong-password') ||
            err.message.includes('auth/user-not-found')));

      const isEmailInUse =
        err?.code === 'auth/email-already-in-use' ||
        err?.message?.includes('auth/email-already-in-use');

      const isWeakPass =
        err?.code === 'auth/weak-password' ||
        err?.message?.includes('auth/weak-password');

      const isInvalidEmail =
        err?.code === 'auth/invalid-email' ||
        err?.message?.includes('auth/invalid-email');

      if (isOpNotAllowed) {
        setAuthError({
          summary:
            'Email & password sign-in is disabled for this project. Please continue with Google using the button above.',
          actionType: 'use_google',
        });
      } else if (isInvalidCreds) {
        setAuthError({
          summary:
            mode === 'signin'
              ? 'Invalid email or password. Please verify your credentials or use the demo login in development.'
              : 'Unable to authenticate. Please verify your email and password.',
          fieldErrors: {
            password: 'Password does not match our records.',
          },
        });
      } else if (isEmailInUse) {
        setAuthError({
          summary: 'An account with this email already exists. Please sign in instead.',
          fieldErrors: {
            email: 'This email is already registered.',
          },
          actionType: 'switch_signup',
        });
      } else if (isWeakPass) {
        setAuthError({
          summary: 'Password is too weak. Please use at least 6 characters.',
          fieldErrors: {
            password: 'Must be at least 6 characters long.',
          },
        });
      } else if (isInvalidEmail) {
        setAuthError({
          summary: 'Please enter a valid email address.',
          fieldErrors: {
            email: 'Invalid email format.',
          },
        });
      } else {
        setAuthError({
          summary: err?.message || 'Authentication failed. Please verify your credentials.',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUseStudentDemo = () => {
    setMode('signin');
    setEmail('student@festofy.demo');
    setPassword('FestofyStudentDemo2026!');
    setAuthError(null);
  };

  const handleUseOrganizerDemo = () => {
    setMode('signin');
    setEmail('organizer@festofy.demo');
    setPassword('FestofyOrganizerDemo2026!');
    setAuthError(null);
  };

  const handleGoogleSignIn = async () => {
    setAuthError(null);
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      if (
        err?.code === 'auth/popup-closed-by-user' ||
        err?.code === 'auth/cancelled-popup-request'
      ) {
        setAuthError({ summary: 'Google Sign-in was cancelled. Please try again.' });
      } else {
        setAuthError({ summary: err?.message || 'Google Sign-in failed. Please try again.' });
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  // Only expose demo credentials in development or if explicitly enabled
  const showDemoCredentials =
    import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEMO_CREDENTIALS === 'true';

  const anyLoading = loading || googleLoading;

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
          <p className="text-xs text-[#8a91a6]">
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
                setAuthError(null);
              }}
              className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                mode === 'signin'
                  ? 'bg-[#e04006] text-white shadow-sm'
                  : 'text-[#8a91a6] hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setAuthError(null);
              }}
              className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                mode === 'signup'
                  ? 'bg-[#e04006] text-white shadow-sm'
                  : 'text-[#8a91a6] hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Google Sign In Button */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] px-1 text-[#8a91a6]">
              <span>Primary Authentication</span>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#ff4f1a] bg-[#ff4f1a]/10 px-2 py-0.5 rounded-full border border-[#ff4f1a]/20">
                <Sparkles className="w-3 h-3" />
                Recommended
              </span>
            </div>
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={anyLoading}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl text-xs sm:text-sm font-semibold bg-[#1e222b] hover:bg-[#282d39] text-white border border-[#ff4f1a]/40 hover:border-[#ff4f1a] transition-all shadow-md shadow-black/40 disabled:opacity-50 cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4f1a]"
            >
              {googleLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin shrink-0 text-[#ff4f1a]" />
                  <span>Connecting with Google...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
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
                </>
              )}
            </button>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-[#242730] w-full" />
            <span className="bg-[#14161a] px-3 text-[10px] text-[#656c80] uppercase tracking-wider font-mono">
              Or with email
            </span>
          </div>

          {/* Accessible Error Summary */}
          {authError && (
            <div
              role="alert"
              aria-live="assertive"
              className="p-3.5 rounded-xl bg-red-950/40 border border-red-900/50 text-xs space-y-2.5 animate-in fade-in"
            >
              <div className="flex items-start gap-2 text-red-200">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{authError.summary}</span>
              </div>

              {authError.actionType === 'switch_signup' && mode === 'signin' && (
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setAuthError(null);
                  }}
                  className="w-full py-2 px-3 rounded-lg bg-[#2e3442] hover:bg-[#383f50] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <User className="w-3.5 h-3.5 text-[#ff4f1a]" />
                  <span>Switch to Create Account</span>
                </button>
              )}

              {authError.actionType === 'use_google' && (
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={anyLoading}
                  className="w-full py-2 px-3 rounded-lg bg-[#e04006] hover:bg-[#ff4f1a] text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Sign in with Google now</span>
                </button>
              )}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {mode === 'signup' && (
              <div className="space-y-1.5">
                <label
                  htmlFor="auth-name"
                  className="block text-xs font-semibold text-[#8a91a6]"
                >
                  Full Name <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <User
                    className="w-4 h-4 text-[#656c80] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                    aria-hidden="true"
                  />
                  <input
                    id="auth-name"
                    name="name"
                    type="text"
                    required
                    autoComplete="name"
                    placeholder="Tanvir Ahmed"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    aria-invalid={!!authError?.fieldErrors?.displayName}
                    aria-describedby={
                      authError?.fieldErrors?.displayName ? 'auth-name-error' : undefined
                    }
                    className={`w-full min-h-[42px] bg-[#191b20] border rounded-xl pl-10 pr-4 py-2.5 text-base sm:text-sm text-white placeholder-[#656c80] transition-colors focus:outline-none focus:ring-2 focus:ring-[#ff4f1a]/50 focus:border-[#ff4f1a] ${
                      authError?.fieldErrors?.displayName
                        ? 'border-red-500/80'
                        : 'border-[#2e3442]'
                    }`}
                  />
                </div>
                {authError?.fieldErrors?.displayName && (
                  <p id="auth-name-error" role="alert" className="text-xs text-red-400 mt-1">
                    {authError.fieldErrors.displayName}
                  </p>
                )}
              </div>
            )}

            <div className="space-y-1.5">
              <label
                htmlFor="auth-email"
                className="block text-xs font-semibold text-[#8a91a6]"
              >
                Email Address <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Mail
                  className="w-4 h-4 text-[#656c80] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  id="auth-email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="student@campus.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-invalid={!!authError?.fieldErrors?.email}
                  aria-describedby={
                    authError?.fieldErrors?.email ? 'auth-email-error' : undefined
                  }
                  className={`w-full min-h-[42px] bg-[#191b20] border rounded-xl pl-10 pr-4 py-2.5 text-base sm:text-sm text-white placeholder-[#656c80] transition-colors focus:outline-none focus:ring-2 focus:ring-[#ff4f1a]/50 focus:border-[#ff4f1a] ${
                    authError?.fieldErrors?.email
                      ? 'border-red-500/80'
                      : 'border-[#2e3442]'
                  }`}
                />
              </div>
              {authError?.fieldErrors?.email && (
                <p id="auth-email-error" role="alert" className="text-xs text-red-400 mt-1">
                  {authError.fieldErrors.email}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="auth-password"
                className="block text-xs font-semibold text-[#8a91a6]"
              >
                Password <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Lock
                  className="w-4 h-4 text-[#656c80] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  id="auth-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-invalid={!!authError?.fieldErrors?.password}
                  aria-describedby={
                    authError?.fieldErrors?.password ? 'auth-password-error' : undefined
                  }
                  className={`w-full min-h-[42px] bg-[#191b20] border rounded-xl pl-10 pr-11 py-2.5 text-base sm:text-sm text-white placeholder-[#656c80] transition-colors focus:outline-none focus:ring-2 focus:ring-[#ff4f1a]/50 focus:border-[#ff4f1a] ${
                    authError?.fieldErrors?.password
                      ? 'border-red-500/80'
                      : 'border-[#2e3442]'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-pressed={showPassword}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#656c80] hover:text-[#f4f5f7] p-1 rounded transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4f1a]"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" aria-hidden="true" />
                  ) : (
                    <Eye className="w-4 h-4" aria-hidden="true" />
                  )}
                </button>
              </div>
              {authError?.fieldErrors?.password && (
                <p id="auth-password-error" role="alert" className="text-xs text-red-400 mt-1">
                  {authError.fieldErrors.password}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={anyLoading}
              className="w-full min-h-[44px] py-3 px-4 rounded-xl text-xs sm:text-sm font-bold text-white bg-[#e04006] hover:bg-[#ff4f1a] transition-all shadow-md shadow-[#ff4f1a]/20 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4f1a]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>{mode === 'signup' ? 'Create Account' : 'Sign In'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials (Visible only in development or with explicit flag) */}
          {showDemoCredentials && (
            <div className="pt-4 border-t border-[#242730] space-y-2.5">
              <div className="flex items-center justify-between text-[11px] text-[#8a91a6]">
                <span className="font-mono uppercase font-semibold text-[10px] text-[#656c80]">
                  Dev Environment Only: Demo Credentials
                </span>
                <span className="text-[10px] text-[#ff4f1a] font-mono">1-Click Fill</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleUseStudentDemo}
                  className="p-2.5 rounded-xl bg-[#191b20] hover:bg-[#20232a] border border-[#2e3442] text-left transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-white group-hover:text-[#ff4f1a]">
                    <User className="w-3.5 h-3.5 text-[#ff4f1a]" />
                    <span>Student Demo</span>
                  </div>
                  <div className="text-[10px] text-[#656c80] font-mono truncate mt-0.5">
                    student@festofy.demo
                  </div>
                </button>

                <button
                  type="button"
                  onClick={handleUseOrganizerDemo}
                  className="p-2.5 rounded-xl bg-[#191b20] hover:bg-[#20232a] border border-[#2e3442] text-left transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-white group-hover:text-[#ff4f1a]">
                    <Sparkles className="w-3.5 h-3.5 text-[#ff4f1a]" />
                    <span>Organizer Demo</span>
                  </div>
                  <div className="text-[10px] text-[#656c80] font-mono truncate mt-0.5">
                    organizer@festofy.demo
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Security and Account Guarantee Notice */}
        <div className="text-center p-3 rounded-xl bg-[#121316] border border-[#242730] text-[11px] text-[#8a91a6] flex items-center justify-center gap-2">
          <Shield className="w-3.5 h-3.5 text-[#ff4f1a]" />
          <span>Festofy Student Account: Explore competitions, manage entry passes, and represent your campus.</span>
        </div>

        {/* Link to Admin Login */}
        <div className="text-center text-xs text-[#8a91a6]">
          Are you a platform administrator?{' '}
          <Link to="/admin/login" className="text-[#ff4f1a] hover:underline font-semibold">
            Admin Console Sign In &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
};
