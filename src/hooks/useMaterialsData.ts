import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useWorkspace } from '@/contexts/WorkspaceContext';

export const useMaterialsData = (projectId: string, shouldFetch: boolean) => {
  const { workspaceId } = useWorkspace();
  const [allProjectsMaterials, setAllProjectsMaterials] = useState<any[]>([]);
  const [activeChangeOrderMaterials, setActiveChangeOrderMaterials] = useState<any[]>([]);

  const fetchAllProjectsMaterials = async () => {
    if (!shouldFetch) return;
    
    try {
      const projectsData = [];

      const { data: currentProjectData, error: currentProjectError } = await supabase
        .from('projects')
        .select('project_id, name, status, active_version')
        .eq('project_id', projectId)
        .eq('workspace_id', workspaceId!)
        .single();

      if (!currentProjectError && currentProjectData?.active_version) {
        const { data: version, error: versionError } = await supabase
          .from('project_versions')
          .select('version_id, multiplier, name, status')
          .eq('version_id', currentProjectData.active_version)
          .single();

        if (!versionError && version) {
          const { data: laborData } = await supabase
            .from('version_labor')
            .select(`
              id,
              quantity,
              price,
              labor_id,
              item_name,
              labor_options(name, description)
            `)
            .eq('version_id', version.version_id);

          const { data: materialData } = await supabase
            .from('version_materials')
            .select(`
              id,
              quantity,
              price,
              waste_pct,
              material_id,
              item_name,
              material_options(name, description)
            `)
            .eq('version_id', version.version_id);

          const laborItems = (laborData || []).map((item: any) => ({
            id: item.id,
            labor_id: item.labor_id,
            name: item.item_name || item.labor_options?.name || 'Unknown', // Use saved name if available, otherwise catalog name
            description: item.labor_options?.description || '',
            qty: Number(item.quantity),
            unitPrice: Number(item.price),
            kind: 'labor' as const,
            originalName: item.labor_options?.name || 'Unknown',
            originalQty: Number(item.quantity),
            originalPrice: Number(item.price)
          }));

          const materialItems = (materialData || []).map((item: any) => ({
            id: item.id,
            material_id: item.material_id,
            name: item.item_name || item.material_options?.name || 'Unknown', // Use saved name if available, otherwise catalog name
            description: item.material_options?.description || '',
            qty: Number(item.quantity),
            unitPrice: Number(item.price),
            wastePct: Number(item.waste_pct || 0),
            kind: 'material' as const,
            originalName: item.material_options?.name || 'Unknown',
            originalQty: Number(item.quantity),
            originalPrice: Number(item.price),
            originalWastePct: Number(item.waste_pct || 0)
          }));

          if (laborItems.length > 0 || materialItems.length > 0) {
            projectsData.push({
              project_id: currentProjectData.project_id,
              project_name: `${currentProjectData.name} - ${version.name || version.status || 'Active Draft'}`,
              status: currentProjectData.status,
              version_id: version.version_id,
              multiplier: Number(version.multiplier),
              laborItems,
              materialItems
            });
          }
        }
      }

      setAllProjectsMaterials(projectsData);
    } catch (error) {
      console.error('Error fetching all projects materials:', error);
    }
  };

  const fetchActiveChangeOrderMaterials = async (activeChangeOrdersList: any[]) => {
    try {
      const changeOrderMaterialsData = await Promise.all(
        activeChangeOrdersList.map(async (version) => {
          const { data: laborData } = await supabase
            .from('version_labor')
            .select(`
              id,
              quantity,
              price,
              labor_options:labor_id (
                id,
                name
              )
            `)
            .eq('version_id', version.version_id);

          const { data: materialData } = await supabase
            .from('version_materials')
            .select(`
              id,
              material_id,
              quantity,
              price,
              waste_pct,
              material_options:material_id (
                id,
                name
              )
            `)
            .eq('version_id', version.version_id);

          const laborItems = (laborData || []).map((item: any) => ({
            id: item.id,
            kind: 'labor' as const,
            name: item.labor_options?.name || '',
            qty: Number(item.quantity),
            unitPrice: Number(item.price),
            originalQty: Number(item.quantity),
            originalPrice: Number(item.price),
            originalName: item.labor_options?.name || ''
          }));

          const materialItems = (materialData || []).map((item: any) => ({
            id: item.id,
            material_id: item.material_id,
            kind: 'material' as const,
            name: item.material_options?.name || '',
            qty: Number(item.quantity),
            unitPrice: Number(item.price),
            wastePct: Number(item.waste_pct || 0),
            originalQty: Number(item.quantity),
            originalPrice: Number(item.price),
            originalName: item.material_options?.name || '',
            originalWastePct: Number(item.waste_pct || 0)
          }));

          return {
            version_id: version.version_id,
            project_id: version.project_id,
            project_name: version.name || version.status,
            status: version.status,
            multiplier: Number(version.multiplier) || 1,
            created_at: version.created_at,
            laborItems,
            materialItems
          };
        })
      );

      setActiveChangeOrderMaterials(changeOrderMaterialsData);
    } catch (error) {
      console.error('Error fetching active change order materials:', error);
    }
  };

  useEffect(() => {
    fetchAllProjectsMaterials();
  }, [projectId, shouldFetch]);

  return {
    allProjectsMaterials,
    activeChangeOrderMaterials,
    setAllProjectsMaterials,
    setActiveChangeOrderMaterials,
    refetch: fetchAllProjectsMaterials,
    fetchActiveChangeOrderMaterials
  };
};
