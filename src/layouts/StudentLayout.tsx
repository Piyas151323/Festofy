import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Compass,
  CalendarCheck,
  History,
  Building2,
  Ticket,
  CalendarDays,
  ShieldCheck,
  Terminal,
  UserCircle
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { AppTopBar } from '../components/navigation/AppTopBar';
import { BrandLogo } from '../components/navigation/BrandLogo';
import { MenuButton, MobileDrawer } from '../components/navigation/MobileDrawer';
import { NavGroupList } from '../components/navigation/NavLinks';
import { DashboardMenu } from '../components/navigation/DashboardMenu';
import { AccountMenu, DrawerAccount } from '../components/navigation/Account';
import { FOCUS_RING, NavEntry, NavGroup } from '../components/navigation/navUtils';

const dashboardItems: NavEntry[] = [
  { label: 'Overview', to: '/dashboard', icon: LayoutDashboard, exact: true },
  { label: 'My Registrations', to: '/dashboard/registrations', icon: CalendarCheck },
  { label: 'History', to: '/dashboard/history', icon: History },
  { label: 'Passes', to: '/dashboard/passes', icon: Ticket, exact: true }
];

export const StudentLayout: React.FC = () => {
  const { currentUser, signOutUser, role } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const close = () => setMenuOpen(false);

  const isAdmin = role === 'admin';
  const roleLabel = isAdmin ? 'Admin' : role === 'organizer' ? 'Organizer' : 'Student';

  const handleSignOut = async () => {
    await signOutUser();
    navigate('/');
  };

  const fests: NavEntry = { label: 'Browse Fests', to: '/fests', icon: CalendarDays };
  const adminLinks: NavEntry[] = [
    { label: 'Admin Console', to: '/admin', icon: ShieldCheck },
    { label: 'Organizer Console', to: '/organizer', icon: Terminal }
  ];

  const drawerGroups: NavGroup[] = [
    { label: 'Student portal', items: dashboardItems },
    { label: 'Discover', items: [fests, { label: 'Events', to: '/events', icon: Compass }] },
    ...(isAdmin ? [{ label: 'Switch console', items: adminLinks }] : [])
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#090a0b] text-[#f4f5f7] motion-safe:animate-page-enter">
      <AppTopBar
        placement="start"
        from="lg"
        tone="bg-[#0d0e11]/95"
        brand={<BrandLogo to="/" label="Student" />}
        nav={
          <div className="flex items-center gap-1">
            <DashboardMenu pathname={pathname} items={dashboardItems} />
            <Link
              to="/fests"
              className={`inline-flex h-10 items-center rounded-lg px-3 text-[13px] font-medium text-[#9da3b4] transition-all duration-200 hover:bg-white/5 hover:text-white ${FOCUS_RING}`}
            >
              Fests
            </Link>
            <Link
              to="/events"
              className={`inline-flex h-10 items-center rounded-lg px-3 text-[13px] font-medium text-[#9da3b4] transition-all duration-200 hover:bg-white/5 hover:text-white ${FOCUS_RING}`}
            >
              Events
            </Link>
          </div>
        }
        actions={
          <>
            <Link
              to={fests.to}
              className={`hidden xl:inline-flex h-10 items-center whitespace-nowrap rounded-lg px-3 text-[13px] font-medium text-[#9da3b4] transition-all duration-200 hover:bg-white/5 hover:text-white ${FOCUS_RING}`}
            >
              {fests.label}
            </Link>
            <AccountMenu
              user={currentUser}
              fallbackName="Student"
              roleLabel={roleLabel}
              items={[{ label: 'View Profile', to: '/dashboard/profile', icon: UserCircle }, { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard, exact: true }, ...(isAdmin ? adminLinks : [])]}
              onSignOut={handleSignOut}
            />
          </>
        }
        trigger={
          <MenuButton open={menuOpen} onClick={() => setMenuOpen(true)} controls="student-drawer" label="Open student menu" />
        }
      />

      <MobileDrawer
        id="student-drawer"
        open={menuOpen}
        onClose={close}
        label="Student menu"
        closeAt={1024}
        header={<BrandLogo to="/" label="Student" onClick={close} />}
        footer={
          <DrawerAccount
            user={currentUser}
            fallbackName="Student"
            roleLabel={roleLabel}
            onSignOut={async () => {
              close();
              await handleSignOut();
            }}
          />
        }
      >
        <nav aria-label="Student">
          <NavGroupList groups={drawerGroups} pathname={pathname} size="lg" onNavigate={close} />
        </nav>
      </MobileDrawer>

      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8">
        <Outlet />
      </main>
    </div>
  );
};
