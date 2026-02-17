import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CloneDraftVersionParams {
  sourceVersionId: string;
  projectId: string;
  workspaceId: string;
  userId: string;
  newDraftName?: string;
}

interface CloneDraftVersionResult {
  success: boolean;
  newVersionId?: string;
  newDraftName?: string;
  error?: string;
}

/**
 * Clones an existing draft version, creating a new immutable version.
 * This includes:
 * - project_versions record
 * - All version_labor items (with item_name)
 * - All version_materials items (with item_name)
 * - All material_revisions (if any)
 * 
 * The new draft is automatically set as the active version for the project.
 */
export async function cloneDraftVersion(
  params: CloneDraftVersionParams
): Promise<CloneDraftVersionResult> {
  const { sourceVersionId, projectId, workspaceId, userId, newDraftName } = params;

  try {
    // 1. Fetch the source project_versions record
    const { data: sourceVersion, error: fetchError } = await (supabase as any)
      .from("project_versions")
      .select("*")
      .eq("version_id", sourceVersionId)
      .eq("workspace_id", workspaceId)
      .maybeSingle();

    // If version doesn't exist (was deleted), return error
    if (fetchError) throw fetchError;
    if (!sourceVersion) {
      return {
        success: false,
        error: "Source version not found (may have been deleted)",
      };
    }

    // 2. Validate draft name is provided
    if (!newDraftName || newDraftName.trim() === '') {
      throw new Error("Draft name is required");
    }

    const finalDraftName = newDraftName.trim();

    // 3. Create new project_versions record
    const { data: newVersion, error: versionError } = await supabase
      .from("project_versions")
      .insert({
        project_id: projectId,
        workspace_id: workspaceId,
        created_by: userId,
        multiplier: sourceVersion.multiplier,
        status: "Draft",
        name: finalDraftName,
        payment_1_percentage: sourceVersion.payment_1_percentage,
        payment_2_percentage: sourceVersion.payment_2_percentage,
        payment_3_percentage: sourceVersion.payment_3_percentage,
        payment_4_percentage: sourceVersion.payment_4_percentage,
        estimated_start_date: sourceVersion.estimated_start_date ?? null,
        estimated_construction_time: sourceVersion.estimated_construction_time ?? null,
      })
      .select()
      .single();

    if (versionError) throw versionError;
    if (!newVersion) throw new Error("Failed to create new version");

    const newVersionId = newVersion.version_id;

    // 4. Clone all version_labor records
    const { data: laborItems, error: laborFetchError } = await supabase
      .from("version_labor")
      .select("*")
      .eq("version_id", sourceVersionId);

    if (laborFetchError) throw laborFetchError;

    if (laborItems && laborItems.length > 0) {
      const laborInserts = laborItems.map((item: any) => ({
        version_id: newVersionId,
        labor_id: item.labor_id,
        quantity: item.quantity,
        price: item.price,
        item_name: item.item_name,
      }));

      const { error: laborInsertError } = await supabase
        .from("version_labor")
        .insert(laborInserts);

      if (laborInsertError) throw laborInsertError;
    }

    // 5. Clone all version_materials records
    const { data: materialItems, error: materialFetchError } = await supabase
      .from("version_materials")
      .select("*")
      .eq("version_id", sourceVersionId);

    if (materialFetchError) throw materialFetchError;

    if (materialItems && materialItems.length > 0) {
      const materialInserts = materialItems.map((item: any) => ({
        version_id: newVersionId,
        material_id: item.material_id,
        quantity: item.quantity,
        price: item.price,
        waste_pct: item.waste_pct,
        item_name: item.item_name,
      }));

      const { error: materialInsertError } = await supabase
        .from("version_materials")
        .insert(materialInserts);

      if (materialInsertError) throw materialInsertError;
    }

    // 6. Clone all material_revisions records (if any)
    // First, we need to create a mapping from old version_materials.id to new version_materials.id
    const { data: sourceVersionMaterials, error: sourceVmError } = await supabase
      .from("version_materials")
      .select("id, material_id")
      .eq("version_id", sourceVersionId)
      .order("created_at", { ascending: true });

    if (sourceVmError) throw sourceVmError;

    const { data: newVersionMaterials, error: newVmError } = await supabase
      .from("version_materials")
      .select("id, material_id")
      .eq("version_id", newVersionId)
      .order("created_at", { ascending: true });

    if (newVmError) throw newVmError;

    // Create a map of old version_materials.id -> new version_materials.id
    // by matching material_id and order (since cloning preserves order)
    const oldToNewIdMap = new Map<string, string>();
    if (sourceVersionMaterials && newVersionMaterials) {
      sourceVersionMaterials.forEach((oldVm, index) => {
        const newVm = newVersionMaterials[index];
        if (newVm && oldVm.material_id === newVm.material_id) {
          oldToNewIdMap.set(oldVm.id, newVm.id);
        }
      });
    }

    const { data: revisions, error: revisionsFetchError } = await supabase
      .from("material_revisions")
      .select("*")
      .eq("version_id", sourceVersionId);

    if (revisionsFetchError) throw revisionsFetchError;

    if (revisions && revisions.length > 0) {
      const revisionInserts = revisions.map((item: any) => {
        // Remap linked_to_id from old version_materials.id to new version_materials.id
        const newLinkedToId = item.linked_to_id ? oldToNewIdMap.get(item.linked_to_id) || null : null;
        const newOriginalMaterialId = item.original_material_id ? oldToNewIdMap.get(item.original_material_id) || null : null;

        return {
          version_id: newVersionId,
          original_material_id: newOriginalMaterialId,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          link: item.link, // Preserve the link
          linked_to_id: newLinkedToId, // Remap to new version_materials.id
          linked_to_name: item.linked_to_name,
          is_unmodified: item.is_unmodified,
          notes: item.notes,
        };
      });

      const { error: revisionsInsertError } = await supabase
        .from("material_revisions")
        .insert(revisionInserts);

      if (revisionsInsertError) throw revisionsInsertError;
    }

    // CRITICAL: active_version is NEVER set here - let the caller decide based on version type
    // This prevents change orders from incorrectly becoming the active version.
    // Change orders must NEVER update active_version in the projects table.
    // Only drafts can be set as active_version. Change orders use is_active field instead.

    return {
      success: true,
      newVersionId,
      newDraftName: finalDraftName,
    };
  } catch (error) {
    console.error("Error cloning draft version:", error);
    return {
      success: false,
      error: (error as any)?.message || "Unknown error occurred",
    };
  }
}

/**
 * Helper function to get the next draft number for a project
 */
export async function getNextDraftNumber(
  projectId: string,
  workspaceId: string
): Promise<number> {
  try {
    const { data, error } = await (supabase as any)
      .from("project_versions")
      .select("status")
      .eq("project_id", projectId)
      .eq("workspace_id", workspaceId);

    if (error) throw error;

    const count =
      data?.filter((v: any) => v.status?.toLowerCase().includes("draft"))
        .length || 0;

    return count + 1;
  } catch (error) {
    console.error("Error getting next draft number:", error);
    return 1;
  }
}

