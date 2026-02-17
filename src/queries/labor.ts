import { supabase } from '@/integrations/supabase/client';
import { isDemoMode } from '@/utils/demoMode';
import { getMockLaborOptions } from '@/utils/mockData';

/**
 * Fetch labor options for a workspace
 */
export const fetchLaborOptions = async (workspaceId: string, limit = 200, offset = 0) => {
  if (isDemoMode()) {
    const mockLabor = getMockLaborOptions();
    return mockLabor.slice(offset, offset + limit);
  }

  // COMMENTED OUT IN DEMO MODE - using mock data instead
  const { data, error } = await (supabase as any)
    .from('labor_options')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('name')
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return data || [];
};

/**
 * Create labor option
 */
export const createLaborOption = async (
  workspaceId: string,
  laborData: {
    name: string;
    description?: string;
    price?: number;
  }
) => {
  const { data, error } = await (supabase as any)
    .from('labor_options')
    .insert({
      ...laborData,
      workspace_id: workspaceId,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Update labor option
 */
export const updateLaborOption = async (laborId: string, laborData: Partial<{
  name: string;
  description?: string;
  price?: number;
}>, workspaceId: string) => {
  const { data, error } = await (supabase as any)
    .from('labor_options')
    .update(laborData)
    .eq('id', laborId)
    .eq('workspace_id', workspaceId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Delete labor options
 */
export const deleteLaborOptions = async (laborIds: string[], workspaceId: string) => {
  const { error } = await (supabase as any)
    .from('labor_options')
    .delete()
    .in('id', laborIds)
    .eq('workspace_id', workspaceId);

  if (error) throw error;
};

/**
 * Fetch version labor for a project version
 */
export const fetchVersionLabor = async (versionId: string) => {
  if (isDemoMode()) {
    const { getMockVersionLabor, getMockLaborOptions } = await import('@/utils/mockData');
    const mockVersionLabor = getMockVersionLabor();
    const mockLabor = getMockLaborOptions();
    
    // Filter by version_id and attach labor_options
    return mockVersionLabor
      .filter(vl => vl.version_id === versionId)
      .map(vl => ({
        ...vl,
        labor_options: mockLabor.find(l => l.id === vl.labor_id) || null,
      }));
  }

  // COMMENTED OUT IN DEMO MODE - using mock data instead
  const { data, error } = await supabase
    .from('version_labor')
    .select('*, labor_options (*)')
    .eq('version_id', versionId);

  if (error) throw error;
  return data || [];
};

/**
 * Insert version labor
 */
export const insertVersionLabor = async (laborItems: Array<{
  version_id: string;
  labor_id?: string;
  quantity: number;
  price: number;
}>) => {
  const { data, error } = await (supabase as any)
    .from('version_labor')
    .insert(laborItems)
    .select();

  if (error) throw error;
  return data || [];
};

/**
 * Delete version labor for a version
 */
export const deleteVersionLabor = async (versionId: string) => {
  const { error } = await supabase
    .from('version_labor')
    .delete()
    .eq('version_id', versionId);

  if (error) throw error;
};

