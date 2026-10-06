import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Compass, CalendarCheck, Building2, LogOut, Menu, X, ExternalLink } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export const StudentLayout: React.FC = () => {
  const { currentUser, signOutUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const studentNavItems = [
    {
      label: 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
      isActive: (pathname: string) => pathname === '/dashboard'
    },
    {
      label: 'Explore Events',
      path: '/events',
      icon: Compass,
      isActive: (pathname: string) => pathname.startsWith('/events')
    },
    {
      label: 'My Registrations',
      path: '/dashboard/registrations',
      icon: CalendarCheck,
      isActive: (pathname: string) => pathname.startsWith('/dashboard/registrations')
    },
    {
      label: 'Club Requests',
      path: '/dashboard/organizations',
      icon: Building2,
      isActive: (pathname: string) => pathname.startsWith('/dashboard/organizations')
    },
  ];

  const handleSignOut = async () => {
    await signOutUser();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#090a0b] text-[#f4f5f7]">
      {/* Student Header */}
      <header className="sticky top-0 z-30 bg-[#121316] border-b border-[#242730]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-[#ff4f1a] flex items-center justify-center font-heading font-black text-white text-base">
                F
              </div>
              <span className="font-heading font-bold text-lg text-white">
                FESTOFY <span className="text-xs px-2 py-0.5 ml-1 rounded bg-[#ff4f1a]/20 text-[#ff4f1a] font-mono">STUDENT</span>
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1 pl-4 border-l border-[#242730]">
              {studentNavItems.map((item) => {
                const Icon = item.icon;
                const active = item.isActive(location.pathname);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      active
                        ? 'bg-[#1e222b] text-white font-semibold'
                        : 'text-[#9da3b4] hover:text-white hover:bg-[#191b20]'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${active ? 'text-[#ff4f1a]' : 'text-[#656c80]'}`} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <Link
              to="/fests"
              className="text-xs text-[#9da3b4] hover:text-white flex items-center gap-1"
            >
              Browse Fests <ExternalLink className="w-3 h-3" />
            </Link>

            {/* User Details */}
            <div className="flex items-center gap-3 pl-3 border-l border-[#242730]">
              <div className="w-8 h-8 rounded-full bg-[#1e222b] border border-[#2e3442] flex items-center justify-center text-xs font-bold text-[#ff4f1a]">
                {currentUser?.displayName?.[0]?.toUpperCase() || 'S'}
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xs font-medium text-white truncate max-w-[120px]">
                  {currentUser?.displayName || 'Student'}
                </span>
                <span className="text-[10px] text-[#656c80] truncate max-w-[120px]">
                  {currentUser?.email}
                </span>
              </div>
              <button
                onClick={handleSignOut}
                className="p-1.5 text-[#656c80] hover:text-white rounded hover:bg-[#1e222b] cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Mobile menu toggle */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-[#9da3b4] hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-[#242730] bg-[#14161a] p-4 space-y-2">
            {studentNavItems.map((item) => {
              const Icon = item.icon;
              const active = item.isActive(location.pathname);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${
                    active ? 'bg-[#ff4f1a] text-white' : 'text-[#9da3b4] hover:bg-[#1e222b]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
            <div className="pt-3 border-t border-[#242730] flex justify-between items-center text-xs text-[#9da3b4]">
              <Link to="/fests" className="hover:text-white">
                Public Directory
              </Link>
              <button onClick={handleSignOut} className="text-red-400 hover:text-red-300">
                Sign Out
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Student Portal Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
};
