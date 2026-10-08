import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Compass,
  CalendarCheck,
  Building2,
  Ticket,
  CalendarDays,
  ShieldCheck,
  Terminal
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { AppTopBar } from '../components/navigation/AppTopBar';
import { BrandLogo } from '../components/navigation/BrandLogo';
import { MenuButton, MobileDrawer } from '../components/navigation/MobileDrawer';
import { NavGroupList, TopNavLink } from '../components/navigation/NavLinks';
import { AccountMenu, DrawerAccount } from '../components/navigation/Account';
import { FOCUS_RING, NavEntry, NavGroup } from '../components/navigation/navUtils';

const studentNavItems: NavEntry[] = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard, exact: true },
  { label: 'Explore Events', to: '/events', icon: Compass },
  { label: 'My Registrations', to: '/dashboard/registrations', icon: CalendarCheck },
  { label: 'Passes', to: '/dashboard/passes', icon: Ticket, exact: true },
  { label: 'Club Requests', to: '/dashboard/organizations', icon: Building2 }
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
    { label: 'Student portal', items: studentNavItems },
    { label: 'Discover', items: [fests] },
    ...(isAdmin ? [{ label: 'Switch console', items: adminLinks }] : [])
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#090a0b] text-[#f4f5f7]">
      <AppTopBar
        placement="start"
        from="lg"
        tone="bg-[#0d0e11]/95"
        brand={<BrandLogo to="/" label="Student" />}
        nav={
          <>
            <span aria-hidden="true" className="mx-2 h-5 w-px bg-[#242730]" />
            {studentNavItems.map((item) => (
              <TopNavLink key={item.to} item={item} pathname={pathname} showIcon />
            ))}
          </>
        }
        actions={
          <>
            <Link
              to={fests.to}
              className={`inline-flex h-9 items-center whitespace-nowrap rounded-lg px-3 text-[13px] font-medium text-[#9da3b4] transition-colors hover:bg-white/5 hover:text-white ${FOCUS_RING}`}
            >
              {fests.label}
            </Link>
            <AccountMenu
              user={currentUser}
              fallbackName="Student"
              roleLabel={roleLabel}
              items={isAdmin ? adminLinks : []}
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

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <Outlet />
      </main>
    </div>
  );
};
