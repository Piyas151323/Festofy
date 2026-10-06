import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export const PublicLayout: React.FC = () => {
  const { currentUser, isAuthenticated, isOrganizer, signOutUser } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: 'Fests', path: '/fests' },
    { label: 'Events', path: '/events' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#090a0b] text-[#f4f5f7]">
      {/* Main Public Header */}
      <header className="sticky top-0 z-40 bg-[#090a0b]/90 backdrop-blur-md border-b border-[#242730]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#ff4f1a] to-[#ff6838] flex items-center justify-center font-heading font-black text-white text-base shadow-sm">
              F
            </div>
            <div className="flex flex-col">
              <span className="font-heading font-extrabold text-xl tracking-tight text-white group-hover:text-[#ff4f1a] transition-colors">
                FESTOFY
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
            {navLinks.map((link) => {
              const active = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`transition-colors py-1 ${
                    active
                      ? 'text-[#ff4f1a] font-semibold border-b-2 border-[#ff4f1a]'
                      : 'text-[#9da3b4] hover:text-white'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Action CTA / User Profile */}
          <div className="hidden md:flex items-center gap-4">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <Link
                  to={isOrganizer ? '/organizer' : '/dashboard'}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#1c1f26] hover:bg-[#252a34] text-white border border-[#2e3442] transition-colors"
                >
                  {isOrganizer ? 'Organizer Console' : 'Student Portal'}
                </Link>

                <div className="flex items-center gap-2 pl-2 border-l border-[#242730]">
                  <div className="w-7 h-7 rounded-full bg-[#ff4f1a]/20 text-[#ff4f1a] flex items-center justify-center text-xs font-bold border border-[#ff4f1a]/30">
                    {currentUser?.displayName?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <span className="text-xs text-[#9da3b4] max-w-[100px] truncate">
                    {currentUser?.displayName}
                  </span>
                  <button
                    onClick={() => signOutUser()}
                    className="p-1.5 text-[#656c80] hover:text-white rounded-md hover:bg-[#1c1f26] cursor-pointer"
                    title="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/auth"
                  className="text-sm font-medium text-[#9da3b4] hover:text-white transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  to="/auth?mode=signup"
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-[#ff4f1a] hover:bg-[#ff6838] transition-all duration-200 shadow-sm shadow-[#ff4f1a]/20"
                >
                  Get started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu trigger */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-[#9da3b4] hover:text-white hover:bg-[#191b20]"
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-[#242730] bg-[#121316] px-4 pt-2 pb-6 space-y-3">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-base font-medium text-[#9da3b4] hover:text-white"
              >
                {link.label}
              </Link>
            ))}

            <div className="pt-3 border-t border-[#242730] space-y-2">
              {isAuthenticated ? (
                <>
                  <Link
                    to={isOrganizer ? '/organizer' : '/dashboard'}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block w-full text-center py-2.5 rounded-lg text-sm font-semibold bg-[#ff4f1a] text-white"
                  >
                    {isOrganizer ? 'Open Organizer Console' : 'Go to Student Dashboard'}
                  </Link>
                  <button
                    onClick={() => {
                      signOutUser();
                      setMobileMenuOpen(false);
                    }}
                    className="block w-full text-center py-2 text-sm text-[#9da3b4] hover:text-white"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/auth"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block w-full text-center py-2.5 rounded-lg text-sm font-semibold bg-[#191b20] text-white border border-[#2e3442]"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/auth?mode=signup"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block w-full text-center py-2.5 rounded-lg text-sm font-semibold bg-[#ff4f1a] text-white"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Page Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Public Footer */}
      <footer className="border-t border-[#242730] bg-[#0c0d0e] py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            {/* Col 1 */}
            <div className="md:col-span-2 space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#ff4f1a] flex items-center justify-center font-heading font-black text-white text-sm">
                  F
                </div>
                <span className="font-heading font-black text-lg tracking-tight text-white">
                  FESTOFY
                </span>
              </div>
              <p className="text-sm font-semibold text-white">
                Plan. Discover. Participate.
              </p>
              <p className="text-xs text-[#9da3b4] max-w-sm leading-relaxed">
                The modern event operations platform for student organizations. Built for collegiate tech clubs, cultural societies, and the ambitious students who make festivals happen.
              </p>
            </div>

            {/* Col 2 */}
            <div>
              <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-4">
                Explore
              </h4>
              <ul className="space-y-2 text-xs text-[#9da3b4]">
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
              </ul>
            </div>

            {/* Col 3 */}
            <div>
              <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-4">
                Architecture
              </h4>
              <p className="text-xs text-[#9da3b4] leading-relaxed mb-3">
                Phase 1 Foundation powered by Google Cloud Firestore & Firebase Auth.
              </p>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#191b20] border border-[#2e3442] text-[11px] text-[#9da3b4]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Zero Mock Data — Firestore Connected</span>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-[#242730] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#656c80]">
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
