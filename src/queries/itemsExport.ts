import { supabase } from '@/integrations/supabase/client';
import { isDemoMode } from '@/utils/demoMode';
import { getMockMaterialOptions, getMockLaborOptions } from '@/utils/mockData';

/**
 * Fetch all items (materials + labor) for a workspace for CSV export.
 * Returns type, name, unit_price.
 */
export const fetchAllItemsForExport = async (
  workspaceId: string
): Promise<Array<{ type: string; name: string; unit_price: string }>> => {
  if (isDemoMode()) {
    const materials = (getMockMaterialOptions() || []).map((m: any) => ({
      type: 'Material',
      name: m.name || '',
      unit_price: String(Number(m.price ?? m.unit_price ?? 0)),
    }));
    const labor = (getMockLaborOptions() || []).map((l: any) => ({
      type: 'Labor',
      name: l.name || '',
      unit_price: String(Number(l.price ?? l.unit_price ?? 0)),
    }));
    return [...materials, ...labor];
  }

  const [materialsRes, laborRes] = await Promise.all([
    (supabase as any)
      .from('material_options')
      .select('name, unit_price')
      .eq('workspace_id', workspaceId)
      .order('name'),
    (supabase as any)
      .from('labor_options')
      .select('name, unit_price')
      .eq('workspace_id', workspaceId)
      .order('name'),
  ]);

  if (materialsRes.error) throw materialsRes.error;
  if (laborRes.error) throw laborRes.error;

  const materials = (materialsRes.data || []).map((m: any) => ({
    type: 'Material',
    name: m.name || '',
    unit_price: String(Number(m.unit_price ?? 0)),
  }));

  const labor = (laborRes.data || []).map((l: any) => ({
    type: 'Labor',
    name: l.name || '',
    unit_price: String(Number(l.unit_price ?? 0)),
  }));

  return [...materials, ...labor];
};
