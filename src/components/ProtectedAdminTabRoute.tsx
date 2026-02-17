import React, { useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';

interface ProtectedAdminTabRouteProps {
  children: React.ReactNode;
}

// Map admin section names to permission keys
const ADMIN_SECTION_TO_PERMISSION: Record<string, string> = {
  'staff': 'tab.admin_staff.view',
  'documents': 'tab.admin_documents.view',
  'pricing': 'tab.admin_pricing.view',
  'roles': 'tab.admin_rolesandpermissions.view',
  'lookbook': 'tab.admin_lookbook.view',
  'auditlog': 'tab.admin_auditlog.view',
  'workspacesetup': 'tab.admin_workspacesetup.view',
  'exportdata': 'tab.admin_exportdata.view',
  // 'advanced' is handled specially with owner check, not permissions
};

// All possible admin sections in order
const ALL_ADMIN_SECTIONS = ['staff', 'documents', 'pricing', 'roles', 'lookbook', 'auditlog', 'workspacesetup', 'exportdata', 'advanced'];

// Main admin tab permission
const ADMIN_TAB_PERMISSION = 'tab.admin.view';

/**
 * Protected route component that checks authentication and permissions for admin tabs
 * This ensures users are authenticated and can only access admin sections they have permission to view
 */
export const ProtectedAdminTabRoute: React.FC<ProtectedAdminTabRouteProps> = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const { can, loading: permissionsLoading } = usePermissions();
  const { currentWorkspace } = useWorkspace();
  const params = useParams<{ section?: string }>();
  const navigate = useNavigate();

  // Check if current user is workspace owner
  const isWorkspaceOwner = useMemo(() => {
    return currentWorkspace?.owner_id === user?.id;
  }, [currentWorkspace?.owner_id, user?.id]);

  // Check if a section is visible
  const isSectionVisible = useCallback(
    (section: string): boolean => {
      // Advanced section requires owner check, not permission check
      if (section === 'advanced') {
        return isWorkspaceOwner;
      }
      
      const permissionKey = ADMIN_SECTION_TO_PERMISSION[section];
      if (!permissionKey) return false;
      return can(permissionKey);
    },
    [can, isWorkspaceOwner]
  );

  // Find first visible admin section (excluding "advanced" - it should never be the default)
  const getFirstVisibleSection = useCallback((): string | null => {
    // Find the first visible section that is NOT "advanced"
    const visibleSection = ALL_ADMIN_SECTIONS.find((section) => 
      section !== 'advanced' && isSectionVisible(section)
    );
    return visibleSection || null;
  }, [isSectionVisible]);

  // Check permissions and redirect if necessary
  useEffect(() => {
    // Wait for auth and permissions to load
    if (authLoading || permissionsLoading || !user) {
      return;
    }

    // First check if user has access to admin tab at all
    if (!can(ADMIN_TAB_PERMISSION)) {
      // User doesn't have admin access, redirect to dashboard
      navigate('/dashboard', { replace: true });
      return;
    }

    // If no section specified, redirect to first available section
    if (!params.section) {
      const firstVisibleSection = getFirstVisibleSection();
      if (firstVisibleSection) {
        navigate(`/admin/${firstVisibleSection}`, { replace: true });
      } else {
        // User has admin access but no section permissions, redirect to dashboard
        navigate('/dashboard', { replace: true });
      }
      return;
    }

    // Normalize section name (lowercase)
    const requestedSection = params.section.toLowerCase();

    // Check if the requested section is visible/accessible
    if (!isSectionVisible(requestedSection)) {
      // Redirect to first available section
      const firstVisibleSection = getFirstVisibleSection();
      if (firstVisibleSection) {
        navigate(`/admin/${firstVisibleSection}`, { replace: true });
      } else {
        // User has admin access but no section permissions, redirect to dashboard
        navigate('/dashboard', { replace: true });
      }
    }
  }, [
    params.section,
    authLoading,
    permissionsLoading,
    user,
    can,
    navigate,
    getFirstVisibleSection,
    isSectionVisible,
    isWorkspaceOwner,
  ]);

  // Show loading while checking auth/permissions
  if (authLoading || permissionsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-slate-600">Loading...</div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Check if user has admin tab access
  if (!can(ADMIN_TAB_PERMISSION)) {
    return <Navigate to="/dashboard" replace />;
  }

  // Additional render-time check: if a specific section is requested, verify permission
  if (params.section) {
    const requestedSection = params.section.toLowerCase();
    if (!isSectionVisible(requestedSection)) {
      // User doesn't have permission for this specific section
      // Redirect will be handled by useEffect, but we can show a loading state
      const firstVisibleSection = getFirstVisibleSection();
      if (firstVisibleSection) {
        return <Navigate to={`/admin/${firstVisibleSection}`} replace />;
      } else {
        return <Navigate to="/dashboard" replace />;
      }
    }
  }

  return <>{children}</>;
};

