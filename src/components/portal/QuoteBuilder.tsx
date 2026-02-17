import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LineItem, Project } from '@/types';
import { usePrice } from '@/contexts/PriceContext';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { PaymentSplitter } from './PaymentSplitter';
import { ProjectDocumentsSection } from './ProjectDocumentsSection';
import { usePermissions } from '@/hooks/usePermissions';
import { Can } from '@/components/Can';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ensureItemId } from '@/utils/quoteBuilderUtils';
import { useClientData } from '@/hooks/quoteBuilder/useClientData';
import { useQuoteBuilderOptions } from '@/hooks/quoteBuilder/useQuoteBuilderOptions';
import { usePackages } from '@/hooks/quoteBuilder/usePackages';
import { useQuoteBuilderState } from '@/hooks/quoteBuilder/useQuoteBuilderState';
import { useQuoteCalculations } from '@/hooks/quoteBuilder/useQuoteCalculations';
import { useDraftOperations } from '@/hooks/quoteBuilder/useDraftOperations';
import { PresetSelector } from './quoteBuilder/PresetSelector';
import { QuoteOptionsCards } from './quoteBuilder/QuoteOptionsCards';
import { CurrentQuoteCards } from './quoteBuilder/CurrentQuoteCards';
import { QuoteSummary } from './quoteBuilder/QuoteSummary';
import { QuoteSaveButton } from './quoteBuilder/QuoteSaveButton';
import { PlusCircle, RotateCcw, Menu } from 'lucide-react';

export function QuoteBuilder({
  items,
  setItems,
  project,
  isSoldProject = false,
  soldProjectMultiplier = 1,
  editingVersionId = null,
  onClearEditing = () => {},
  saveRef = null,
  readOnly = false,
  onDraftChanged = () => {},
}: {
  items: LineItem[];
  setItems: (u: (p: LineItem[]) => LineItem[]) => void;
  project: Project;
  isSoldProject?: boolean;
  soldProjectMultiplier?: number;
  editingVersionId?: string | null;
  onClearEditing?: () => void;
  saveRef?: React.MutableRefObject<(() => void) | null> | null;
  readOnly?: boolean;
  onDraftChanged?: (newVersionId: string, newDraftName: string) => void;
}) {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const workspaceId = currentWorkspace?.id;
  const { hidden } = usePrice();
  const { can } = usePermissions();
  const isMobile = useIsMobile();

  // Permission checks
  const canViewQuote = can('component.contractbuilder_quote.view');
  const canEditQuote = can('component.contractbuilder_quote.edit');
  const canViewPaymentSplit = can('component.contractbuilder_paymentsplit.view');
  const canEditPaymentSplit = can('component.contractbuilder_paymentsplit.edit');
  const canViewTimeframe = can('component.contractbuilder_timeframe.view');
  const canEditTimeframe = can('component.contractbuilder_timeframe.edit');
  const canViewClientDocuments = can('component.contractbuilder_projectdocuments.view');
  const canEditClientDocuments = can('component.contractbuilder_projectdocuments.edit');
  const canViewPrices = can('component.contractbuilder_viewprices.view');

  const quoteReadOnly = isSoldProject || !canEditQuote;
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
  } = useQuoteBuilderOptions(workspaceId, items);

  const { packages, loadPackageItems } = usePackages(workspaceId);

  const {
    multiplier,
    setMultiplier,
    draftName,
    setDraftName,
    isPaymentValid,
    setIsPaymentValid,
    paymentSplits,
    setPaymentSplits,
    estimatedStartDate,
    setEstimatedStartDate,
    estimatedConstructionTime,
    setEstimatedConstructionTime,
    clearAllCache: clearQuoteBuilderCache,
  } = useQuoteBuilderState(isSoldProject, soldProjectMultiplier, project.id);

  const { rows, laborSub, matSub, tax, grand } = useQuoteCalculations(items, multiplier);

  const { loadDraft, saveDraft } = useDraftOperations();

  // Track the name of the draft being edited
  const [editingDraftName, setEditingDraftName] = useState<string | null>(null);
  
  // Track the latest draft name from onDraftChanged callback for immediate display
  const [latestDraftName, setLatestDraftName] = useState<string | null>(null);

  // Update editing draft name when editingVersionId changes
  useEffect(() => {
    if (editingVersionId && latestDraftName) {
      // Use the latest draft name from onDraftChanged callback if available
      setEditingDraftName(latestDraftName);
    }
  }, [editingVersionId, latestDraftName]);

  // Wrapper for onDraftChanged to capture the draft name
  const handleDraftChanged = (newVersionId: string, newDraftName: string) => {
    setLatestDraftName(newDraftName);
    onDraftChanged(newVersionId, newDraftName);
  };

  // Load existing version when editingVersionId is provided
  // IMPORTANT: When editingVersionId is null (creating new draft), do NOT load from active version
  // Items should only come from cache (handled by useLocalStorageCache) or remain empty
  useEffect(() => {
    const loadEditingVersion = async () => {
      // Only load when explicitly editing a version
      if (editingVersionId && workspaceId) {
        try {
          const { data: versionData, error: versionError } = await (supabase as any)
            .from('project_versions')
            .select('*')
            .eq('version_id', editingVersionId)
            .eq('workspace_id', workspaceId)
            .single();

          if (versionError) throw versionError;

          if (versionData) {
            // Store the draft name for display (use latestDraftName if available, otherwise fetch from DB)
            const draftNameToUse = latestDraftName || versionData.name || versionData.status || 'Draft';
            setEditingDraftName(draftNameToUse);
            
            await loadDraft({
              draft: versionData,
              setItems,
              setMultiplier,
              setDraftName,
              setPaymentSplits,
              setEstimatedStartDate,
              setEstimatedConstructionTime,
            });
          }
        } catch (error) {
          console.error('Error loading version for editing:', error);
          toast.error('Failed to load change order');
        }
      } else {
        // Clear editing draft name when not editing
        setEditingDraftName(null);
        setLatestDraftName(null);
      }
      // When editingVersionId is null (creating new draft), ensure we don't auto-load from active version
      // Items will come from cache if available, or stay empty (handled by useLocalStorageCache)
    };
    loadEditingVersion();
  }, [editingVersionId, workspaceId, latestDraftName]);

  // Handlers
  const handleLoadPackage = async (packageId: string) => {
    if (!workspaceId) return;
    const newItems = await loadPackageItems(packageId, workspaceId);
    if (newItems.length > 0) {
      setItems((prev) => [...prev, ...newItems]);
    }
  };

  const startNewDraft = () => {
    // Clear editing state but keep current items/prices intact
    onClearEditing();
    setEditingDraftName(null);
    setLatestDraftName(null);
    setDraftName("New Draft");
  };

  const resetToDefaults = () => {
    clearQuoteBuilderCache();
    setItems(() => []);
    setMultiplier(isSoldProject ? soldProjectMultiplier : 1.4);
    setPaymentSplits([40, 30, 20, 10]);
    setDraftName("");
    setEstimatedStartDate(undefined);
    setEstimatedConstructionTime(undefined);
    toast.success("Reset items to default values");
  };

  const addItem = (it: LineItem) => {
    const newItem = ensureItemId(it);
    setItems((prev) => [...prev, newItem]);
  };

  const removeItem = (id: string) => setItems((prev) => prev.filter((x) => x.id !== id));

  const updateItemName = (id: string, name: string) => {
    setItems((prev) => prev.map((x) => (x.id === id ? { ...x, name } : x)));
  };

  const updateItemQty = (id: string, qty: number) => {
    setItems((prev) => prev.map((x) => (x.id === id ? { ...x, qty } : x)));
  };

  const updateItemPrice = (id: string, unitPrice: number) => {
    setItems((prev) => prev.map((x) => (x.id === id ? { ...x, unitPrice } : x)));
  };

  const handleSaveDraft = async () => {
    const success = await saveDraft({
      user,
      workspaceId,
      isPaymentValid,
      draftName,
      items,
      project,
      multiplier,
      paymentSplits,
      estimatedStartDate,
      estimatedConstructionTime,
      onDraftChanged: handleDraftChanged,
      onClearEditing,
      editingVersionId, // Pass editingVersionId so we know if we're editing vs creating new
    });
    
    // Clear cache after successful save
    if (success) {
      clearQuoteBuilderCache();
    }
  };

  // Expose saveDraft function to parent via ref
  useEffect(() => {
    if (saveRef) {
      saveRef.current = handleSaveDraft;
    }
  }, [handleSaveDraft, saveRef]);

  return (
    <>
      <Card className="rounded-2xl border bg-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CardTitle className="text-base">Quote Builder</CardTitle>
              {editingVersionId ? (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-md">
                  Editing: {editingDraftName || 'Draft'} → Will create new draft on save
                </span>
              ) : (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-md">
                  Creating New Draft
                </span>
              )}
            </div>
            {!quoteReadOnly && (
              isMobile ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Menu className="h-4 w-4" />
                      Actions
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={startNewDraft} className="gap-2">
                      <PlusCircle className="h-4 w-4" />
                      New Draft
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={resetToDefaults} className="gap-2">
                      <RotateCcw className="h-4 w-4" />
                      Reset Items
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={startNewDraft}
                    className="gap-2"
                  >
                    <PlusCircle className="h-4 w-4" />
                    New Draft
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetToDefaults}
                    className="gap-2"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Reset Items
                  </Button>
                </div>
              )
            )}
          </div>
          <div className="mt-4 space-y-4">
            {!quoteReadOnly && (
              <PresetSelector
                packages={packages}
                onLoadPackage={handleLoadPackage}
              />
            )}
            {quoteReadOnly && (
              <div className="bg-muted/50 border border-muted rounded-lg p-4">
                <p className="text-sm text-muted-foreground">
                  📋 <strong>View Only Mode:</strong>{' '}
                  {isSoldProject
                    ? 'This draft is from a sold project and cannot be edited. You can still generate documents below.'
                    : 'You have read-only access. You can view the quote and generate documents, but cannot make edits.'}
                </p>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            {/* Options - Show when canViewQuote is true, but hide Add button when read-only */}
            {canViewQuote && (
              <QuoteOptionsCards
                availableLaborOptions={availableLaborOptions}
                availableMaterialOptions={availableMaterialOptions}
                filterLabor={filterLabor}
                setFilterLabor={setFilterLabor}
                filterMat={filterMat}
                setFilterMat={setFilterMat}
                onAddItem={addItem}
                showPrices={showPrices}
                showAddButton={!quoteReadOnly}
              />
            )}

            {/* Current Quote */}
            <Can permission="component.contractbuilder_quote.view">
              <CurrentQuoteCards
                rows={rows}
                onUpdateName={updateItemName}
                onUpdateQty={updateItemQty}
                onUpdatePrice={updateItemPrice}
                onRemoveItem={removeItem}
                readOnly={quoteReadOnly}
                showPrices={showPrices}
              />
            </Can>
          </div>

          {/* Totals and Payment Split */}
          <Can permission="component.contractbuilder_quote.view">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {showPrices && (
                <QuoteSummary
                  laborSub={laborSub}
                  matSub={matSub}
                  tax={tax}
                  multiplier={multiplier}
                  onMultiplierChange={setMultiplier}
                  grand={grand}
                  readOnly={quoteReadOnly}
                  estimatedStartDate={estimatedStartDate}
                  onEstimatedStartDateChange={setEstimatedStartDate}
                  estimatedConstructionTime={estimatedConstructionTime}
                  onEstimatedConstructionTimeChange={setEstimatedConstructionTime}
                  canViewTimeframe={canViewTimeframe}
                  canEditTimeframe={canEditTimeframe}
                />
              )}

              <Can permission="component.contractbuilder_paymentsplit.view">
                <PaymentSplitter
                  totalAmount={grand}
                  onValidationChange={setIsPaymentValid}
                  onPaymentsChange={setPaymentSplits}
                  initialPayments={paymentSplits}
                  readOnly={isSoldProject || !canEditPaymentSplit}
                  showPrices={canViewPrices}
                />
              </Can>
            </div>
          </Can>

          {/* Project Documents Section */}
          <Can permission="component.contractbuilder_projectdocuments.view">
            <div className="mt-6">
              <ProjectDocumentsSection
                projectId={project.id}
                project={project}
                clientData={clientData}
                activeDraftItems={items}
                activeDraftMultiplier={multiplier}
                tabIdentifier="contract_builder"
                title="Project Documents"
                readOnly={isSoldProject || !canEditClientDocuments}
              />
            </div>
          </Can>
        </CardContent>
      </Card>
      {/* Save Button */}
      <QuoteSaveButton
        draftName={draftName}
        onDraftNameChange={setDraftName}
        onSave={handleSaveDraft}
        readOnly={readOnly}
        isEditing={!!editingVersionId}
      />
    </>
  );
}


