import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { fetchUserFolderPermissions, checkFolderPermission } from '@/queries/attachmentFolderPermissions';

/**
 * Hook to get user's permissions for all attachment folders in the current workspace
 * Returns a map of folderId -> { canView: boolean, canEdit: boolean }
 */
export function useAttachmentFolderPermissions() {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const [permissions, setPermissions] = useState<Map<string, { canView: boolean; canEdit: boolean }>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refreshPermissions = useCallback(async () => {
    if (!user?.id || !currentWorkspace?.id) {
      setPermissions(new Map());
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const perms = await fetchUserFolderPermissions(user.id, currentWorkspace.id);
      setPermissions(perms);
    } catch (err) {
      console.error('Error fetching folder permissions:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch permissions'));
      setPermissions(new Map());
    } finally {
      setLoading(false);
    }
  }, [user?.id, currentWorkspace?.id]);

  useEffect(() => {
    refreshPermissions();
  }, [refreshPermissions]);

  /**
   * Check if user can view a specific folder
   */
  const canViewFolder = useCallback((folderId: string): boolean => {
    const folderPerms = permissions.get(folderId);
    return folderPerms?.canView ?? false;
  }, [permissions]);

  /**
   * Check if user can edit (upload/delete) in a specific folder
   */
  const canEditFolder = useCallback((folderId: string): boolean => {
    const folderPerms = permissions.get(folderId);
    return folderPerms?.canEdit ?? false;
  }, [permissions]);

  /**
   * Check permission for a specific folder and action
   */
  const checkPermission = useCallback(async (
    folderId: string,
    action: 'view' | 'edit'
  ): Promise<boolean> => {
    if (!user?.id || !currentWorkspace?.id) {
      return false;
    }

    try {
      return await checkFolderPermission(user.id, currentWorkspace.id, folderId, action);
    } catch (err) {
      console.error('Error checking folder permission:', err);
      return false;
    }
  }, [user?.id, currentWorkspace?.id]);

  return {
    permissions,
    loading,
    error,
    refreshPermissions,
    canViewFolder,
    canEditFolder,
    checkPermission,
  };
}

