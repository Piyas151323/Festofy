import { useEffect, useRef } from 'react';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface UseDialogFocusOptions {
  isOpen: boolean;
  onClose?: () => void;
  closeOnEscape?: boolean;
  initialFocusRef?: React.RefObject<HTMLElement | null>;
  lockScroll?: boolean;
}

/**
 * Shared focus-management and accessibility hook for modal dialogs and drawers.
 * Extracted from MobileDrawer pattern with support for:
 * - Focus trapping (Tab & Shift+Tab cycle within dialog)
 * - Initial focus targeting
 * - Restoring focus to previous activeElement on close
 * - Escape key dismissal
 * - Background scroll locking
 */
export function useDialogFocus<T extends HTMLElement = HTMLDivElement>({
  isOpen,
  onClose,
  closeOnEscape = true,
  initialFocusRef,
  lockScroll = true,
}: UseDialogFocusOptions) {
  const containerRef = useRef<T | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;

    // 1. Capture previously focused element to restore on teardown
    const triggerElement = document.activeElement as HTMLElement | null;

    // 2. Lock background scroll
    const previousOverflow = document.body.style.overflow;
    if (lockScroll) {
      document.body.style.overflow = 'hidden';
    }

    const container = containerRef.current;

    // 3. Set initial focus
    const timer = window.setTimeout(() => {
      if (!container) return;
      if (initialFocusRef?.current) {
        initialFocusRef.current.focus();
      } else {
        const preferred = container.querySelector<HTMLElement>(
          '[data-autofocus], [data-dialog-close], button:not([disabled]), input:not([disabled])'
        );
        preferred?.focus();
      }
    }, 20);

    // 4. Trap focus and handle escape key
    const handleKeyDown = (e: KeyboardEvent) => {
      if (closeOnEscape && e.key === 'Escape') {
        e.preventDefault();
        onCloseRef.current?.();
        return;
      }

      if (e.key !== 'Tab' || !container) return;

      const focusable = Array.from(
        container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      ).filter((el) => el.offsetParent !== null || el.getClientRects().length > 0);

      if (focusable.length === 0) {
        e.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (e.shiftKey) {
        if (active === first || !container.contains(active)) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (active === last || !container.contains(active)) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('keydown', handleKeyDown);
      if (lockScroll) {
        document.body.style.overflow = previousOverflow;
      }
      // Restore focus to trigger
      triggerElement?.focus?.();
    };
  }, [isOpen, closeOnEscape, lockScroll, initialFocusRef]);

  return containerRef;
}
