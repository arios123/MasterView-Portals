import React, { useEffect, useCallback } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuth } from '@/contexts/AuthContext';


interface ProtectedProjectTabRouteProps {
  children: React.ReactNode;
}

// Map URL tab names to permission keys (moved outside component for stability)
const TAB_TO_PERMISSION_KEY: Record<string, string> = {
  'Client Projects': 'tab.projects_clientprojects.view',
  'Activity': 'tab.projects_activity.view',
  'LookBook': 'tab.projects_lookbook.view',
  'Contract Builder': 'tab.projects_contractbuilder.view',
  'Change Orders': 'tab.projects_changeorders.view',
  'Materials': 'tab.projects_materials.view',
  'Drafts': 'tab.projects_drafts.view',
  'Payments': 'tab.projects_payments.view',
  'Attachments': 'tab.projects_attachments.view',
};

// All possible tabs in order (moved outside component for stability)
const ALL_TABS = [
  'Client Projects',
  'Activity',
  'LookBook',
  'Contract Builder',
  'Change Orders',
  'Materials',
  'Drafts',
  'Payments',
  'Attachments',
];

/**
 * Protected route component that checks authentication and permissions for project tabs
 * This ensures users are authenticated and can only access tabs they have permission to view
 */
export const ProtectedProjectTabRoute: React.FC<ProtectedProjectTabRouteProps> = ({ children }) => {
  const { user, loading: authLoading, isPasswordRecovery } = useAuth();
  const { can, loading: permissionsLoading } = usePermissions();
  const params = useParams<{ clientId?: string; projectId?: string; tab?: string }>();
  const navigate = useNavigate();

  // Check if a tab is visible
  const isTabVisible = useCallback((tabName: string): boolean => {
    const permissionKey = TAB_TO_PERMISSION_KEY[tabName];
    if (!permissionKey) return true; // Default to visible if not in mapping
    return can(permissionKey);
  }, [can]);

  // Normalize tab name (handle URL encoding and case differences)
  const normalizeTabName = useCallback((tabName: string | undefined): string => {
    if (!tabName) return 'Activity';
    
    // Decode URL encoding
    const decoded = decodeURIComponent(tabName);
    
    // Try to find exact match first
    if (TAB_TO_PERMISSION_KEY[decoded]) {
      return decoded;
    }
    
    // Try case-insensitive match
    const matched = ALL_TABS.find(tab => tab.toLowerCase() === decoded.toLowerCase());
    if (matched) {
      return matched;
    }
    
    // Default to Activity if no match
    return 'Activity';
  }, []);

  // Find first visible tab
  const getFirstVisibleTab = useCallback((): string | null => {
    const visibleTab = ALL_TABS.find(tab => isTabVisible(tab));
    return visibleTab || null;
  }, [isTabVisible]);

  // Check permissions and redirect if necessary
  useEffect(() => {
    if (isPasswordRecovery) return;

    // Wait for auth and permissions to load
    if (authLoading || permissionsLoading || !user) {
      return;
    }

    // Only check if we have a tab parameter and project params
    if (!params.projectId || !params.clientId) {
      return;
    }

    // If no tab specified, redirect to first available tab
    if (!params.tab) {
      const firstVisibleTab = getFirstVisibleTab();
      if (firstVisibleTab) {
        navigate(`/projects/${params.clientId}/${params.projectId}/${firstVisibleTab}`, { replace: true });
        return;
      } else {
        // If user has no access to any tab, redirect to projects list
        navigate('/projects', { replace: true });
        return;
      }
    }

    const requestedTab = normalizeTabName(params.tab);

    // Check if the requested tab is visible/accessible
    if (!isTabVisible(requestedTab)) {
      // Redirect to first available tab
      const firstVisibleTab = getFirstVisibleTab();
      if (firstVisibleTab) {
        navigate(`/projects/${params.clientId}/${params.projectId}/${firstVisibleTab}`, { replace: true });
      } else {
        // If user has no access to any tab, redirect to projects list
        navigate('/projects', { replace: true });
      }
    }
  }, [isPasswordRecovery,params.tab, params.projectId, params.clientId, authLoading, permissionsLoading, user, navigate, normalizeTabName, isTabVisible, getFirstVisibleTab]);

  // Show loading while checking auth/permissions
  if (authLoading || permissionsLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-slate-600">Loading...</div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  // Redirect to login if not authenticated
if (!user && !isPasswordRecovery) {
  return <Navigate to="/" replace />;
}


  return <>{children}</>;
};

