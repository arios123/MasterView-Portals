import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading, isPasswordRecovery } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-slate-600">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Allow recovery flow on /reset-password
  if (isPasswordRecovery && location.pathname === '/reset-password') {
    return <>{children}</>;
  }

  // Guard: invited users who haven't completed their profile (no name set)
  // must finish signup before accessing protected pages.
  if (!user.user_metadata?.name && location.pathname !== '/finish-signup') {
    return <Navigate to="/finish-signup" replace />;
  }

  return <>{children}</>;
};
