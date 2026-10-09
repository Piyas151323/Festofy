import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Clock, Building2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { UserRoleType } from '../../types';
import { AdminLoginPage } from '../../pages/admin/AdminLoginPage';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRoleType[];
  adminAuth?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  adminAuth
}) => {
  const { role, loading, isAuthenticated, hasPendingOrgRequest } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-8 h-8 rounded-full border-2 border-[#ff4f1a] border-t-transparent animate-spin" />
        <p className="text-xs text-[#9da3b4] font-mono">Verifying authorization credentials...</p>
      </div>
    );
  }

  const isAdminRoute = adminAuth || (allowedRoles?.includes('admin') && allowedRoles.length === 1);

  if (!isAuthenticated) {
    if (isAdminRoute) {
      // Unauthenticated user on /admin routes sees dedicated Admin Login page
      return <AdminLoginPage redirectPath={location.pathname} />;
    }
    // Redirect to general student/organizer auth with return url
    return <Navigate to={`/auth?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  // If applicant is awaiting organization review and accessing organizer area
  if (allowedRoles?.includes('organizer') && !allowedRoles.includes(role) && role !== 'admin' && hasPendingOrgRequest) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 rounded-2xl border border-amber-500/30 bg-[#14161a] text-center space-y-4 shadow-xl">
        <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-400 mx-auto flex items-center justify-center">
          <Clock className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-mono font-semibold uppercase">
            Review Pending
          </div>
          <h3 className="font-heading text-lg font-bold text-white">
            Application Under Review
          </h3>
        </div>
        <p className="text-xs text-[#9da3b4] leading-relaxed">
          Your organization charter application is currently being verified by platform administrators. Once approved, your account will be granted full organizer access.
        </p>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-2.5">
          <Link
            to="/organizer/status"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#ff4f1a] hover:bg-[#ff6838] text-xs font-semibold text-white transition-colors shadow-sm"
          >
            Track Status & Onboarding &rarr;
          </Link>
          <Link
            to="/events"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1e222b] hover:bg-[#252a34] text-xs font-semibold text-white border border-[#2e3442] transition-colors"
          >
            Public Directory
          </Link>
        </div>
      </div>
    );
  }

  // If role check specified and current authenticated role is insufficient.
  // Platform administrators have superuser oversight across student, organizer, and admin routes.
  if (allowedRoles && !allowedRoles.includes(role) && role !== 'admin') {
    return (
      <div className="max-w-md mx-auto my-16 p-8 rounded-2xl border border-[#242730] bg-[#14161a] text-center space-y-4 shadow-xl">
        <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-400 mx-auto flex items-center justify-center">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h3 className="font-heading text-lg font-bold text-white">
          Access Restricted
        </h3>
        <p className="text-xs text-[#9da3b4] leading-relaxed">
          Your authenticated role is <span className="font-semibold text-white uppercase font-mono">{role}</span>.
          This console area requires <span className="text-[#ff4f1a] font-mono">{allowedRoles.join(' or ')}</span> access privileges.
        </p>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-2.5">
          <Link
            to={role === 'organizer' ? '/organizer' : '/dashboard'}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1e222b] hover:bg-[#252a34] text-xs font-semibold text-white border border-[#2e3442] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Return to {role === 'organizer' ? 'Organizer' : 'Student'} Portal
          </Link>
          <Link
            to="/events"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#ff4f1a] hover:bg-[#ff6838] text-xs font-semibold text-white transition-colors shadow-sm"
          >
            Public Directory
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
