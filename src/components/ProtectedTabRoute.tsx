import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';

interface ProtectedTabRouteProps {
  children: React.ReactNode;
  requiredPermission: string;
  redirectTo?: string;
}

export const ProtectedTabRoute: React.FC<ProtectedTabRouteProps> = ({
  children,
  requiredPermission,
  redirectTo = '/dashboard',
}) => {
  const { user, loading: authLoading, isPasswordRecovery } = useAuth();
  const { can, loading: permissionsLoading } = usePermissions();
  const location = useLocation();

  if (isPasswordRecovery && location.pathname === '/reset-password') {
    return <>{children}</>;
  }

  if (authLoading || permissionsLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-slate-600">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (isPasswordRecovery) {
    return <Navigate to="/reset-password" replace />;
  }

  // Guard: invited users who haven't completed their profile
  if (!user.user_metadata?.name && location.pathname !== '/finish-signup') {
    return <Navigate to="/finish-signup" replace />;
  }

  if (!can(requiredPermission)) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};
