import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, GraduationCap, ShieldCheck, Terminal } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { BrandLogo } from './BrandLogo';
import { MobileDrawer } from './MobileDrawer';
import { DrawerBehavior, NavGroupList } from './NavLinks';
import { FestsPage } from '../../pages/public/FestsPage';
import { EventsPage } from '../../pages/public/EventsPage';
import { DrawerAccount } from './Account';
import { BROWSE_NAV, STUDENT_PORTAL_NAV } from './navConfig';
import { FOCUS_RING, NavEntry, NavGroup, isPathActive } from './navUtils';

interface SiteDrawerProps {
  open: boolean;
  onClose: () => void;
  id: string;
}

type DrawerView = 'menu' | 'fests' | 'events';

const VIEW_LABEL: Record<Exclude<DrawerView, 'menu'>, string> = { fests: 'Fests', events: 'Events' };

const adminLink: NavEntry = { label: 'Admin Console', to: '/admin', icon: ShieldCheck };
const organizerLink: NavEntry = { label: 'Organizer Console', to: '/organizer', icon: Terminal };
const statusLink: NavEntry = { label: 'Application Status', to: '/organizer/status', icon: Clock };
const studentPortalLink: NavEntry = { label: 'Student Portal', to: '/dashboard', icon: GraduationCap, exact: true };

const PROTECTED_AREAS = ['/dashboard', '/organizer', '/admin'];

/**
 * The one mobile navigation drawer, used by both the public site and the
 * student portal: Browse + Student Portal (+ console switching for staff),
 * with the account footer pinned at the bottom.
 */
export const SiteDrawer: React.FC<SiteDrawerProps> = ({ open, onClose, id }) => {
  const { currentUser, isAuthenticated, role, hasPendingOrgRequest, signOutUser } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const isAdmin = role === 'admin';
  const isOrganizer = role === 'organizer';
  const roleLabel = isAdmin ? 'Admin' : isOrganizer ? 'Organizer' : hasPendingOrgRequest ? 'Applicant' : 'Student';

  // Students always see the portal; staff see it while they are inside it.
  const inStudentPortal = isPathActive(pathname, '/dashboard');
  const showStudentPortal = isAuthenticated && (role === 'student' || inStudentPortal);

  const portalLinks: NavEntry[] = [];
  if (isAuthenticated) {
    if (isAdmin) portalLinks.push(adminLink, organizerLink);
    else if (isOrganizer) portalLinks.push(organizerLink);
    if ((isAdmin || isOrganizer) && !showStudentPortal) portalLinks.push(studentPortalLink);
    if (hasPendingOrgRequest && !isAdmin && !isOrganizer) portalLinks.push(statusLink);
  }

  const groups: NavGroup[] = [{ label: 'Browse', items: BROWSE_NAV }];
  if (showStudentPortal) groups.push({ label: 'Student Portal', items: STUDENT_PORTAL_NAV });
  if (portalLinks.length > 0) {
    groups.push({ label: showStudentPortal ? 'Switch console' : 'Your portals', items: portalLinks });
  }

  const [view, setView] = useState<DrawerView>('menu');
  const browsing = view !== 'menu';

  // Listings reuse the real pages, which set document.title; restore it when the view closes.
  const titleRef = useRef(document.title);
  useEffect(() => {
    if (!browsing) {
      titleRef.current = document.title;
      return;
    }
    return () => {
      document.title = titleRef.current;
    };
  }, [browsing]);

  const drawerBehavior: DrawerBehavior = {
    intercepts: (item) => !!item.drawerView,
    // While browsing, only the selected listing is highlighted.
    isActive: (item) => (browsing ? item.drawerView === view : undefined),
    onSelect: (item) => item.drawerView && setView(item.drawerView)
  };

  const handleSignOut = async () => {
    onClose();
    await signOutUser();
    if (PROTECTED_AREAS.some((p) => isPathActive(pathname, p))) navigate('/');
  };

  const accountFooter = isAuthenticated ? (
    <DrawerAccount user={currentUser} fallbackName="User" roleLabel={roleLabel} onSignOut={handleSignOut} />
  ) : (
    <div className="grid gap-2">
      <Link
        to="/auth?mode=signup"
        onClick={onClose}
        className={`flex min-h-11 items-center justify-center rounded-lg bg-[#ff4f1a] text-[13px] font-semibold text-white transition-colors hover:bg-[#ff6838] ${FOCUS_RING}`}
      >
        Get started
      </Link>
      <Link
        to="/auth"
        onClick={onClose}
        className={`flex min-h-11 items-center justify-center rounded-lg border border-[#2e3442] text-[13px] font-semibold text-[#c3c8d6] transition-colors hover:bg-white/5 hover:text-white ${FOCUS_RING}`}
      >
        Sign in
      </Link>
    </div>
  );

  return (
    <MobileDrawer
      id={id}
      open={open}
      onClose={onClose}
      onExited={() => setView('menu')}
      label="Site navigation"
      side="left"
      body="custom"
      widthClass={
        browsing
          ? 'w-screen md:w-[min(64rem,calc(100vw-3rem))]'
          : 'w-[min(20rem,calc(100vw-3rem))]'
      }
      header={<BrandLogo to="/" onClick={onClose} />}
    >
      {/* Navigation column: full width as a menu, a fixed side column beside the listing on md+. */}
      <div
        className={`min-h-0 flex-col ${
          browsing ? 'hidden md:flex md:w-72 md:shrink-0 md:border-r md:border-[#242730]' : 'flex w-full'
        }`}
      >
        <nav
          aria-label="Primary"
          className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain px-3 py-3"
        >
          <NavGroupList
            groups={groups}
            pathname={pathname}
            size="lg"
            onNavigate={onClose}
            drawer={drawerBehavior}
          />
        </nav>
        <div className="shrink-0 border-t border-[#242730] p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          {accountFooter}
        </div>
      </div>

      {browsing && (
        <section aria-label={`${VIEW_LABEL[view as 'fests' | 'events']} listing`} className="flex min-w-0 flex-1 flex-col">
          <div className="flex shrink-0 items-center gap-2 border-b border-[#242730] px-3 py-2">
            <button
              type="button"
              onClick={() => setView('menu')}
              className={`inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2.5 text-[13px] font-semibold text-[#c3c8d6] transition-colors hover:bg-white/5 hover:text-white cursor-pointer ${FOCUS_RING}`}
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Menu
            </button>
            <div role="group" aria-label="Browse" className="ml-auto flex rounded-lg bg-[#14161a] p-0.5">
              {(['fests', 'events'] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  aria-pressed={view === v}
                  onClick={() => setView(v)}
                  className={`min-h-10 rounded-md px-4 text-[13px] font-semibold transition-colors cursor-pointer ${FOCUS_RING} ${
                    view === v ? 'bg-[#1c1f26] text-white' : 'text-[#9da3b4] hover:text-white'
                  }`}
                >
                  {VIEW_LABEL[v]}
                </button>
              ))}
            </div>
          </div>
          {/* key resets scroll position when switching listings */}
          <div
            key={view}
            className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain pb-[env(safe-area-inset-bottom)]"
          >
            {view === 'fests' ? <FestsPage embedded /> : <EventsPage embedded />}
          </div>
        </section>
      )}
    </MobileDrawer>
  );
};
