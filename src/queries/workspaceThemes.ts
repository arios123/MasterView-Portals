import { supabase } from '@/integrations/supabase/client';

export interface WorkspaceTheme {
  id: string;
  workspace_id: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  bg_color: string;
  surface_color: string;
  text_color: string;
  muted_color: string;
  border_color: string;
  created_by: string | null;
  created_at: string;
  updated_by: string | null;
  updated_at: string;
}

/**
 * Fetch theme for a workspace
 * Returns the theme if it exists, or null if not found
 */
export async function fetchWorkspaceTheme(workspaceId: string): Promise<WorkspaceTheme | null> {
  const { data, error } = await supabase
    .from('workspace_themes')
    .select('*')
    .eq('workspace_id', workspaceId)
    .single();

  if (error) {
    // If not found, return null (theme will use defaults)
    if (error.code === 'PGRST116') {
      return null;
    }
    throw error;
  }

  return data;
}

/**
 * Update theme for a workspace
 * Creates the theme if it doesn't exist, updates if it does
 */
export async function updateWorkspaceTheme(
  workspaceId: string,
  theme: {
    primary_color?: string;
    secondary_color?: string;
    accent_color?: string;
    bg_color?: string;
    surface_color?: string;
    text_color?: string;
    muted_color?: string;
    border_color?: string;
  },
  userId: string
): Promise<WorkspaceTheme> {
  // First check if theme exists
  const existing = await fetchWorkspaceTheme(workspaceId);

  if (existing) {
    // Update existing theme
    const { data, error } = await supabase
      .from('workspace_themes')
      .update({
        ...theme,
        updated_by: userId,
        updated_at: new Date().toISOString(),
      })
      .eq('workspace_id', workspaceId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } else {
    // Create new theme with defaults + provided values
    const defaultTheme = {
      primary_color: '0 0% 9%',
      secondary_color: '0 0% 96%',
      accent_color: '0 0% 15%',
      bg_color: '0 0% 100%',
      surface_color: '0 0% 100%',
      text_color: '215 25% 15%',
      muted_color: '215 15% 92%',
      border_color: '215 15% 88%',
    };

    const { data, error } = await supabase
      .from('workspace_themes')
      .insert({
        workspace_id: workspaceId,
        ...defaultTheme,
        ...theme,
        created_by: userId,
        updated_by: userId,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

/**
 * Reset theme to defaults for a workspace
 */
export async function resetWorkspaceTheme(
  workspaceId: string,
  userId: string
): Promise<WorkspaceTheme> {
  const defaultTheme = {
    primary_color: '0 0% 9%',
    secondary_color: '0 0% 96%',
    accent_color: '0 0% 15%',
    bg_color: '0 0% 100%',
    surface_color: '0 0% 100%',
    text_color: '215 25% 15%',
    muted_color: '215 15% 92%',
    border_color: '215 15% 88%',
  };

  return updateWorkspaceTheme(workspaceId, defaultTheme, userId);
}

