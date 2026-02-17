import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LineItem, Project } from '@/types';
import { usePrice } from '@/contexts/PriceContext';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { PlusCircle, RotateCcw, GitCompare, Menu } from 'lucide-react';
import { ProjectDocumentsSection } from './ProjectDocumentsSection';
import { usePermissions } from '@/hooks/usePermissions';
import { supabase } from '@/integrations/supabase/client';
import { useClientData } from '@/hooks/quoteBuilder/useClientData';
import { useChangeOrderOptions } from '@/hooks/changeOrderBuilder/useChangeOrderOptions';
import { useChangeOrderCalculations } from '@/hooks/changeOrderBuilder/useChangeOrderCalculations';
import { useChangeOrderState } from '@/hooks/changeOrderBuilder/useChangeOrderState';
import { useChangeOrderOperations } from '@/hooks/changeOrderBuilder/useChangeOrderOperations';
import { useChangeOrderDrafts } from '@/hooks/changeOrderBuilder/useChangeOrderDrafts';
import { useResetToActiveDraft } from '@/hooks/changeOrderBuilder/useResetToActiveDraft';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChangeOrderOptionsCards } from './changeOrderBuilder/ChangeOrderOptionsCards';
import { CurrentChangeOrderCards } from './changeOrderBuilder/CurrentChangeOrderCards';
import { ChangeOrderSummary } from './changeOrderBuilder/ChangeOrderSummary';
import { ChangeOrderSaveButton } from './changeOrderBuilder/ChangeOrderSaveButton';
import { DraftSelector } from './changeOrderBuilder/DraftSelector';

export function ChangeOrderBuilder({
  items,
  setItems,
  project,
  selectedDraft = null,
  onDraftSelect = () => {},
  isSoldProject = false,
  soldProjectMultiplier = 1,
  baselineItems = [],
  editingVersionId = null,
  onClearEditing = () => {},
  onClearEditingVersionIdOnly = () => {},
  saveRef = null,
  readOnly = false,
  onBaselineItemsChange = () => {},
}: {
  items: LineItem[];
  setItems: (u: (p: LineItem[]) => LineItem[]) => void;
  project: Project;
  selectedDraft?: any;
  onDraftSelect?: (draft: any) => void;
  isSoldProject?: boolean;
  soldProjectMultiplier?: number;
  baselineItems?: LineItem[];
  editingVersionId?: string | null;
  onClearEditing?: () => void;
  onClearEditingVersionIdOnly?: () => void;
  saveRef?: React.MutableRefObject<(() => void) | null> | null;
  readOnly?: boolean;
  onBaselineItemsChange?: (items: LineItem[]) => void;
}) {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const workspaceId = currentWorkspace?.id;
  const { hidden } = usePrice();
  const { can } = usePermissions();
  const isMobile = useIsMobile();

  // Permission checks for change order components
  const canViewQuote = can('component.changeorders_quote.view');
  const canEditQuote = can('component.changeorders_quote.edit');
  const canViewClientDocuments = can('component.changeorders_projectdocuments.view');
  const canEditClientDocuments = can('component.changeorders_projectdocuments.edit');
  const canViewPrices = can('component.changeorders_viewprices.view');

  // Determine if change order should be read-only based on permissions
  // Component-level edit permission overrides tab-level readOnly
  const changeOrderReadOnly = !canEditQuote;

  // Determine if prices should be shown (both global hidden state and permission)
  const showPrices = !hidden && canViewPrices;

  // Custom hooks
  const { clientData } = useClientData(project.clientId, workspaceId);

  const {
    availableLaborOptions,
    availableMaterialOptions,
    filterLabor,
    setFilterLabor,
    filterMat,
    setFilterMat,
  } = useChangeOrderOptions(workspaceId, items);

  const { multiplier, setMultiplier, draftName, setDraftName, loadedChangeOrderName, setLoadedChangeOrderName } =
    useChangeOrderState({
      projectId: project.id,
      workspaceId,
      editingVersionId,
    });

  const { rows, laborSub, matSub, tax, grand } = useChangeOrderCalculations({
    items,
    baselineItems,
    multiplier,
    editingVersionId,
  });

  const { drafts, selectedDraftId, setSelectedDraftId, isDropdownOpen, setIsDropdownOpen } = useChangeOrderDrafts({
    projectId: project.id,
    workspaceId,
    isSoldProject,
  });

  const { loadChangeOrder, saveChangeOrder } = useChangeOrderOperations();

  const { resetToActiveDraft } = useResetToActiveDraft();

  // State for showing only changes (deltas)
  const [showChangesOnly, setShowChangesOnly] = useState(false);

  // Load existing version when editingVersionId is provided
  useEffect(() => {
    const loadEditingVersion = async () => {
      if (editingVersionId && workspaceId) {
        try {
          // Fetch the version details
          const { data: versionData, error: versionError } = await (supabase as any)
            .from('project_versions')
            .select('*')
            .eq('version_id', editingVersionId)
            .eq('workspace_id', workspaceId)
            .single();

          if (versionError) throw versionError;

          if (versionData) {
            await loadChangeOrder({
              draft: versionData,
              setItems,
              setMultiplier,
              setDraftName,
              setLoadedChangeOrderName,
              onDraftSelect,
            });
            // Clear loaded name when not editing
            if (!editingVersionId) {
              setLoadedChangeOrderName(null);
            }
          }
        } catch (error) {
          console.error('Error loading version for editing, starting new CO instead:', error);
          // Fall back to creating a new change order
          onClearEditingVersionIdOnly();
          setDraftName('');
          setLoadedChangeOrderName(null);
        }
      } else {
        // Clear loaded name when not editing
        setLoadedChangeOrderName(null);
      }
    };
    loadEditingVersion();
  }, [editingVersionId, workspaceId]);

  const handleDraftSelection = (draftId: string) => {
    const selectedDraft = drafts.find((d) => d.version_id === draftId);
    if (selectedDraft) {
      loadChangeOrder({
        draft: selectedDraft,
        setItems,
        setMultiplier,
        setDraftName,
        setLoadedChangeOrderName,
        onDraftSelect,
      });
      setSelectedDraftId(draftId);
    }
  };

  const addItem = (it: LineItem) => {
    if (changeOrderReadOnly) return; // Prevent adding items when read-only
    // Keep the original database ID for labor/material options, generate new ID for local items
    const newItem = {
      ...it,
      id: it.id && it.id.length === 36 && it.id.includes('-') ? it.id : Math.random().toString(36).slice(2),
    };
    setItems((prev) => [...prev, newItem]);
  };

  const removeItem = (id: string) => {
    if (changeOrderReadOnly) return; // Prevent removing items when read-only
    
    // Check if item is in baseline (was part of original contract)
    const baselineItemIds = new Set(baselineItems.map((item) => item.id));
    const isInBaseline = baselineItemIds.has(id);
    
    if (isInBaseline) {
      // Item is in baseline - mark as deleted to show red outline and strike-through
      // This keeps it visible to show it was removed from the original contract
      setItems((prev) => prev.map((x) => (x.id === id ? { ...x, isDeleted: true } : x)));
    } else {
      // Item is newly added (not in baseline) - just remove it completely
      // No need to track deletion since it was never part of the original contract
      setItems((prev) => prev.filter((x) => x.id !== id));
    }
  };

  const restoreItem = (id: string) => {
    if (changeOrderReadOnly) return; // Prevent restoring items when read-only
    setItems((prev) => prev.map((x) => (x.id === id ? { ...x, isDeleted: false } : x)));
  };

  const updateItemName = (id: string, name: string) => {
    // Only allow name editing for items NOT in baseline (new items)
    const baselineItemIds = new Set(baselineItems.map((item) => item.id));
    if (baselineItemIds.has(id)) {
      // Item is in baseline - cannot edit name
      return;
    }
    // Item is new - allow name editing
    setItems((prev) => prev.map((x) => (x.id === id ? { ...x, name } : x)));
  };

  const updateItemQty = (id: string, qty: number) => {
    setItems((prev) => prev.map((x) => (x.id === id ? { ...x, qty } : x)));
  };

  const updateItemPrice = (id: string, unitPrice: number) => {
    setItems((prev) => prev.map((x) => (x.id === id ? { ...x, unitPrice } : x)));
  };

  const startNewDraft = () => {
    // Clear editing context (editing version ID, etc.) but keep all items intact
    // This allows creating a new change order based on current items without losing them
    // Use onClearEditingVersionIdOnly to clear editing state without clearing cached items
    onClearEditingVersionIdOnly(); // Clears editingVersionId only, preserves items cache
    setSelectedDraftId('');
    setDraftName('');
    setLoadedChangeOrderName(null);
    setIsDropdownOpen(false);
    // Note: Items in "In Quote" sections are NOT cleared - they remain as-is
  };

  const handleResetToActiveDraft = async () => {
    await resetToActiveDraft({
      projectId: project.id,
      workspaceId,
      setItems,
      setMultiplier,
      setDraftName,
      setLoadedChangeOrderName,
      setSelectedDraftId,
      onClearEditing,
      onBaselineItemsChange,
      preserveEditingState: !!editingVersionId, // Preserve editing state if editing a change order
    });
  };

  const handleSaveChangeOrder = async () => {
    await saveChangeOrder({
      user,
      workspaceId,
      draftName,
      items,
      project,
      baselineItems,
      onClearEditing,
      editingVersionId,
      onBaselineItemsChange,
    });
    setLoadedChangeOrderName(null);
  };

  // Expose saveDraft function to parent via ref
  useEffect(() => {
    if (saveRef) {
      saveRef.current = handleSaveChangeOrder;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saveRef]);

  return (
    <>
      <Card className="rounded-2xl border bg-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CardTitle className="text-base">Change Order Builder</CardTitle>
              {loadedChangeOrderName ? (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-md">
                  Loaded: {loadedChangeOrderName}
                </span>
              ) : editingVersionId ? (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-md">
                  Editing Change Order → Will create new change order on save
                </span>
              ) : (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-md">
                  Creating New Change Order
                </span>
              )}
            </div>
            {/* Mobile: Dropdown menu, Desktop: Individual buttons */}
            {isMobile ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Menu className="h-4 w-4" />
                    Actions
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {!changeOrderReadOnly && (
                    <>
                      <DropdownMenuItem onClick={startNewDraft} className="gap-2">
                        <PlusCircle className="h-4 w-4" />
                        New Change Order
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleResetToActiveDraft} className="gap-2">
                        <RotateCcw className="h-4 w-4" />
                        Reset Items
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuItem
                    onClick={() => setShowChangesOnly(!showChangesOnly)}
                    className="gap-2"
                  >
                    <GitCompare className="h-4 w-4" />
                    {showChangesOnly ? 'Hide Changes' : 'Show Changes'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex gap-2">
                {!changeOrderReadOnly && (
                  <>
                    <Button variant="outline" size="sm" onClick={startNewDraft} className="gap-2">
                      <PlusCircle className="h-4 w-4" />
                      <span className="flex flex-col leading-tight">
                        <span>New</span>
                        <span>Change Order</span>
                      </span>
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleResetToActiveDraft} className="gap-2">
                      <RotateCcw className="h-4 w-4" />
                      Reset Items
                    </Button>
                  </>
                )}
                <Button
                  variant={showChangesOnly ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowChangesOnly(!showChangesOnly)}
                  className="gap-2"
                >
                  <GitCompare className="h-4 w-4" />
                  Show Changes
                </Button>
              </div>
            )}
          </div>
          <div className="mt-4 space-y-4">
            {changeOrderReadOnly && (
              <div className="bg-muted/50 border border-muted rounded-lg p-4">
                <p className="text-sm text-muted-foreground">
                  📋 <strong>View Only Mode:</strong> You have read-only access. You can view the change order and
                  generate documents, but cannot make edits.
                </p>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isSoldProject && (
            <DraftSelector
              drafts={drafts}
              selectedDraftId={selectedDraftId}
              isDropdownOpen={isDropdownOpen}
              setIsDropdownOpen={setIsDropdownOpen}
              onDraftSelect={handleDraftSelection}
            />
          )}

          {(selectedDraftId || isSoldProject) && (
            <div className="space-y-4">
              {/* Top: Options side by side - Show when canViewQuote is true, but hide Add button when read-only */}
              {canViewQuote && (
                <ChangeOrderOptionsCards
                  availableLaborOptions={availableLaborOptions}
                  availableMaterialOptions={availableMaterialOptions}
                  filterLabor={filterLabor}
                  setFilterLabor={setFilterLabor}
                  filterMat={filterMat}
                  setFilterMat={setFilterMat}
                  onAddItem={addItem}
                  showPrices={showPrices}
                  showAddButton={!changeOrderReadOnly}
                />
              )}

              {/* Bottom: Current Change Order side by side */}
              {canViewQuote && (
                <CurrentChangeOrderCards
                  rows={rows}
                  baselineItems={baselineItems}
                  onUpdateName={updateItemName}
                  onUpdateQty={updateItemQty}
                  onUpdatePrice={updateItemPrice}
                  onRemoveItem={removeItem}
                  onRestoreItem={restoreItem}
                  readOnly={changeOrderReadOnly}
                  showPrices={showPrices}
                  showChangesOnly={showChangesOnly}
                />
              )}
            </div>
          )}

          {(selectedDraftId || isSoldProject) && (
            <>
              {/* Totals - Change orders don't have payment splitter */}
              {canViewQuote && (
                <div className="grid grid-cols-1 gap-4">
                  {/* Price Summary - only shown when showPrices is true */}
                  {showPrices && <ChangeOrderSummary laborSub={laborSub} matSub={matSub} tax={tax} multiplier={multiplier} grand={grand} />}
                </div>
              )}
            </>
          )}

          {!selectedDraftId && !isSoldProject && (
            <div className="text-center py-8 text-muted-foreground">
              Please select a draft above to begin creating a change order.
            </div>
          )}

          {/* Project Documents Section */}
          {(selectedDraftId || isSoldProject) && canViewClientDocuments && (
            <div className="mt-6">
              <ProjectDocumentsSection
                projectId={project.id}
                project={project}
                clientData={clientData}
                activeDraftItems={items}
                activeDraftMultiplier={multiplier}
                tabIdentifier="change_order"
                title="Project Documents"
                readOnly={!canEditClientDocuments}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save Button - Fixed at bottom */}
      <ChangeOrderSaveButton
        draftName={draftName}
        onDraftNameChange={setDraftName}
        onSave={handleSaveChangeOrder}
        readOnly={readOnly}
        isEditing={!!editingVersionId}
      />
    </>
  );
}
