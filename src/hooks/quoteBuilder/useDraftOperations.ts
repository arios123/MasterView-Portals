import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { LineItem, Project } from '@/types';
import { filterValidItems } from '@/utils/quoteBuilderUtils';
import { syncMaterialRevisions } from './useMaterialRevisionsSync';
import { rollForwardDraft } from '@/utils/draftRollForward';
import { logInsert } from '@/lib/auditLog';

interface SaveDraftParams {
  user: any;
  workspaceId: string | undefined;
  isPaymentValid: boolean;
  draftName: string;
  items: LineItem[];
  project: Project;
  multiplier: number;
  paymentSplits: number[];
  estimatedStartDate?: Date;
  estimatedConstructionTime?: number;
  onDraftChanged: (versionId: string, draftName: string) => void;
  onClearEditing: () => void;
  editingVersionId?: string | null; // If provided, we're editing an existing draft
}

interface LoadDraftParams {
  draft: any;
  setItems: (fn: (prev: LineItem[]) => LineItem[]) => void;
  setMultiplier: (value: number) => void;
  setDraftName: (value: string) => void;
  setPaymentSplits: (splits: number[]) => void;
  setEstimatedStartDate: (date: Date | undefined) => void;
  setEstimatedConstructionTime: (weeks: number | undefined) => void;
}

export function useDraftOperations() {
  const loadDraft = async ({ draft, setItems, setMultiplier, setDraftName, setPaymentSplits, setEstimatedStartDate, setEstimatedConstructionTime }: LoadDraftParams) => {
    try {
      // Load labor items
      const { data: laborData, error: laborError } = await supabase
        .from('version_labor')
        .select('*, labor_options:labor_id (*)')
        .eq('version_id', draft.version_id);

      if (laborError) throw laborError;

      // Load material items
      const { data: materialData, error: materialError } = await supabase
        .from('version_materials')
        .select('*, material_options:material_id (*)')
        .eq('version_id', draft.version_id);

      if (materialError) throw materialError;

      // Convert to LineItem format
      const draftItems: LineItem[] = [];

      // Add labor items
      laborData?.forEach((item: any) => {
        if (item.labor_options) {
          draftItems.push({
            id: item.labor_options.id,
            name: item.item_name || item.labor_options.name,
            qty: Number(item.quantity),
            unitPrice: Number(item.price),
            kind: 'labor',
          });
        }
      });

      // Add material items
      materialData?.forEach((item: any) => {
        if (item.material_options) {
          draftItems.push({
            id: item.material_options.id,
            name: item.item_name || item.material_options.name,
            qty: Number(item.quantity),
            unitPrice: Number(item.price),
            wastePct: Number(item.waste_pct) || 0,
            kind: 'material',
          });
        }
      });

      setItems(() => draftItems);
      setMultiplier(Number(draft.multiplier) || 1.4);
      setDraftName(''); // Keep blank for user to enter fresh

      // Load payment splits
      // Use != null to check for both null and undefined, but allow 0 values
      const splits = [
        draft.payment_1_percentage != null ? Number(draft.payment_1_percentage) : 40,
        draft.payment_2_percentage != null ? Number(draft.payment_2_percentage) : 30,
        draft.payment_3_percentage != null ? Number(draft.payment_3_percentage) : 20,
        draft.payment_4_percentage != null ? Number(draft.payment_4_percentage) : 10,
      ];
      setPaymentSplits(splits);

      // Load estimated start date and construction time
      if (draft.estimated_start_date) {
        // Parse date string in local timezone to avoid timezone conversion issues
        const [year, month, day] = draft.estimated_start_date.split('-').map(Number);
        setEstimatedStartDate(new Date(year, month - 1, day));
      } else {
        setEstimatedStartDate(undefined);
      }
      setEstimatedConstructionTime(draft.estimated_construction_time ?? undefined);

      toast.success(`Loaded ${draft.name || draft.status}`);
    } catch (error) {
      console.error('Error loading draft items:', error);
      toast.error('Failed to load draft items');
    }
  };

  const saveDraft = async (params: SaveDraftParams): Promise<boolean> => {
    const { user, workspaceId, isPaymentValid, draftName, items, project, multiplier, paymentSplits, estimatedStartDate, estimatedConstructionTime, onDraftChanged, onClearEditing, editingVersionId } = params;

    if (!user) {
      toast.error('You must be logged in to save drafts');
      return false;
    }

    if (!workspaceId) {
      toast.error('Workspace not available');
      return false;
    }

    if (!isPaymentValid) {
      toast.error('Payment split must total 100% before saving');
      return false;
    }

    if (!draftName || draftName.trim() === '') {
      toast.error('Please enter a draft name before saving');
      return false;
    }

    try {
      // If editing an existing draft, use roll-forward logic to preserve Materials tab state
      if (editingVersionId) {
        
        // Normalize and validate items before saving
        const normalizedItems = items.map((item) => {
          const normalized: LineItem = {
            ...item,
            qty: item.qty ?? 0,
            unitPrice: item.unitPrice ?? 0,
            name: item.name?.trim() || '',
          };
          return normalized;
        });

        // Validate that all items have required fields
        const invalidItems = normalizedItems.filter((item) => {
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

        const rollForwardResult = await rollForwardDraft({
          sourceVersionId: editingVersionId,
          projectId: project.id,
          workspaceId,
          userId: user.id,
          newDraftName: draftName.trim(),
          quoteItems: normalizedItems,
          multiplier,
          paymentSplits,
          estimatedStartDate,
          estimatedConstructionTime,
          versionType: 'draft',
        });

        if (!rollForwardResult.success || !rollForwardResult.newVersionId) {
          throw new Error(rollForwardResult.error || 'Failed to roll forward draft');
        }

        toast.success(`Saved as ${rollForwardResult.newDraftName}!`);
        // When editing an existing draft (roll-forward), we also want to load the newly created draft
        // Don't call onClearEditing() - we want to keep editing the newly saved draft
        onDraftChanged(rollForwardResult.newVersionId, rollForwardResult.newDraftName || draftName.trim());
        return true;
      }

      // Validate items before saving (check original values, not normalized)
      const invalidItems = items.filter((item) => {
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
      const normalizedItems = items.map((item) => {
        const normalized: LineItem = {
          ...item,
          qty: item.qty ?? 0,
          unitPrice: item.unitPrice ?? 0,
          name: item.name?.trim() || '',
        };
        return normalized;
      });

      // Otherwise, create a brand-new draft (current behavior)
      // Create new version
      const { data: versionData, error: versionError } = await supabase
        .from('project_versions')
        .insert({
          project_id: project.id,
          created_by: user.id,
          multiplier: multiplier,
          status: 'Draft',
          name: draftName.trim(),
          payment_1_percentage: paymentSplits[0],
          payment_2_percentage: paymentSplits[1],
          payment_3_percentage: paymentSplits[2],
          payment_4_percentage: paymentSplits[3],
          estimated_start_date: estimatedStartDate ? estimatedStartDate.toISOString().split('T')[0] : null,
          estimated_construction_time: estimatedConstructionTime ?? null,
          workspace_id: workspaceId,
        })
        .select()
        .single();

      if (versionError) throw versionError;

      const versionId = versionData.version_id;

      // Save labor items (only those with valid UUIDs) - use normalized items
      const laborItems = filterValidItems(normalizedItems, 'labor');

      if (laborItems.length > 0) {
        const laborInserts = laborItems.map((item) => ({
          version_id: versionId,
          labor_id: item.id,
          quantity: item.qty,
          price: item.unitPrice,
          item_name: item.name,
        }));

        const { error: laborError } = await supabase.from('version_labor').insert(laborInserts);

        if (laborError) {
          console.error('Labor insert error:', laborError);
          throw laborError;
        }
      }

      // Save material items (only those with valid UUIDs) - use normalized items
      const materialItems = filterValidItems(normalizedItems, 'material');

      if (materialItems.length > 0) {
        const materialInserts = materialItems.map((item) => ({
          version_id: versionId,
          material_id: item.id,
          quantity: item.qty,
          price: item.unitPrice,
          waste_pct: item.wastePct || 0,
          item_name: item.name,
        }));

        const { error: materialError } = await supabase.from('version_materials').insert(materialInserts);

        if (materialError) {
          console.error('Material insert error:', materialError);
          throw materialError;
        }
      }

      // Create fresh material_revisions for all materials in Quote Builder
      await syncMaterialRevisions(versionId, materialItems);

      const totalSaved = laborItems.length + materialItems.length;
      const totalItems = normalizedItems.length;

      if (totalSaved === 0) {
        toast.error('No valid database items to save. Please add items from the catalog.');
        return false;
      }

      // Update active_version for drafts
      const { error: updateError } = await supabase
        .from('projects')
        .update({ active_version: versionId } as any)
        .eq('project_id', project.id);

      if (updateError) {
        console.error('Error updating active version:', updateError);
      }

      // Log audit event for draft creation
      if (workspaceId && user && versionData) {
        await logInsert(workspaceId, user.id, 'project_versions', versionId, versionData, 'Projects');
      }

        toast.success(`Created new draft: ${draftName.trim()}!`);

      // Notify parent that draft has changed
      // Don't call onClearEditing() - we want to keep editing the newly saved draft
      onDraftChanged(versionId, draftName.trim());
      return true;
    } catch (error) {
      console.error('Error saving draft:', error);
      toast.error('Failed to save draft: ' + (error as any)?.message || 'Unknown error');
      return false;
    }
  };

  return { loadDraft, saveDraft };
}

