import React from 'react';
import { usePermissions } from '@/hooks/usePermissions';

interface CanProps {
  permission: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  loading?: React.ReactNode;
}

/**
 * Can component - wraps UI elements that should be permission-controlled
 * Follows the SaaS-ready RBAC pattern from cursor rules
 * Uses the scope.target.action permission key pattern
 * 
 * Usage:
 * <Can permission="tab.projects.view">
 *   <ProjectsTab />
 * </Can>
 * 
 * <Can permission="tab.projects.edit" fallback={<div>No edit access</div>}>
 *   <EditButton />
 * </Can>
 */
export const Can: React.FC<CanProps> = ({
  permission,
  children,
  fallback = null,
  loading = null,
}) => {
  const { can, loading: permissionsLoading } = usePermissions();

  // Show loading state while permissions are being fetched
  if (permissionsLoading) {
    return <>{loading}</>;
  }

  // Check if user has the required permission
  if (!can(permission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

