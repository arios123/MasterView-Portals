import { supabase } from '@/integrations/supabase/client';
import { LineItem } from '@/types';

/**
 * Calculate the cumulative result of a change order by applying all deltas
 * starting from the active/sold draft and going through the change order chain
 */
export async function getCumulativeChangeOrderResult(
  changeOrderVersionId: string,
  projectId: string,
  workspaceId: string
): Promise<LineItem[]> {
  try {
    // Get the change order
    const { data: changeOrder, error: coError } = await (supabase as any)
      .from('project_versions')
      .select('source_version_id, version_id')
      .eq('version_id', changeOrderVersionId)
      .eq('workspace_id', workspaceId)
      .single();

    if (coError || !changeOrder) {
      throw new Error('Change order not found');
    }

    // Get the project's active_version
    const { data: projectData, error: projectError } = await (supabase as any)
      .from('projects')
      .select('active_version')
      .eq('project_id', projectId)
      .eq('workspace_id', workspaceId)
      .single();

    if (projectError || !projectData?.active_version) {
      throw new Error('Active version not found');
    }

    const activeVersionId = projectData.active_version;

    // Start with active/sold draft items
    const { data: activeLaborData } = await (supabase as any)
      .from('version_labor')
      .select('*, labor_options:labor_id (*)')
      .eq('version_id', activeVersionId);

    const { data: activeMaterialData } = await (supabase as any)
      .from('version_materials')
      .select('*, material_options:material_id (*)')
      .eq('version_id', activeVersionId);

    // Build base items from active/sold draft
    const baseItems = new Map<string, LineItem>();

    activeLaborData?.forEach((item: any) => {
      if (item.labor_options) {
        const key = `${item.labor_id}-labor`;
        baseItems.set(key, {
          id: item.labor_options.id,
          name: item.item_name || item.labor_options.name,
          qty: Number(item.quantity),
          unitPrice: Number(item.price),
          kind: 'labor',
        });
      }
    });

    activeMaterialData?.forEach((item: any) => {
      if (item.material_options) {
        const key = `${item.material_id}-material`;
        baseItems.set(key, {
          id: item.material_options.id,
          name: item.item_name || item.material_options.name,
          qty: Number(item.quantity),
          unitPrice: Number(item.price),
          wastePct: Number(item.waste_pct) || 0,
          kind: 'material',
        });
      }
    });

    // If this change order has a source_version_id, apply parent change orders
    if (changeOrder.source_version_id && changeOrder.source_version_id !== activeVersionId) {
      // Get all change orders in the chain (from active up to and including source)
      const chain = await getChangeOrderChain(changeOrder.source_version_id, projectId, workspaceId);
      
      // Apply each change order's delta to the base
      for (const coVersionId of chain) {
        const { data: coLaborData } = await (supabase as any)
          .from('version_labor')
          .select('*, labor_options:labor_id (*)')
          .eq('version_id', coVersionId);

        const { data: coMaterialData } = await (supabase as any)
          .from('version_materials')
          .select('*, material_options:material_id (*)')
          .eq('version_id', coVersionId);

        // Apply labor deltas
        coLaborData?.forEach((item: any) => {
          if (item.labor_options) {
            const key = `${item.labor_id}-labor`;
            const currentQty = baseItems.get(key)?.qty || 0;
            const deltaQty = Number(item.quantity);
            const newQty = currentQty + deltaQty;
            
            if (newQty === 0) {
              baseItems.delete(key);
            } else {
              baseItems.set(key, {
                id: item.labor_options.id,
                name: item.item_name || item.labor_options.name,
                qty: newQty,
                unitPrice: Number(item.price),
                kind: 'labor',
              });
            }
          }
        });

        // Apply material deltas
        coMaterialData?.forEach((item: any) => {
          if (item.material_options) {
            const key = `${item.material_id}-material`;
            const currentItem = baseItems.get(key);
            const currentQty = currentItem?.qty || 0;
            const deltaQty = Number(item.quantity);
            const newQty = currentQty + deltaQty;
            
            if (newQty === 0) {
              baseItems.delete(key);
            } else {
              baseItems.set(key, {
                id: item.material_options.id,
                name: item.item_name || item.material_options.name,
                qty: newQty,
                unitPrice: Number(item.price),
                wastePct: Number(item.waste_pct) || 0,
                kind: 'material',
              });
            }
          }
        });
      }
    }

    return Array.from(baseItems.values());
  } catch (error) {
    console.error('Error calculating cumulative change order result:', error);
    throw error;
  }
}

/**
 * Get the chain of change orders from active_version up to and including targetVersionId
 * Returns array of version_ids in order: [first_change_order, second_change_order, ..., target]
 */
async function getChangeOrderChain(
  targetVersionId: string,
  projectId: string,
  workspaceId: string
): Promise<string[]> {
  const chain: string[] = [];
  
  // Get active_version
  const { data: projectData, error: projectError } = await (supabase as any)
    .from('projects')
    .select('active_version')
    .eq('project_id', projectId)
    .eq('workspace_id', workspaceId)
    .single();

  if (projectError || !projectData?.active_version) {
    return [];
  }

  // Build chain by following source_version_id from target back to active
  // We'll reverse it at the end to get chronological order
  const reverseChain: string[] = [];
  let currentVersionId: string | null = targetVersionId;

  while (currentVersionId) {
    const { data: version, error } = await (supabase as any)
      .from('project_versions')
      .select('version_id, source_version_id, status')
      .eq('version_id', currentVersionId)
      .eq('workspace_id', workspaceId)
      .single();

    if (error || !version) {
      break;
    }

    // Only include change orders in the chain
    if (version.status?.toLowerCase().includes('change order')) {
      reverseChain.push(version.version_id);
    }

    // Stop if we've reached the active version
    if (version.source_version_id === projectData.active_version || !version.source_version_id) {
      break;
    }

    currentVersionId = version.source_version_id;
  }

  // Reverse to get chronological order (first change order first)
  return reverseChain.reverse();
}

/**
 * Get baseline items for a change order
 * - First-degree: Returns active/sold draft items
 * - Second-degree: Returns parent change order's cumulative result
 */
export async function getChangeOrderBaselineItems(
  sourceVersionId: string | null,
  projectId: string,
  workspaceId: string
): Promise<LineItem[]> {
  // Get active_version to check if sourceVersionId is the active version (first-degree)
  const { data: projectData, error: projectError } = await (supabase as any)
    .from('projects')
    .select('active_version')
    .eq('project_id', projectId)
    .eq('workspace_id', workspaceId)
    .single();

  if (projectError || !projectData?.active_version) {
    return [];
  }

  const activeVersionId = projectData.active_version;

  // First-degree change order: source_version_id is null or equals active_version
  if (!sourceVersionId || sourceVersionId === activeVersionId) {
    // First-degree change order - use active/sold draft

    const { data: laborData } = await (supabase as any)
      .from('version_labor')
      .select('*, labor_options:labor_id (*)')
      .eq('version_id', activeVersionId);

    const { data: materialData } = await (supabase as any)
      .from('version_materials')
      .select('*, material_options:material_id (*)')
      .eq('version_id', activeVersionId);

    const items: LineItem[] = [];

    laborData?.forEach((item: any) => {
      if (item.labor_options) {
        items.push({
          id: item.labor_options.id,
          name: item.item_name || item.labor_options.name,
          qty: Number(item.quantity),
          unitPrice: Number(item.price),
          kind: 'labor',
        });
      }
    });

    materialData?.forEach((item: any) => {
      if (item.material_options) {
        items.push({
          id: item.material_options.id,
          name: item.item_name || item.material_options.name,
          qty: Number(item.quantity),
          unitPrice: Number(item.price),
          wastePct: Number(item.waste_pct) || 0,
          kind: 'material',
        });
      }
    });

    return items;
  } else {
    // Second-degree change order - get parent's cumulative result
    // Check if source is a change order
    const { data: sourceVersion, error: sourceError } = await (supabase as any)
      .from('project_versions')
      .select('status, version_id')
      .eq('version_id', sourceVersionId)
      .single();

    if (sourceError || !sourceVersion) {
      return [];
    }

    const isChangeOrder = sourceVersion.status?.toLowerCase().includes('change order');
    
    if (isChangeOrder) {
      // Parent is a change order - get its cumulative result
      return await getCumulativeChangeOrderResult(sourceVersionId, projectId, workspaceId);
    } else {
      // Parent is the active/sold draft - just return its items
      const { data: laborData } = await (supabase as any)
        .from('version_labor')
        .select('*, labor_options:labor_id (*)')
        .eq('version_id', sourceVersionId);

      const { data: materialData } = await (supabase as any)
        .from('version_materials')
        .select('*, material_options:material_id (*)')
        .eq('version_id', sourceVersionId);

      const items: LineItem[] = [];

      laborData?.forEach((item: any) => {
        if (item.labor_options) {
          items.push({
            id: item.labor_options.id,
            name: item.item_name || item.labor_options.name,
            qty: Number(item.quantity),
            unitPrice: Number(item.price),
            kind: 'labor',
          });
        }
      });

      materialData?.forEach((item: any) => {
        if (item.material_options) {
          items.push({
            id: item.material_options.id,
            name: item.item_name || item.material_options.name,
            qty: Number(item.quantity),
            unitPrice: Number(item.price),
            wastePct: Number(item.waste_pct) || 0,
            kind: 'material',
          });
        }
      });

      return items;
    }
  }
}

export type ChangeOrderMaterialChangeType = 'Added' | 'Modified' | 'Removed';

/** Before / After / Delta structure for a single change-order material line */
export interface ChangeOrderMaterialDelta {
  changeType: ChangeOrderMaterialChangeType;
  // Before (baseline) — empty / 0 for Added items
  titleB: string;
  qtyB: number;
  priceB: number;
  totalB: number;
  // After (CO result)
  titleA: string;
  qtyA: number;
  priceA: number;
  totalA: number;
  // Delta (After − Before)
  qtyD: number;
  priceD: number;
  totalD: number;
}

/**
 * Get Before / After / Delta materials for a change order.
 *
 * Uses the saveChangeOrder delta-format:
 *  - Items WITH baseline_version_material_id → Modified or Removed
 *    • quantity is a DELTA, price is absolute (baseline + price_delta)
 *    • Before values come from the baseline record (fetched by baseline_version_material_id)
 *    • After qty = baseline qty + delta qty
 *    • After price = CO line item's price column
 *  - Items WITHOUT baseline_version_material_id → Added
 *    • Before fields are empty / 0
 *    • After = CO line item values directly
 */
export async function getChangeOrderDeltaMaterials(
  changeOrderVersionId: string
): Promise<ChangeOrderMaterialDelta[]> {
  try {
    // 1. Fetch CO version_materials with material_options join
    const { data: materialData, error: materialError } = await (supabase as any)
      .from('version_materials')
      .select('*, material_options:material_id (*)')
      .eq('version_id', changeOrderVersionId);

    if (materialError) {
      console.error('Error fetching change order materials:', materialError);
      return [];
    }

    if (!materialData || materialData.length === 0) return [];

    // 2. Collect baseline_version_material_id values to batch-fetch baseline records
    const baselineIds: string[] = materialData
      .filter((item: any) => item.baseline_version_material_id)
      .map((item: any) => item.baseline_version_material_id);

    // 3. Batch-fetch baseline records by their row IDs
    let baselineRecordMap = new Map<string, { qty: number; price: number; name: string }>();

    if (baselineIds.length > 0) {
      const { data: baselineRecords, error: baselineError } = await (supabase as any)
        .from('version_materials')
        .select('id, quantity, price, item_name, material_options:material_id (*)')
        .in('id', baselineIds);

      if (baselineError) {
        console.error('Error fetching baseline records:', baselineError);
      }

      if (baselineRecords) {
        baselineRecords.forEach((rec: any) => {
          baselineRecordMap.set(rec.id, {
            qty: Number(rec.quantity) || 0,
            price: Math.abs(Number(rec.price) || 0),
            name: (rec.item_name || rec.material_options?.name || '').trim(),
          });
        });
      }
    }

    // 4. Build Before / After / Delta for each CO item
    const results: ChangeOrderMaterialDelta[] = [];

    materialData.forEach((item: any) => {
      if (!item.material_options) return;

      const hasBaselineRef = Boolean(item.baseline_version_material_id);
      const storedQty = Number(item.quantity) || 0; // delta for modified/removed, absolute for added
      const storedPrice = Math.abs(Number(item.price) || 0);
      const itemName = (item.item_name || item.material_options.name || 'Unknown Material').trim();

      if (hasBaselineRef) {
        // ── Modified or Removed item ──
        const baseline = baselineRecordMap.get(item.baseline_version_material_id);
        const qtyB = baseline?.qty ?? 0;
        const priceB = baseline?.price ?? 0;
        const titleB = baseline?.name || itemName;
        const totalB = qtyB * priceB;

        // After: qty = baseline qty + delta qty; price = CO price column
        const qtyA = qtyB + storedQty;
        const priceA = storedPrice;
        const totalA = qtyA * priceA;

        // Determine change type
        let changeType: ChangeOrderMaterialChangeType;
        if (qtyA <= 0) {
          changeType = 'Removed';
        } else {
          changeType = 'Modified';
        }

        // For Removed: After qty = 0, After total = 0
        const finalQtyA = changeType === 'Removed' ? 0 : qtyA;
        const finalTotalA = changeType === 'Removed' ? 0 : totalA;

        results.push({
          changeType,
          titleB,
          qtyB,
          priceB,
          totalB,
          titleA: itemName,
          qtyA: finalQtyA,
          priceA,
          totalA: finalTotalA,
          qtyD: finalQtyA - qtyB,
          priceD: priceA - priceB,
          totalD: finalTotalA - totalB,
        });
      } else {
        // ── Added item (no baseline) ──
        const qtyA = storedQty;
        const priceA = storedPrice;
        const totalA = qtyA * priceA;

        results.push({
          changeType: 'Added',
          titleB: '',
          qtyB: 0,
          priceB: 0,
          totalB: 0,
          titleA: itemName,
          qtyA,
          priceA,
          totalA,
          qtyD: qtyA,
          priceD: priceA,
          totalD: totalA,
        });
      }
    });

    return results;
  } catch (error) {
    console.error('Error processing change order delta materials:', error);
    return [];
  }
}

/** Before / After / Delta structure for a single change-order labor line */
export interface ChangeOrderLaborDelta {
  changeType: ChangeOrderMaterialChangeType;
  titleB: string;
  qtyB: number;
  priceB: number;
  totalB: number;
  titleA: string;
  qtyA: number;
  priceA: number;
  totalA: number;
  qtyD: number;
  priceD: number;
  totalD: number;
}

/**
 * Get Before / After / Delta labor items for a change order.
 * Same logic as getChangeOrderDeltaMaterials but for version_labor / labor_options.
 */
export async function getChangeOrderDeltaLabor(
  changeOrderVersionId: string
): Promise<ChangeOrderLaborDelta[]> {
  try {
    // 1. Fetch CO version_labor with labor_options join
    const { data: laborData, error: laborError } = await (supabase as any)
      .from('version_labor')
      .select('*, labor_options:labor_id (*)')
      .eq('version_id', changeOrderVersionId);

    if (laborError) {
      console.error('Error fetching change order labor:', laborError);
      return [];
    }

    if (!laborData || laborData.length === 0) return [];

    // 2. Collect baseline_version_labor_id values to batch-fetch baseline records
    const baselineIds: string[] = laborData
      .filter((item: any) => item.baseline_version_labor_id)
      .map((item: any) => item.baseline_version_labor_id);

    // 3. Batch-fetch baseline records by their row IDs
    let baselineRecordMap = new Map<string, { qty: number; price: number; name: string }>();

    if (baselineIds.length > 0) {
      const { data: baselineRecords, error: baselineError } = await (supabase as any)
        .from('version_labor')
        .select('id, quantity, price, item_name, labor_options:labor_id (*)')
        .in('id', baselineIds);

      if (baselineError) {
        console.error('Error fetching baseline labor records:', baselineError);
      }

      if (baselineRecords) {
        baselineRecords.forEach((rec: any) => {
          baselineRecordMap.set(rec.id, {
            qty: Number(rec.quantity) || 0,
            price: Math.abs(Number(rec.price) || 0),
            name: (rec.item_name || rec.labor_options?.name || '').trim(),
          });
        });
      }
    }

    // 4. Build Before / After / Delta for each CO labor item
    const results: ChangeOrderLaborDelta[] = [];

    laborData.forEach((item: any) => {
      if (!item.labor_options) return;

      const hasBaselineRef = Boolean(item.baseline_version_labor_id);
      const storedQty = Number(item.quantity) || 0;
      const storedPrice = Math.abs(Number(item.price) || 0);
      const itemName = (item.item_name || item.labor_options.name || 'Unknown Labor').trim();

      if (hasBaselineRef) {
        // ── Modified or Removed labor item ──
        const baseline = baselineRecordMap.get(item.baseline_version_labor_id);
        const qtyB = baseline?.qty ?? 0;
        const priceB = baseline?.price ?? 0;
        const titleB = baseline?.name || itemName;
        const totalB = qtyB * priceB;

        const qtyA = qtyB + storedQty;
        const priceA = storedPrice;
        const totalA = qtyA * priceA;

        let changeType: ChangeOrderMaterialChangeType;
        if (qtyA <= 0) {
          changeType = 'Removed';
        } else {
          changeType = 'Modified';
        }

        const finalQtyA = changeType === 'Removed' ? 0 : qtyA;
        const finalTotalA = changeType === 'Removed' ? 0 : totalA;

        results.push({
          changeType,
          titleB,
          qtyB,
          priceB,
          totalB,
          titleA: itemName,
          qtyA: finalQtyA,
          priceA,
          totalA: finalTotalA,
          qtyD: finalQtyA - qtyB,
          priceD: priceA - priceB,
          totalD: finalTotalA - totalB,
        });
      } else {
        // ── Added labor item (no baseline) ──
        const qtyA = storedQty;
        const priceA = storedPrice;
        const totalA = qtyA * priceA;

        results.push({
          changeType: 'Added',
          titleB: '',
          qtyB: 0,
          priceB: 0,
          totalB: 0,
          titleA: itemName,
          qtyA,
          priceA,
          totalA,
          qtyD: qtyA,
          priceD: priceA,
          totalD: totalA,
        });
      }
    });

    return results;
  } catch (error) {
    console.error('Error processing change order delta labor:', error);
    return [];
  }
}
