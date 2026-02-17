import { supabase } from '@/integrations/supabase/client';
import { LineItem } from '@/types';

/**
 * Fetch all versions for a project
 */
export const fetchProjectVersions = async (projectId: string, workspaceId: string) => {
  const { data: projectData } = await (supabase as any)
    .from('projects')
    .select('active_version')
    .eq('project_id', projectId)
    .eq('workspace_id', workspaceId)
    .single();

  const { data, error } = await (supabase as any)
    .from('project_versions')
    .select('*')
    .eq('project_id', projectId)
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  const userIds = [...new Set((data || []).map((v: any) => v.created_by))];
  const { data: userData } = await (supabase as any)
    .from('users')
    .select('user_id, name')
    .in('user_id', userIds);

  const versionsWithUsers = (data || []).map((version: any) => ({
    ...version,
    creator_name: userData?.find((u: any) => u.user_id === version.created_by)?.name || 'Unknown User',
    isActive: projectData?.active_version === version.version_id
  }));

  return versionsWithUsers;
};

/**
 * Fetch active draft items for a project
 */
export const fetchActiveDraft = async (projectId: string, workspaceId: string) => {
  const { data: projectData } = await (supabase as any)
    .from('projects')
    .select('active_version')
    .eq('project_id', projectId)
    .eq('workspace_id', workspaceId)
    .single();

  if (!projectData?.active_version) {
    return {
      items: [] as LineItem[],
      multiplier: 1,
      versionId: null,
      name: '',
    };
  }

  const versionId = projectData.active_version;

  const { data: versionData } = await (supabase as any)
    .from('project_versions')
    .select('multiplier, name, status')
    .eq('version_id', versionId)
    .single();

  const { data: laborData } = await (supabase as any)
    .from('version_labor')
    .select('*, labor_options (*)')
    .eq('version_id', versionId);

  const { data: materialData } = await (supabase as any)
    .from('version_materials')
    .select('*, material_options (*)')
    .eq('version_id', versionId);

  const items: LineItem[] = [];

  laborData?.forEach((item: any) => {
    items.push({
      id: item.id,
      kind: 'labor',
      name: item.labor_options?.name || '',
      qty: Number(item.quantity),
      unitPrice: Number(item.price)
    });
  });

  materialData?.forEach((item: any) => {
    items.push({
      id: item.id,
      kind: 'material',
      name: item.material_options?.name || '',
      qty: Number(item.quantity),
      unitPrice: Number(item.price),
      wastePct: Number(item.waste_pct || 0)
    });
  });

  return {
    items,
    multiplier: Number(versionData?.multiplier) || 1,
    versionId,
    name: versionData?.name || versionData?.status || 'Active Draft',
  };
};

/**
 * Fetch change orders for a project
 */
export const fetchChangeOrders = async (projectId: string, workspaceId: string) => {
  const { data, error } = await (supabase as any)
    .from('project_versions')
    .select('*')
    .eq('project_id', projectId)
    .eq('workspace_id', workspaceId)
    .ilike('status', '%Change Order%')
    .order('created_at', { ascending: false });

  if (error) throw error;

  const changeOrdersWithItems = await Promise.all(
    (data || []).map(async (version: any) => {
      const { data: laborData } = await (supabase as any)
        .from('version_labor')
        .select('*, labor_options:labor_id (*)')
        .eq('version_id', version.version_id);

      const { data: materialData } = await (supabase as any)
        .from('version_materials')
        .select('*, material_options:material_id (*)')
        .eq('version_id', version.version_id);

      const items: LineItem[] = [];
      laborData?.forEach(item => {
        if (item.labor_options) {
          items.push({
            id: item.labor_options.id,
            name: item.labor_options.name,
            qty: Number(item.quantity),
            unitPrice: Number(item.price),
            kind: 'labor'
          });
        }
      });
      materialData?.forEach(item => {
        if (item.material_options) {
          items.push({
            id: item.material_options.id,
            name: item.material_options.name,
            qty: Number(item.quantity),
            unitPrice: Number(item.price),
            wastePct: Number(item.waste_pct) || 0,
            kind: 'material'
          });
        }
      });

      return {
        ...version,
        items,
      };
    })
  );

  return {
    all: changeOrdersWithItems,
    active: changeOrdersWithItems.filter(co => co.is_active),
  };
};

