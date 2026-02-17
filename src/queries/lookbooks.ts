import { supabase } from '@/integrations/supabase/client';

/**
 * Fetch lookbook for a project
 */
export const fetchLookbook = async (projectId: string, workspaceId: string) => {
  const { data, error } = await (supabase as any)
    .from("lookbooks")
    .select("*")
    .eq("project_id", projectId)
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  if (error) throw error;
  return data;
};

/**
 * Create or update lookbook
 */
export const upsertLookbook = async (projectId: string, workspaceId: string, lookbookData: {
  budget?: string;
  timeline?: string;
  main_goal?: string;
  live_in_home_during_project?: string;
  house_types_and_age?: string;
  project_floor?: string;
  foundation?: string;
  hoa_rules?: string;
  past_renos_issues?: string;
  finishes_and_colors?: string;
  changes_wanted?: string;
  style?: string;
  inspiration_links?: string;
  use_of_space?: string;
  kids_pets_access?: string;
  storage_needs?: string;
  length_of_stay?: string;
  electrical_updates?: string;
  gas_type?: string;
  water_source?: string;
  hvac_issues?: string;
  work_restirctions?: string;
  permits?: string;
}) => {
  const { data, error } = await (supabase as any)
    .from("lookbooks")
    .upsert({
      project_id: projectId,
      workspace_id: workspaceId,
      ...lookbookData,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

