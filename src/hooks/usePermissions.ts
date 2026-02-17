import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { getUserPermissions } from '@/queries/permissions';
import { Role, FeatureKey } from '@/stores/adminStore';
import { isDemoMode } from '@/utils/demoMode';

// Re-export FeatureKey for convenience
export type { FeatureKey };

/**
 * Hook to get user permissions based on their role in the workspace
 * This follows the SaaS-ready RBAC pattern from cursor rules
 * Uses the new database-driven permission system with scope.target.action pattern
 */
export const usePermissions = () => {
  const { user } = useAuth();
  const { currentWorkspace, currentUserRole } = useWorkspace();
  const [permissionKeys, setPermissionKeys] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const demoMode = isDemoMode();

  const userRole = useMemo(() => {
    if (demoMode) {
      return 'Admin' as Role;
    }
    // Get role from workspace_members via WorkspaceContext
    if (currentUserRole) {
      return currentUserRole as Role;
    }
    // No default fallback
    return '' as Role;
  }, [currentUserRole, demoMode]);

  // Fetch permissions from database (skip in demo mode)
  useEffect(() => {
    if (demoMode) {
      // In demo mode, grant all permissions (empty array means all permissions granted via can() function)
      setPermissionKeys([]);
      setLoading(false);
      return;
    }

    if (user && currentWorkspace?.id) {
      setLoading(true);
      getUserPermissions(user.id, currentWorkspace.id)
        .then((keys) => {
          setPermissionKeys(keys);
          setLoading(false);
        })
        .catch((error) => {
          console.error('Error fetching permissions:', error);
          setPermissionKeys([]);
          setLoading(false);
        });
    } else {
      setPermissionKeys([]);
      setLoading(false);
    }
  }, [user, currentWorkspace?.id, demoMode]);

  /**
   * Check if user has a specific permission key
   * Follows the scope.target.action pattern (e.g., "tab.projects.view", "component.document_generation.edit")
   * In demo mode, always returns true
   */
  const can = (permissionKey: string): boolean => {
    if (demoMode) {
      return true; // Demo mode: grant all permissions
    }
    return permissionKeys.includes(permissionKey);
  };

  /**
   * Map legacy FeatureKey to permission keys for backward compatibility
   */
  const featureKeyToPermissionKeys = (feature: FeatureKey, action: 'view' | 'read' | 'write' | 'edit'): string[] => {
    const mappings: Record<FeatureKey, { component?: string; tab?: string }> = {
      activity: { component: 'activity', tab: 'activity' },
      lookbook: { component: 'lookbook', tab: 'lookbook' },
      contractBuilder: { component: 'contract_builder', tab: 'contract_builder' },
      changeOrder: { component: 'change_order', tab: 'change_order' },
      materials: { component: 'materials', tab: 'materials' },
      drafts: { component: 'drafts', tab: 'drafts' },
      payments: { component: 'payments', tab: 'payments' },
      viewPrice: { component: 'view_price' },
      clientProjects: { component: 'client_projects', tab: 'projects' },
      attachments: { component: 'attachments', tab: 'attachments' },
    };

    const mapping = mappings[feature];
    if (!mapping) return [];

    const keys: string[] = [];
    if (mapping.component) {
      keys.push(`component.${mapping.component}.${action === 'write' ? 'edit' : action}`);
    }
    if (mapping.tab) {
      keys.push(`tab.${mapping.tab}.${action === 'write' ? 'view' : action}`);
    }
    return keys;
  };

  /**
   * Check if user can view a feature (backward compatibility)
   */
  const canView = (feature: FeatureKey): boolean => {
    const keys = featureKeyToPermissionKeys(feature, 'view');
    return keys.some(key => can(key));
  };

  /**
   * Check if user can read a feature (backward compatibility)
   */
  const canRead = (feature: FeatureKey): boolean => {
    const keys = featureKeyToPermissionKeys(feature, 'read');
    return keys.some(key => can(key));
  };

  /**
   * Check if user can write/edit a feature (backward compatibility)
   */
  const canWrite = (feature: FeatureKey): boolean => {
    const keys = featureKeyToPermissionKeys(feature, 'write');
    return keys.some(key => can(key));
  };

  /**
   * Check if user can create new items (backward compatibility)
   */
  const canCreate = (feature: FeatureKey): boolean => {
    return canWrite(feature);
  };

  /**
   * Check if user can delete items (backward compatibility)
   */
  const canDelete = (feature: FeatureKey): boolean => {
    return canWrite(feature);
  };

  return {
    userRole,
    can, // New method: can(permissionKey: string)
    canView, // Backward compatibility
    canRead, // Backward compatibility
    canWrite, // Backward compatibility
    canCreate, // Backward compatibility
    canDelete, // Backward compatibility
    permissions: permissionKeys, // Array of permission keys
    loading,
  };
};

