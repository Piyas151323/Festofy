import React from 'react';

interface AppTopBarProps {
  brand: React.ReactNode;
  /** Primary navigation (desktop only). */
  nav: React.ReactNode;
  /** Right-hand actions (desktop only). */
  actions: React.ReactNode;
  /** Hamburger button (mobile only). */
  trigger: React.ReactNode;
  /**
   * center: true-centred nav between brand and actions (public site).
   * start: nav follows the brand (dashboards with more links).
   */
  placement: 'center' | 'start';
  /** Viewport at which the desktop bar replaces the hamburger. */
  from: 'md' | 'lg';
  tone?: string;
}

// Full class names so Tailwind can see them.
const LAYOUT = {
  'center-md': {
    row: 'flex md:grid md:grid-cols-[1fr_auto_1fr]',
    nav: 'hidden md:flex',
    actions: 'hidden md:flex justify-self-end',
    trigger: 'ml-auto md:hidden'
  },
  'center-lg': {
    row: 'flex lg:grid lg:grid-cols-[1fr_auto_1fr]',
    nav: 'hidden lg:flex',
    actions: 'hidden lg:flex justify-self-end',
    trigger: 'ml-auto lg:hidden'
  },
  'start-md': {
    row: 'flex gap-6',
    nav: 'hidden md:flex min-w-0 flex-1',
    actions: 'hidden md:flex shrink-0',
    trigger: 'ml-auto md:hidden'
  },
  'start-lg': {
    row: 'flex gap-6',
    nav: 'hidden lg:flex min-w-0 flex-1',
    actions: 'hidden lg:flex shrink-0',
    trigger: 'ml-auto lg:hidden'
  }
} as const;

/** Sticky top bar shared by the public site and the student portal. */
export const AppTopBar: React.FC<AppTopBarProps> = ({
  brand,
  nav,
  actions,
  trigger,
  placement,
  from,
  tone = 'bg-[#090a0b]/90'
}) => {
  const l = LAYOUT[`${placement}-${from}` as keyof typeof LAYOUT];
  return (
    <header data-nav-root className={`sticky top-0 z-40 border-b border-[#242730]/90 backdrop-blur-xl ${tone}`}>
      <div className={`mx-auto h-14 w-full max-w-7xl items-center gap-3 px-3 sm:h-16 sm:px-6 lg:px-8 ${l.row}`}>
        <div className="min-w-0">{brand}</div>
        <nav aria-label="Primary" className={`items-center gap-1 ${l.nav}`}>
          {nav}
        </nav>
        <div className={`items-center gap-2 ${l.actions}`}>{actions}</div>
        <div className={l.trigger}>{trigger}</div>
      </div>
    </header>
  );
};
