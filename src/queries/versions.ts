import { supabase } from '@/integrations/supabase/client';
import { LineItem } from '@/types';
import { isDemoMode } from '@/utils/demoMode';
import { getMockProjectVersions, getMockVersionMaterials, getMockVersionLabor, getMockMaterialOptions, getMockLaborOptions } from '@/utils/mockData';

/**
 * Fetch all versions for a project
 */
export const fetchProjectVersions = async (projectId: string, workspaceId: string) => {
  if (isDemoMode()) {
    const mockVersions = getMockProjectVersions();
    const mockProjects = await import('@/utils/mockData').then(m => m.getMockDbProjects());
    const project = mockProjects.find(p => p.project_id === projectId);
    
    return mockVersions
      .filter(v => v.project_id === projectId)
      .map(version => ({
        ...version,
        creator_name: 'Demo User',
        isActive: project?.active_version === version.version_id,
      }));
  }

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
  if (isDemoMode()) {
    // Get project's active version
    const mockProjects = await import('@/utils/mockData').then(m => m.getMockDbProjects());
    const project = mockProjects.find(p => p.project_id === projectId);
    
    if (!project?.active_version) {
      return {
        items: [] as LineItem[],
        multiplier: 1,
        versionId: null,
        name: '',
      };
    }

    const versionId = project.active_version;
    const mockVersions = getMockProjectVersions();
    const version = mockVersions.find(v => v.version_id === versionId);
    
    if (!version) {
      return {
        items: [] as LineItem[],
        multiplier: 1,
        versionId: null,
        name: '',
      };
    }

    // Get version materials and labor
    const mockVersionMaterials = getMockVersionMaterials();
    const mockVersionLabor = getMockVersionLabor();
    const mockMaterials = getMockMaterialOptions();
    const mockLabor = getMockLaborOptions();

    const items: LineItem[] = [];

    // Add labor items
    mockVersionLabor
      .filter(vl => vl.version_id === versionId)
      .forEach((item: any) => {
        const laborOption = mockLabor.find(l => l.id === item.labor_id);
        items.push({
          id: item.id,
          kind: 'labor',
          name: item.item_name || laborOption?.name || '',
          qty: Number(item.quantity),
          unitPrice: Number(item.price)
        });
      });

    // Add material items
    mockVersionMaterials
      .filter(vm => vm.version_id === versionId)
      .forEach((item: any) => {
        const materialOption = mockMaterials.find(m => m.id === item.material_id);
        items.push({
          id: item.id,
          kind: 'material',
          name: item.item_name || materialOption?.name || '',
          qty: Number(item.quantity),
          unitPrice: Number(item.price),
          wastePct: Number(item.waste_pct || 0)
        });
      });

    return {
      items,
      multiplier: Number(version.multiplier) || 1,
      versionId,
      name: version.name || version.status || 'Active Draft',
    };
  }

  // COMMENTED OUT IN DEMO MODE - using mock data instead
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

  // COMMENTED OUT IN DEMO MODE - using mock data instead
  const { data: versionData } = await (supabase as any)
    .from('project_versions')
    .select('multiplier, name, status')
    .eq('version_id', versionId)
    .single();

  // COMMENTED OUT IN DEMO MODE - using mock data instead
  const { data: laborData } = await (supabase as any)
    .from('version_labor')
    .select('*, labor_options (*)')
    .eq('version_id', versionId);

  // COMMENTED OUT IN DEMO MODE - using mock data instead
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
  if (isDemoMode()) {
    const mockVersions = getMockProjectVersions();
    return mockVersions
      .filter((v: any) => v.project_id === projectId && /change order/i.test(v.status || ''))
      .map((v: any) => ({
        ...v,
        version_id: v.version_id,
        name: v.name,
        status: v.status,
        is_active: v.is_active ?? true,
      }));
  }

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
            name: item.item_name || item.labor_options.name,
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
            name: item.item_name || item.material_options.name,
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

  return changeOrdersWithItems;
};

