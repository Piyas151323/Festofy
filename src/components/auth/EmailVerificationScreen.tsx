import React, { useState } from 'react';
import {
  MailCheck,
  RefreshCw,
  Send,
  LogOut,
  AlertCircle,
  CheckCircle2,
  Mail
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface EmailVerificationScreenProps {
  title?: string;
  subtitle?: string;
  onVerified?: () => void;
  onSignedOut?: () => void;
  compact?: boolean;
}

export const EmailVerificationScreen: React.FC<EmailVerificationScreenProps> = ({
  title = 'Verify Your Email Address',
  subtitle,
  onVerified,
  onSignedOut,
  compact = false
}) => {
  const {
    firebaseUser,
    verificationNotice,
    verificationError,
    resendVerificationEmail,
    checkEmailVerification,
    signOutUser,
    clearVerificationMessages
  } = useAuth();

  const [checking, setChecking] = useState(false);
  const [resending, setResending] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleCheckVerification = async () => {
    setLocalError(null);
    clearVerificationMessages();
    setChecking(true);
    try {
      const verified = await checkEmailVerification();
      if (verified && onVerified) {
        onVerified();
      }
    } catch (err: any) {
      setLocalError(err?.message || 'Unable to check verification status right now. Please try again.');
    } finally {
      setChecking(false);
    }
  };

  const handleResend = async () => {
    setLocalError(null);
    clearVerificationMessages();
    setResending(true);
    try {
      await resendVerificationEmail();
    } catch (err: any) {
      setLocalError(err?.message || 'Could not resend verification email. Please try again shortly.');
    } finally {
      setResending(false);
    }
  };

  const handleSignOut = async () => {
    setLocalError(null);
    setSigningOut(true);
    try {
      await signOutUser();
      if (onSignedOut) {
        onSignedOut();
      }
    } catch (err: any) {
      setLocalError(err?.message || 'Unable to sign out right now.');
    } finally {
      setSigningOut(false);
    }
  };

  const displayedError = localError || verificationError;

  return (
    <div className={compact ? 'w-full' : 'min-h-[75vh] flex items-center justify-center px-4 py-12'}>
      <div className={`w-full ${compact ? '' : 'max-w-md mx-auto'} rounded-2xl border border-[#242730] bg-[#14161a] p-6 sm:p-8 space-y-6 shadow-2xl`}>
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#ff4f1a]/15 border border-[#ff4f1a]/30 text-[#ff4f1a] flex items-center justify-center mx-auto">
            <MailCheck className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <h2 className="font-heading text-xl sm:text-2xl font-extrabold text-white">
              {title}
            </h2>
            <p className="text-xs sm:text-sm text-[#9da3b4] leading-relaxed">
              {subtitle ||
                'Please verify your email address before accessing dashboards, registering for events, or submitting applications.'}
            </p>
          </div>
        </div>

        {firebaseUser?.email && (
          <div className="p-3.5 rounded-xl bg-[#101216] border border-[#242730] flex items-center gap-3 text-xs">
            <Mail className="w-4 h-4 text-[#ff4f1a] shrink-0" />
            <div className="min-w-0">
              <p className="text-[11px] text-[#656c80] uppercase font-mono">Signed in as</p>
              <p className="text-white font-semibold truncate">{firebaseUser.email}</p>
            </div>
          </div>
        )}

        {verificationNotice && (
          <div
            role="status"
            aria-live="polite"
            className="p-3.5 rounded-xl bg-emerald-950/35 border border-emerald-800/50 flex items-start gap-2.5 text-xs text-emerald-200"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{verificationNotice}</span>
          </div>
        )}

        {displayedError && (
          <div
            role="alert"
            aria-live="assertive"
            className="p-3.5 rounded-xl bg-red-950/40 border border-red-900/50 flex items-start gap-2.5 text-xs text-red-200"
          >
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{displayedError}</span>
          </div>
        )}

        <div className="p-3.5 rounded-xl bg-[#191b20] border border-[#242730] text-[11px] text-[#9da3b4] leading-relaxed space-y-1">
          <p className="font-semibold text-white">Next steps</p>
          <p>
            Open the verification link in your inbox (check spam/promotions if missing). Once verified, click{' '}
            <span className="text-white font-semibold">I’ve verified my email</span> below or refresh this page.
          </p>
        </div>

        <div className="space-y-2.5">
          <button
            type="button"
            onClick={handleCheckVerification}
            disabled={checking || resending || signingOut}
            className="w-full py-3 px-4 rounded-xl text-xs font-bold text-white bg-[#ff4f1a] hover:bg-[#ff6838] transition-colors shadow-lg shadow-[#ff4f1a]/20 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
            <span>{checking ? 'Checking verification status...' : 'I’ve verified my email'}</span>
          </button>

          <button
            type="button"
            onClick={handleResend}
            disabled={checking || resending || signingOut}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-[#1e222b] hover:bg-[#252a34] border border-[#2e3442] transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5 text-[#ff4f1a]" />
            <span>{resending ? 'Sending verification email...' : 'Resend verification email'}</span>
          </button>

          <button
            type="button"
            onClick={handleSignOut}
            disabled={checking || resending || signingOut}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-[#9da3b4] hover:text-white bg-transparent hover:bg-[#191b20] border border-[#242730] transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{signingOut ? 'Signing out...' : 'Sign out'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
