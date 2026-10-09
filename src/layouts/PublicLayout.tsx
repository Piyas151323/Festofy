import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { CalendarDays, Compass, GraduationCap, Home, LayoutDashboard, ShieldCheck, Terminal, UserCircle, Building2, Clock } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { AppTopBar } from '../components/navigation/AppTopBar';
import { BrandLogo } from '../components/navigation/BrandLogo';
import { MenuButton, MobileDrawer } from '../components/navigation/MobileDrawer';
import { NavGroupList, TopNavLink } from '../components/navigation/NavLinks';
import { AccountMenu, DrawerAccount } from '../components/navigation/Account';
import { FOCUS_RING, NavEntry } from '../components/navigation/navUtils';

const navLinks: NavEntry[] = [
  { label: 'Home', to: '/', icon: Home, exact: true },
  { label: 'Fests', to: '/fests', icon: CalendarDays },
  { label: 'Events', to: '/events', icon: Compass }
];

export const PublicLayout: React.FC = () => {
  const { currentUser, isAuthenticated, isOrganizer, isAdmin, hasPendingOrgRequest, signOutUser } = useAuth();
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const close = () => setMenuOpen(false);

  const adminLink: NavEntry = { label: 'Admin Console', to: '/admin', icon: ShieldCheck };
  const organizerLink: NavEntry = { label: 'Organizer Console', to: '/organizer', icon: Terminal };
  const statusLink: NavEntry = { label: 'Application Status', to: '/organizer/status', icon: Clock };
  const studentLink: NavEntry = { label: 'Student Portal', to: '/dashboard', icon: GraduationCap };

  const primaryPortal = isAdmin
    ? adminLink
    : isOrganizer
    ? organizerLink
    : hasPendingOrgRequest
    ? statusLink
    : studentLink;

  const otherPortals = isAdmin
    ? [organizerLink, studentLink]
    : isOrganizer
    ? [studentLink]
    : [];

  const accountItems: NavEntry[] = [
    { label: 'View Profile', to: '/dashboard/profile', icon: UserCircle },
    { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard, exact: true },
    ...(hasPendingOrgRequest ? [{ label: 'Application Status', to: '/organizer/status', icon: Clock }] : []),
    ...otherPortals
  ];
  const roleLabel = isAdmin ? 'Admin' : isOrganizer ? 'Organizer' : hasPendingOrgRequest ? 'Applicant' : 'Student';

  const PrimaryIcon = primaryPortal.icon;
  const portalButton = (
    <Link
      to={primaryPortal.to}
      className={`inline-flex h-9 items-center gap-2 whitespace-nowrap rounded-lg border px-3.5 text-[13px] font-semibold transition-colors ${FOCUS_RING} ${
        isAdmin
          ? 'border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20'
          : 'border-[#2e3442] bg-[#1c1f26] text-white hover:bg-[#252a34]'
      }`}
    >
      <PrimaryIcon className="hidden h-4 w-4 lg:block" aria-hidden="true" />
      {primaryPortal.label}
    </Link>
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#090a0b] text-[#f4f5f7]">
      <AppTopBar
        placement="center"
        from="md"
        brand={<BrandLogo to="/" />}
        nav={navLinks.map((l) => (
          <TopNavLink key={l.to} item={l} pathname={pathname} />
        ))}
        actions={
          isAuthenticated ? (
            <>
              {portalButton}
              <AccountMenu
                user={currentUser}
                fallbackName="User"
                roleLabel={roleLabel}
                items={accountItems}
                onSignOut={() => signOutUser()}
              />
            </>
          ) : (
            <>
              <Link
                to="/organizer/apply"
                className={`hidden sm:inline-flex h-9 items-center rounded-lg border border-[#2e3442] bg-[#14161a] px-3 text-[13px] font-semibold text-[#f4f5f7] transition-colors hover:bg-[#1e222b] ${FOCUS_RING}`}
              >
                Join as Organizer
              </Link>
              <Link
                to="/auth"
                className={`inline-flex h-9 items-center rounded-lg px-3 text-[13px] font-medium text-[#c3c8d6] transition-colors hover:bg-white/5 hover:text-white ${FOCUS_RING}`}
              >
                Sign in
              </Link>
              <Link
                to="/auth?mode=signup"
                className={`inline-flex h-9 items-center rounded-lg bg-[#ff4f1a] px-4 text-[13px] font-semibold text-white transition-colors hover:bg-[#ff6838] ${FOCUS_RING}`}
              >
                Get started
              </Link>
            </>
          )
        }
        trigger={
          <MenuButton open={menuOpen} onClick={() => setMenuOpen(true)} controls="public-drawer" label="Open navigation menu" />
        }
      />

      <MobileDrawer
        id="public-drawer"
        open={menuOpen}
        onClose={close}
        label="Site navigation"
        closeAt={768}
        header={<BrandLogo to="/" onClick={close} />}
        footer={
          isAuthenticated ? (
            <DrawerAccount
              user={currentUser}
              fallbackName="User"
              roleLabel={roleLabel}
              onSignOut={async () => {
                close();
                await signOutUser();
              }}
            />
          ) : (
            <div className="grid gap-2">
              <Link
                to="/organizer/apply"
                onClick={close}
                className={`flex min-h-11 items-center justify-center rounded-lg border border-[#ff4f1a]/40 bg-[#ff4f1a]/10 text-[13px] font-semibold text-[#ff4f1a] transition-colors hover:bg-[#ff4f1a]/20 ${FOCUS_RING}`}
              >
                Join Festofy as Organizer
              </Link>
              <Link
                to="/auth?mode=signup"
                onClick={close}
                className={`flex min-h-11 items-center justify-center rounded-lg bg-[#ff4f1a] text-[13px] font-semibold text-white transition-colors hover:bg-[#ff6838] ${FOCUS_RING}`}
              >
                Get started (Student)
              </Link>
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/auth"
                  onClick={close}
                  className={`flex min-h-11 items-center justify-center rounded-lg border border-[#2e3442] text-[13px] font-semibold text-white transition-colors hover:bg-white/5 ${FOCUS_RING}`}
                >
                  Student Sign In
                </Link>
                <Link
                  to="/organizer/login"
                  onClick={close}
                  className={`flex min-h-11 items-center justify-center rounded-lg border border-[#2e3442] text-[13px] font-semibold text-white transition-colors hover:bg-white/5 ${FOCUS_RING}`}
                >
                  Organizer Login
                </Link>
              </div>
            </div>
          )
        }
      >
        <nav aria-label="Primary">
          <NavGroupList
            pathname={pathname}
            size="lg"
            onNavigate={close}
            groups={[
              { label: 'Browse', items: navLinks },
              {
                label: 'Organizer Hub',
                items: [
                  { label: 'Join as Organizer', to: '/organizer/apply', icon: Building2 },
                  { label: 'Organizer Console', to: '/organizer', icon: Terminal },
                  { label: 'Application Status', to: '/organizer/status', icon: Clock }
                ]
              },
              ...(isAuthenticated
                ? [{ label: 'Your portals', items: [primaryPortal, ...otherPortals] }]
                : [])
            ]}
          />
        </nav>
      </MobileDrawer>

      {/* Page Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Public Footer */}
      <footer className="border-t border-[#242730] bg-[#0c0d0e] py-10 mt-10 sm:mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Col 1 */}
            <div className="md:col-span-2 space-y-4">
              <BrandLogo to="/" />
              <p className="text-sm font-semibold text-white">
                Plan. Discover. Participate.
              </p>
              <p className="text-[13px] text-[#9da3b4] max-w-sm leading-relaxed">
                The modern event operations platform for student organizations. Built for collegiate tech clubs, cultural societies, and the ambitious students who make festivals happen.
              </p>
            </div>

            {/* Col 2 */}
            <div>
              <h4 className="text-[13px] font-bold text-white uppercase tracking-wider mb-4">
                Explore
              </h4>
              <ul className="space-y-2.5 text-[13px] text-[#9da3b4]">
                <li>
                  <Link to="/fests" className="hover:text-white transition-colors">
                    Festival Directory
                  </Link>
                </li>
                <li>
                  <Link to="/events" className="hover:text-white transition-colors">
                    Competitions & Events
                  </Link>
                </li>
                {isAuthenticated ? (
                  <>
                    <li>
                      <Link to="/dashboard" className="hover:text-white transition-colors">
                        Student Portal
                      </Link>
                    </li>
                    <li>
                      <Link to="/organizer" className="hover:text-white transition-colors">
                        Organizer Console
                      </Link>
                    </li>
                  </>
                ) : (
                  <>
                    <li>
                      <Link to="/auth" className="hover:text-white transition-colors">
                        Sign In
                      </Link>
                    </li>
                    <li>
                      <Link to="/organizer/apply" className="hover:text-white transition-colors">
                        Join as Organizer
                      </Link>
                    </li>
                    <li>
                      <Link to="/organizer/login" className="hover:text-white transition-colors">
                        Organizer Sign In
                      </Link>
                    </li>
                  </>
                )}
              </ul>
            </div>

            {/* Col 3 */}
            <div>
              <h4 className="text-[13px] font-bold text-white uppercase tracking-wider mb-4">
                Organizations
              </h4>
              <p className="text-[13px] text-[#9da3b4] leading-relaxed mb-3">
                Register your campus club, publish competitions, and manage festival logistics in a dedicated operations console.
              </p>
              <div className="flex flex-col gap-2.5 text-[13px] text-[#9da3b4]">
                <Link
                  to="/organizer/apply"
                  className="text-[#ff4f1a] hover:text-[#ff6838] font-semibold transition-colors"
                >
                  Join Festofy as Organizer &rarr;
                </Link>
                <Link to="/organizer/login" className="text-[#9da3b4] hover:text-white text-[13px] transition-colors">
                  Organizer Console Sign In
                </Link>
                <Link to="/admin/login" className="text-[#656c80] hover:text-[#9da3b4] text-[13px] transition-colors">
                  Platform Admin Sign In
                </Link>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-[#242730] flex flex-col sm:flex-row items-center justify-between gap-4 text-[13px] text-[#656c80]">
            <div>
              © 2026 Festofy. Built for Student Technology Competitions.
            </div>
            <div className="flex items-center gap-6">
              <span>Timezone: Asia/Dhaka (BST)</span>
              <span>All rights reserved</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
