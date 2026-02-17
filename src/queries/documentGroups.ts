import { supabase } from '@/integrations/supabase/client';
import { DocumentGroup } from '@/stores/adminStore';

/**
 * Fetch all document groups for a workspace, ordered by display_order
 */
export async function fetchDocumentGroups(workspaceId: string): Promise<DocumentGroup[]> {
  const { data, error } = await supabase
    .from('document_groups')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('display_order', { ascending: true });
  
  if (error) throw error;
  
  return (data || []).map(row => ({
    id: row.id,
    workspaceId: row.workspace_id,
    name: row.name,
    slug: row.slug,
    displayOrder: row.display_order,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedBy: row.updated_by,
    updatedAt: row.updated_at,
  }));
}

/**
 * Create a new document group
 */
export async function createDocumentGroup(
  workspaceId: string,
  name: string,
  slug: string,
  displayOrder: number,
  userId: string
): Promise<DocumentGroup> {
  const { data, error } = await supabase
    .from('document_groups')
    .insert({
      workspace_id: workspaceId,
      name,
      slug,
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
    slug: data.slug,
    displayOrder: data.display_order,
    createdBy: data.created_by,
    createdAt: data.created_at,
    updatedBy: data.updated_by,
    updatedAt: data.updated_at,
  };
}

/**
 * Update a document group
 */
export async function updateDocumentGroup(
  id: string,
  workspaceId: string,
  updates: { name?: string; slug?: string; display_order?: number },
  userId: string
): Promise<DocumentGroup> {
  const { data, error } = await supabase
    .from('document_groups')
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
    slug: data.slug,
    displayOrder: data.display_order,
    createdBy: data.created_by,
    createdAt: data.created_at,
    updatedBy: data.updated_by,
    updatedAt: data.updated_at,
  };
}

/**
 * Delete a document group
 */
export async function deleteDocumentGroup(id: string, workspaceId: string): Promise<void> {
  const { error } = await supabase
    .from('document_groups')
    .delete()
    .eq('id', id)
    .eq('workspace_id', workspaceId);
  
  if (error) throw error;
}

/**
 * Check if a document group has template files
 */
export async function checkDocumentGroupHasTemplates(id: string, workspaceId: string): Promise<boolean> {
  const group = await supabase
    .from('document_groups')
    .select('slug')
    .eq('id', id)
    .eq('workspace_id', workspaceId)
    .single();

  if (!group.data) {
    return false;
  }

  const { data: files } = await supabase.storage
    .from('contract_templates')
    .list(`${workspaceId}/${group.data.slug}`);

  return (files?.length || 0) > 0;
}

/**
 * Batch update display orders for document groups
 */
export async function updateDocumentGroupOrders(
  updates: Array<{ id: string; display_order: number }>,
  workspaceId: string,
  userId: string
): Promise<void> {
  // Update each group's display order
  const promises = updates.map(({ id, display_order }) =>
    supabase
      .from('document_groups')
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

/**
 * Generate a slug from a name (for creating new document groups)
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

