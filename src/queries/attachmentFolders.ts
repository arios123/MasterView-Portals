import { supabase } from '@/integrations/supabase/client';
import { AttachmentFolder } from '@/stores/adminStore';
import { setDefaultFolderPermissions } from './attachmentFolderPermissions';

/**
 * Fetch all attachment folders for a workspace, ordered by display_order
 */
export async function fetchAttachmentFolders(workspaceId: string): Promise<AttachmentFolder[]> {
  const { data, error } = await supabase
    .from('attachment_folders' as any)
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('display_order', { ascending: true });
  
  if (error) throw error;
  
  return ((data || []) as any[]).map((row: any) => ({
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
 * Create a new attachment folder
 */
export async function createAttachmentFolder(
  workspaceId: string,
  name: string,
  slug: string,
  displayOrder: number,
  userId: string
): Promise<AttachmentFolder> {
  const { data, error } = await supabase
    .from('attachment_folders' as any)
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
  
  const row = data as any;
  const newFolder: AttachmentFolder = {
    id: row.id,
    workspaceId: row.workspace_id,
    name: row.name,
    slug: row.slug,
    displayOrder: row.display_order,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedBy: row.updated_by,
    updatedAt: row.updated_at,
  };

  // Set default permissions (Admin only) for the new folder
  try {
    await setDefaultFolderPermissions(row.id, workspaceId, userId);
  } catch (error) {
    // Log error but don't fail folder creation if permissions fail
    console.error('Error setting default folder permissions:', error);
  }

  return newFolder;
}

/**
 * Update an attachment folder
 * If name is updated, slug will be auto-generated from the new name
 */
export async function updateAttachmentFolder(
  id: string,
  workspaceId: string,
  updates: { name?: string; slug?: string; display_order?: number },
  userId: string
): Promise<AttachmentFolder> {
  // If name is being updated, auto-generate slug from name
  const updateData: any = {
    ...updates,
    updated_by: userId,
    updated_at: new Date().toISOString(),
  };

  // If name is provided but slug is not, generate slug from name
  if (updates.name && !updates.slug) {
    updateData.slug = generateSlug(updates.name);
  }

  const { data, error } = await supabase
    .from('attachment_folders' as any)
    .update(updateData)
    .eq('id', id)
    .eq('workspace_id', workspaceId)
    .select()
    .single();
  
  if (error) throw error;
  
  const row = data as any;
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    name: row.name,
    slug: row.slug,
    displayOrder: row.display_order,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedBy: row.updated_by,
    updatedAt: row.updated_at,
  };
}

/**
 * Delete an attachment folder
 */
export async function deleteAttachmentFolder(id: string, workspaceId: string): Promise<void> {
  const { error } = await supabase
    .from('attachment_folders' as any)
    .delete()
    .eq('id', id)
    .eq('workspace_id', workspaceId);
  
  if (error) throw error;
}

/**
 * Check if an attachment folder has files in any projects
 */
export async function checkAttachmentFolderHasFiles(id: string, workspaceId: string): Promise<{ hasFiles: boolean; fileCount: number }> {
  const folder = await supabase
    .from('attachment_folders' as any)
    .select('slug')
    .eq('id', id)
    .eq('workspace_id', workspaceId)
    .single();

  if (!folder.data) {
    return { hasFiles: false, fileCount: 0 };
  }
  
  const folderData = folder.data as any;

  // Get all projects in this workspace - use any to avoid TypeScript inference issues
  // @ts-ignore - Supabase type inference issue with new table
  const projectsResult: any = await supabase
    .from('projects')
    .select('project_id')
    .eq('workspace_id', workspaceId);

  const projects = (projectsResult?.data as any[]) || [];

  if (!projects || projects.length === 0) {
    return { hasFiles: false, fileCount: 0 };
  }

  // Check storage for files in any project's folder
  let totalFileCount = 0;
  for (const project of projects) {
    const { data: files } = await supabase.storage
      .from('project-attachments')
      .list(`${workspaceId}/${project.project_id}/${folderData.slug}`);
    
    totalFileCount += files?.length || 0;
  }

  return {
    hasFiles: totalFileCount > 0,
    fileCount: totalFileCount,
  };
}

/**
 * Batch update display orders for attachment folders
 */
export async function updateAttachmentFolderOrders(
  updates: Array<{ id: string; display_order: number }>,
  workspaceId: string,
  userId: string
): Promise<void> {
  // Update each folder's display order
  const promises = updates.map(({ id, display_order }) =>
    supabase
      .from('attachment_folders' as any)
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
 * Generate a slug from a name (for creating new attachment folders)
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

