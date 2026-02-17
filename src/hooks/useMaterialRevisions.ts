import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { isDemoMode } from '@/utils/demoMode';
import { cloneDraftVersion } from '@/utils/draftCloning';

interface MaterialRevision {
  id: string;
  name: string;
  qty: number;
  price: number;
  linkedTo?: string;
  linkedName?: string;
  unmodified?: boolean;
  link?: string;
  notes?: string;
}

interface SaveRevisionsAsNewDraftParams {
  items: MaterialRevision[];
  projectId: string;
  workspaceId: string;
  userId: string;
  draftName?: string;
}

interface SaveRevisionsAsNewDraftResult {
  success: boolean;
  newVersionId?: string;
  newDraftName?: string;
  error?: string;
}

export function useMaterialRevisions(versionId: string | null) {
  const [revisions, setRevisions] = useState<MaterialRevision[]>([]);
  const [loading, setLoading] = useState(false);

  // Load revisions from database
  useEffect(() => {
    if (!versionId) return;

    const loadRevisions = async () => {
      setLoading(true);
      if (isDemoMode()) {
        setLoading(false);
        return;
      }
      try {
        const { data, error } = await supabase
          .from('material_revisions')
          .select('*')
          .eq('version_id', versionId)
          .order('created_at', { ascending: true });

        if (error) throw error;

        if (data && data.length > 0) {
          const formattedRevisions = data.map((rev) => ({
            id: rev.id,
            name: rev.name,
            qty: Number(rev.quantity),
            price: Number(rev.price),
            linkedTo: rev.linked_to_id || undefined,
            linkedName: rev.linked_to_name || undefined,
            unmodified: rev.is_unmodified,
            link: rev.link || undefined,
            notes: rev.notes || undefined,
          }));
          setRevisions(formattedRevisions);
        }
      } catch (error) {
        console.error('Error loading material revisions:', error);
        toast.error('Failed to load material revisions');
      } finally {
        setLoading(false);
      }
    };

    loadRevisions();
  }, [versionId]);

  // Save revisions to database (update in place - for sold projects)
  const saveRevisions = async (items: MaterialRevision[]) => {
    if (!versionId) {
      toast.error('No version selected');
      return false;
    }

    // COMMENTED OUT IN DEMO MODE - demo is read-only
    const { isDemoMode, blockDemoWrite } = await import('@/utils/demoMode');
    if (blockDemoWrite('save material revisions')) {
      return false;
    }

    try {
      // COMMENTED OUT IN DEMO MODE - demo is read-only
      // Delete existing revisions for this version
      const { error: deleteError } = await supabase
        .from('material_revisions')
        .delete()
        .eq('version_id', versionId);

      if (deleteError) throw deleteError;

      // COMMENTED OUT IN DEMO MODE - demo is read-only
      // Insert new revisions
      // item.linkedTo is already a version_materials.id, so we use it directly
      if (items.length > 0) {
        const revisionsToInsert = items.map((item) => ({
          version_id: versionId,
          original_material_id: item.linkedTo || null, // linkedTo is version_materials.id
          name: item.name,
          quantity: item.qty,
          price: item.price,
          link: item.link || null,
          linked_to_id: item.linkedTo || null, // linkedTo is version_materials.id
          linked_to_name: item.linkedName || null,
          is_unmodified: item.unmodified || false,
          notes: item.notes || null,
        }));

        // COMMENTED OUT IN DEMO MODE - demo is read-only
        const { error: insertError } = await supabase
          .from('material_revisions')
          .insert(revisionsToInsert);

        if (insertError) throw insertError;
      }

      return true;
    } catch (error) {
      console.error('Error saving material revisions:', error);
      toast.error('Failed to save material revisions');
      return false;
    }
  };

  // Save revisions by creating a new draft version (clone + save)
  const saveRevisionsAsNewDraft = async (
    params: SaveRevisionsAsNewDraftParams
  ): Promise<SaveRevisionsAsNewDraftResult> => {
    if (!versionId) {
      toast.error('No version selected');
      return { success: false, error: 'No version selected' };
    }

    const { blockDemoWrite } = await import('@/utils/demoMode');
    if (blockDemoWrite('save material revisions as new draft')) {
      return { success: false, error: 'Disabled in demo' };
    }

    const { items, projectId, workspaceId, userId, draftName } = params;

    try {
      // 1. Clone the current draft version
      const cloneResult = await cloneDraftVersion({
        sourceVersionId: versionId,
        projectId,
        workspaceId,
        userId,
        newDraftName: draftName,
      });

      if (!cloneResult.success || !cloneResult.newVersionId) {
        throw new Error(cloneResult.error || 'Failed to clone draft');
      }

      // 2. Fetch the source version_materials to create a mapping from old to new IDs
      const { data: sourceVersionMaterials, error: sourceVmError } = await supabase
        .from('version_materials')
        .select('id, material_id')
        .eq('version_id', versionId)
        .order('created_at', { ascending: true });

      if (sourceVmError) throw sourceVmError;

      // 3. Fetch the cloned version_materials to get their new IDs
      const { data: newVersionMaterials, error: newVmError } = await supabase
        .from('version_materials')
        .select('id, material_id')
        .eq('version_id', cloneResult.newVersionId)
        .order('created_at', { ascending: true });

      if (newVmError) throw newVmError;

      // Create a map of old version_materials.id -> new version_materials.id
      // by matching material_id and order
      const oldToNewIdMap = new Map<string, string>();
      if (sourceVersionMaterials && newVersionMaterials) {
        // Match by material_id and position (since cloning preserves order)
        sourceVersionMaterials.forEach((oldVm, index) => {
          const newVm = newVersionMaterials[index];
          if (newVm && oldVm.material_id === newVm.material_id) {
            oldToNewIdMap.set(oldVm.id, newVm.id);
          }
        });
      }

      // COMMENTED OUT IN DEMO MODE - demo is read-only
      // 4. Delete any existing revisions for the NEW version (shouldn't exist, but just in case)
      const { error: deleteError } = await supabase
        .from('material_revisions')
        .delete()
        .eq('version_id', cloneResult.newVersionId);

      if (deleteError) throw deleteError;

      // COMMENTED OUT IN DEMO MODE - demo is read-only
      // 5. Insert new revisions for the NEW version with remapped linked_to_id
      if (items.length > 0) {
        const revisionsToInsert = items.map((item) => {
          // Remap linkedTo (old version_materials.id) to new version_materials.id
          const newLinkedToId = item.linkedTo ? oldToNewIdMap.get(item.linkedTo) || null : null;
          
          return {
            version_id: cloneResult.newVersionId,
            original_material_id: newLinkedToId, // Use remapped version_materials.id
            name: item.name,
            quantity: item.qty,
            price: item.price,
            link: item.link || null, // Preserve the link
            linked_to_id: newLinkedToId, // Use remapped version_materials.id
            linked_to_name: item.linkedName || null,
            is_unmodified: item.unmodified || false,
            notes: item.notes || null,
          };
        });

        // COMMENTED OUT IN DEMO MODE - demo is read-only
        const { error: insertError } = await supabase
          .from('material_revisions')
          .insert(revisionsToInsert);

        if (insertError) throw insertError;
      }

      toast.success(`Saved as ${cloneResult.newDraftName}!`);
      
      return {
        success: true,
        newVersionId: cloneResult.newVersionId,
        newDraftName: cloneResult.newDraftName,
      };
    } catch (error) {
      console.error('Error saving material revisions as new draft:', error);
      toast.error('Failed to save material revisions');
      return {
        success: false,
        error: (error as any)?.message || 'Unknown error',
      };
    }
  };

  return {
    revisions,
    loading,
    saveRevisions, // Old method - still available for backwards compatibility
    saveRevisionsAsNewDraft, // New method - creates new draft version
  };
}
