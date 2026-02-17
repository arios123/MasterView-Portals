import { supabase } from '@/integrations/supabase/client';

/**
 * Fetch role permissions for a workspace
 * Note: The legacy role_permissions table doesn't have workspace_id, so this returns all permissions
 * In the future, this should be replaced with the new RBAC system
 */
export const fetchRolePermissions = async (workspaceId: string) => {
  const { data, error } = await (supabase as any)
    .from('role_permissions')
    .select('*')
    .order('role, feature_key');

  if (error) {
    // If table doesn't exist, return empty array
    if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
      return [];
    }
    throw error;
  }

  return data || [];
};

/**
 * Save role permissions for a workspace (delete all and insert new)
 * Note: The legacy role_permissions table doesn't have workspace_id, so this saves globally
 * In the future, this should be replaced with the new RBAC system
 */
export const saveRolePermissions = async (
  workspaceId: string,
  permissions: Array<{
    role: string;
    feature_key: string;
    visible: boolean;
    read: boolean;
    write: boolean;
  }>
) => {
  // Delete all existing permissions for the specified roles
  // Since the table doesn't have workspace_id, we delete by role names
  const rolesToDelete = [...new Set(permissions.map(p => p.role))];
  
  for (const role of rolesToDelete) {
    const { error: deleteError } = await (supabase as any)
      .from('role_permissions')
      .delete()
      .eq('role', role);

    if (deleteError) {
      if (deleteError.code === 'PGRST205' || deleteError.message?.includes('Could not find the table')) {
        throw new Error('Table role_permissions does not exist. Please run the migration.');
      }
      throw deleteError;
    }
  }

  // Insert all permissions (without workspace_id since the table doesn't have it)
  if (permissions.length > 0) {
    const { error: insertError } = await (supabase as any)
      .from('role_permissions')
      .insert(permissions);

    if (insertError) throw insertError;
  }
};

/**
 * Invite user via edge function
 * Note: The edge function should handle workspace_id internally based on the authenticated user's workspace
 */
export const inviteUser = async (email: string, role: string, workspaceId?: string) => {
  const { data, error } = await supabase.functions.invoke('invite-user', {
    body: {
      email,
      role,
      workspace_id: workspaceId,
    }
  });

  if (error) throw error;
  if (data?.error) {
    throw new Error(data.error);
  }

  return data;
};

