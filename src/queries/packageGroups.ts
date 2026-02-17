import { supabase } from '@/integrations/supabase/client';
import { PackageGroup } from '@/stores/adminStore';

/**
 * Fetch all package groups for a workspace, ordered by display_order
 */
export async function fetchPackageGroups(workspaceId: string): Promise<PackageGroup[]> {
  const { data, error } = await supabase
    .from('package_groups')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('display_order', { ascending: true });
  
  if (error) throw error;
  
  return (data || []).map(row => ({
    id: row.id,
    workspaceId: row.workspace_id,
    name: row.name,
    displayOrder: row.display_order,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedBy: row.updated_by,
    updatedAt: row.updated_at,
  }));
}

/**
 * Create a new package group
 */
export async function createPackageGroup(
  workspaceId: string,
  name: string,
  displayOrder: number,
  userId: string
): Promise<PackageGroup> {
  const { data, error } = await supabase
    .from('package_groups')
    .insert({
      workspace_id: workspaceId,
      name,
      display_order: displayOrder,
      created_by: userId,
      updated_by: userId,
    })
    .select()
    .single();
  
  if (error) throw error;
  
  return {
    id: data.id,
    workspaceId: data.workspace_id,
    name: data.name,
    displayOrder: data.display_order,
    createdBy: data.created_by,
    createdAt: data.created_at,
    updatedBy: data.updated_by,
    updatedAt: data.updated_at,
  };
}

/**
 * Update a package group
 */
export async function updatePackageGroup(
  id: string,
  workspaceId: string,
  updates: { name?: string; display_order?: number },
  userId: string
): Promise<PackageGroup> {
  const { data, error } = await supabase
    .from('package_groups')
    .update({ 
      ...updates, 
      updated_by: userId, 
      updated_at: new Date().toISOString() 
    })
    .eq('id', id)
    .eq('workspace_id', workspaceId)
    .select()
    .single();
  
  if (error) throw error;
  
  return {
    id: data.id,
    workspaceId: data.workspace_id,
    name: data.name,
    displayOrder: data.display_order,
    createdBy: data.created_by,
    createdAt: data.created_at,
    updatedBy: data.updated_by,
    updatedAt: data.updated_at,
  };
}

/**
 * Delete a package group
 */
export async function deletePackageGroup(id: string, workspaceId: string): Promise<void> {
  const { error } = await supabase
    .from('package_groups')
    .delete()
    .eq('id', id)
    .eq('workspace_id', workspaceId);
  
  if (error) throw error;
}

/**
 * Batch update display orders for package groups
 */
export async function updatePackageGroupOrders(
  updates: Array<{ id: string; display_order: number }>,
  workspaceId: string,
  userId: string
): Promise<void> {
  // Update each group's display order
  const promises = updates.map(({ id, display_order }) =>
    supabase
      .from('package_groups')
      .update({ 
        display_order, 
        updated_by: userId, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', id)
      .eq('workspace_id', workspaceId)
  );
  
  const results = await Promise.all(promises);
  
  // Check for errors
  const errors = results.filter(r => r.error);
  if (errors.length > 0) {
    throw errors[0].error;
  }
}

