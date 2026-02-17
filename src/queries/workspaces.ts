import { supabase } from '@/integrations/supabase/client';
import { isDemoMode } from '@/utils/demoMode';

/**
 * Get materials tax rate for a workspace (used for project totals, export, etc.)
 */
export const getMaterialsTaxRate = async (workspaceId: string): Promise<number> => {
  if (isDemoMode()) return 0.06;
  const { data, error } = await (supabase as any)
    .from('workspaces')
    .select('materials_tax_rate')
    .eq('id', workspaceId)
    .single();
  if (error || data == null) return 0.06;
  return Number(data.materials_tax_rate ?? 0.06);
};

/**
 * Update materials tax rate for a workspace
 */
export const updateMaterialsTaxRate = async (
  workspaceId: string,
  taxRate: number,
  _userId: string
): Promise<void> => {
  if (isDemoMode()) return;
  if (taxRate < 0 || taxRate > 1) {
    throw new Error('Tax rate must be between 0 and 1 (0% to 100%)');
  }
  const { error } = await (supabase as any)
    .from('workspaces')
    .update({ materials_tax_rate: taxRate })
    .eq('id', workspaceId);
  if (error) throw error;
};

/**
 * Fetch workspace members for a user
 * Returns all workspaces the user is a member of via the workspace_members join table
 * 
 * Architecture:
 * - users: Global user identity (email, password, auth ID)
 * - workspaces: Organization/team/company/workspace
 * - workspace_members: JOIN TABLE linking users ↔ workspaces with role attribute
 */
export const fetchUserWorkspaceMembers = async (userId: string) => {
  const { data, error } = await (supabase as any)
    .from('workspace_members')
    .select('*, workspaces(*)')
    .eq('user_id', userId);

  if (error) throw error;
  return data || [];
};

/**
 * Create a new workspace
 * Creates the workspace and adds the creator as Admin via workspace_members join table
 * Uses a database function to handle the initial member insertion (bypasses RLS)
 * 
 * Architecture:
 * - Creates a workspace in the workspaces table
 * - Creates a workspace_members entry linking the creator to the workspace
 */
export const createWorkspace = async (name: string, slug: string, createdBy: string) => {
  // Use the database function to create workspace and add creator as Admin
  const { data, error } = await (supabase as any)
    .rpc('create_workspace_with_creator', {
      _name: name,
      _slug: slug,
      _created_by: createdBy,
    });

  if (error) throw error;

  // Fetch the created workspace
  const { data: workspace, error: fetchError } = await (supabase as any)
    .from('workspaces')
    .select('*')
    .eq('id', data)
    .single();

  if (fetchError) throw fetchError;

  return workspace;
};

/**
 * Update workspace owner
 * Changes the owner_id of a workspace to a new user
 * This is an irreversible action that should only be done by the current owner
 */
export const updateWorkspaceOwner = async (workspaceId: string, newOwnerId: string) => {
  const { data, error } = await (supabase as any)
    .from('workspaces')
    .update({ owner_id: newOwnerId })
    .eq('id', workspaceId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

