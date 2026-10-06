import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { UserRoleType } from '../../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRoleType[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles
}) => {
  const { role, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-8 h-8 rounded-full border-2 border-[#ff4f1a] border-t-transparent animate-spin" />
        <p className="text-xs text-[#9da3b4] font-mono">Verifying authorization credentials...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to auth with return url
    return <Navigate to={`/auth?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  // If role check specified and current authenticated role is insufficient
  if (allowedRoles && !allowedRoles.includes(role)) {
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
          This console area is restricted to approved festival organizers and administrators. If you submitted a club application, your organization may still be awaiting administrative review.
        </p>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-2.5">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1e222b] hover:bg-[#252a34] text-xs font-semibold text-white border border-[#2e3442] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Return to Student Portal
          </Link>
          <Link
            to="/dashboard/organizations"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#ff4f1a] hover:bg-[#ff6838] text-xs font-semibold text-white transition-colors shadow-sm"
          >
            Club Applications
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
