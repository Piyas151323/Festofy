import React, { useId } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useDialogFocus } from '../../hooks/useDialogFocus';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
  initialFocusRef?: React.RefObject<HTMLElement | null>;
  className?: string;
  hideCloseButton?: boolean;
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
  '2xl': 'max-w-4xl',
  full: 'max-w-[calc(100vw-2rem)] h-[calc(100vh-2rem)]',
};

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  closeOnBackdropClick = true,
  closeOnEscape = true,
  initialFocusRef,
  className = '',
  hideCloseButton = false,
}) => {
  const generatedId = useId();
  const titleId = `modal-title-${generatedId}`;
  const descId = `modal-desc-${generatedId}`;

  const containerRef = useDialogFocus<HTMLDivElement>({
    isOpen,
    onClose,
    closeOnEscape,
    initialFocusRef,
    lockScroll: true,
  });

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      data-modal-root
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity animate-in fade-in duration-150"
        aria-hidden="true"
        onClick={() => {
          if (closeOnBackdropClick) onClose();
        }}
      />

      {/* Modal Dialog Container */}
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        className={`relative w-full ${sizeClasses[size]} rounded-3xl bg-[#14161a] border border-[#2e3442] shadow-2xl overflow-hidden flex flex-col max-h-[92vh] z-10 animate-in fade-in zoom-in-95 duration-150 ${className}`}
      >
        {(title || !hideCloseButton) && (
          <div className="p-5 border-b border-[#242730] flex items-start justify-between gap-4 bg-[#14161a]">
            <div className="space-y-1 min-w-0 flex-1">
              {title && (
                <h2
                  id={titleId}
                  className="font-heading text-base sm:text-lg font-bold text-white tracking-tight"
                >
                  {title}
                </h2>
              )}
              {description && (
                <p id={descId} className="text-xs text-[#8a91a6] leading-relaxed">
                  {description}
                </p>
              )}
            </div>

            {!hideCloseButton && (
              <button
                type="button"
                data-dialog-close
                onClick={onClose}
                aria-label="Close dialog"
                className="w-8 h-8 rounded-xl bg-[#191b20] hover:bg-[#252830] border border-[#2e3442] text-[#8a91a6] hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4f1a]"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>,
    document.body
  );
};
