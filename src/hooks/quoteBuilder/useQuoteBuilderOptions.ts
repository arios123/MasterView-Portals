import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { LineItem } from '@/types';
import { isDemoMode } from '@/utils/demoMode';
import { getMockMaterialOptions, getMockLaborOptions } from '@/utils/mockData';

export function useQuoteBuilderOptions(workspaceId: string | undefined, items: LineItem[]) {
  const [laborOptions, setLaborOptions] = useState<LineItem[]>([]);
  const [materialOptions, setMaterialOptions] = useState<LineItem[]>([]);
  const [filterLabor, setFilterLabor] = useState('');
  const [filterMat, setFilterMat] = useState('');

  useEffect(() => {
    const fetchOptions = async () => {
      if (!workspaceId) return;

      if (isDemoMode()) {
        const mockLabor = getMockLaborOptions();
        const mockMaterials = getMockMaterialOptions();
        setLaborOptions(
          mockLabor.map((item) => ({
            id: item.id,
            name: item.name,
            unitPrice: Number(item.price),
            qty: 1,
            kind: 'labor' as const,
          }))
        );
        setMaterialOptions(
          mockMaterials.map((item) => ({
            id: item.id,
            name: item.name,
            unitPrice: Number(item.price),
            qty: 1,
            kind: 'material' as const,
          }))
        );
        return;
      }

      // Fetch labor options
      const { data: laborData, error: laborError } = await supabase
        .from('labor_options')
        .select('*')
        .eq('workspace_id', workspaceId);

      if (laborData && !laborError) {
        const formattedLabor = laborData.map((item: any) => ({
          id: item.id,
          name: item.name,
          unitPrice: Number(item.unit_price ?? item.price),
          qty: 1,
          kind: 'labor' as const,
        }));
        setLaborOptions(formattedLabor);
      }

      // Fetch material options
      const { data: materialData, error: materialError } = await supabase
        .from('material_options')
        .select('*')
        .eq('workspace_id', workspaceId);

      if (materialData && !materialError) {
        const formattedMaterials = materialData.map((item: any) => ({
          id: item.id,
          name: item.name,
          unitPrice: Number(item.unit_price ?? item.price),
          qty: 1,
          kind: 'material' as const,
        }));
        setMaterialOptions(formattedMaterials);
      }
    };

    fetchOptions();
  }, [workspaceId]);

  // Filter out options that are already in the quote
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

