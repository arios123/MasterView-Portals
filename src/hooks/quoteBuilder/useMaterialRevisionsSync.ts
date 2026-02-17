import { supabase } from '@/integrations/supabase/client';

interface MaterialItem {
  id: string;
  name: string;
  qty: number;
  unitPrice: number;
  wastePct?: number;
}

/**
 * Sync material_revisions with version_materials
 * Keeps existing revisions (preserves user edits) and adds new materials
 */
export async function syncMaterialRevisions(versionId: string, materialItems: MaterialItem[]) {
  try {
    // 1. Get the version_materials records we just inserted (to get their IDs)
    const { data: versionMaterialsData, error: vmError } = await supabase
      .from('version_materials')
      .select('id, material_id')
      .eq('version_id', versionId);

    if (vmError) throw vmError;

    // Create a map of material_id -> version_materials.id
    const versionMaterialsMap = new Map(versionMaterialsData?.map((vm) => [vm.material_id, vm.id]) || []);

    // 2. Get existing material_revisions for this version
    const { data: existingRevisions, error: fetchError } = await supabase
      .from('material_revisions')
      .select('*')
      .eq('version_id', versionId);

    if (fetchError) throw fetchError;

    // Create a map of existing revisions by linked_to_id (material_options.id)
    const existingRevisionsMap = new Map(existingRevisions?.map((r) => [r.linked_to_id, r]) || []);

    // 3. Determine which revisions to keep and which to add
    const revisionsToKeep: any[] = [];
    const revisionsToAdd: any[] = [];

    for (const material of materialItems) {
      const existingRevision = existingRevisionsMap.get(material.id);
      const versionMaterialsId = versionMaterialsMap.get(material.id);

      if (existingRevision) {
        // Keep existing revision (preserves notes, links, custom names, etc.)
        // Update the original_material_id to point to the new version_materials record
        revisionsToKeep.push({
          ...existingRevision,
          original_material_id: versionMaterialsId || null,
        });
      } else {
        // New material - create new revision as unmodified
        revisionsToAdd.push({
          version_id: versionId,
          original_material_id: versionMaterialsId || null,
          name: material.name,
          quantity: material.qty,
          price: material.unitPrice,
          linked_to_id: material.id,
          linked_to_name: material.name,
          is_unmodified: true,
          notes: null,
          link: null,
        });
      }
    }

    // 4. Delete all existing revisions and re-insert (keeps + new)
    const { error: deleteError } = await supabase.from('material_revisions').delete().eq('version_id', versionId);

    if (deleteError) throw deleteError;

    // 5. Insert all revisions (existing + new)
    const allRevisions = [
      ...revisionsToKeep.map((r) => ({
        version_id: versionId,
        original_material_id: r.original_material_id,
        name: r.name,
        quantity: r.quantity,
        price: r.price,
        link: r.link,
        linked_to_id: r.linked_to_id,
        linked_to_name: r.linked_to_name,
        is_unmodified: r.is_unmodified,
        notes: r.notes,
      })),
      ...revisionsToAdd,
    ];

    if (allRevisions.length > 0) {
      const { error: insertError } = await supabase.from('material_revisions').insert(allRevisions);

      if (insertError) throw insertError;
    }

  } catch (error) {
    console.error('Error syncing material revisions:', error);
    // Don't throw - this is a non-critical operation
  }
}

