import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { FOCUS_RING } from './navUtils';

interface MenuButtonProps {
  open: boolean;
  onClick: () => void;
  controls: string;
  label: string;
  className?: string;
}

/** 44×44 hamburger trigger shared by every mobile header. */
export const MenuButton: React.FC<MenuButtonProps> = ({ open, onClick, controls, label, className = '' }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={label}
    aria-expanded={open}
    aria-haspopup="dialog"
    aria-controls={controls}
    className={`grid h-11 w-11 shrink-0 place-items-center rounded-lg text-[#c3c8d6] transition-colors hover:bg-white/5 hover:text-white cursor-pointer ${FOCUS_RING} ${className}`}
  >
    <Menu className="h-5 w-5" aria-hidden="true" />
  </button>
);

interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
  /** Accessible name of the dialog. */
  label: string;
  id: string;
  /** Viewport width (px) at which the desktop navigation takes over. */
  closeAt: number;
  header: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

const FOCUSABLE = 'a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"])';

/**
 * Modal navigation drawer. Portaled to <body> so it is never trapped inside a
 * sticky/blurred header's stacking context. Handles Escape, backdrop click,
 * scroll lock, focus trap + restore, route changes and resize to desktop.
 */
export const MobileDrawer: React.FC<MobileDrawerProps> = ({
  open,
  onClose,
  label,
  id,
  closeAt,
  header,
  children,
  footer
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const { pathname } = useLocation();

  // Close on route change.
  useEffect(() => {
    closeRef.current();
  }, [pathname]);

  useEffect(() => {
    if (!open) return;

    const trigger = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const panel = panelRef.current;
    panel?.querySelector<HTMLElement>('[data-drawer-close]')?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeRef.current();
        return;
      }
      if (e.key !== 'Tab' || !panel) return;
      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || !panel.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (active === last || !panel.contains(active))) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);

    const mq = window.matchMedia(`(min-width: ${closeAt}px)`);
    const onChange = (e: MediaQueryListEvent) => e.matches && closeRef.current();
    mq.addEventListener('change', onChange);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      mq.removeEventListener('change', onChange);
      document.body.style.overflow = prevOverflow;
      trigger?.focus?.();
    };
  }, [open, closeAt]);

  if (!open) return null;

  return createPortal(
    <div data-nav-root className="fixed inset-0 z-[60]">
      <div
        className="nav-drawer-backdrop absolute inset-0 bg-black/70"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        id={id}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className="nav-drawer-panel absolute inset-y-0 right-0 flex w-[min(20rem,calc(100vw-3rem))] flex-col border-l border-[#242730] bg-[#0f1013] text-[#f4f5f7]"
      >
        <div className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-[#242730] pl-4 pr-1.5">
          <div className="min-w-0">{header}</div>
          <button
            type="button"
            data-drawer-close
            onClick={onClose}
            aria-label="Close menu"
            className={`grid h-11 w-11 shrink-0 place-items-center rounded-lg text-[#c3c8d6] transition-colors hover:bg-white/5 hover:text-white cursor-pointer ${FOCUS_RING}`}
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3">{children}</div>

        {footer && (
          <div className="shrink-0 border-t border-[#242730] p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};
