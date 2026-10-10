import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
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
  /** Viewport width (px) at which a desktop navigation takes over. Omit when the drawer is used at every size. */
  closeAt?: number;
  /** Edge the drawer slides in from. */
  side?: 'left' | 'right';
  /** Tailwind width classes for the panel (animated when they change). */
  widthClass?: string;
  /** 'scroll' (default): children scroll inside a padded body. 'custom': children own their layout and footer. */
  body?: 'scroll' | 'custom';
  /** Called after the closing animation finished and the drawer unmounted. */
  onExited?: () => void;
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
  side = 'right',
  widthClass = 'w-[min(20rem,calc(100vw-3rem))]',
  body = 'scroll',
  onExited,
  header,
  children,
  footer
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const onExitedRef = useRef(onExited);
  onExitedRef.current = onExited;
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const pushedRef = useRef(false);
  const pendingNavRef = useRef<string | null>(null);

  // Keep the panel mounted briefly after `open` turns false so it can slide out.
  const [mounted, setMounted] = useState(open);
  useEffect(() => {
    if (open) {
      setMounted(true);
      return;
    }
    const timer = window.setTimeout(() => {
      setMounted(false);
      onExitedRef.current?.();
    }, 180);
    return () => window.clearTimeout(timer);
  }, [open]);

  // Close on route change.
  useEffect(() => {
    closeRef.current();
  }, [pathname]);

  // Android back button: opening the drawer adds one history entry so Back
  // closes the drawer instead of leaving the page. Link taps inside the drawer
  // pop that entry first and then navigate, so no duplicate entry is left behind.
  useEffect(() => {
    if (!open) return;

    window.history.pushState({ ...(window.history.state ?? {}), __navDrawer: true }, '');
    pushedRef.current = true;

    const onPop = () => {
      pushedRef.current = false;
      const to = pendingNavRef.current;
      pendingNavRef.current = null;
      closeRef.current();
      if (to) navigate(to);
    };
    window.addEventListener('popstate', onPop);

    return () => {
      window.removeEventListener('popstate', onPop);
      const to = pendingNavRef.current;
      pendingNavRef.current = null;
      if (pushedRef.current && window.history.state?.__navDrawer) {
        pushedRef.current = false;
        if (to) window.addEventListener('popstate', () => navigate(to), { once: true });
        window.history.back();
      } else if (to) {
        navigate(to);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handlePanelClickCapture = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const anchor = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href]');
    if (!anchor || anchor.hasAttribute('data-drawer-keep')) return;
    if (anchor.target === '_blank' || anchor.hasAttribute('download')) return;
    if (anchor.origin !== window.location.origin) return;
    const to = anchor.pathname + anchor.search + anchor.hash;
    e.preventDefault();
    const here = window.location.pathname + window.location.search + window.location.hash;
    pendingNavRef.current = to === here ? null : to;
    closeRef.current();
  };

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
      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.getClientRects().length > 0
      );
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

    const mq = closeAt ? window.matchMedia(`(min-width: ${closeAt}px)`) : null;
    const onChange = (e: MediaQueryListEvent) => e.matches && closeRef.current();
    mq?.addEventListener('change', onChange);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      mq?.removeEventListener('change', onChange);
      document.body.style.overflow = prevOverflow;
      trigger?.focus?.();
    };
  }, [open, closeAt]);

  if (!open && !mounted) return null;
  const closing = !open;
  const edge = side === 'left' ? 'left-0 border-r' : 'right-0 border-l';

  return createPortal(
    <div
      data-nav-root
      className={`fixed inset-0 z-[60] overflow-hidden overscroll-none ${closing ? 'pointer-events-none' : ''}`}
    >
      <div
        data-closing={closing}
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
        data-side={side}
        data-closing={closing}
        onClickCapture={handlePanelClickCapture}
        className={`nav-drawer-panel absolute top-0 ${edge} flex h-dvh max-h-full max-w-full flex-col overflow-hidden border-[#242730] bg-[#0f1013] text-[#f4f5f7] transition-[width] duration-200 ease-out motion-reduce:transition-none ${widthClass}`}
      >
        <div className="flex min-h-14 shrink-0 items-center justify-between gap-2 border-b border-[#242730] pl-4 pr-[max(0.375rem,env(safe-area-inset-right))] pt-[env(safe-area-inset-top)]">
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

        {body === 'custom' ? (
          <div className="flex min-h-0 flex-1">{children}</div>
        ) : (
          <>
            <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain px-3 py-3">{children}</div>
            {footer && (
              <div className="shrink-0 border-t border-[#242730] p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pr-[max(0.75rem,env(safe-area-inset-right))]">
                {footer}
              </div>
            )}
          </>
        )}
      </div>
    </div>,
    document.body
  );
};
