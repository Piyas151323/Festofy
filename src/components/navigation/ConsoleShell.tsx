import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { MenuButton, MobileDrawer } from './MobileDrawer';
import { NavGroupList } from './NavLinks';
import { Avatar, DrawerAccount, NavUser } from './Account';
import { FOCUS_RING, NavAccent, NavGroup } from './navUtils';

interface ConsoleShellProps {
  id: string;
  brandTo: string;
  /** Area label shown under the wordmark, e.g. "Organizer Console". */
  areaLabel: string;
  /** Label shown in the compact mobile bar (defaults to areaLabel). */
  mobileLabel?: string;
  accent?: NavAccent;
  groups: NavGroup[];
  /** Content pinned above the nav in the sidebar (workspace switcher etc.). */
  sidebarTop?: React.ReactNode;
  /** Same, inside the mobile drawer. Receives a close callback. */
  drawerTop?: (close: () => void) => React.ReactNode;
  user: NavUser | null;
  fallbackName: string;
  roleLabel: string;
  onSignOut: () => void | Promise<void>;
  pageBg: string;
  sidebarBg: string;
  mainClassName?: string;
}

/**
 * Shared dashboard shell (sticky sidebar ≥1024px, compact bar + drawer below).
 * Used by the Organizer Console and Admin Panel so both keep one visual language.
 */
export const ConsoleShell: React.FC<ConsoleShellProps> = ({
  id,
  brandTo,
  areaLabel,
  mobileLabel,
  accent = 'orange',
  groups,
  sidebarTop,
  drawerTop,
  user,
  fallbackName,
  roleLabel,
  onSignOut,
  pageBg,
  sidebarBg,
  mainClassName = 'flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto'
}) => {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  const drawerId = `${id}-drawer`;

  return (
    <div className={`flex min-h-screen text-[#f4f5f7] ${pageBg}`}>
      {/* Desktop sidebar */}
      <aside
        data-nav-root
        className={`hidden w-64 shrink-0 flex-col border-r border-[#242730] lg:sticky lg:top-0 lg:flex lg:h-dvh ${sidebarBg}`}
      >
        <div className="flex h-16 shrink-0 items-center border-b border-[#242730] px-5">
          <BrandLogo to={brandTo} label={areaLabel} labelAccent={accent} layout="stacked" />
        </div>

        {sidebarTop && <div className="shrink-0 px-3 pt-3">{sidebarTop}</div>}

        <nav aria-label={areaLabel} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4">
          <NavGroupList groups={groups} pathname={pathname} accent={accent} />
        </nav>

        <div className="flex shrink-0 items-center gap-2.5 border-t border-[#242730] p-3">
          <Avatar name={user?.displayName} fallback={fallbackName[0]} />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-medium text-white" title={user?.displayName || fallbackName}>
              {user?.displayName || fallbackName}
            </div>
            <div className="truncate font-mono text-[10px] uppercase tracking-wider text-[#656c80]">{roleLabel}</div>
          </div>
          <button
            type="button"
            onClick={() => void onSignOut()}
            aria-label="Sign out"
            title="Sign out"
            className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg text-[#9da3b4] transition-colors hover:bg-red-950/40 hover:text-red-300 cursor-pointer ${FOCUS_RING}`}
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile / tablet bar */}
        <header
          data-nav-root
          className={`sticky top-0 z-30 flex h-14 items-center justify-between gap-2 border-b border-[#242730] pl-4 pr-1.5 lg:hidden ${sidebarBg}`}
        >
          <div className="min-w-0">
            <BrandLogo
              to={brandTo}
              label={mobileLabel ?? areaLabel}
              labelAccent={accent}
              layout="stacked"
              collapse
            />
          </div>
          <MenuButton
            open={open}
            onClick={() => setOpen(true)}
            controls={drawerId}
            label={`Open ${areaLabel} menu`}
          />
        </header>

        <MobileDrawer
          id={drawerId}
          open={open}
          onClose={close}
          label={`${areaLabel} menu`}
          closeAt={1024}
          header={<BrandLogo to={brandTo} label={areaLabel} labelAccent={accent} layout="stacked" onClick={close} />}
          footer={<DrawerAccount user={user} fallbackName={fallbackName} roleLabel={roleLabel} onSignOut={onSignOut} />}
        >
          {drawerTop && <div className="mb-4">{drawerTop(close)}</div>}
          <nav aria-label={areaLabel}>
            <NavGroupList groups={groups} pathname={pathname} accent={accent} size="lg" onNavigate={close} />
          </nav>
        </MobileDrawer>

        <main className={mainClassName}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};
