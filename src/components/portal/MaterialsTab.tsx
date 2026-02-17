import React, { useEffect, useMemo, useState, useRef } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { toast } from 'sonner';
import { useMaterialRevisions } from '@/hooks/useMaterialRevisions';
import { useClientData } from '@/hooks/materials/useClientData';
import { useChangeOrdersData } from '@/hooks/materials/useChangeOrdersData';
import { useMaterialsLocalState } from '@/hooks/materials/useMaterialsLocalState';
import { ChangeOrderSection } from './ChangeOrderSection';
import { usePrice } from '@/contexts/PriceContext';
import { ProjectDocumentsSection } from './ProjectDocumentsSection';
import { Project } from '@/types';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { Item } from '@/types/materials';
import { total, uid, money, ensureNumber } from '@/utils/materialsUtils';
import { MaterialsSummaryCards } from './materials/MaterialsSummaryCards';
import { ContractMaterialsCard } from './materials/ContractMaterialsCard';
import { RevisedMaterialsCard } from './materials/RevisedMaterialsCard';
import { MaterialsSaveButton } from './materials/MaterialsSaveButton';
import { Can } from '@/components/Can';
import { LinkDialog } from './materials/LinkDialog';
import { UnsavedChangesDialog } from '@/components/shared/UnsavedChangesDialog';
import { useLocalStorageCache, useCacheKey, useClearProjectCache } from '@/hooks/useLocalStorageCache';

interface MaterialsTabProps {
  activeDraftMaterials?: Item[];
  versionId: string | null;
  activeChangeOrders?: any[];
  project: Project;
  multiplier?: number;
  readOnly?: boolean;
  userRole?: string;
  onDraftChanged?: (newVersionId: string, newDraftName: string) => void;
  saveRef?: React.MutableRefObject<(() => void) | null> | null;
  isSoldProject?: boolean;
  activeDraftName?: string | null;
}

export function MaterialsTab({
  activeDraftMaterials = [],
  versionId,
  activeChangeOrders = [],
  project,
  multiplier = 1,
  readOnly = false,
  onDraftChanged,
  saveRef = null,
  isSoldProject = false,
  activeDraftName = null,
}: MaterialsTabProps) {
  // Cache all MaterialsTab state to localStorage (with user/workspace scoping)
  const cacheKey = useCacheKey();
  const clearProjectCache = useClearProjectCache();
  const projectId = project.id;
  const cachePrefix = `materialstab.${projectId}`;
  
  const [contractItems, setContractItems, clearContractItemsCache] = useLocalStorageCache<Item[]>(
    cacheKey(cachePrefix, projectId, versionId ?? 'no-version', 'contractItems'),
    activeDraftMaterials
  );
  const [hoveredLink, setHoveredLink] = useLocalStorageCache<string | null>(
    cacheKey(cachePrefix, projectId, undefined, 'hoveredLink'),
    null
  );
  const [draftName, setDraftName, clearDraftNameCache] = useLocalStorageCache<string>(
    cacheKey(cachePrefix, projectId, undefined, 'draftName'),
    ''
  );
  const [linkDialogOpen, setLinkDialogOpen] = useLocalStorageCache<boolean>(
    cacheKey(cachePrefix, projectId, undefined, 'linkDialogOpen'),
    false
  );
  const [linkDialogItemId, setLinkDialogItemId] = useLocalStorageCache<string | null>(
    cacheKey(cachePrefix, projectId, undefined, 'linkDialogItemId'),
    null
  );
  const [linkDialogUrl, setLinkDialogUrl] = useLocalStorageCache<string>(
    cacheKey(cachePrefix, projectId, undefined, 'linkDialogUrl'),
    ''
  );
  const [hasUnsavedChanges, setHasUnsavedChanges] = useLocalStorageCache<boolean>(
    cacheKey(cachePrefix, projectId, undefined, 'hasUnsavedChanges'),
    false
  );
  const [showUnsavedDialog, setShowUnsavedDialog] = useLocalStorageCache<boolean>(
    cacheKey(cachePrefix, projectId, undefined, 'showUnsavedDialog'),
    false
  );
  const [pendingNavigation, setPendingNavigation] = useLocalStorageCache<(() => void) | null>(
    cacheKey(cachePrefix, projectId, undefined, 'pendingNavigation'),
    null,
    {
      // Don't try to serialize/deserialize functions - just clear on restore
      serialize: () => '',
      deserialize: () => null,
      saveOnChange: false, // Functions can't be serialized
    }
  );
  
  // Clear all cached state (useful after save)
  const clearAllMaterialsCache = () => {
    clearContractItemsCache();
    clearDraftNameCache();
    clearActualItemsCache();
    clearProjectCache(projectId);
  };

  // Clear cache but keep Revised section populated (avoids emptying UI after save)
  const clearMaterialsCacheExceptRevised = () => {
    clearContractItemsCache();
    clearDraftNameCache();
    clearProjectCache(projectId);
  };

  const changeOrderSaveFunctions = useRef<Map<string, () => Promise<void>>>(new Map());
  const dropSectionLocalValuesGetter = useRef<(() => Record<string, Partial<Item>>) | null>(null);
  const [quoteLocalOverrides, setQuoteLocalOverrides] = useState<Record<string, Partial<Item>>>({});

  const { saveRevisions, saveRevisionsAsNewDraft } = useMaterialRevisions(versionId);
  const { clientData } = useClientData(project.clientId);
  const changeOrdersOptions = useMemo(
    () => ({
      soldContractMaterials: activeDraftMaterials,
      soldContractKey: `${versionId ?? ''}-${activeDraftMaterials.length}`,
    }),
    [versionId, activeDraftMaterials.length, activeDraftMaterials]
  );
  const { changeOrders } = useChangeOrdersData(activeChangeOrders, changeOrdersOptions);
  const { actualItems, setActualItems, clearActualItemsCache } = useMaterialsLocalState({ 
    versionId, 
    contractItems,
    cacheKey: cacheKey(cachePrefix, projectId, versionId ?? 'no-version', 'actualItems')
  });

  const { hidden } = usePrice();
  const { can } = usePermissions();
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const workspaceId = currentWorkspace?.id;

  // Permission checks
  const canViewPriceTotals = can('component.materials_pricetotals.view');
  const canViewClientDocuments = can('component.materials_projectdocuments.view');
  const canEditClientDocuments = can('component.materials_projectdocuments.edit');
  const canViewDraftMaterials = can('component.materials_draftmaterials.view');
  const canEditDraftMaterials = can('component.materials_draftmaterials.edit');
  const canViewDraftMaterialsPrices = can('component.materials_draftmaterialsprices.view');
  const canViewDraftRevisedPrices = can('component.materials_draftrevisedprices.view');
  const canViewChangeOrderMaterials = can('component.materials_changeordermaterials.view');
  const canEditChangeOrderMaterials = can('component.materials_changeordermaterials.edit');
  const canViewChangeOrderMaterialsPrices = can('component.materials_changeordermaterialsprices.view');
  const canViewChangeOrderRevisedPrices = can('component.materials_changeorderrevisedprices.view');
  const canEditSaveDraft = can('component.materials_savedraft.edit');
  const canViewSaveChangeOrder = can('component.materials_savechangeorder.view');
  const canEditSaveChangeOrder = can('component.materials_savechangeorder.edit');

  // Update contract items when activeDraftMaterials changes (but respect cached state if it exists)
  useEffect(() => {
    // Only update if we don't have cached items already
    // This prevents overwriting cached edits when data refetches
    if (activeDraftMaterials.length > 0 && contractItems.length === 0) {
      setContractItems(activeDraftMaterials);
    }
  }, [activeDraftMaterials.length]); // Only check length to avoid overwriting cached edits

  // Reset quote local overrides when version or contract list changes so difference uses fresh data
  useEffect(() => {
    setQuoteLocalOverrides({});
  }, [versionId, contractItems.length]);

  // Track unsaved changes
  useEffect(() => {
    const checkUnsavedChanges = () => {
      if (dropSectionLocalValuesGetter.current) {
        try {
          const localValues = dropSectionLocalValuesGetter.current();
          const hasChanges =
            Object.keys(localValues).length > 0 &&
            Object.values(localValues).some((local) => {
              const item = actualItems.find((i) => local.id === i.id || Object.keys(localValues).includes(i.id));
              if (!item) return false;
              return (
                (local.name !== undefined && local.name !== item.name) ||
                (local.notes !== undefined && local.notes !== (item.notes || '')) ||
                (local.qty !== undefined && local.qty !== item.qty) ||
                (local.price !== undefined && local.price !== item.price)
              );
            });
          setHasUnsavedChanges(hasChanges);
        } catch (e) {
          setHasUnsavedChanges(false);
        }
      } else {
        setHasUnsavedChanges(false);
      }
    };

    checkUnsavedChanges();
    const interval = setInterval(checkUnsavedChanges, 500);
    return () => clearInterval(interval);
  }, [actualItems.length]);

  // Warn before page unload
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const contractTotal = useMemo(() => total(contractItems), [contractItems]);
  const actualTotal = useMemo(
    () =>
      actualItems.reduce((sum, it) => {
        const qty = ensureNumber(quoteLocalOverrides[it.id]?.qty, it.qty);
        const price = ensureNumber(quoteLocalOverrides[it.id]?.price, it.price);
        return sum + qty * price;
      }, 0),
    [actualItems, quoteLocalOverrides]
  );
  const diff = actualTotal - contractTotal;

  const handleDropContract = (item: Item) => {
    const newItem: Item = {
      ...item,
      linkedTo: item.id,
      linkedName: item.name,
      id: uid(),
      unmodified: true,
    };
    setActualItems((prev) => [...prev, newItem]);
  };

  const handleSaveRevised = async () => {
    if (!user || !workspaceId || !versionId) {
      toast.error('Missing required information to save');
      return;
    }

    // For sold projects, draft name is not required (updating in place)
    // For non-sold projects, draft name is required (creating new draft)
    if (!isSoldProject && (!draftName || draftName.trim() === '')) {
      toast.error('Please enter a draft name before saving');
      return;
    }

    let itemsToSave = actualItems;
    if (dropSectionLocalValuesGetter.current) {
      const localValues = dropSectionLocalValuesGetter.current();
      itemsToSave = actualItems.map((it) => {
        const local = localValues[it.id];
        if (local) {
          return {
            ...it,
            ...local,
            qty: ensureNumber(local.qty, it.qty),
            price: ensureNumber(local.price, it.price),
            unmodified: false,
          };
        }
        return it;
      });
    }

    try {
      const savePromises = Array.from(changeOrderSaveFunctions.current.values()).map((saveFn) => saveFn());
      await Promise.all(savePromises);
    } catch (error) {
      console.error('Error saving change orders:', error);
      toast.error('Failed to save some change orders');
      return;
    }

    if (isSoldProject) {
      const success = await saveRevisions(itemsToSave);
      if (success) {
        setActualItems(itemsToSave);
        dropSectionLocalValuesGetter.current = null;
        setHasUnsavedChanges(false);
        clearMaterialsCacheExceptRevised();
        toast.success('Materials updated for sold project!');
      }
    } else {
      const result = await saveRevisionsAsNewDraft({
        items: itemsToSave,
        projectId: project.id,
        workspaceId,
        userId: user.id,
        draftName: draftName.trim(),
      });

      if (result.success && result.newVersionId && result.newDraftName) {
        setActualItems(itemsToSave);
        setDraftName('');
        dropSectionLocalValuesGetter.current = null;
        setHasUnsavedChanges(false);
        clearMaterialsCacheExceptRevised();
        onDraftChanged?.(result.newVersionId, result.newDraftName);
        toast.success('Draft saved');
      }
    }
  };

  const handleSaveQuoteOnly = async () => {
    if (!user || !workspaceId || !versionId) {
      toast.error('Missing required information to save');
      return;
    }

    if (!isSoldProject && (!draftName || draftName.trim() === '')) {
      toast.error('Please enter a draft name before saving');
      return;
    }

    let itemsToSave = actualItems;
    if (dropSectionLocalValuesGetter.current) {
      const localValues = dropSectionLocalValuesGetter.current();
      itemsToSave = actualItems.map((it) => {
        const local = localValues[it.id];
        if (local) {
          return {
            ...it,
            ...local,
            qty: ensureNumber(local.qty, it.qty),
            price: ensureNumber(local.price, it.price),
            unmodified: false,
          };
        }
        return it;
      });
    }

    if (isSoldProject) {
      const success = await saveRevisions(itemsToSave);
      if (success) {
        setActualItems(itemsToSave);
        dropSectionLocalValuesGetter.current = null;
        setHasUnsavedChanges(false);
        clearMaterialsCacheExceptRevised();
        toast.success('Materials updated for sold project!');
      }
    } else {
      const result = await saveRevisionsAsNewDraft({
        items: itemsToSave,
        projectId: project.id,
        workspaceId,
        userId: user.id,
        draftName: draftName.trim(),
      });

      if (result.success && result.newVersionId && result.newDraftName) {
        setActualItems(itemsToSave);
        setDraftName('');
        dropSectionLocalValuesGetter.current = null;
        setHasUnsavedChanges(false);
        clearMaterialsCacheExceptRevised();
        onDraftChanged?.(result.newVersionId, result.newDraftName);
        toast.success('Draft saved');
      }
    }
  };

  // Expose handleSaveRevised function to parent via ref
  useEffect(() => {
    if (saveRef) {
      saveRef.current = handleSaveRevised;
    }
  }, [handleSaveRevised, saveRef]);

  const handleLinkSave = () => {
    if (linkDialogItemId && linkDialogUrl.trim()) {
      setActualItems((prev) =>
        prev.map((it) => (it.id === linkDialogItemId ? { ...it, link: linkDialogUrl.trim(), unmodified: false } : it))
      );
      setLinkDialogOpen(false);
      setLinkDialogUrl('');
      setLinkDialogItemId(null);
    }
  };

  return (
    <>
      <DndProvider backend={HTML5Backend}>
        <div className="mx-auto max-w-4xl space-y-5 text-sm">
          {/* Materials header with draft label */}
          <div className="flex items-center gap-3">
            <h2 className="text-base font-semibold">Materials</h2>
            {activeDraftName ? (
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-md">
                Draft: {activeDraftName}
              </span>
            ) : (
              <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-md">
                No draft selected
              </span>
            )}
          </div>

          {/* Summary Cards */}
          {!hidden && canViewPriceTotals && <MaterialsSummaryCards contractTotal={contractTotal} actualTotal={actualTotal} />}

          {/* Quote section */}
          {canViewDraftMaterials && (
            <>
              <p className="text-xs font-medium text-muted-foreground text-left mb-1">Quote's</p>
              <ContractMaterialsCard
                items={contractItems}
                actualItems={actualItems}
                hoveredLink={hoveredLink}
                setHoveredLink={setHoveredLink}
                readOnly={!canEditDraftMaterials}
                showPrice={!hidden && canViewDraftMaterialsPrices}
              />

              <RevisedMaterialsCard
                items={actualItems}
                setItems={setActualItems}
                hoveredLink={hoveredLink}
                setHoveredLink={setHoveredLink}
                onDrop={handleDropContract}
                readOnly={!canEditDraftMaterials}
                showPrice={!hidden && canViewDraftRevisedPrices}
                onOpenLinkDialog={(itemId, currentLink) => {
                  setLinkDialogItemId(itemId);
                  setLinkDialogUrl(currentLink || '');
                  setLinkDialogOpen(true);
                }}
                onGetLocalValues={(getter) => {
                  dropSectionLocalValuesGetter.current = getter;
                }}
                onLocalValuesChange={setQuoteLocalOverrides}
              />

              {canViewDraftRevisedPrices && !hidden && (
                <div className="flex justify-between border-t pt-2 text-xs items-center">
                  <span className="text-muted-foreground">Difference</span>
                  <span className={`font-medium ${diff < 0 ? 'text-green-600' : 'text-red-600'}`}>{money(diff)}</span>
                </div>
              )}

              {!readOnly && (
                <Can permission="component.materials_savedraft.view" fallback={null}>
                  <MaterialsSaveButton
                    inline
                    draftName={draftName}
                    onDraftNameChange={setDraftName}
                    onSave={handleSaveQuoteOnly}
                    isSoldProject={isSoldProject}
                    currentDraftName={activeDraftName}
                    disabled={!canEditSaveDraft}
                  />
                </Can>
              )}
            </>
          )}

          {/* Change Order section */}
          {canViewChangeOrderMaterials && (
            <div className="space-y-5">
              <p className="text-xs font-medium text-muted-foreground text-left mb-1">Change order's</p>
              {changeOrders.map((co) => (
                <ChangeOrderSection
                  key={co.id}
                  changeOrder={co}
                  hoveredLink={hoveredLink}
                  setHoveredLink={setHoveredLink}
                  showPaymentSplitter={false}
                  readOnly={!canEditChangeOrderMaterials}
                  showInContractPrices={!hidden && canViewChangeOrderMaterialsPrices}
                  showRevisedPrices={!hidden && canViewChangeOrderRevisedPrices}
                  canViewSaveButton={canViewSaveChangeOrder}
                  canEditSaveButton={canEditSaveChangeOrder}
                  onSaveRef={(saveFn) => {
                    if (saveFn) {
                      changeOrderSaveFunctions.current.set(co.id, saveFn);
                    } else {
                      changeOrderSaveFunctions.current.delete(co.id);
                    }
                  }}
                />
              ))}
            </div>
          )}

          {/* Project Documents Section */}
          {canViewClientDocuments && (
            <div className="mt-6">
              <ProjectDocumentsSection
                projectId={project.id}
                project={project}
                clientData={clientData}
                activeDraftItems={contractItems.map((item) => ({
                  id: item.id,
                  name: item.name,
                  qty: item.qty,
                  unitPrice: item.price,
                  kind: 'material' as const,
                  wastePct: 0,
                }))}
                activeDraftMultiplier={multiplier}
                tabIdentifier="materials"
                title="Project Documents"
                readOnly={!canEditClientDocuments}
              />
            </div>
          )}
        </div>
      </DndProvider>

      {/* Link Dialog */}
      <LinkDialog
        open={linkDialogOpen}
        onOpenChange={setLinkDialogOpen}
        url={linkDialogUrl}
        onUrlChange={setLinkDialogUrl}
        onSave={handleLinkSave}
      />

      {/* Unsaved Changes Dialog */}
      <UnsavedChangesDialog
        open={showUnsavedDialog}
        onOpenChange={setShowUnsavedDialog}
        onDiscard={() => {
          setShowUnsavedDialog(false);
          setHasUnsavedChanges(false);
          if (pendingNavigation) {
            pendingNavigation();
            setPendingNavigation(null);
          }
        }}
        description="You have unsaved changes to your materials. Are you sure you want to leave? All unsaved changes will be lost."
      />
    </>
  );
}
