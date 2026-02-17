import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { LineItem } from '@/types';

export function useChangeOrderOptions(workspaceId: string | undefined, items: LineItem[]) {
  const [laborOptions, setLaborOptions] = useState<LineItem[]>([]);
  const [materialOptions, setMaterialOptions] = useState<LineItem[]>([]);
  const [filterLabor, setFilterLabor] = useState('');
  const [filterMat, setFilterMat] = useState('');

  useEffect(() => {
    const fetchOptions = async () => {
      if (!workspaceId) return;

      // Fetch labor options
      const { data: laborData, error: laborError } = await (supabase as any)
        .from('labor_options')
        .select('*')
        .eq('workspace_id', workspaceId);

      if (laborData && !laborError) {
        const formattedLabor = laborData.map((item: any) => ({
          id: item.id,
          name: item.name,
          unitPrice: Number(item.unit_price),
          qty: 1,
          kind: 'labor' as const,
        }));
        setLaborOptions(formattedLabor);
      }

      // Fetch material options
      const { data: materialData, error: materialError } = await (supabase as any)
        .from('material_options')
        .select('*')
        .eq('workspace_id', workspaceId);

      if (materialData && !materialError) {
        const formattedMaterials = materialData.map((item: any) => ({
          id: item.id,
          name: item.name,
          unitPrice: Number(item.unit_price),
          qty: 1,
          kind: 'material' as const,
        }));
        setMaterialOptions(formattedMaterials);
      }
    };

    fetchOptions();
  }, [workspaceId]);

  // Filter out options that are already in the change order
  const availableLaborOptions = useMemo(() => {
    const itemIds = new Set(items.map((item) => item.id));
    return laborOptions.filter((option) => !itemIds.has(option.id));
  }, [laborOptions, items]);

  const availableMaterialOptions = useMemo(() => {
    const itemIds = new Set(items.map((item) => item.id));
    return materialOptions.filter((option) => !itemIds.has(option.id));
  }, [materialOptions, items]);

  return {
    laborOptions,
    materialOptions,
    availableLaborOptions,
    availableMaterialOptions,
    filterLabor,
    setFilterLabor,
    filterMat,
    setFilterMat,
  };
}
