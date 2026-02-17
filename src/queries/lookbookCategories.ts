import { supabase } from '@/integrations/supabase/client';

export interface LookbookCategory {
  id: string;
  workspaceId: string;
  name: string;
  displayOrder: number;
  isDefault: boolean;
  createdBy: string | null;
  createdAt: string;
  updatedBy: string | null;
  updatedAt: string;
}

/**
 * Fetch all lookbook categories for a workspace, ordered by display_order
 */
export async function fetchLookbookCategories(workspaceId: string): Promise<LookbookCategory[]> {
  const { data, error } = await supabase
    .from('lookbook_categories')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('display_order', { ascending: true });
  
  if (error) throw error;
  
  return (data || []).map(row => ({
    id: row.id,
    workspaceId: row.workspace_id,
    name: row.name,
    displayOrder: row.display_order,
    isDefault: row.is_default,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedBy: row.updated_by,
    updatedAt: row.updated_at,
  }));
}

/**
 * Create a new lookbook category
 */
export async function createLookbookCategory(
  workspaceId: string,
  name: string,
  displayOrder: number,
  userId: string
): Promise<LookbookCategory> {
  const { data, error } = await supabase
    .from('lookbook_categories')
    .insert({
      workspace_id: workspaceId,
      name,
      display_order: displayOrder,
      is_default: false,
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
    isDefault: data.is_default,
    createdBy: data.created_by,
    createdAt: data.created_at,
    updatedBy: data.updated_by,
    updatedAt: data.updated_at,
  };
}

/**
 * Update a lookbook category
 */
export async function updateLookbookCategory(
  id: string,
  workspaceId: string,
  updates: { name?: string; display_order?: number },
  userId: string
): Promise<LookbookCategory> {
  const { data, error } = await supabase
    .from('lookbook_categories')
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
    isDefault: data.is_default,
    createdBy: data.created_by,
    createdAt: data.created_at,
    updatedBy: data.updated_by,
    updatedAt: data.updated_at,
  };
}

/**
 * Delete a lookbook category
 */
export async function deleteLookbookCategory(id: string, workspaceId: string): Promise<void> {
  const { error } = await supabase
    .from('lookbook_categories')
    .delete()
    .eq('id', id)
    .eq('workspace_id', workspaceId);
  
  if (error) throw error;
}

/**
 * Batch update display orders for lookbook categories
 */
export async function updateLookbookCategoryOrders(
  updates: Array<{ id: string; display_order: number }>,
  workspaceId: string,
  userId: string
): Promise<void> {
  // Update each category's display order
  const promises = updates.map(({ id, display_order }) =>
    supabase
      .from('lookbook_categories')
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

