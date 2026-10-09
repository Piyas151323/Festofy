import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
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
import { NavGroupList, TopNavLink } from '../components/navigation/NavLinks';
import { AccountMenu, DrawerAccount } from '../components/navigation/Account';
import { NavEntry, NavGroup } from '../components/navigation/navUtils';

export const StudentLayout: React.FC = () => {
  const { currentUser, signOutUser, role } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const close = () => setMenuOpen(false);

  const isAdmin = role === 'admin';
  const isOrganizer = role === 'organizer';
  const roleLabel = isAdmin ? 'Admin' : isOrganizer ? 'Organizer' : 'Student';
  const isStudentOnly = !isAdmin && !isOrganizer;

  const handleSignOut = async () => {
    await signOutUser();
    navigate('/');
  };

  // Top navigation items: Dashboard, Events, My Registrations, Passes
  const topNavItems: NavEntry[] = [
    { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard, exact: true },
    { label: 'Events', to: '/events', icon: Compass },
    { label: 'My Registrations', to: '/dashboard/registrations', icon: CalendarCheck },
    { label: 'Passes', to: '/dashboard/passes', icon: Ticket, exact: true }
  ];

  const adminLinks: NavEntry[] = [
    { label: 'Admin Console', to: '/admin', icon: ShieldCheck },
    { label: 'Organizer Console', to: '/organizer', icon: Terminal }
  ];

  const organizerLinks: NavEntry[] = [
    { label: 'Organizer Console', to: '/organizer', icon: Terminal }
  ];

  // Account menu items
  const accountMenuItems: NavEntry[] = [
    { label: 'My Profile', to: '/dashboard/profile', icon: UserCircle },
    { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard, exact: true },
    { label: 'Organizations', to: '/dashboard/organizations', icon: Building2 },
    ...(isStudentOnly
      ? [{ label: 'Become an Organizer', to: '/dashboard/organizations/apply', icon: Compass }]
      : []),
    ...(isAdmin ? adminLinks : isOrganizer ? organizerLinks : [])
  ];

  // Drawer items
  const drawerPortalItems: NavEntry[] = [
    { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard, exact: true },
    { label: 'My Registrations', to: '/dashboard/registrations', icon: CalendarCheck },
    { label: 'Passes', to: '/dashboard/passes', icon: Ticket, exact: true },
    { label: 'History', to: '/dashboard/history', icon: History },
    { label: 'Profile', to: '/dashboard/profile', icon: UserCircle },
    { label: 'Organizations', to: '/dashboard/organizations', icon: Building2 },
    ...(isStudentOnly
      ? [{ label: 'Become an Organizer', to: '/dashboard/organizations/apply', icon: Compass }]
      : [])
  ];

  const drawerGroups: NavGroup[] = [
    { label: 'Student portal', items: drawerPortalItems },
    {
      label: 'Discover',
      items: [
        { label: 'Browse Fests', to: '/fests', icon: CalendarDays },
        { label: 'Events', to: '/events', icon: Compass }
      ]
    },
    ...(isAdmin
      ? [{ label: 'Switch console', items: adminLinks }]
      : isOrganizer
      ? [{ label: 'Switch console', items: organizerLinks }]
      : [])
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
            {topNavItems.map((item) => (
              <TopNavLink key={item.to} item={item} pathname={pathname} />
            ))}
          </div>
        }
        actions={
          <AccountMenu
            user={currentUser}
            fallbackName="Student"
            roleLabel={roleLabel}
            items={accountMenuItems}
            onSignOut={handleSignOut}
          />
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
