import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  ShieldCheck,
  LayoutDashboard,
  Building2,
  Users2,
  Inbox,
  LogOut,
  Menu,
  X,
  ExternalLink,
  ChevronRight,
  ArrowLeft,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export const AdminLayout: React.FC = () => {
  const { currentUser, signOutUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const adminNavItems = [
    {
      label: 'Overview',
      path: '/admin',
      icon: LayoutDashboard,
      exact: true
    },
    {
      label: 'Organization Requests',
      path: '/admin/organization-requests',
      icon: Inbox,
      exact: false
    },
    {
      label: 'Organizations',
      path: '/admin/organizations',
      icon: Building2,
      comingSoon: true
    },
    {
      label: 'User Directory',
      path: '/admin/users',
      icon: Users2,
      comingSoon: true
    }
  ];

  const handleSignOut = async () => {
    await signOutUser();
    navigate('/admin');
  };

  const isLinkActive = (path: string, exact?: boolean) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen flex bg-[#090a0b] text-[#f4f5f7]">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-[#242730] bg-[#101114] shrink-0">
        {/* Brand Header */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-[#242730]">
          <Link to="/admin" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center font-heading font-black text-white text-base shadow-sm shadow-red-600/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-heading font-black text-sm tracking-tight text-white">
                FESTOFY
              </span>
              <span className="text-[10px] text-red-400 font-mono uppercase tracking-wider font-semibold">
                ADMIN CONSOLE
              </span>
            </div>
          </Link>
        </div>

        {/* Admin Badge */}
        <div className="p-3 mx-3 my-3 rounded-2xl bg-[#17191e] border border-[#272b35]">
          <div className="flex items-center justify-between text-[10px] text-[#656c80] uppercase tracking-wider font-mono font-semibold mb-1">
            <span>Access Tier</span>
            <span className="text-red-400 font-mono">ROOT</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs font-semibold text-white truncate">
              {currentUser?.displayName || 'Platform Administrator'}
            </span>
          </div>
          <div className="text-[10px] text-[#9da3b4] font-mono truncate mt-0.5">
            {currentUser?.email || ''}
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 space-y-1 py-1">
          {adminNavItems.map((item) => {
            const Icon = item.icon;
            const active = !item.comingSoon && isLinkActive(item.path, item.exact);

            if (item.comingSoon) {
              return (
                <div
                  key={item.label}
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium text-zinc-500 cursor-not-allowed select-none"
                  title="Upcoming feature"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 text-zinc-600" />
                    <span>{item.label}</span>
                  </div>
                  <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                    Soon
                  </span>
                </div>
              );
            }

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  active
                    ? 'bg-red-600 text-white shadow-sm font-semibold'
                    : 'text-[#9da3b4] hover:text-white hover:bg-[#181a20]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-[#656c80]'}`} />
                  <span>{item.label}</span>
                </div>
                {active && <ChevronRight className="w-3.5 h-3.5" />}
              </Link>
            );
          })}
        </nav>

        {/* Portal Switching & Sign Out */}
        <div className="p-3 border-t border-[#242730] space-y-1">
          <div className="px-2 py-1 text-[10px] font-mono text-[#656c80] uppercase tracking-wider font-semibold">
            Cross-Portal Access
          </div>
          <Link
            to="/organizer"
            className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-[#9da3b4] hover:text-white hover:bg-[#181a20] transition-colors"
          >
            <div className="flex flex-col">
              <span className="font-semibold text-white">Organizer Console</span>
              <span className="text-[10px] text-[#656c80]">Manage fests, events & clubs</span>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-[#ff4f1a]" />
          </Link>
          <Link
            to="/dashboard"
            className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-[#9da3b4] hover:text-white hover:bg-[#181a20] transition-colors"
          >
            <div className="flex flex-col">
              <span className="font-semibold text-white">Student Portal</span>
              <span className="text-[10px] text-[#656c80]">View entry passes & events</span>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-[#ff4f1a]" />
          </Link>
          <Link
            to="/events"
            className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-[#9da3b4] hover:text-white hover:bg-[#181a20] transition-colors"
          >
            <span className="truncate">Public Directory</span>
            <ExternalLink className="w-3.5 h-3.5 text-[#656c80]" />
          </Link>

          <button
            type="button"
            onClick={handleSignOut}
            className="w-full mt-2 flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-red-400 hover:text-white hover:bg-red-950/40 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="lg:hidden h-16 border-b border-[#242730] bg-[#101114] px-4 flex items-center justify-between sticky top-0 z-30">
          <Link to="/admin" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-red-600 flex items-center justify-center font-heading font-black text-white text-sm">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <span className="font-heading font-bold text-sm text-white">
              FESTOFY <span className="text-[10px] text-red-400 font-mono">ADMIN</span>
            </span>
          </Link>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl bg-[#17191e] border border-[#272b35] text-white cursor-pointer"
            aria-label="Toggle Navigation"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </header>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden p-4 border-b border-[#242730] bg-[#121316] space-y-2">
            {adminNavItems.map((item) => {
              if (item.comingSoon) return null;
              const Icon = item.icon;
              const active = isLinkActive(item.path, item.exact);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium ${
                    active ? 'bg-red-600 text-white font-semibold' : 'text-[#9da3b4] hover:bg-[#1a1d24]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
            <div className="pt-2 border-t border-[#242730] flex flex-col gap-2">
              <div className="text-[10px] font-mono text-[#656c80] uppercase tracking-wider font-semibold">
                Switch Portal
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <Link
                  to="/organizer"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-xl bg-[#17191e] border border-[#272b35] text-white text-center font-medium hover:bg-[#20232a]"
                >
                  Organizer Console
                </Link>
                <Link
                  to="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-xl bg-[#17191e] border border-[#272b35] text-white text-center font-medium hover:bg-[#20232a]"
                >
                  Student Portal
                </Link>
              </div>
              <div className="pt-2 flex justify-between items-center text-xs">
                <Link
                  to="/events"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-[#9da3b4] hover:text-white"
                >
                  Public Directory
                </Link>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="text-red-400 font-semibold"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
