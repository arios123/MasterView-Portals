import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Item } from '@/types/materials';
import { uid } from '@/utils/materialsUtils';
import { useLocalStorageCache } from '@/hooks/useLocalStorageCache';
import { isDemoMode } from '@/utils/demoMode';

interface UseMaterialsLocalStateProps {
  versionId: string | null;
  contractItems: Item[];
  cacheKey?: string; // Optional cache key for localStorage persistence
}

export function useMaterialsLocalState({ versionId, contractItems, cacheKey }: UseMaterialsLocalStateProps) {
  // Use localStorage cache if cacheKey is provided, otherwise use regular state
  // We need to always call hooks in the same order, so we use a fallback key when cacheKey is not provided
  const fallbackKey = `temp-actual-items-${versionId || 'no-version'}`;
  const cachedState = useLocalStorageCache<Item[]>(cacheKey || fallbackKey, [], {
    saveOnChange: !!cacheKey, // Only save to cache if cacheKey is provided
    restoreOnMount: !!cacheKey, // Only restore from cache if cacheKey is provided
  });
  const regularState = useState<Item[]>([]);
  
  // Use cached state if cacheKey is provided, otherwise use regular state
  const actualItems = cacheKey ? cachedState[0] : regularState[0];
  const setActualItems = cacheKey ? cachedState[1] : regularState[1];
  const clearActualItemsCache = cacheKey ? cachedState[2] : () => {};

  // Load material revisions from database on initial load
  useEffect(() => {
    const loadInitialRevisions = async () => {
      if (!versionId) {
        if (actualItems.length === 0 && contractItems.length > 0) {
          const cloned = contractItems.map((it) => ({
            ...it,
            linkedTo: it.id,
            linkedName: it.name,
            id: uid(),
            unmodified: true,
          }));
          setActualItems(cloned);
        }
        return;
      }
      if (isDemoMode()) {
        if (actualItems.length === 0 && contractItems.length > 0) {
          const cloned = contractItems.map((it) => ({
            ...it,
            linkedTo: it.id,
            linkedName: it.name,
            id: uid(),
            unmodified: true,
          }));
          setActualItems(cloned);
        }
        return;
      }

      // Only load if actualItems is empty (initial load)
      // But if we have cached items, we still want to refresh from database to ensure we have latest data
      const hasCachedItems = actualItems.length > 0;

      try {
        const { data, error } = await supabase
          .from('material_revisions')
          .select('*')
          .eq('version_id', versionId);

        if (error) {
          console.error('Error loading material revisions:', error);
          // If error and we have cached items, keep them (don't overwrite with clones)
          // Only clone if we have no cached items and no database data
          if (!hasCachedItems && contractItems.length > 0) {
            const cloned = contractItems.map((it) => ({
              ...it,
              linkedTo: it.id,
              linkedName: it.name,
              id: uid(),
              unmodified: true,
            }));
            setActualItems(cloned);
          }
        } else if (data && data.length > 0) {
          // Fetch current version_materials to validate/remap linked_to_id
          const { data: currentVersionMaterials } = await supabase
            .from('version_materials')
            .select('id, material_id')
            .eq('version_id', versionId);

          // Create a set of valid version_materials.id for quick lookup
          const validVersionMaterialIds = new Set(
            currentVersionMaterials?.map(vm => vm.id) || []
          );

          // Load saved revisions and remap linked_to_id if needed
          const formattedRevisions = data.map((item: any) => {
            let linkedToId = item.linked_to_id || undefined;

            // If linked_to_id doesn't exist in current version, try to remap it
            if (linkedToId && !validVersionMaterialIds.has(linkedToId)) {
              // Try to find the original_material_id and remap it
              if (item.original_material_id && validVersionMaterialIds.has(item.original_material_id)) {
                // If original_material_id exists in current version, use it
                linkedToId = item.original_material_id;
              } else {
                // Try to find by material_id if we have the original version_material
                // This is a fallback - in most cases, cloning should have already remapped it
                linkedToId = undefined; // Clear invalid reference
              }
            }

            return {
              id: item.id,
              name: item.name,
              qty: Number(item.quantity),
              price: Number(item.price),
              linkedTo: linkedToId,
              linkedName: item.linked_to_name || undefined,
              unmodified: item.is_unmodified || false,
              link: item.link || undefined, // Preserve the link
              notes: item.notes || undefined,
            };
          });
          // Always update with database data (source of truth)
          setActualItems(formattedRevisions);
        } else {
          // No saved revisions in database
          // If we have cached items, keep them (user might have unsaved changes)
          // Only clone if we have no cached items
          if (!hasCachedItems && contractItems.length > 0) {
            const cloned = contractItems.map((it) => ({
              ...it,
              linkedTo: it.id,
              linkedName: it.name,
              id: uid(),
              unmodified: true,
            }));
            setActualItems(cloned);
          }
        }
      } catch (error) {
        console.error('Error loading material revisions:', error);
      }
    };

    loadInitialRevisions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [versionId, contractItems.length]); // Only depend on versionId and contractItems.length, not actualItems

  return { actualItems, setActualItems, clearActualItemsCache };
}

