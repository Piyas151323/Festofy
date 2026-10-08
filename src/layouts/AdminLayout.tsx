import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Users2,
  Inbox,
  Terminal,
  GraduationCap,
  Globe
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { ConsoleShell } from '../components/navigation/ConsoleShell';
import { NavGroup } from '../components/navigation/navUtils';

const groups: NavGroup[] = [
  { label: 'Overview', items: [{ label: 'Overview', to: '/admin', icon: LayoutDashboard, exact: true }] },
  {
    label: 'Organizations',
    items: [
      { label: 'Organization Requests', to: '/admin/organization-requests', icon: Inbox },
      { label: 'Organizations', to: '/admin/organizations', icon: Building2, soon: true }
    ]
  },
  { label: 'People', items: [{ label: 'User Directory', to: '/admin/users', icon: Users2, soon: true }] },
  {
    label: 'Switch portal',
    items: [
      { label: 'Organizer Console', to: '/organizer', icon: Terminal },
      { label: 'Student Portal', to: '/dashboard', icon: GraduationCap },
      { label: 'Public Directory', to: '/events', icon: Globe }
    ]
  }
];

export const AdminLayout: React.FC = () => {
  const { currentUser, signOutUser } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOutUser();
    navigate('/admin');
  };

  return (
    <ConsoleShell
      id="admin"
      brandTo="/admin"
      areaLabel="Admin Console"
      mobileLabel="Admin"
      accent="red"
      groups={groups}
      user={currentUser}
      fallbackName="Administrator"
      roleLabel="Admin"
      onSignOut={handleSignOut}
      pageBg="bg-[#090a0b]"
      sidebarBg="bg-[#101114]"
    />
  );
};
