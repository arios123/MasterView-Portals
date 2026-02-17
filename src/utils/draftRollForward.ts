import { supabase } from '@/integrations/supabase/client';
import { LineItem } from '@/types';
import { cloneDraftVersion } from './draftCloning';

interface RollForwardDraftParams {
  sourceVersionId: string;
  projectId: string;
  workspaceId: string;
  userId: string;
  newDraftName: string;
  quoteItems: LineItem[];
  multiplier: number;
  paymentSplits: number[];
  estimatedStartDate?: Date;
  estimatedConstructionTime?: number;
  versionType: 'draft' | 'change-order';
}

interface RollForwardDraftResult {
  success: boolean;
  newVersionId?: string;
  newDraftName?: string;
  error?: string;
}

/**
 * Rolls forward an existing draft/change order to a new version, preserving all Materials tab state
 * (contract materials + revisions) and applying Quote Builder adds/removals.
 * 
 * This function:
 * 1. Clones the source version (including all materials and revisions)
 * 2. Applies adds/removals from Quote Builder items to version_materials
 * 3. Updates material_revisions to match (removes revisions for removed materials, adds for new ones)
 * 4. Updates version_labor similarly
 * 5. Sets the new version as active (for drafts only)
 */
export async function rollForwardDraft(
  params: RollForwardDraftParams
): Promise<RollForwardDraftResult> {
  const {
    sourceVersionId,
    projectId,
    workspaceId,
    userId,
    newDraftName,
    quoteItems,
    multiplier,
    paymentSplits,
    estimatedStartDate,
    estimatedConstructionTime,
    versionType,
  } = params;

  try {
    // 1. Clone the source version (this preserves all materials and revisions)
    const cloneResult = await cloneDraftVersion({
      sourceVersionId,
      projectId,
      workspaceId,
      userId,
      newDraftName,
    });

    if (!cloneResult.success || !cloneResult.newVersionId) {
      // If version was deleted, return error that can be handled gracefully
      if (cloneResult.error?.includes("not found") || cloneResult.error?.includes("deleted")) {
        return {
          success: false,
          error: cloneResult.error || 'Source version not found (may have been deleted)',
        };
      }
      throw new Error(cloneResult.error || 'Failed to clone draft');
    }

    const newVersionId = cloneResult.newVersionId;

    // 2. Fetch source version to copy estimated_start_date and estimated_construction_time if not provided
    let sourceEstimatedStartDate = estimatedStartDate;
    let sourceEstimatedConstructionTime = estimatedConstructionTime;
    
    if (sourceEstimatedStartDate === undefined || sourceEstimatedConstructionTime === undefined) {
      const { data: sourceVersion, error: sourceError } = await supabase
        .from('project_versions')
        .select('estimated_start_date, estimated_construction_time')
        .eq('version_id', sourceVersionId)
        .single();

      if (!sourceError && sourceVersion) {
        if (sourceEstimatedStartDate === undefined && sourceVersion.estimated_start_date) {
          // Parse date string in local timezone to avoid timezone conversion issues
          const [year, month, day] = sourceVersion.estimated_start_date.split('-').map(Number);
          sourceEstimatedStartDate = new Date(year, month - 1, day);
        }
        if (sourceEstimatedConstructionTime === undefined) {
          sourceEstimatedConstructionTime = sourceVersion.estimated_construction_time ?? undefined;
        }
      }
    }

    // 3. Update the new version with Quote Builder settings (multiplier, payment splits, estimated dates)
    const { error: updateVersionError } = await supabase
      .from('project_versions')
      .update({
        multiplier,
        payment_1_percentage: paymentSplits[0] || 0,
        payment_2_percentage: paymentSplits[1] || 0,
        payment_3_percentage: paymentSplits[2] || 0,
        payment_4_percentage: paymentSplits[3] || 0,
        estimated_start_date: sourceEstimatedStartDate ? sourceEstimatedStartDate.toISOString().split('T')[0] : null,
        estimated_construction_time: sourceEstimatedConstructionTime ?? null,
        status: versionType === 'change-order' ? 'Change Order' : 'Draft',
      })
      .eq('version_id', newVersionId);

    if (updateVersionError) throw updateVersionError;

    // 3. Get current version_materials from the cloned version (this is our "baseline" from Materials tab)
    const { data: baselineMaterialsData, error: baselineError } = await supabase
      .from('version_materials')
      .select('id, material_id, quantity, price, waste_pct, item_name')
      .eq('version_id', newVersionId);

    if (baselineError) throw baselineError;
    if (!baselineMaterialsData) throw new Error('Failed to fetch baseline materials');
    
    const baselineMaterials = baselineMaterialsData as unknown as Array<{
      id: string;
      material_id: string;
      quantity: number;
      price: number;
      waste_pct: number;
      item_name: string | null;
    }>;

    // 5. Get current material_revisions from the cloned version
    const { data: baselineRevisionsData, error: revisionsError } = await supabase
      .from('material_revisions')
      .select('*')
      .eq('version_id', newVersionId);

    if (revisionsError) throw revisionsError;
    
    const baselineRevisions = (baselineRevisionsData || []) as Array<{
      id: string;
      linked_to_id: string | null;
      [key: string]: any;
    }>;

    // 6. Compute diff: what materials are in Quote Builder vs what's in the baseline
    const quoteMaterialIds = new Set(
      quoteItems
        .filter((item) => item.kind === 'material' && item.id)
        .map((item) => item.id)
    );

    const baselineMaterialIds = new Set(
      baselineMaterials.map((vm) => vm.material_id)
    );

    // Materials to remove (in baseline but not in Quote Builder)
    const materialsToRemove = baselineMaterials.filter(
      (vm) => !quoteMaterialIds.has(vm.material_id)
    );

    // Materials to add (in Quote Builder but not in baseline)
    const materialsToAdd = quoteItems.filter(
      (item) =>
        item.kind === 'material' &&
        item.id &&
        !baselineMaterialIds.has(item.id)
    );

    // Materials to update (in both - keep existing version_materials, but may need to update qty/price)
    const materialsToUpdate = quoteItems.filter(
      (item) =>
        item.kind === 'material' &&
        item.id &&
        baselineMaterialIds.has(item.id)
    );

    // 7. Remove materials that were deleted in Quote Builder
    if (materialsToRemove.length > 0) {
      const versionMaterialIdsToRemove = materialsToRemove.map((vm) => vm.id);

      // Delete material_revisions for removed materials
      const revisionsToRemove = baselineRevisions.filter((rev) =>
        versionMaterialIdsToRemove.includes(rev.linked_to_id || '')
      );

      if (revisionsToRemove.length > 0) {
        const { error: deleteRevisionsError } = await supabase
          .from('material_revisions')
          .delete()
          .in('id', revisionsToRemove.map((r) => r.id));

        if (deleteRevisionsError) throw deleteRevisionsError;
      }

      // Delete version_materials for removed materials
      const { error: deleteMaterialsError } = await supabase
        .from('version_materials')
        .delete()
        .in('id', versionMaterialIdsToRemove);

      if (deleteMaterialsError) throw deleteMaterialsError;
    }

    // 8. Add new materials from Quote Builder
    if (materialsToAdd.length > 0) {
      const materialInserts = materialsToAdd.map((item) => ({
        version_id: newVersionId,
        material_id: item.id,
        quantity: item.qty,
        price: item.unitPrice,
        waste_pct: item.wastePct || 0,
        item_name: item.name,
      }));

      const { error: insertMaterialsError } = await supabase
        .from('version_materials')
        .insert(materialInserts);

      if (insertMaterialsError) throw insertMaterialsError;

      // Create material_revisions for new materials (as unmodified)
      // We need to fetch the newly inserted version_materials to get their IDs
      const { data: newVersionMaterials, error: fetchNewMaterialsError } = await supabase
        .from('version_materials')
        .select('id, material_id')
        .eq('version_id', newVersionId)
        .in('material_id', materialsToAdd.map((item) => item.id));

      if (fetchNewMaterialsError) throw fetchNewMaterialsError;

      if (!newVersionMaterials) throw new Error('Failed to fetch new version materials');
      
      const revisionInserts = newVersionMaterials.map((vm) => {
        const quoteItem = materialsToAdd.find((item) => item.id === vm.material_id);
        return {
          version_id: newVersionId,
          original_material_id: vm.id,
          name: quoteItem?.name || '',
          quantity: quoteItem?.qty || 0,
          price: quoteItem?.unitPrice || 0,
          linked_to_id: vm.id,
          linked_to_name: quoteItem?.name || '',
          is_unmodified: true,
          notes: null,
          link: null,
        };
      });

      if (revisionInserts.length > 0) {
        const { error: insertRevisionsError } = await supabase
          .from('material_revisions')
          .insert(revisionInserts);

        if (insertRevisionsError) throw insertRevisionsError;
      }
    }

    // 9. Update existing materials (qty, price, waste_pct, item_name may have changed)
    if (materialsToUpdate.length > 0) {
      for (const quoteItem of materialsToUpdate) {
        const baselineVm = baselineMaterials?.find(
          (vm) => vm.material_id === quoteItem.id
        );

        if (baselineVm) {
          const { error: updateError } = await supabase
            .from('version_materials')
            .update({
              quantity: quoteItem.qty,
              price: quoteItem.unitPrice,
              waste_pct: quoteItem.wastePct || 0,
              item_name: quoteItem.name,
            })
            .eq('id', baselineVm.id);

          if (updateError) throw updateError;
        }
      }
    }

    // 10. Handle labor items similarly
    const quoteLaborIds = new Set(
      quoteItems
        .filter((item) => item.kind === 'labor' && item.id)
        .map((item) => item.id)
    );

    const { data: baselineLaborData, error: laborError } = await supabase
      .from('version_labor')
      .select('id, labor_id, quantity, price, item_name')
      .eq('version_id', newVersionId);

    if (laborError) throw laborError;
    if (!baselineLaborData) throw new Error('Failed to fetch baseline labor');
    
    const baselineLabor = baselineLaborData as unknown as Array<{
      id: string;
      labor_id: string;
      quantity: number;
      price: number;
      item_name: string | null;
    }>;

    const baselineLaborIds = new Set(
      baselineLabor.map((vl) => vl.labor_id)
    );

    // Remove labor items
    const laborToRemove = baselineLabor.filter(
      (vl) => !quoteLaborIds.has(vl.labor_id)
    );

    if (laborToRemove.length > 0) {
      if (laborToRemove.length > 0) {
        const { error: deleteLaborError } = await supabase
          .from('version_labor')
          .delete()
          .in('id', laborToRemove.map((vl) => vl.id));

        if (deleteLaborError) throw deleteLaborError;
      }
    }

    // Add new labor items
    const laborToAdd = quoteItems.filter(
      (item) =>
        item.kind === 'labor' &&
        item.id &&
        !baselineLaborIds.has(item.id)
    );

    if (laborToAdd.length > 0) {
      const laborInserts = laborToAdd.map((item) => ({
        version_id: newVersionId,
        labor_id: item.id,
        quantity: item.qty,
        price: item.unitPrice,
        item_name: item.name,
      }));

      const { error: insertLaborError } = await supabase
        .from('version_labor')
        .insert(laborInserts);

      if (insertLaborError) throw insertLaborError;
    }

    // Update existing labor items
    const laborToUpdate = quoteItems.filter(
      (item) =>
        item.kind === 'labor' &&
        item.id &&
        baselineLaborIds.has(item.id)
    );

    if (laborToUpdate.length > 0) {
      for (const quoteItem of laborToUpdate) {
        const baselineVl = baselineLabor.find(
          (vl) => vl.labor_id === quoteItem.id
        );

        if (baselineVl) {
          const { error: updateError } = await supabase
            .from('version_labor')
            .update({
              quantity: quoteItem.qty,
              price: quoteItem.unitPrice,
              item_name: quoteItem.name,
            })
            .eq('id', baselineVl.id);

          if (updateError) throw updateError;
        }
      }
    }

    // 11. Set as active version (for drafts only, not change orders)
    if (versionType === 'draft') {
      const { error: updateActiveError } = await supabase
        .from('projects')
        .update({ active_version: newVersionId })
        .eq('project_id', projectId);

      if (updateActiveError) {
        console.error('Error updating active version:', updateActiveError);
        // Don't throw - the draft was created successfully
      }
    }

    return {
      success: true,
      newVersionId,
      newDraftName: cloneResult.newDraftName,
    };
  } catch (error) {
    console.error('Error rolling forward draft:', error);
    return {
      success: false,
      error: (error as any)?.message || 'Unknown error occurred',
    };
  }
}

