import {
  CalendarCheck,
  CalendarDays,
  Compass,
  History,
  Home,
  LayoutDashboard,
  Ticket,
  UserCircle
} from 'lucide-react';
import type { NavEntry } from './navUtils';

/**
 * Single source of truth for the navigation items shared by the public site
 * and the student portal (desktop bars and the unified mobile drawer).
 * Routes here mirror the route table in App.tsx.
 */
export const BROWSE_NAV: NavEntry[] = [
  { label: 'Home', to: '/', icon: Home, exact: true },
  { label: 'Fests', to: '/fests', icon: CalendarDays, drawerView: 'fests' },
  { label: 'Events', to: '/events', icon: Compass, drawerView: 'events' }
];

export const STUDENT_PORTAL_NAV: NavEntry[] = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard, exact: true },
  // Prefix match so /dashboard/registrations/:id keeps this item active.
  { label: 'My Registrations', to: '/dashboard/registrations', icon: CalendarCheck },
  { label: 'Passes', to: '/dashboard/passes', icon: Ticket, exact: true },
  { label: 'History', to: '/dashboard/history', icon: History },
  { label: 'Profile', to: '/dashboard/profile', icon: UserCircle }
];
