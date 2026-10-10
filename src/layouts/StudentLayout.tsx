import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ShieldCheck, Terminal, UserCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { AppTopBar } from '../components/navigation/AppTopBar';
import { BrandLogo } from '../components/navigation/BrandLogo';
import { MenuButton } from '../components/navigation/MobileDrawer';
import { SiteDrawer } from '../components/navigation/SiteDrawer';
import { AccountMenu } from '../components/navigation/Account';
import { NavEntry } from '../components/navigation/navUtils';

export const StudentLayout: React.FC = () => {
  const { currentUser, signOutUser, role } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const close = () => setMenuOpen(false);

  const isAdmin = role === 'admin';
  const isOrganizer = role === 'organizer';
  const roleLabel = isAdmin ? 'Admin' : isOrganizer ? 'Organizer' : 'Student';

  const handleSignOut = async () => {
    await signOutUser();
    navigate('/');
  };

  const adminLinks: NavEntry[] = [
    { label: 'Admin Console', to: '/admin', icon: ShieldCheck },
    { label: 'Organizer Console', to: '/organizer', icon: Terminal }
  ];

  const organizerLinks: NavEntry[] = [
    { label: 'Organizer Console', to: '/organizer', icon: Terminal }
  ];

  // Account menu items (laptop view)
  const accountMenuItems: NavEntry[] = [
    { label: 'My Profile', to: '/dashboard/profile', icon: UserCircle },
    { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard, exact: true },
    ...(isAdmin ? adminLinks : isOrganizer ? organizerLinks : [])
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#090a0b] text-[#f4f5f7] motion-safe:animate-page-enter">
      <AppTopBar
        tone="bg-[#0d0e11]/95"
        brand={<BrandLogo to="/" label="Student" />}
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
          <MenuButton open={menuOpen} onClick={() => setMenuOpen(true)} controls="student-drawer" label="Open navigation menu" />
        }
      />

      <SiteDrawer id="student-drawer" open={menuOpen} onClose={close} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8">
        <Outlet />
      </main>
    </div>
  );
};
