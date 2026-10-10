import React from 'react';

interface AppTopBarProps {
  brand: React.ReactNode;
  /** Right-hand actions (account menu / sign-in), shown from md up. */
  actions: React.ReactNode;
  /** Menu button that opens the navigation drawer (all viewports). */
  trigger: React.ReactNode;
  tone?: string;
}

/** Compact sticky top bar shared by the public site and the student portal. */
export const AppTopBar: React.FC<AppTopBarProps> = ({ brand, actions, trigger, tone = 'bg-[#090a0b]/90' }) => (
  <header data-nav-root className={`sticky top-0 z-40 border-b border-[#242730]/90 backdrop-blur-xl ${tone}`}>
    <div className="mx-auto flex h-14 w-full max-w-7xl items-center gap-2 px-3 sm:h-16 sm:px-6 lg:px-8">
      <div className="shrink-0">{trigger}</div>
      <div className="min-w-0">{brand}</div>
      <div className="ml-auto hidden shrink-0 items-center gap-2 md:flex">{actions}</div>
    </div>
  </header>
);
