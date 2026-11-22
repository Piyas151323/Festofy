import React, { useState } from 'react';
import { AlertCircle, RefreshCw, LogOut } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface AuthSyncErrorScreenProps {
  title?: string;
  error?: string | null;
  compact?: boolean;
}

export const AuthSyncErrorScreen: React.FC<AuthSyncErrorScreenProps> = ({
  title = 'Unable to Load Your Account',
  error,
  compact = false
}) => {
  const { authError, retryAuthSync, signOutUser } = useAuth();
  const [retrying, setRetrying] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const displayedError =
    error || authError || 'We could not read your profile and permissions from Firestore. Please retry.';

  const handleRetry = async () => {
    setRetrying(true);
    try {
      await retryAuthSync();
    } finally {
      setRetrying(false);
    }
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOutUser();
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <div className={compact ? 'w-full' : 'min-h-[70vh] flex items-center justify-center px-4 py-12'}>
      <div className={`w-full ${compact ? '' : 'max-w-md mx-auto'} rounded-2xl border border-red-900/50 bg-[#14161a] p-6 sm:p-8 space-y-5 shadow-2xl text-center`}>
        <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div className="space-y-1.5">
          <h2 className="font-heading text-xl font-bold text-white">{title}</h2>
          <p className="text-xs text-[#9da3b4] leading-relaxed">{displayedError}</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
          <button
            type="button"
            onClick={handleRetry}
            disabled={retrying || signingOut}
            className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-[#ff4f1a] hover:bg-[#ff6838] transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${retrying ? 'animate-spin' : ''}`} />
            <span>{retrying ? 'Retrying...' : 'Retry'}</span>
          </button>

          <button
            type="button"
            onClick={handleSignOut}
            disabled={retrying || signingOut}
            className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold text-[#9da3b4] hover:text-white bg-[#1e222b] hover:bg-[#252a34] border border-[#2e3442] transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{signingOut ? 'Signing out...' : 'Sign out'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
