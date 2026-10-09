import React, { useEffect, useRef } from 'react';
import { AlertTriangle, CheckCircle2, X, AlertCircle } from 'lucide-react';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'success' | 'warning' | 'primary';
  isLoading?: boolean;
  confirmDisabled?: boolean;
  children?: React.ReactNode;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'primary',
  isLoading = false,
  confirmDisabled = false,
  children
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          icon: <AlertTriangle className="w-5 h-5 text-red-400" />,
          iconBg: 'bg-red-950/60 border border-red-900/60',
          btnBg: 'bg-red-600 hover:bg-red-500 text-white shadow-sm shadow-red-600/30'
        };
      case 'success':
        return {
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
          iconBg: 'bg-emerald-950/60 border border-emerald-900/60',
          btnBg: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-600/30'
        };
      case 'warning':
        return {
          icon: <AlertCircle className="w-5 h-5 text-amber-400" />,
          iconBg: 'bg-amber-950/60 border border-amber-900/60',
          btnBg: 'bg-amber-600 hover:bg-amber-500 text-white shadow-sm shadow-amber-600/30'
        };
      default:
        return {
          icon: <AlertCircle className="w-5 h-5 text-[#ff4f1a]" />,
          iconBg: 'bg-[#191b20] border border-[#2e3442]',
          btnBg: 'bg-[#ff4f1a] hover:bg-[#ff6838] text-white shadow-sm shadow-[#ff4f1a]/30'
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs motion-safe:animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div
        className="fixed inset-0"
        onClick={() => {
          if (!isLoading) onClose();
        }}
      />
      <div
        ref={dialogRef}
        className="relative w-full max-w-md rounded-2xl border border-[#2e3442] bg-[#14161a] p-6 shadow-2xl space-y-4 z-10 motion-safe:animate-scale-in"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${styles.iconBg}`}>
              {styles.icon}
            </div>
            <div>
              <h3 id="confirm-dialog-title" className="font-heading text-base font-bold text-white">
                {title}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="p-1 rounded-lg text-[#656c80] hover:text-white hover:bg-[#1e222b] transition-colors cursor-pointer disabled:opacity-50"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {description && (
          <div className="text-xs text-[#9da3b4] leading-relaxed">
            {description}
          </div>
        )}

        {children && <div className="space-y-3">{children}</div>}

        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#242730]">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-[#9da3b4] hover:text-white bg-[#191b20] hover:bg-[#1e222b] border border-[#2e3442] transition-colors cursor-pointer disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading || confirmDisabled}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${styles.btnBg}`}
          >
            {isLoading ? 'Processing...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
