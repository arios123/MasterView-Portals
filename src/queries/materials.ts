import { supabase } from '@/integrations/supabase/client';

/**
 * Fetch material options for a workspace
 */
export const fetchMaterialOptions = async (workspaceId: string, limit = 200, offset = 0) => {
  const { data, error } = await (supabase as any)
    .from('material_options')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('name')
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return data || [];
};

/**
 * Create material option
 */
export const createMaterialOption = async (
  workspaceId: string,
  materialData: {
    name: string;
    description?: string;
    price?: number;
  }
) => {
  const { data, error } = await (supabase as any)
    .from('material_options')
    .insert({
      ...materialData,
      workspace_id: workspaceId,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Update material option
 */
export const updateMaterialOption = async (materialId: string, materialData: Partial<{
  name: string;
  description?: string;
  price?: number;
}>, workspaceId: string) => {
  const { data, error } = await (supabase as any)
    .from('material_options')
    .update(materialData)
    .eq('id', materialId)
    .eq('workspace_id', workspaceId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Delete material options
 */
export const deleteMaterialOptions = async (materialIds: string[], workspaceId: string) => {
  const { error } = await (supabase as any)
    .from('material_options')
    .delete()
    .in('id', materialIds)
    .eq('workspace_id', workspaceId);

  if (error) throw error;
};

/**
 * Fetch version materials for a project version
 */
export const fetchVersionMaterials = async (versionId: string) => {
  const { data, error } = await supabase
    .from('version_materials')
    .select('*, material_options (*)')
    .eq('version_id', versionId);

  if (error) throw error;
  return data || [];
};

/**
 * Insert version materials
 */
export const insertVersionMaterials = async (materials: Array<{
  version_id: string;
  material_id?: string;
  quantity: number;
  price: number;
  waste_pct?: number;
}>) => {
  const { data, error } = await (supabase as any)
    .from('version_materials')
    .insert(materials)
    .select();

  if (error) throw error;
  return data || [];
};

/**
 * Delete version materials for a version
 */
export const deleteVersionMaterials = async (versionId: string) => {
  const { error } = await supabase
    .from('version_materials')
    .delete()
    .eq('version_id', versionId);

  if (error) throw error;
};

