import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { LineItem } from '@/types';

interface UseResetToActiveDraftParams {
  projectId: string;
  workspaceId: string | undefined;
  setItems: (fn: (prev: LineItem[]) => LineItem[]) => void;
  setMultiplier: (value: number) => void;
  setDraftName: (value: string) => void;
  setLoadedChangeOrderName: (value: string | null) => void;
  setSelectedDraftId: (value: string) => void;
  onClearEditing: () => void;
  onBaselineItemsChange: (items: LineItem[]) => void;
  preserveEditingState?: boolean; // If true, preserve loadedChangeOrderName and don't clear selectedDraftId
}

export function useResetToActiveDraft() {
  const resetToActiveDraft = async ({
    projectId,
    workspaceId,
    setItems,
    setMultiplier,
    setDraftName,
    setLoadedChangeOrderName,
    setSelectedDraftId,
    onClearEditing,
    onBaselineItemsChange,
    preserveEditingState = false,
  }: UseResetToActiveDraftParams) => {
    if (!workspaceId) {
      toast.error('Workspace not available');
      return;
    }

    try {
      // Fetch active version from project
      const { data: projectData, error: projectError } = await (supabase as any)
        .from('projects')
        .select('active_version')
        .eq('project_id', projectId)
        .single();

      if (projectError || !projectData?.active_version) {
        toast.error('No active draft found for this project');
        return;
      }

      const activeVersionId = projectData.active_version;

      // Load labor items from active version
      const { data: laborData, error: laborError } = await supabase
        .from('version_labor')
        .select(
          `
          *,
          labor_options:labor_id (*)
        `
        )
        .eq('version_id', activeVersionId);

      if (laborError) throw laborError;

      // Load material items from active version
      const { data: materialData, error: materialError } = await supabase
        .from('version_materials')
        .select(
          `
          *,
          material_options:material_id (*)
        `
        )
        .eq('version_id', activeVersionId);

      if (materialError) throw materialError;

      // Convert to LineItem format
      const activeItems: LineItem[] = [];

      // Add labor items
      laborData?.forEach((item: any) => {
        if (item.labor_options) {
          activeItems.push({
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
          activeItems.push({
            id: item.material_options.id,
            name: item.item_name || item.material_options.name,
            qty: Number(item.quantity),
            unitPrice: Number(item.price),
            wastePct: Number(item.waste_pct) || 0,
            kind: 'material',
          });
        }
      });

      // Set items to active draft items (use direct assignment to ensure immediate update)
      // Note: We do NOT call onClearEditing() here to preserve the editing version ID state
      setItems(activeItems);
      // Also update baselineItems to active items (for first-degree change orders)
      onBaselineItemsChange(JSON.parse(JSON.stringify(activeItems)));
      setMultiplier(1); // Change orders always use multiplier of 1
      setDraftName('');
      
      // If preserving editing state (editing a change order), keep the loaded name and selected draft ID
      // Otherwise, clear them for a fresh start
      if (!preserveEditingState) {
        setLoadedChangeOrderName(null);
        setSelectedDraftId('');
      }

      toast.success(`Loaded ${activeItems.length} items from active draft`);
    } catch (error) {
      console.error('Error loading active draft:', error);
      toast.error('Failed to load active draft');
    }
  };

  return { resetToActiveDraft };
}
