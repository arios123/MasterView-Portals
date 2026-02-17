import { supabase } from '@/integrations/supabase/client';

/**
 * Get all permissions for a user in a workspace
 * Follows the path: user & workspace -> workspace_members -> workspace_member_roles -> roles -> role_permissions -> permissions
 * 
 * @param userId - The user ID
 * @param workspaceId - The workspace ID
 * @returns Array of permission keys (e.g., ["tab.projects.view", "tab.projects.edit"])
 */
export const getUserPermissions = async (
  userId: string,
  workspaceId: string
): Promise<string[]> => {
  try {
    // Query: workspace_members -> workspace_member_roles -> roles -> role_permissions -> permissions
    const { data, error } = await (supabase as any)
      .from('workspace_members')
      .select(`
        workspace_member_roles!inner (
          roles!inner (
            workspace_id,
            name,
            role_permissions!inner (
              permissions!inner (
                key
              )
            )
          )
        )
      `)
      .eq('user_id', userId)
      .eq('workspace_id', workspaceId)
      .eq('workspace_member_roles.roles.workspace_id', workspaceId);

    if (error) {
      console.error('Error fetching user permissions:', error);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Extract unique permission keys from the nested structure
    const permissionKeys = new Set<string>();

    data.forEach((member: any) => {
      if (member.workspace_member_roles && Array.isArray(member.workspace_member_roles)) {
        member.workspace_member_roles.forEach((wmr: any) => {
          // Only add permissions that are explicitly assigned to the role
          if (wmr.roles && wmr.roles.role_permissions && Array.isArray(wmr.roles.role_permissions)) {
            wmr.roles.role_permissions.forEach((rp: any) => {
              if (rp.permissions && rp.permissions.key) {
                permissionKeys.add(rp.permissions.key);
              }
            });
          }
        });
      }
    });

    // Return only the permissions that are explicitly assigned to the user's roles
    // No automatic granting of permissions - all permissions must be explicitly assigned
    return Array.from(permissionKeys);
  } catch (error) {
    console.error('Error in getUserPermissions:', error);
    return [];
  }
};

