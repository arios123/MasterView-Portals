// import React from 'react';
// import { Navigate } from 'react-router-dom';
// import { useAuth } from '@/contexts/AuthContext';
// import { usePermissions } from '@/hooks/usePermissions';

// interface ProtectedTabRouteProps {
//   children: React.ReactNode;
//   requiredPermission: string;
//   redirectTo?: string;
// }

// /**
//  * Protected route component that checks authentication and a specific permission
//  * This ensures users are authenticated and have the required permission to access the route
//  */
// export const ProtectedTabRoute: React.FC<ProtectedTabRouteProps> = ({
//   children,
//   requiredPermission,
//   redirectTo = '/dashboard',
// }) => {
//   const { user, loading: authLoading } = useAuth();
//   const { can, loading: permissionsLoading } = usePermissions();

//   // Show loading while checking auth/permissions
//   if (authLoading || permissionsLoading) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
//         <div className="text-slate-600">Loading...</div>
//       </div>
//     );
//   }

//   // Redirect to login if not authenticated (ProtectedRoute handles this)
//   if (!user) {
//     return <Navigate to="/" replace />;
//   }

//   // Check if user has the required permission
//   if (!can(requiredPermission)) {
//     return <Navigate to={redirectTo} replace />;
//   }

//   return <>{children}</>;
// };

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

  // Allow password recovery to pass through untouched
  if (
    isPasswordRecovery &&
    location.pathname === '/reset-password'
  ) {
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

  // If in password recovery, redirect to reset-password page
  if (isPasswordRecovery) {
    return <Navigate to="/reset-password" replace />;
  }

  if (!can(requiredPermission)) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};
