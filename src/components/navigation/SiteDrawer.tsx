import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Clock, GraduationCap, ShieldCheck, Terminal } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { BrandLogo } from './BrandLogo';
import { MobileDrawer } from './MobileDrawer';
import { NavGroupList } from './NavLinks';
import { DrawerAccount } from './Account';
import { BROWSE_NAV, STUDENT_PORTAL_NAV } from './navConfig';
import { FOCUS_RING, NavEntry, NavGroup, isPathActive } from './navUtils';

interface SiteDrawerProps {
  open: boolean;
  onClose: () => void;
  id: string;
  /** Viewport width (px) at which the desktop navigation takes over. */
  closeAt: number;
}

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
export const SiteDrawer: React.FC<SiteDrawerProps> = ({ open, onClose, id, closeAt }) => {
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

  const handleSignOut = async () => {
    onClose();
    await signOutUser();
    if (PROTECTED_AREAS.some((p) => isPathActive(pathname, p))) navigate('/');
  };

  return (
    <MobileDrawer
      id={id}
      open={open}
      onClose={onClose}
      label="Site navigation"
      closeAt={closeAt}
      header={<BrandLogo to="/" onClick={onClose} />}
      footer={
        isAuthenticated ? (
          <DrawerAccount
            user={currentUser}
            fallbackName="User"
            roleLabel={roleLabel}
            onSignOut={handleSignOut}
          />
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
        )
      }
    >
      <nav aria-label="Primary">
        <NavGroupList groups={groups} pathname={pathname} size="lg" onNavigate={onClose} />
      </nav>
    </MobileDrawer>
  );
};
