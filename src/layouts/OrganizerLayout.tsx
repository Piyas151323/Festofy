import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Terminal,
  CalendarDays,
  CalendarCheck2,
  Users2,
  BarChart3,
  LogOut,
  Menu,
  X,
  ChevronRight,
  ExternalLink,
  Building2,
  ChevronDown,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { OrganizerProvider, useOrganizer } from '../context/OrganizerContext';

const OrganizerLayoutInner: React.FC = () => {
  const { currentUser, signOutUser, role } = useAuth();
  const { organizations, activeOrganization, setActiveOrganization, loading: orgLoading } = useOrganizer();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [showOrgDropdown, setShowOrgDropdown] = useState(false);

  const organizerNav = [
    { label: 'Dashboard', path: '/organizer', icon: Terminal, exact: true },
    { label: 'Fests', path: '/organizer/fests', icon: CalendarDays },
    { label: 'Events', path: '/organizer/events', icon: CalendarCheck2 },
    { label: 'Participants', path: '/organizer/participants', icon: Users2 },
    { label: 'Analytics', path: '/organizer/analytics', icon: BarChart3 },
  ];

  const handleSignOut = async () => {
    await signOutUser();
    navigate('/');
  };

  const isLinkActive = (path: string, exact?: boolean) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen flex bg-[#0c0d0e] text-[#f4f5f7]">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-[#242730] bg-[#121316] shrink-0">
        {/* Brand */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-[#242730]">
          <Link to="/organizer" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#ff4f1a] flex items-center justify-center font-heading font-black text-white text-base shadow-sm">
              F
            </div>
            <div className="flex flex-col">
              <span className="font-heading font-black text-sm tracking-tight text-white">
                FESTOFY
              </span>
              <span className="text-[10px] text-[#ff4f1a] font-mono uppercase tracking-wider font-semibold">
                ORGANIZER CONSOLE
              </span>
            </div>
          </Link>
        </div>

        {/* Dynamic Active Organization Context */}
        <div className="p-3 mx-3 my-3 rounded-2xl bg-[#191b20] border border-[#2e3442] relative">
          <div className="flex items-center justify-between text-[10px] text-[#656c80] uppercase tracking-wider font-mono font-semibold mb-1.5">
            <span>Active Workspace</span>
            {organizations.length > 1 && (
              <span className="text-[#ff4f1a] font-mono">{organizations.length} clubs</span>
            )}
          </div>

          {orgLoading ? (
            <div className="flex items-center gap-2 py-1 animate-pulse">
              <div className="w-6 h-6 rounded-md bg-[#242730]" />
              <div className="h-3 w-28 bg-[#242730] rounded" />
            </div>
          ) : activeOrganization ? (
            <div>
              <div
                onClick={() => organizations.length > 1 && setShowOrgDropdown(!showOrgDropdown)}
                className={`flex items-center justify-between gap-2 ${
                  organizations.length > 1 ? 'cursor-pointer hover:opacity-90' : ''
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 rounded-md bg-[#ff4f1a]/20 border border-[#ff4f1a]/30 text-[#ff4f1a] flex items-center justify-center text-xs font-bold shrink-0">
                    {activeOrganization.name?.[0]?.toUpperCase() || 'O'}
                  </div>
                  <span className="text-xs font-semibold text-white truncate" title={activeOrganization.name}>
                    {activeOrganization.name}
                  </span>
                </div>
                {organizations.length > 1 && (
                  <ChevronDown className="w-3.5 h-3.5 text-[#656c80] shrink-0" />
                )}
              </div>

              {/* Multiple Organization Selector Dropdown */}
              {showOrgDropdown && organizations.length > 1 && (
                <div className="mt-2.5 pt-2 border-t border-[#2e3442] space-y-1">
                  <span className="text-[10px] text-[#656c80] block font-mono">Switch Workspace:</span>
                  {organizations.map((org) => (
                    <button
                      key={org.id}
                      type="button"
                      onClick={() => {
                        setActiveOrganization(org);
                        setShowOrgDropdown(false);
                      }}
                      className={`w-full text-left px-2 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                        org.id === activeOrganization.id
                          ? 'bg-[#ff4f1a]/15 text-[#ff4f1a] font-semibold'
                          : 'text-[#9da3b4] hover:text-white hover:bg-[#242730]'
                      }`}
                    >
                      <span className="truncate">{org.name}</span>
                      {org.id === activeOrganization.id && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#ff4f1a]" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="text-xs text-amber-400 font-medium py-0.5">
              No organization linked
            </div>
          )}
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-3 space-y-1 py-1">
          {organizerNav.map((item) => {
            const Icon = item.icon;
            const active = isLinkActive(item.path, item.exact);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  active
                    ? 'bg-[#ff4f1a] text-white shadow-sm font-semibold'
                    : 'text-[#9da3b4] hover:text-white hover:bg-[#1a1d24]'
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

        {/* Bottom Profile & Role Bar */}
        <div className="p-3 border-t border-[#242730] space-y-3">
          <div className="flex items-center justify-between px-2 pt-1">
            <div className="flex items-center gap-2 truncate">
              <div className="w-7 h-7 rounded-full bg-[#1e222b] text-[#ff4f1a] border border-[#2e3442] flex items-center justify-center text-xs font-bold shrink-0">
                {currentUser?.displayName?.[0]?.toUpperCase() || 'O'}
              </div>
              <div className="truncate">
                <div className="text-xs font-medium text-white truncate max-w-[110px]" title={currentUser?.displayName || 'Organizer'}>
                  {currentUser?.displayName || 'Organizer'}
                </div>
                <div className="text-[10px] text-[#656c80] uppercase tracking-wider font-mono">
                  {role}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSignOut}
              className="p-1.5 text-[#656c80] hover:text-white rounded-lg hover:bg-[#1e222b] cursor-pointer"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          <div className="pt-2 border-t border-[#242730] flex justify-between items-center text-[11px] text-[#9da3b4]">
            <Link to="/events" className="hover:text-white flex items-center gap-1 transition-colors">
              <ArrowLeft className="w-3 h-3 text-[#ff4f1a]" /> Back to Events
            </Link>
            <Link to="/dashboard" className="hover:text-white transition-colors">
              Student View
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Top Bar */}
        <header className="lg:hidden h-16 border-b border-[#242730] bg-[#121316] px-4 flex items-center justify-between sticky top-0 z-30">
          <Link to="/organizer" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#ff4f1a] flex items-center justify-center font-bold text-white text-sm">
              F
            </div>
            <div className="flex flex-col">
              <span className="font-heading font-black text-xs text-white">
                FESTOFY CONSOLE
              </span>
              {activeOrganization && (
                <span className="text-[10px] text-[#ff4f1a] font-mono truncate max-w-[140px]">
                  {activeOrganization.name}
                </span>
              )}
            </div>
          </Link>

          <button
            type="button"
            onClick={() => setMobileDrawerOpen(true)}
            className="p-2 text-[#9da3b4] hover:text-white cursor-pointer"
            aria-label="Open Organizer Menu"
          >
            <Menu className="w-6 h-6" />
          </button>
        </header>

        {/* Mobile Drawer */}
        {mobileDrawerOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div
              className="fixed inset-0 bg-black/75 backdrop-blur-sm"
              onClick={() => setMobileDrawerOpen(false)}
            />
            <div className="relative w-72 bg-[#121316] border-r border-[#242730] p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-[#242730] mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#ff4f1a] flex items-center justify-center font-black text-white text-xs">
                      F
                    </div>
                    <span className="font-heading font-bold text-sm text-white">
                      ORGANIZER CONSOLE
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMobileDrawerOpen(false)}
                    className="p-1 text-[#9da3b4] hover:text-white cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Mobile Active Workspace Context */}
                {activeOrganization && (
                  <div className="mb-4 p-3 rounded-xl bg-[#191b20] border border-[#2e3442] space-y-1">
                    <span className="text-[10px] text-[#656c80] uppercase font-mono block">Workspace</span>
                    <div className="text-xs font-semibold text-white truncate">
                      {activeOrganization.name}
                    </div>
                    {organizations.length > 1 && (
                      <div className="pt-2 border-t border-[#2e3442] space-y-1">
                        <span className="text-[10px] text-[#656c80] block font-mono">Switch:</span>
                        {organizations.map((org) => (
                          <button
                            key={org.id}
                            type="button"
                            onClick={() => {
                              setActiveOrganization(org);
                              setMobileDrawerOpen(false);
                            }}
                            className={`w-full text-left text-xs px-2 py-1 rounded truncate block ${
                              org.id === activeOrganization.id
                                ? 'bg-[#ff4f1a] text-white font-semibold'
                                : 'text-[#9da3b4] hover:bg-[#242730]'
                            }`}
                          >
                            {org.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <nav className="space-y-1">
                  {organizerNav.map((item) => {
                    const Icon = item.icon;
                    const active = isLinkActive(item.path, item.exact);
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setMobileDrawerOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium ${
                          active ? 'bg-[#ff4f1a] text-white font-semibold' : 'text-[#9da3b4] hover:bg-[#1a1d24]'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {item.label}
                      </Link>
                    );
                  })}
                </nav>
              </div>

              <div className="pt-4 border-t border-[#242730] space-y-3">
                <Link
                  to="/events"
                  onClick={() => setMobileDrawerOpen(false)}
                  className="block text-xs text-[#9da3b4] hover:text-white"
                >
                  ← Back to Events
                </Link>
                <Link
                  to="/dashboard"
                  onClick={() => setMobileDrawerOpen(false)}
                  className="block text-xs text-[#9da3b4] hover:text-white"
                >
                  Student View
                </Link>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="w-full text-left text-xs text-red-400 hover:text-red-300 py-1 cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Organizer Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export const OrganizerLayout: React.FC = () => {
  return (
    <OrganizerProvider>
      <OrganizerLayoutInner />
    </OrganizerProvider>
  );
};
