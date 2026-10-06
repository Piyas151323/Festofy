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
    <div className="flex flex-col items-center justify-center text-center p-12 rounded-2xl border border-dashed border-[#242730] bg-[#121316]/50 my-6">
      <div className="p-4 rounded-full bg-[#191b20] text-[#9da3b4] mb-4">
        {icon || <FolderSearch className="w-8 h-8 text-[#9da3b4]" />}
      </div>
      <h3 className="text-lg font-semibold text-[#f4f5f7] mb-1">{title}</h3>
      <p className="text-sm text-[#9da3b4] max-w-md mb-6">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#ff4f1a] hover:bg-[#ff6838] transition-colors rounded-lg shadow-sm"
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
  title = 'Something went wrong',
  message,
  onRetry
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-10 rounded-2xl border border-red-900/40 bg-red-950/10 my-6 max-w-2xl mx-auto">
      <div className="p-3 rounded-full bg-red-900/20 text-red-400 mb-4">
        <AlertCircle className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-sm text-red-200/80 mb-6 font-mono text-xs max-w-lg bg-black/40 p-3 rounded border border-red-900/30 overflow-auto">
        {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#242730] hover:bg-[#323744] transition-colors rounded-lg"
        >
          <RefreshCw className="w-4 h-4" /> Try Again
        </button>
      )}
    </div>
  );
};
