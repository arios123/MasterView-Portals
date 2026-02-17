import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { LineItem, Project } from '@/types';
import { logInsert } from '@/lib/auditLog';

interface LoadChangeOrderParams {
  draft: any;
  setItems: (fn: (prev: LineItem[]) => LineItem[]) => void;
  setMultiplier: (value: number) => void;
  setDraftName: (value: string) => void;
  setLoadedChangeOrderName: (value: string | null) => void;
  onDraftSelect: (draft: any) => void;
}

interface SaveChangeOrderParams {
  user: any;
  workspaceId: string | undefined;
  draftName: string;
  items: LineItem[];
  project: Project;
  baselineItems: LineItem[];
  onClearEditing: () => void;
  editingVersionId?: string | null;
  onBaselineItemsChange?: (items: LineItem[]) => void;
}

export function useChangeOrderOperations() {
  const loadChangeOrder = async ({
    draft,
    setItems,
    setMultiplier,
    setDraftName,
    setLoadedChangeOrderName,
    onDraftSelect,
  }: LoadChangeOrderParams) => {
    try {
      // Get the project to find active_version (baseline)
      const { data: projectData } = await (supabase as any)
        .from('projects')
        .select('project_id, active_version')
        .eq('project_id', draft.project_id)
        .single();

      if (!projectData?.active_version) {
        toast.error('No active draft found for this project');
        return;
      }

      const activeVersionId = projectData.active_version;

      // Load baseline items (sold/active draft)
      const { data: baselineLaborData } = await supabase
        .from('version_labor')
        .select('*, labor_options:labor_id (*)')
        .eq('version_id', activeVersionId);

      const { data: baselineMaterialData } = await supabase
        .from('version_materials')
        .select('*, material_options:material_id (*)')
        .eq('version_id', activeVersionId);

      // Build baseline map: catalog_id -> baseline item
      const baselineMap = new Map<string, LineItem>();
      
      baselineLaborData?.forEach((item: any) => {
        if (item.labor_options) {
          baselineMap.set(item.labor_id, {
            id: item.labor_options.id,
            name: item.item_name || item.labor_options.name,
            qty: Number(item.quantity),
            unitPrice: Number(item.price),
            kind: 'labor',
          });
        }
      });

      baselineMaterialData?.forEach((item: any) => {
        if (item.material_options) {
          baselineMap.set(item.material_id, {
            id: item.material_options.id,
            name: item.item_name || item.material_options.name,
            qty: Number(item.quantity),
            unitPrice: Number(item.price),
            wastePct: Number(item.waste_pct) || 0,
            kind: 'material',
          });
        }
      });

      // Load change order deltas
      const { data: laborDeltas, error: laborError } = await supabase
        .from('version_labor')
        .select('*, labor_options:labor_id (*)')
        .eq('version_id', draft.version_id);

      if (laborError) throw laborError;

      const { data: materialDeltas, error: materialError } = await supabase
        .from('version_materials')
        .select('*, material_options:material_id (*)')
        .eq('version_id', draft.version_id);

      if (materialError) throw materialError;

      // Apply deltas to baseline to get final state
      const finalItems = new Map<string, LineItem>();

      // Start with baseline items
      baselineMap.forEach((item, catalogId) => {
        finalItems.set(catalogId, { ...item });
      });

      // Apply labor deltas
      laborDeltas?.forEach((delta: any) => {
        if (!delta.labor_options) return;
        
        const catalogId = delta.labor_id;
        const baselineItem = baselineMap.get(catalogId);
        
        if (delta.baseline_version_labor_id && baselineItem) {
          // Modified item - apply deltas
          const currentItem = finalItems.get(catalogId);
          if (currentItem) {
            const newQty = currentItem.qty + Number(delta.quantity);
            const newPrice = currentItem.unitPrice + Number(delta.price_delta || 0);
            
            if (newQty === 0) {
              // Quantity became 0, mark as deleted
              finalItems.set(catalogId, {
                ...currentItem,
                qty: 0,
                isDeleted: true,
              });
            } else {
              finalItems.set(catalogId, {
                ...currentItem,
                qty: newQty,
                unitPrice: newPrice,
              });
            }
          }
        } else {
          // New item - add it
          finalItems.set(catalogId, {
            id: delta.labor_options.id,
            name: delta.item_name || delta.labor_options.name,
            qty: Number(delta.quantity),
            unitPrice: Number(delta.price), // New items store price directly
            kind: 'labor',
          });
        }
      });

      // Apply material deltas
      materialDeltas?.forEach((delta: any) => {
        if (!delta.material_options) return;
        
        const catalogId = delta.material_id;
        const baselineItem = baselineMap.get(catalogId);
        
        if (delta.baseline_version_material_id && baselineItem) {
          // Modified item - apply deltas
          const currentItem = finalItems.get(catalogId);
          if (currentItem) {
            const newQty = currentItem.qty + Number(delta.quantity);
            const newPrice = currentItem.unitPrice + Number(delta.price_delta || 0);
            
            if (newQty === 0) {
              // Quantity became 0, mark as deleted
              finalItems.set(catalogId, {
                ...currentItem,
                qty: 0,
                isDeleted: true,
              });
            } else {
              finalItems.set(catalogId, {
                ...currentItem,
                qty: newQty,
                unitPrice: newPrice,
                wastePct: Number(delta.waste_pct) || currentItem.wastePct || 0,
              });
            }
          }
        } else {
          // New item - add it
          finalItems.set(catalogId, {
            id: delta.material_options.id,
            name: delta.item_name || delta.material_options.name,
            qty: Number(delta.quantity),
            unitPrice: Number(delta.price), // New items store price directly
            wastePct: Number(delta.waste_pct) || 0,
            kind: 'material',
          });
        }
      });

      // Convert map to array and filter out items with qty 0 (unless marked as deleted)
      const draftItems = Array.from(finalItems.values()).filter(
        (item) => item.qty !== 0 || item.isDeleted
      );

      setItems(() => draftItems);
      setMultiplier(1); // Change orders always use multiplier of 1
      setDraftName(''); // Always set draft name to empty when loading
      const changeOrderName = draft.name || draft.status || 'Change Order';
      setLoadedChangeOrderName(changeOrderName);

      onDraftSelect(draft);
      toast.success(`Loaded ${changeOrderName}`);
    } catch (error) {
      console.error('Error loading draft items:', error);
      toast.error('Failed to load draft items');
    }
  };

  const saveChangeOrder = async (params: SaveChangeOrderParams): Promise<boolean> => {
    const { user, workspaceId, draftName, items, project, baselineItems, onClearEditing, editingVersionId, onBaselineItemsChange } = params;

    if (!user) {
      toast.error('You must be logged in to save change orders');
      return false;
    }

    if (!workspaceId) {
      toast.error('Workspace not available');
      return false;
    }

    // Validate draft name is required
    if (!draftName || draftName.trim() === '') {
      toast.error('Please enter a change order name before saving');
      return false;
    }

    try {
      // Get active_version to use as baseline
      const { data: projectData, error: projectError } = await (supabase as any)
        .from('projects')
        .select('active_version')
        .eq('project_id', project.id)
        .eq('workspace_id', workspaceId)
        .single();

      if (projectError) throw projectError;

      const activeVersionId = projectData?.active_version;
      if (!activeVersionId) {
        toast.error('No active draft found. Please set an active draft first.');
        return false;
      }

      // Load baseline version_materials and version_labor with their IDs for linking
      const { data: baselineLaborData } = await supabase
        .from('version_labor')
        .select('id, labor_id, quantity, price')
        .eq('version_id', activeVersionId);

      const { data: baselineMaterialData } = await supabase
        .from('version_materials')
        .select('id, material_id, quantity, price, waste_pct')
        .eq('version_id', activeVersionId);

      // Create maps for quick lookup: catalog_id -> baseline record
      const baselineLaborMap = new Map(
        (baselineLaborData || []).map((item: any) => [item.labor_id, item])
      );
      const baselineMaterialMap = new Map(
        (baselineMaterialData || []).map((item: any) => [item.material_id, item])
      );     
      // Validate items before processing (check original values, not normalized)
      const activeItems = items.filter((item) => !item.isDeleted);
      const invalidItems = activeItems.filter((item) => {
        if (!item.name || item.name.trim() === '') {
          return true; // Name is required
        }
        if (item.qty === undefined || item.qty === null || isNaN(item.qty)) {
          return true; // Qty must be a valid number
        }
        if (item.unitPrice === undefined || item.unitPrice === null || isNaN(item.unitPrice)) {
          return true; // Price must be a valid number
        }
        return false;
      });

      if (invalidItems.length > 0) {
        toast.error('Please fill in all fields (Name, Qty, and Price) before saving. Empty fields will default to 0.');
        return false;
      }

      // Normalize items after validation (default to 0 for numbers, trim name)
      const normalizedItems = activeItems.map((item) => {
        const normalized: LineItem = {
          ...item,
          qty: item.qty ?? 0,
          unitPrice: item.unitPrice ?? 0,
          name: item.name?.trim() || '',
        };
        return normalized;
      });

      const baselineItemIds = new Set(baselineItems.map((i) => i.id));

      // Calculate deltas for each item (use normalized items)
      const laborDeltas: any[] = [];
      const materialDeltas: any[] = [];

      // Process items that exist in baseline (modified or removed)
      baselineItems.forEach((baselineItem) => {
        const currentItem = normalizedItems.find((item) => item.id === baselineItem.id);
        const baselineRecord = baselineItem.kind === 'labor' 
          ? baselineLaborMap.get(baselineItem.id)
          : baselineMaterialMap.get(baselineItem.id);

        if (!baselineRecord) return; // Skip if baseline record not found

        if (!currentItem) {
          // Item was completely removed - save negative delta
          const qtyDelta = -baselineItem.qty;
          if (baselineItem.kind === 'labor') {
            laborDeltas.push({
              version_id: null, // Will be set after version creation
              labor_id: baselineItem.id,
              quantity: qtyDelta,
              price_delta: 0, // No price change on removal
              baseline_version_labor_id: baselineRecord.id,
              item_name: baselineItem.name, // Keep baseline name
            });
          } else {
            materialDeltas.push({
              version_id: null, // Will be set after version creation
              material_id: baselineItem.id,
              quantity: qtyDelta,
              price_delta: 0, // No price change on removal
              waste_pct: baselineItem.wastePct || 0,
              baseline_version_material_id: baselineRecord.id,
              item_name: baselineItem.name, // Keep baseline name
            });
          }
        } else {
          // Item exists in both - calculate deltas
          // Use normalized values (0 if undefined/null)
          const currentQty = currentItem.qty ?? 0;
          const currentPrice = currentItem.unitPrice ?? 0;
          const qtyDelta = currentQty - baselineItem.qty;
          const priceDelta = currentPrice - baselineItem.unitPrice;

          // Only save if there's a change
          if (qtyDelta !== 0 || priceDelta !== 0) {
            if (baselineItem.kind === 'labor') {
              laborDeltas.push({
                version_id: null, // Will be set after version creation
                labor_id: baselineItem.id,
                quantity: qtyDelta,
                price_delta: priceDelta,
                baseline_version_labor_id: baselineRecord.id,
                item_name: baselineItem.name, // Keep baseline name (cannot edit)
              });
            } else {
              materialDeltas.push({
                version_id: null, // Will be set after version creation
                material_id: baselineItem.id,
                quantity: qtyDelta,
                price_delta: priceDelta,
                waste_pct: currentItem.wastePct || 0,
                baseline_version_material_id: baselineRecord.id,
                item_name: baselineItem.name, // Keep baseline name (cannot edit)
              });
            }
          }
        }
      });

      // Process new items (not in baseline) - use normalized items
      normalizedItems.forEach((item) => {
        if (!baselineItemIds.has(item.id)) {
          // New item - save full item (no baseline link)
          // Use normalized values (0 if undefined/null)
          const itemQty = item.qty ?? 0;
          const itemPrice = item.unitPrice ?? 0;
          const itemName = item.name?.trim() || '';
          
          if (item.kind === 'labor') {
            laborDeltas.push({
              version_id: null, // Will be set after version creation
              labor_id: item.id,
              quantity: itemQty, // Positive quantity for new items
              price_delta: 0, // New items use their own price (stored in price field, not delta)
              baseline_version_labor_id: null, // New item, no baseline
              item_name: itemName, // Can have custom name for new items
            });
          } else {
            materialDeltas.push({
              version_id: null, // Will be set after version creation
              material_id: item.id,
              quantity: itemQty, // Positive quantity for new items
              price_delta: 0, // New items use their own price (stored in price field, not delta)
              waste_pct: item.wastePct || 0,
              baseline_version_material_id: null, // New item, no baseline
              item_name: itemName, // Can have custom name for new items
            });
          }
        }
      });

      // Check if there are any changes to save
      if (laborDeltas.length === 0 && materialDeltas.length === 0) {
        toast.error('No changes to save');
        return false;
      }

      let versionId: string;

      // Create new change order. Same delta-based save for first- and second-degree.
      // First-degree: source_version_id = activeVersionId. Second-degree: source_version_id = editingVersionId (parent).
      const sourceVersionId = editingVersionId ?? activeVersionId;
      console.log(
        editingVersionId
          ? `Creating second-degree change order (from parent ${editingVersionId})`
          : 'Creating first-degree change order'
      );

      const { data: versionData, error: versionError } = await supabase
        .from('project_versions')
        .insert({
          project_id: project.id,
          created_by: user.id,
          multiplier: 1,
          status: 'Change Order',
          name: draftName.trim(),
          workspace_id: workspaceId,
          source_version_id: sourceVersionId,
        })
        .select()
        .single();

      if (versionError) throw versionError;

      versionId = versionData.version_id;
      console.log('Created change order:', versionId);

      // Set version_id for all deltas
      laborDeltas.forEach((delta) => {
        delta.version_id = versionId;
      });
      materialDeltas.forEach((delta) => {
        delta.version_id = versionId;
      });

      // Save labor deltas
      if (laborDeltas.length > 0) {
        // For new items, we need to store the price in the price field (not delta)
        // For modified items, price_delta is stored separately, but we still need to store the final price
        const laborInserts = laborDeltas.map((delta) => {
          const baselineRecord = delta.baseline_version_labor_id 
            ? baselineLaborMap.get(baselineItems.find((bi) => bi.id === delta.labor_id)?.id || '')
            : null;
          
          return {
            version_id: delta.version_id,
            labor_id: delta.labor_id,
            quantity: delta.quantity,
            price: baselineRecord 
              ? Number(baselineRecord.price) + (delta.price_delta || 0) // baseline + delta
              : (normalizedItems.find((item) => item.id === delta.labor_id)?.unitPrice ?? 0), // new item price (normalized)
            price_delta: delta.price_delta || 0,
            baseline_version_labor_id: delta.baseline_version_labor_id,
            item_name: delta.item_name,
          };
        });

        const { error: laborError } = await supabase.from('version_labor').insert(laborInserts);

        if (laborError) {
          console.error('Labor insert error:', laborError);
          throw laborError;
        }
      }

      // Save material deltas
      if (materialDeltas.length > 0) {
        // For new items, we need to store the price in the price field (not delta)
        // For modified items, price_delta is stored separately, but we still need to store the final price
        const materialInserts = materialDeltas.map((delta) => {
          const baselineRecord = delta.baseline_version_material_id
            ? baselineMaterialMap.get(baselineItems.find((bi) => bi.id === delta.material_id)?.id || '')
            : null;
          
          return {
            version_id: delta.version_id,
            material_id: delta.material_id,
            quantity: delta.quantity,
            price: baselineRecord
              ? Number(baselineRecord.price) + (delta.price_delta || 0) // baseline + delta
              : (normalizedItems.find((item) => item.id === delta.material_id)?.unitPrice ?? 0), // new item price (normalized)
            price_delta: delta.price_delta || 0,
            waste_pct: delta.waste_pct || 0,
            baseline_version_material_id: delta.baseline_version_material_id,
            item_name: delta.item_name,
          };
        });

        const { error: materialError } = await supabase.from('version_materials').insert(materialInserts);

        if (materialError) {
          console.error('Material insert error:', materialError);
          throw materialError;
        }
      }

      const totalSaved = laborDeltas.length + materialDeltas.length;

      if (totalSaved === 0) {
        toast.error('No changes to save');
        return false;
      }

      // CRITICAL: Change orders NEVER update active_version in the projects table.
      // active_version is only for drafts. Change orders use is_active field on project_versions instead.
      // This ensures change orders can only affect other change orders, never the active/sold draft.

      // Log audit event for change order creation
      // Fetch versionData for audit logging (needed for both roll-forward and new change order paths)
      if (workspaceId && user && versionId) {
        try {
          const { data: versionDataForAudit } = await (supabase as any)
            .from('project_versions')
            .select('*')
            .eq('version_id', versionId)
            .single();

          if (versionDataForAudit) {
            await logInsert(workspaceId, user.id, 'project_versions', versionId, versionDataForAudit, 'Projects');
          }
        } catch (auditError) {
          // Don't fail the save if audit logging fails
          console.error('Error logging audit event:', auditError);
        }
      }

      // If editing an existing CO: deactivate the old one and copy its material_revisions to the new one
      if (editingVersionId) {
        // Deactivate old CO
        const { error: deactivateError } = await supabase
          .from('project_versions')
          .update({ is_active: false })
          .eq('version_id', editingVersionId);

        if (deactivateError) {
          console.error('Error deactivating old change order:', deactivateError);
          // Don't fail the save — the new CO was created successfully
        }

        // Copy material_revisions from old CO to new CO
        const { data: oldRevisions, error: fetchRevisionsError } = await supabase
          .from('material_revisions')
          .select('*')
          .eq('version_id', editingVersionId);

        if (fetchRevisionsError) {
          console.error('Error fetching old material revisions:', fetchRevisionsError);
        } else if (oldRevisions && oldRevisions.length > 0) {
          const revisionInserts = oldRevisions.map((rev: any) => ({
            version_id: versionId,
            original_material_id: rev.original_material_id,
            name: rev.name,
            quantity: rev.quantity,
            price: rev.price,
            link: rev.link || null,
            linked_to_id: rev.linked_to_id,
            linked_to_name: rev.linked_to_name,
            is_unmodified: rev.is_unmodified,
            notes: rev.notes || null,
          }));

          const { error: insertRevisionsError } = await supabase
            .from('material_revisions')
            .insert(revisionInserts);

          if (insertRevisionsError) {
            console.error('Error copying material revisions to new CO:', insertRevisionsError);
          }
        }
      }

      // Set new CO as active
      const { error: activateError } = await supabase
        .from('project_versions')
        .update({ is_active: true })
        .eq('version_id', versionId);

      if (activateError) {
        console.error('Error activating new change order:', activateError);
      }

      toast.success(`Change order saved successfully with ${totalSaved} delta(s)!`);

      // Clear editing state after saving (this also clears cached items)
      onClearEditing();
      return true;
    } catch (error) {
      console.error('Error saving change order:', error);
      toast.error('Failed to save change order: ' + (error as any)?.message || 'Unknown error');
      return false;
    }
  };

  const saveAsNew = async (params: SaveChangeOrderParams): Promise<boolean> => {
    const { user, workspaceId, items, project, baselineItems, onClearEditing } = params;

    if (!user) {
      toast.error('You must be logged in to save change orders');
      return false;
    }

    if (!workspaceId) {
      toast.error('Workspace not available');
      return false;
    }

    try {
      // For change orders, calculate delta items
      let itemsToSave = items;
      if (baselineItems.length > 0) {
        // Filter out deleted items when building currentItemIds (they should be treated as removed)
        const activeItems = items.filter((item) => !item.isDeleted);
        const currentItemIds = new Set(activeItems.map((i) => i.id));

        // Find items that were removed (in baseline but not in current active items)
        const baselineItemIds = new Set(baselineItems.map((i) => i.id));
        const removedFromBaseline = baselineItems.filter((baselineItem) => !currentItemIds.has(baselineItem.id));

        // Also include items that are marked as deleted and were in baseline
        const deletedItemsFromBaseline = items.filter(
          (item) => item.isDeleted && baselineItemIds.has(item.id)
        );

        // Combine removed items (from baseline comparison) and deleted items (from baseline)
        const removedItems = [
          ...removedFromBaseline,
          ...deletedItemsFromBaseline.map((item) => {
            // Find the baseline item to get original quantity
            const baselineItem = baselineItems.find((bi) => bi.id === item.id);
            return baselineItem || item;
          }),
        ];

        // Find items that were added (in current active items but not in baseline)
        const addedItems = activeItems.filter((item) => !baselineItemIds.has(item.id));

        // Combine: removed items with negative quantities + added items with positive quantities
        itemsToSave = [
          ...removedItems.map((item) => ({
            ...item,
            qty: -Math.abs(item.qty), // Set quantity negative to indicate removal
            unitPrice: Math.abs(item.unitPrice), // Keep price positive
          })),
          ...addedItems,
        ];

        console.log('Change order delta - Removed:', removedItems.length, 'Added:', addedItems.length);
      }

      if (itemsToSave.length === 0) {
        toast.error('No changes to save');
        return false;
      }

      // Always create a new version (ignore editingVersionId)
      const { data: countData } = await (supabase as any)
        .from('project_versions')
        .select('status')
        .eq('project_id', project.id)
        .eq('workspace_id', workspaceId);

      const count = countData?.filter((v) => v.status?.toLowerCase().includes('change order')).length || 0;

      const nextNumber = count + 1;
      const newName = `Change Order ${nextNumber}`;

      const { data: versionData, error: versionError } = await supabase
        .from('project_versions')
        .insert({
          project_id: project.id,
          created_by: user.id,
          multiplier: 1,
          status: 'Change Order',
          name: newName,
          payment_1_percentage: 0,
          payment_2_percentage: 0,
          payment_3_percentage: 0,
          payment_4_percentage: 0,
          workspace_id: workspaceId,
        })
        .select()
        .single();

      if (versionError) throw versionError;

      const versionId = versionData.version_id;
      console.log('Created new version:', versionId);

      // Save labor items (only those with valid UUIDs)
      const laborItems = itemsToSave.filter(
        (item) =>
          item.kind === 'labor' &&
          item.id &&
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item.id)
      );
      console.log('Labor items to save:', laborItems);

      if (laborItems.length > 0) {
        const laborInserts = laborItems.map((item) => ({
          version_id: versionId,
          labor_id: item.id,
          quantity: item.qty, // Can be negative for removed items in change orders
          price: item.unitPrice, // Always positive
          item_name: item.name, // Save the displayed name (may be edited)
        }));

        const { error: laborError } = await supabase.from('version_labor').insert(laborInserts);

        if (laborError) {
          console.error('Labor insert error:', laborError);
          throw laborError;
        }
      }

      // Save material items (only those with valid UUIDs)
      const materialItems = itemsToSave.filter(
        (item) =>
          item.kind === 'material' &&
          item.id &&
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item.id)
      );
      console.log('Material items to save:', materialItems);

      if (materialItems.length > 0) {
        const materialInserts = materialItems.map((item) => ({
          version_id: versionId,
          material_id: item.id,
          quantity: item.qty, // Can be negative for removed items in change orders
          price: item.unitPrice, // Always positive
          waste_pct: item.wastePct || 0,
          item_name: item.name, // Save the displayed name (may be edited)
        }));

        const { error: materialError } = await supabase.from('version_materials').insert(materialInserts);

        if (materialError) {
          console.error('Material insert error:', materialError);
          throw materialError;
        }
      }

      const totalSaved = laborItems.length + materialItems.length;
      const totalItems = items.length;

      if (totalSaved === 0) {
        toast.error('No valid database items to save. Please add items from the catalog.');
        return false;
      }

      // CRITICAL: Change orders NEVER update active_version in the projects table.
      // active_version is only for drafts. Change orders use is_active field on project_versions instead.
      // This ensures change orders can only affect other change orders, never the active/sold draft.

      if (totalSaved < totalItems) {
        toast.success(
          `Change order saved as new! (${totalSaved}/${totalItems} items saved - only catalog items can be saved)`
        );
      } else {
        toast.success('Change order saved as new successfully!');
      }

      // Clear editing state after saving as new (this also clears cached items)
      onClearEditing();
      return true;
    } catch (error) {
      console.error('Error saving as new:', error);
      toast.error('Failed to save as new: ' + (error as any)?.message || 'Unknown error');
      return false;
    }
  };

  return { loadChangeOrder, saveChangeOrder, saveAsNew };
}
