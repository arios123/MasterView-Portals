// import React from 'react';
// import { useAuth } from '@/contexts/AuthContext';
// import { Navigate } from 'react-router-dom';

// interface ProtectedRouteProps {
//   children: React.ReactNode;
// }

// export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
//   const { user, loading } = useAuth();

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
//         <div className="text-slate-600">Loading...</div>
//       </div>
//     );
//   }

//   if (!user) {
//     return <Navigate to="/" replace />;
//   }

//   return <>{children}</>;
// };
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

  // 🚫 Block unauthenticated users
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // 🔐 Allow authenticated users to stay on set-password during recovery
  if (
    isPasswordRecovery &&
    location.pathname === '/set-password'
  ) {
    return <>{children}</>;
  }

  return <>{children}</>;
};
