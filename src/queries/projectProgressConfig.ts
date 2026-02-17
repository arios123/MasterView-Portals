import { supabase } from '@/integrations/supabase/client';

export type ProjectProgressConfigSegment = {
  id: string;
  config_id: string;
  status_id: string | null;
  percentage: number;
  display_order: number;
  created_by: string | null;
  created_at: string;
  updated_by: string | null;
  updated_at: string;
};

export type ProjectProgressConfig = {
  id: string;
  workspace_id: string;
  num_segments: number;
  created_by: string | null;
  created_at: string;
  updated_by: string | null;
  updated_at: string;
  segments?: ProjectProgressConfigSegment[];
};

export type ProjectProgressConfigWithSegments = ProjectProgressConfig & {
  segments: ProjectProgressConfigSegment[];
};

export const projectProgressConfigQueries = {
  // Fetch progress config with segments for a workspace
  async getByWorkspace(workspaceId: string): Promise<ProjectProgressConfigWithSegments | null> {
    const { data: config, error: configError } = await supabase
      .from('project_progress_config')
      .select('*')
      .eq('workspace_id', workspaceId)
      .maybeSingle();

    if (configError) throw configError;
    if (!config) return null;

    const { data: segments, error: segmentsError } = await supabase
      .from('project_progress_config_segments')
      .select('*')
      .eq('config_id', config.id)
      .order('display_order', { ascending: true });

    if (segmentsError) throw segmentsError;

    return {
      ...config,
      segments: segments || [],
    };
  },

  // Get progress percentage for a specific status
  async getProgressForStatus(workspaceId: string, statusId: string | null): Promise<number | null> {
    if (!statusId) return null;

    const config = await this.getByWorkspace(workspaceId);
    if (!config || !config.segments) return null;

    // Find exact match
    const exactMatch = config.segments.find(s => s.status_id === statusId);
    if (exactMatch) return exactMatch.percentage;

    // Find nearest lower percentage (for unmapped statuses)
    const segmentsWithStatus = config.segments
      .filter(s => s.status_id !== null)
      .sort((a, b) => a.percentage - b.percentage);

    // Find the highest percentage that's still lower
    let nearestLower: number | null = null;
    for (const segment of segmentsWithStatus) {
      if (segment.percentage > (nearestLower ?? -1)) {
        nearestLower = segment.percentage;
      }
    }

    return nearestLower ?? 0;
  },

  // Create or update progress config with segments
  async createOrUpdate(
    workspaceId: string,
    numSegments: number,
    segments: Array<{ status_id: string | null; percentage: number }>,
    userId: string
  ): Promise<ProjectProgressConfigWithSegments> {
    // Validate segments
    if (segments.length !== numSegments) {
      throw new Error('Number of segments must match num_segments');
    }

    if (segments.some(s => s.percentage < 0 || s.percentage > 100)) {
      throw new Error('Percentages must be between 0 and 100');
    }

    // Check if config exists
    const { data: existingConfig } = await supabase
      .from('project_progress_config')
      .select('id')
      .eq('workspace_id', workspaceId)
      .maybeSingle();

    let configId: string;

    if (existingConfig) {
      // Update existing config
      const { data: updatedConfig, error: updateError } = await supabase
        .from('project_progress_config')
        .update({
          num_segments: numSegments,
          updated_by: userId,
        })
        .eq('id', existingConfig.id)
        .select()
        .single();

      if (updateError) throw updateError;
      configId = updatedConfig.id;

      // Delete all existing segments
      const { error: deleteError } = await supabase
        .from('project_progress_config_segments')
        .delete()
        .eq('config_id', configId);

      if (deleteError) throw deleteError;
    } else {
      // Create new config
      const { data: newConfig, error: createError } = await supabase
        .from('project_progress_config')
        .insert({
          workspace_id: workspaceId,
          num_segments: numSegments,
          created_by: userId,
          updated_by: userId,
        })
        .select()
        .single();

      if (createError) throw createError;
      configId = newConfig.id;
    }

    // Insert new segments
    const segmentsToInsert = segments.map((segment, index) => ({
      config_id: configId,
      status_id: segment.status_id,
      percentage: segment.percentage,
      display_order: index + 1,
      created_by: userId,
      updated_by: userId,
    }));

    const { data: insertedSegments, error: insertError } = await supabase
      .from('project_progress_config_segments')
      .insert(segmentsToInsert)
      .select();

    if (insertError) throw insertError;

    // Return full config with segments
    const config = await this.getByWorkspace(workspaceId);
    if (!config) {
      throw new Error('Failed to retrieve created config');
    }

    return config;
  },

  // Delete progress config (cascades to segments)
  async delete(workspaceId: string): Promise<void> {
    const { error } = await supabase
      .from('project_progress_config')
      .delete()
      .eq('workspace_id', workspaceId);

    if (error) throw error;
  },
};

