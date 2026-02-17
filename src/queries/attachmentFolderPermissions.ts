import { supabase } from '@/integrations/supabase/client';

export type AttachmentFolderPermission = {
  id: string;
  attachmentFolderId: string;
  roleId: string;
  roleName?: string;
  canView: boolean;
  canEdit: boolean;
  createdBy?: string;
  createdAt: string;
  updatedBy?: string;
  updatedAt: string;
};

/**
 * Fetch all permissions for a specific attachment folder
 */
export async function fetchAttachmentFolderPermissions(
  folderId: string,
  workspaceId: string
): Promise<AttachmentFolderPermission[]> {
  const { data, error } = await supabase
    .from('attachment_folder_permissions' as any)
    .select(`
      id,
      attachment_folder_id,
      role_id,
      can_view,
      can_edit,
      created_by,
      created_at,
      updated_by,
      updated_at,
      roles!inner (
        id,
        name,
        workspace_id
      )
    `)
    .eq('attachment_folder_id', folderId)
    .eq('roles.workspace_id', workspaceId);
  
  if (error) throw error;
  
  // Map and sort by role name in JavaScript
  const mapped = ((data || []) as any[]).map((row: any) => ({
    id: row.id,
    attachmentFolderId: row.attachment_folder_id,
    roleId: row.role_id,
    roleName: row.roles?.name,
    canView: row.can_view,
    canEdit: row.can_edit,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedBy: row.updated_by,
    updatedAt: row.updated_at,
  }));
  
  // Sort by role name
  return mapped.sort((a, b) => {
    const nameA = a.roleName || '';
    const nameB = b.roleName || '';
    return nameA.localeCompare(nameB);
  });
}

/**
 * Fetch all folder permissions for a user based on their roles
 * Returns a map of folderId -> { canView: boolean, canEdit: boolean }
 */
export async function fetchUserFolderPermissions(
  userId: string,
  workspaceId: string
): Promise<Map<string, { canView: boolean; canEdit: boolean }>> {
  // Get user's roles in the workspace
  const { data: memberData, error: memberError } = await supabase
    .from('workspace_members' as any)
    .select(`
      id,
      workspace_member_roles!inner (
        role_id,
        roles!inner (
          id,
          name,
          workspace_id
        )
      )
    `)
    .eq('user_id', userId)
    .eq('workspace_id', workspaceId)
    .eq('workspace_member_roles.roles.workspace_id', workspaceId);

  if (memberError) throw memberError;
  if (!memberData || memberData.length === 0) {
    return new Map();
  }

  // Extract role IDs
  const roleIds: string[] = [];
  memberData.forEach((member: any) => {
    if (member.workspace_member_roles && Array.isArray(member.workspace_member_roles)) {
      member.workspace_member_roles.forEach((wmr: any) => {
        if (wmr.roles?.id) {
          roleIds.push(wmr.roles.id);
        }
      });
    }
  });

  if (roleIds.length === 0) {
    return new Map();
  }

  // Get all permissions for these roles
  const { data: permissionsData, error: permissionsError } = await supabase
    .from('attachment_folder_permissions' as any)
    .select(`
      attachment_folder_id,
      can_view,
      can_edit
    `)
    .in('role_id', roleIds);

  if (permissionsError) throw permissionsError;

  // Build map: folderId -> { canView, canEdit }
  // Use OR logic: if ANY role has permission, user has permission
  const permissionsMap = new Map<string, { canView: boolean; canEdit: boolean }>();

  (permissionsData || []).forEach((perm: any) => {
    const folderId = perm.attachment_folder_id;
    const existing = permissionsMap.get(folderId);
    
    if (existing) {
      // OR logic: if any role allows, user can do it
      permissionsMap.set(folderId, {
        canView: existing.canView || perm.can_view,
        canEdit: existing.canEdit || perm.can_edit,
      });
    } else {
      permissionsMap.set(folderId, {
        canView: perm.can_view,
        canEdit: perm.can_edit,
      });
    }
  });

  return permissionsMap;
}

/**
 * Check if user has permission to view or edit a specific folder
 */
export async function checkFolderPermission(
  userId: string,
  workspaceId: string,
  folderId: string,
  action: 'view' | 'edit'
): Promise<boolean> {
  const permissions = await fetchUserFolderPermissions(userId, workspaceId);
  const folderPerms = permissions.get(folderId);
  
  if (!folderPerms) {
    return false;
  }
  
  return action === 'view' ? folderPerms.canView : folderPerms.canEdit;
}

/**
 * Create a new folder permission
 */
export async function createAttachmentFolderPermission(
  folderId: string,
  roleId: string,
  canView: boolean,
  canEdit: boolean,
  userId: string
): Promise<AttachmentFolderPermission> {
  const { data, error } = await supabase
    .from('attachment_folder_permissions' as any)
    .insert({
      attachment_folder_id: folderId,
      role_id: roleId,
      can_view: canView,
      can_edit: canEdit,
      created_by: userId,
      updated_by: userId,
    })
    .select(`
      id,
      attachment_folder_id,
      role_id,
      can_view,
      can_edit,
      created_by,
      created_at,
      updated_by,
      updated_at,
      roles!inner (
        name
      )
    `)
    .single();
  
  if (error) throw error;
  
  const row = data as any;
  return {
    id: row.id,
    attachmentFolderId: row.attachment_folder_id,
    roleId: row.role_id,
    roleName: row.roles?.name,
    canView: row.can_view,
    canEdit: row.can_edit,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedBy: row.updated_by,
    updatedAt: row.updated_at,
  };
}

/**
 * Update a folder permission
 */
export async function updateAttachmentFolderPermission(
  id: string,
  updates: { canView?: boolean; canEdit?: boolean },
  userId: string
): Promise<AttachmentFolderPermission> {
  // Convert camelCase to snake_case for database
  const updateData: any = {
    updated_by: userId,
    updated_at: new Date().toISOString(),
  };
  
  if (updates.canView !== undefined) {
    updateData.can_view = updates.canView;
  }
  if (updates.canEdit !== undefined) {
    updateData.can_edit = updates.canEdit;
  }

  const { data, error } = await supabase
    .from('attachment_folder_permissions' as any)
    .update(updateData)
    .eq('id', id)
    .select(`
      id,
      attachment_folder_id,
      role_id,
      can_view,
      can_edit,
      created_by,
      created_at,
      updated_by,
      updated_at,
      roles!inner (
        name
      )
    `)
    .single();
  
  if (error) throw error;
  
  const row = data as any;
  return {
    id: row.id,
    attachmentFolderId: row.attachment_folder_id,
    roleId: row.role_id,
    roleName: row.roles?.name,
    canView: row.can_view,
    canEdit: row.can_edit,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedBy: row.updated_by,
    updatedAt: row.updated_at,
  };
}

/**
 * Delete a folder permission
 */
export async function deleteAttachmentFolderPermission(id: string): Promise<void> {
  const { error } = await supabase
    .from('attachment_folder_permissions' as any)
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

/**
 * Bulk update all permissions for a folder
 * This will create/update/delete permissions as needed
 */
export async function bulkUpdateFolderPermissions(
  folderId: string,
  permissions: Array<{ roleId: string; canView: boolean; canEdit: boolean }>,
  userId: string
): Promise<void> {
  // First, get existing permissions
  const { data: existingData, error: fetchError } = await supabase
    .from('attachment_folder_permissions' as any)
    .select('id, role_id')
    .eq('attachment_folder_id', folderId);

  if (fetchError) throw fetchError;

  const existing = new Map<string, string>(); // roleId -> permissionId
  (existingData || []).forEach((perm: any) => {
    existing.set(perm.role_id, perm.id);
  });

  const newRoleIds = new Set(permissions.map(p => p.roleId));

  // Delete permissions that are no longer in the list
  const toDelete: string[] = [];
  existing.forEach((permissionId, roleId) => {
    if (!newRoleIds.has(roleId)) {
      toDelete.push(permissionId);
    }
  });

  if (toDelete.length > 0) {
    const { error: deleteError } = await supabase
      .from('attachment_folder_permissions' as any)
      .delete()
      .in('id', toDelete);
    
    if (deleteError) throw deleteError;
  }

  // Create or update permissions
  const promises = permissions.map(async (perm) => {
    const existingId = existing.get(perm.roleId);
    
    if (existingId) {
      // Update existing
      return updateAttachmentFolderPermission(
        existingId,
        { canView: perm.canView, canEdit: perm.canEdit },
        userId
      );
    } else {
      // Create new
      return createAttachmentFolderPermission(
        folderId,
        perm.roleId,
        perm.canView,
        perm.canEdit,
        userId
      );
    }
  });

  await Promise.all(promises);
}

/**
 * When a new folder is created, set default permissions (Admin only)
 */
export async function setDefaultFolderPermissions(
  folderId: string,
  workspaceId: string,
  userId: string
): Promise<void> {
  // Get Admin role for this workspace
  const { data: adminRole, error: roleError } = await supabase
    .from('roles' as any)
    .select('id')
    .eq('workspace_id', workspaceId)
    .eq('name', 'Admin')
    .single();

  if (roleError || !adminRole) {
    // If no Admin role exists, that's okay - just return
    console.warn('No Admin role found for workspace, skipping default permissions');
    return;
  }

  // Create permission for Admin role (view + edit)
  await createAttachmentFolderPermission(
    folderId,
    (adminRole as any).id,
    true, // canView
    true, // canEdit
    userId
  );
}

