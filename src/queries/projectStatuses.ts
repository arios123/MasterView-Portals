import { supabase } from '@/integrations/supabase/client';
import { isDemoMode } from '@/utils/demoMode';
import { getMockProjectStatuses } from '@/utils/mockData';

export type ProjectStatus = {
  id: string;
  workspace_id: string;
  name: string;
  color: string;
  display_order: number;
  is_required: boolean;
  created_by: string | null;
  created_at: string;
  updated_by: string | null;
  updated_at: string;
};

export const projectStatusesQueries = {
  // Fetch all project statuses for a workspace
  async getByWorkspace(workspaceId: string): Promise<ProjectStatus[]> {
    if (isDemoMode()) {
      return getMockProjectStatuses();
    }

    // COMMENTED OUT IN DEMO MODE - using mock data instead
    const { data, error } = await supabase
      .from('project_statuses')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('display_order', { ascending: true })
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Create project status
  async create(
    workspaceId: string,
    name: string,
    color: string,
    displayOrder: number,
    userId: string
  ): Promise<ProjectStatus> {
    const { data, error } = await supabase
      .from('project_statuses')
      .insert({
        workspace_id: workspaceId,
        name,
        color,
        display_order: displayOrder,
        is_required: false,
        created_by: userId,
        updated_by: userId,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update project status (only color and display_order for required, all fields for non-required)
  // The database trigger will automatically update projects.status when name changes
  async update(
    id: string,
    updates: { name?: string; color?: string; display_order?: number },
    userId: string
  ): Promise<ProjectStatus> {
    // For required statuses, only allow color and display_order updates
    // For non-required statuses, allow all updates including name
    const finalUpdates = {
      ...updates,
      updated_by: userId,
    };

    const { data, error } = await supabase
      .from('project_statuses')
      .update(finalUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete project status (only non-required)
  // Foreign key constraint with ON DELETE SET NULL will automatically set projects.status_id to NULL
  async delete(id: string): Promise<void> {
    // First check if it's required
    const { data: existing, error: fetchError } = await supabase
      .from('project_statuses')
      .select('is_required')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;
    if (existing?.is_required) {
      throw new Error('Cannot delete required project status');
    }

    // Delete the status - foreign key will handle setting projects.status_id to NULL
    // and the trigger will set projects.status to NULL
    const { error } = await supabase
      .from('project_statuses')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Get default status_id for a workspace (first by display_order)
  async getDefaultStatusId(workspaceId: string): Promise<string | null> {
    const { data, error } = await supabase
      .from('project_statuses')
      .select('id')
      .eq('workspace_id', workspaceId)
      .order('display_order', { ascending: true })
      .order('name', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data?.id || null;
  },
};

