import React from 'react';
import { AlertCircle, RefreshCw, FolderSearch } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionLabel,
  onAction,
  icon
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 sm:p-12 rounded-2xl border border-dashed border-[#242730] bg-[#121316]/50 my-6 max-w-xl mx-auto">
      <div className="p-3.5 rounded-2xl bg-[#191b20] border border-[#2e3442] text-[#9da3b4] mb-4">
        {icon || <FolderSearch className="w-6 h-6 text-[#9da3b4]" />}
      </div>
      <h3 className="font-heading text-base sm:text-lg font-bold text-white mb-1.5">{title}</h3>
      <p className="text-xs sm:text-sm text-[#9da3b4] max-w-sm mb-5 leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#ff4f1a] hover:bg-[#ff6838] transition-colors rounded-xl shadow-sm shadow-[#ff4f1a]/20 cursor-pointer"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Unable to complete request',
  message,
  onRetry
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 sm:p-10 rounded-2xl border border-red-900/40 bg-[#14161a] my-6 max-w-xl mx-auto space-y-3">
      <div className="p-3 rounded-2xl bg-red-950/50 border border-red-900/50 text-red-400">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h3 className="font-heading text-base sm:text-lg font-bold text-white">{title}</h3>
      <p className="text-xs text-[#9da3b4] max-w-md leading-relaxed">
        {message}
      </p>
      {onRetry && (
        <div className="pt-2">
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#191b20] hover:bg-[#20232a] border border-[#2e3442] transition-colors rounded-xl cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Try Again
          </button>
        </div>
      )}
    </div>
  );
};
