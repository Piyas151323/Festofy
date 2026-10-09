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
  Globe,
  ExternalLink,
  Copy,
  Check,
  Info,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { SITE_CONFIG, getCurrentDomainInfo } from '../../config/siteConfig';

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

  // Domain verification & guide states
  const [showDomainGuide, setShowDomainGuide] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [domainWarning, setDomainWarning] = useState<string | null>(null);

  const {
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signInWithGoogleRedirect,
    signInWithGoogleDemo,
    isAuthenticated,
    role,
    loading: authLoading
  } = useAuth();

  const handleCopyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  React.useEffect(() => {
    document.title = `${mode === 'signup' ? 'Create Account' : 'Sign In'} · Festofy`;
  }, [mode]);

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
        navigate(getPostLoginDestination('student'), { replace: true });
      } else {
        await signInWithEmail(email, password);
        navigate(getPostLoginDestination(role), { replace: true });
      }
    } catch (err: any) {
      const isOpNotAllowed =
        err?.code === 'auth/operation-not-allowed' ||
        err?.message?.includes('auth/operation-not-allowed') ||
        err?.message?.includes('operation-not-allowed');

      const isExpectedAuthNotice = [
        'auth/invalid-credential',
        'auth/wrong-password',
        'auth/user-not-found',
        'auth/invalid-email',
        'auth/email-already-in-use',
        'auth/weak-password',
        'auth/user-disabled',
        'auth/too-many-requests'
      ].includes(err?.code) || (err?.message && (
        err.message.includes('auth/invalid-credential') ||
        err.message.includes('auth/wrong-password') ||
        err.message.includes('auth/user-not-found') ||
        err.message.includes('auth/invalid-email') ||
        err.message.includes('auth/email-already-in-use') ||
        err.message.includes('auth/weak-password')
      ));

      if (isOpNotAllowed) {
        console.warn('Firebase Email/Password provider notice. Google authentication available.');
      } else if (isExpectedAuthNotice) {
        console.warn('Authentication validation notice:', err?.code || err?.message);
      } else {
        console.warn('Authentication Error Notice:', err?.code || err?.message);
      }

      let message = err.message || 'Authentication failed. Please verify your credentials.';
      if (isOpNotAllowed) {
        message = 'Email & password sign-in is disabled for this project. Please continue with Google or use the instant demo buttons below.';
      } else if (message.includes('auth/invalid-credential') || message.includes('auth/wrong-password') || message.includes('auth/user-not-found')) {
        message = mode === 'signin'
          ? 'Invalid email or password. You can click the Demo Account buttons below to sign in instantly.'
          : 'Unable to authenticate. Please verify your email and password.';
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

  const handleUseStudentDemo = async () => {
    setErrorMsg(null);
    setLoading(true);
    try {
      await signInWithEmail('student@festofy.demo', 'FestofyStudentDemo2026!');
      navigate(getPostLoginDestination('student'), { replace: true });
    } catch (err: any) {
      setErrorMsg(err?.message || 'Student demo sign-in notice.');
    } finally {
      setLoading(false);
    }
  };

  const handleUseOrganizerDemo = async () => {
    setErrorMsg(null);
    setLoading(true);
    try {
      await signInWithEmail('organizer@festofy.demo', 'FestofyOrganizerDemo2026!');
      navigate(getPostLoginDestination('organizer'), { replace: true });
    } catch (err: any) {
      setErrorMsg(err?.message || 'Organizer demo sign-in notice.');
    } finally {
      setLoading(false);
    }
  };

  const handleInstantGoogleDemo = async () => {
    setErrorMsg(null);
    setLoading(true);
    try {
      await signInWithGoogleDemo();
      navigate(getPostLoginDestination('student'), { replace: true });
    } catch (err: any) {
      setErrorMsg(err?.message || 'Instant Google sign-in notice.');
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
        navigate(getPostLoginDestination('student'), { replace: true });
      }
    } catch (err: any) {
      const code = err?.code || '';
      const msg = err?.message || '';

      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        setErrorMsg('Google Sign-in popup was closed or cancelled. You can retry, use Redirect mode, or test with Instant Google Demo below.');
      } else if (code === 'auth/popup-blocked') {
        setErrorMsg('Google Sign-in popup was blocked by your browser settings. Try "Sign In with Google (Redirect)" or use the Instant Demo button.');
      } else if (code === 'auth/unauthorized-domain' || msg.includes('unauthorized-domain')) {
        const activeHost = window.location.hostname || SITE_CONFIG.productionDomain;
        setDomainWarning(activeHost);
        setShowDomainGuide(true);
        setErrorMsg(
          `Domain Authorization Required: "${activeHost}" must be whitelisted in Firebase Console -> Authentication -> Settings -> Authorized domains for project "${SITE_CONFIG.firebaseProjectId}". Use the 1-click guide below or test with Instant Google Demo.`
        );
      } else if (code === 'auth/operation-not-allowed' || msg.includes('operation-not-allowed')) {
        setErrorMsg('Google provider configuration notice in Firebase Console. Click "Instant Google Sign-In" below to test.');
      } else {
        setErrorMsg(msg || 'Google Sign-in encountered an issue. Click "Instant Google Sign-In" below to proceed.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignInRedirect = async () => {
    setErrorMsg(null);
    setLoading(true);
    try {
      await signInWithGoogleRedirect();
    } catch (err: any) {
      const code = err?.code || '';
      const msg = err?.message || '';
      if (code === 'auth/unauthorized-domain' || msg.includes('unauthorized-domain')) {
        const activeHost = window.location.hostname || SITE_CONFIG.productionDomain;
        setDomainWarning(activeHost);
        setShowDomainGuide(true);
        setErrorMsg(
          `Domain Authorization Required: "${activeHost}" must be whitelisted in Firebase Console -> Authentication -> Settings -> Authorized domains for project "${SITE_CONFIG.firebaseProjectId}".`
        );
      } else {
        setErrorMsg(msg || 'Google Redirect failed. Please try popup sign-in or use Instant Google Demo.');
      }
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
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-[11px] px-1 text-[#9da3b4]">
              <span>Primary Authentication</span>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#ff4f1a] bg-[#ff4f1a]/10 px-2 py-0.5 rounded-full border border-[#ff4f1a]/20">
                <Sparkles className="w-3 h-3" />
                Recommended
              </span>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl text-xs font-semibold bg-[#1e222b] hover:bg-[#282d39] text-white border border-[#ff4f1a]/40 hover:border-[#ff4f1a] transition-all shadow-md shadow-black/40 disabled:opacity-50 cursor-pointer group"
              >
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
                <span>{loading ? 'Authenticating with Google...' : 'Continue with Google'}</span>
              </button>

              <div className="flex items-center justify-between px-1 text-[11px]">
                <button
                  type="button"
                  onClick={handleGoogleSignInRedirect}
                  disabled={loading}
                  className="text-[#9da3b4] hover:text-white hover:underline flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                  title="If popups are blocked by your browser, sign in using full page redirect"
                >
                  <RefreshCw className="w-3 h-3 text-[#656c80]" />
                  <span>Popup blocked? Use Redirect Flow</span>
                </button>

                <button
                  type="button"
                  onClick={handleInstantGoogleDemo}
                  disabled={loading}
                  className="text-[#ff4f1a] hover:text-[#ff6838] hover:underline flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50 font-medium"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Instant Google Demo</span>
                </button>
              </div>
            </div>

            {/* Domain & OAuth Helper Bar */}
            <div className="rounded-xl border border-[#242730] bg-[#16181e] p-2.5 text-xs space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0 text-[#9da3b4]">
                  <Globe className="w-3.5 h-3.5 text-[#ff4f1a] shrink-0" />
                  <span className="truncate text-[11px] font-mono text-zinc-300">
                    {SITE_CONFIG.productionDomain}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDomainGuide(!showDomainGuide)}
                  className="text-[10px] text-[#ff4f1a] hover:text-[#ff6838] hover:underline flex items-center gap-1 shrink-0 font-medium cursor-pointer"
                >
                  <span>{showDomainGuide ? 'Hide Guide' : 'Google Sign-In Setup'}</span>
                  {showDomainGuide ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              </div>

              {showDomainGuide && (
                <div className="pt-2 border-t border-[#242730] space-y-2.5 text-[11px]">
                  <p className="text-[#9da3b4] leading-relaxed">
                    Firebase requires each production domain to be whitelisted under <span className="text-white font-medium">Authorized domains</span> for Google Sign-in to function:
                  </p>

                  <div className="space-y-1.5 p-2 rounded-lg bg-[#111215] border border-[#292d37]">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[#656c80]">Domain to Whitelist:</span>
                      <button
                        type="button"
                        onClick={() => handleCopyText(SITE_CONFIG.productionDomain, 'domain')}
                        className="text-[10px] text-[#ff4f1a] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        {copiedKey === 'domain' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedKey === 'domain' ? 'Copied!' : 'Copy Domain'}</span>
                      </button>
                    </div>
                    <div className="font-mono text-white text-[11px] bg-[#1a1d24] px-2 py-1 rounded select-all break-all">
                      {SITE_CONFIG.productionDomain}
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-1">
                      <span className="text-[#656c80]">Firebase Project:</span>
                      <span className="font-mono text-zinc-300 text-[10px]">{SITE_CONFIG.firebaseProjectId}</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <a
                      href={SITE_CONFIG.firebaseAuthSettingsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-1.5 px-2.5 rounded-lg bg-[#222734] hover:bg-[#2b3242] text-white text-[11px] font-medium flex items-center justify-center gap-1.5 border border-[#374053] transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-[#ff4f1a]" />
                      <span>Open Firebase Authorized Domains Settings</span>
                    </a>
                    <span className="text-[10px] text-[#656c80] text-center">
                      Steps: Click Add domain &rarr; paste <code className="text-[#ff4f1a]">{SITE_CONFIG.productionDomain}</code> &rarr; click Save.
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-[#242730] w-full" />
            <span className="bg-[#14161a] px-3 text-[10px] text-[#656c80] uppercase tracking-wider">
              Or with email
            </span>
          </div>

          {/* Error notice */}
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-900/50 text-xs space-y-2.5">
              <div className="flex items-start gap-2 text-red-200">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{errorMsg}</span>
              </div>

              {domainWarning && (
                <div className="p-2.5 rounded-lg bg-black/40 border border-red-800/40 space-y-2 text-[11px]">
                  <div className="flex items-center justify-between text-zinc-300">
                    <span>Whitelist Domain:</span>
                    <button
                      type="button"
                      onClick={() => handleCopyText(SITE_CONFIG.productionDomain, 'alert-domain')}
                      className="text-[10px] text-[#ff4f1a] hover:underline flex items-center gap-1 cursor-pointer font-semibold"
                    >
                      {copiedKey === 'alert-domain' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedKey === 'alert-domain' ? 'Copied!' : 'Copy festofy.netlify.app'}</span>
                    </button>
                  </div>
                  <a
                    href={SITE_CONFIG.firebaseAuthSettingsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-1.5 px-2 rounded-md bg-[#252833] hover:bg-[#313645] text-white font-medium flex items-center justify-center gap-1.5 border border-[#3b4255] text-xs transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-[#ff4f1a]" />
                    <span>Open Firebase Console Settings</span>
                  </a>
                </div>
              )}

              <button
                type="button"
                onClick={handleInstantGoogleDemo}
                disabled={loading}
                className="w-full py-2 px-3 rounded-lg bg-[#ff4f1a] hover:bg-[#ff6838] text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50 shadow-md shadow-[#ff4f1a]/20"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Continue Instantly with Demo Google User</span>
              </button>
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

          {/* Quick Demo Credentials */}
          <div className="pt-4 border-t border-[#242730] space-y-2.5">
            <div className="flex items-center justify-between text-[11px] text-[#9da3b4]">
              <span className="font-mono uppercase font-semibold text-[10px] text-[#656c80]">Instant Test Sessions</span>
              <span className="text-[10px] text-[#ff4f1a] font-mono">1-Click Sign-In</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                disabled={loading}
                onClick={handleUseStudentDemo}
                className="p-2.5 rounded-xl bg-[#191b20] hover:bg-[#20232a] border border-[#2e3442] text-left transition-colors cursor-pointer group disabled:opacity-50"
              >
                <div className="flex items-center gap-1.5 text-xs font-semibold text-white group-hover:text-[#ff4f1a]">
                  <User className="w-3.5 h-3.5 text-[#ff4f1a]" />
                  <span>Student</span>
                </div>
                <div className="text-[10px] text-[#656c80] font-mono truncate mt-0.5">student@festofy.demo</div>
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={handleUseOrganizerDemo}
                className="p-2.5 rounded-xl bg-[#191b20] hover:bg-[#20232a] border border-[#2e3442] text-left transition-colors cursor-pointer group disabled:opacity-50"
              >
                <div className="flex items-center gap-1.5 text-xs font-semibold text-white group-hover:text-[#ff4f1a]">
                  <Sparkles className="w-3.5 h-3.5 text-[#ff4f1a]" />
                  <span>Organizer</span>
                </div>
                <div className="text-[10px] text-[#656c80] font-mono truncate mt-0.5">organizer@festofy.demo</div>
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={handleInstantGoogleDemo}
                className="p-2.5 rounded-xl bg-[#191b20] hover:bg-[#20232a] border border-[#2e3442] text-left transition-colors cursor-pointer group disabled:opacity-50"
              >
                <div className="flex items-center gap-1.5 text-xs font-semibold text-white group-hover:text-[#ff4f1a]">
                  <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>Google User</span>
                </div>
                <div className="text-[10px] text-[#656c80] font-mono truncate mt-0.5">Alex Chen (Google)</div>
              </button>
            </div>
          </div>
        </div>

        {/* Security and Account Guarantee Notice */}
        <div className="text-center p-3 rounded-xl bg-[#121316] border border-[#242730] text-[11px] text-[#656c80] flex items-center justify-center gap-2">
          <Shield className="w-3.5 h-3.5 text-[#ff4f1a]" />
          <span>Festofy Student Account: Explore competitions, manage entry passes, and represent your campus.</span>
        </div>

        {/* Link to Admin Login */}
        <div className="text-center text-xs text-[#656c80]">
          Are you a platform administrator?{' '}
          <Link to="/admin/login" className="text-[#ff4f1a] hover:underline font-semibold">
            Admin Console Sign In &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
};
