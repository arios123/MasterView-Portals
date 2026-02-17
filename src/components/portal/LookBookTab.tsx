import React, { useState, useEffect, useMemo } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useToast } from '@/hooks/use-toast';
import { usePermissions } from '@/hooks/usePermissions';
import { useLookbookItems } from '@/hooks/lookbook/useLookbookItems';
import { useLookbookSelections } from '@/hooks/lookbook/useLookbookSelections';
import { useLookbookFilter } from '@/hooks/lookbook/useLookbookFilter';
import { useLookbookQuestionsManagement } from '@/hooks/lookbook/useLookbookQuestionsManagement';
import { useLookbookAnswers } from '@/hooks/lookbook/useLookbookAnswers';
import { exportLookbookItems } from '@/utils/lookbookExport';
import { LookbookItem } from '@/types/lookbook';
import { QuestionFormFields } from './lookbook/QuestionFormFields';
import { LookbookItemGrid } from './lookbook/LookbookItemGrid';
import { LookbookSummary } from './lookbook/LookbookSummary';
import { ItemDetailsDialog } from './lookbook/ItemDetailsDialog';
import { useLocalStorageCache, useCacheKey } from '@/hooks/useLocalStorageCache';
import { ProjectDocumentsSection } from './ProjectDocumentsSection';
import { Project, LineItem } from '@/types';
import { useClientData } from '@/hooks/materials/useClientData';
import { Can } from '@/components/Can';

interface LookBookTabProps {
  projectId: string;
  project?: Project;
  activeDraftItems?: LineItem[];
  activeDraftMultiplier?: number;
  readOnly?: boolean;
  userRole?: string;
}

export default function LookBookTab({ projectId, project, activeDraftItems = [], activeDraftMultiplier = 1, readOnly = false, userRole }: LookBookTabProps) {
  const { currentWorkspace } = useWorkspace();
  const workspaceId = currentWorkspace?.id;
  const { toast } = useToast();
  const { can, permissions } = usePermissions();

  // Permission checks (must be declared before use)
  const canViewLookbook = can('tab.projects_lookbook.view');
  const canEditLookbook = can('tab.projects_lookbook.edit');
  
  // Permission checks for Client Documents
  // Component-level edit permission overrides tab-level read-only
  const canViewClientDocuments = can('component.lookbook_projectdocuments.view');
  const canEditClientDocuments = can('component.lookbook_projectdocuments.edit');
  const clientDocumentsReadOnly = !canEditClientDocuments;
  
  // Get client data for ProjectDocumentsSection
  const { clientData } = useClientData(project?.clientId || '');

  // Cache UI state to localStorage (with user/workspace scoping)
  const cacheKey = useCacheKey();
  const cachePrefix = `lookbooktab.${projectId}`;
  const [activeTab, setActiveTab] = useLocalStorageCache<string>(
    cacheKey(cachePrefix, projectId, undefined, 'activeTab'),
    'questions'
  );
  const [hidePrices, setHidePrices] = useLocalStorageCache<boolean>(
    cacheKey(cachePrefix, projectId, undefined, 'hidePrices'),
    false
  );
  const [viewingItem, setViewingItem] = useLocalStorageCache<LookbookItem | null>(
    cacheKey(cachePrefix, projectId, undefined, 'viewingItem'),
    null
  );
  const hasViewPricePermission = can('component.view_price.view');
  
  // Sub-tab permission checks
  const canViewQuestionsTab = can('component.lookbook_questionstab.view');
  const canEditQuestionsTab = can('component.lookbook_questionstab.edit');
  const canViewSelectionTab = can('component.lookbook_selectiontab.view');
  const canEditSelectionTab = can('component.lookbook_selectiontab.edit');
  const canViewSummaryTab = can('component.lookbook_summarytab.view');
  const canEditSummaryTab = can('component.lookbook_summarytab.edit');
  
  // Granular permission checks for Questions tab buttons
  // These require BOTH the tab edit permission AND the specific button permission
  const canAddQuestions = canEditQuestionsTab && can('component.lookbook_questionstabquestions.add');
  const canDeleteQuestions = canEditQuestionsTab && can('component.lookbook_questionstabquestions.delete');

  // Filter visible tabs based on view permissions (memoized to prevent hook issues)
  const visibleTabs = useMemo(() => [
    { value: 'questions', label: 'Questions', canView: canViewQuestionsTab },
    { value: 'lookbook', label: 'Selection', canView: canViewSelectionTab },
    { value: 'summary', label: 'Summary', canView: canViewSummaryTab },
  ].filter(tab => tab.canView), [canViewQuestionsTab, canViewSelectionTab, canViewSummaryTab]);

  // Get array of visible tab values for comparison
  const visibleTabValues = useMemo(() => visibleTabs.map(tab => tab.value), [visibleTabs]);

  // Update hidePrices based on viewPrice permission
  useEffect(() => {
    setHidePrices(!hasViewPricePermission);
  }, [hasViewPricePermission, permissions, setHidePrices]);

  // Custom hooks - must be called unconditionally before any early returns
  // Get questions for this project
  const questionsManagement = useLookbookQuestionsManagement({
    projectId,
    workspaceId,
  });

  // Get answers for this project (used for Summary tab)
  const questionIds = questionsManagement.questions.map((q) => q.id);
  const answersHook = useLookbookAnswers({
    projectId,
    workspaceId,
    questionIds,
    autoSaveDelay: 1000,
  });

  const { items } = useLookbookItems(workspaceId);

  const selections = useLookbookSelections(projectId, workspaceId);

  const filter = useLookbookFilter(items, workspaceId, projectId);

  // If active tab is not visible, switch to first visible tab
  useEffect(() => {
    if (visibleTabValues.length > 0 && !visibleTabValues.includes(activeTab)) {
      setActiveTab(visibleTabValues[0]);
    }
  }, [visibleTabValues, activeTab, setActiveTab]);

  // Handlers
  const handleAnswerChange = (questionId: string, value: string) => {
    answersHook.setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleContinueToLookbook = async () => {
    const success = await answersHook.saveAnswers();
    if (success) {
      setActiveTab('lookbook');
    }
  };

  const handleClearAll = async () => {
    const answersCleared = await answersHook.clearAnswers();
    const selectionsCleared = await selections.clearSelections();

    if (answersCleared && selectionsCleared) {
      filter.setSearchTerm('');
      filter.setSortBy('relevance');
      filter.setSubTab(filter.subCategories[0]);

      toast({
        title: 'Success',
        description: 'All lookbook data cleared for this project',
      });
    }
  };

  const handleExport = (format: 'json' | 'csv') => {
    exportLookbookItems(selections.likedItems, format);
  };

  // Effective read-only states for each sub-tab
  // Component-level edit permission overrides tab-level edit permission
  const questionsTabReadOnly = readOnly || !canEditQuestionsTab;
  const selectionTabReadOnly = readOnly || !canEditSelectionTab;
  const summaryTabReadOnly = readOnly || !canEditSummaryTab;

  // Don't render if no view permission
  if (!canViewLookbook) {
    return (
      <div className="w-full p-6">
        <p className="text-muted-foreground">You don't have permission to view this lookbook.</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {visibleTabs.length === 0 ? (
        <div className="w-full p-6">
          <p className="text-muted-foreground">You don't have permission to view any lookbook sub-tabs.</p>
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList 
            className={`w-full mb-6 ${
              visibleTabs.length === 1 ? 'grid grid-cols-1' :
              visibleTabs.length === 2 ? 'grid grid-cols-2' :
              'grid grid-cols-3'
            }`}
          >
            {canViewQuestionsTab && (
              <TabsTrigger value="questions">Questions</TabsTrigger>
            )}
            {canViewSelectionTab && (
              <TabsTrigger value="lookbook">Selection</TabsTrigger>
            )}
            {canViewSummaryTab && (
              <TabsTrigger value="summary">Summary</TabsTrigger>
            )}
          </TabsList>

        {/* QUESTIONS TAB */}
        {canViewQuestionsTab && (
          <TabsContent value="questions">
            <QuestionFormFields
              projectId={projectId}
              workspaceId={workspaceId}
              answers={answersHook.answers}
              onAnswerChange={handleAnswerChange}
              readOnly={questionsTabReadOnly}
              canAdd={canAddQuestions}
              canDelete={canDeleteQuestions}
            />
            {!questionsTabReadOnly && (
              <div className="mt-4 flex gap-2">
                <Button onClick={handleContinueToLookbook}>Continue to Lookbook</Button>
                <Button variant="outline" onClick={handleClearAll}>
                  <Trash2 className="h-4 w-4 mr-2" /> Reset
                </Button>
              </div>
            )}
          </TabsContent>
        )}

        {/* LOOKBOOK/SELECTION TAB */}
        {canViewSelectionTab && (
          <TabsContent value="lookbook">
            <LookbookItemGrid
              subTab={filter.subTab}
              onSubTabChange={filter.setSubTab}
              subCategories={filter.subCategories}
              searchTerm={filter.searchTerm}
              onSearchChange={filter.setSearchTerm}
              sortBy={filter.sortBy}
              onSortChange={filter.setSortBy}
              hidePrices={hidePrices}
              onHidePricesChange={setHidePrices}
              visibleItems={filter.visibleItems}
              selectedItemIds={selections.selectedItemIds}
              readOnly={selectionTabReadOnly}
              onToggleLike={selections.toggleLike}
              onViewDetails={setViewingItem}
            />
          </TabsContent>
        )}

        {/* SUMMARY TAB */}
        {canViewSummaryTab && (
            <TabsContent value="summary">
              <LookbookSummary
                questions={questionsManagement.questions}
                answers={answersHook.answers}
                likedItems={selections.likedItems}
                readOnly={summaryTabReadOnly}
                hidePrices={hidePrices}
                onEditQuestions={() => setActiveTab('questions')}
                onExport={handleExport}
                onToggleLike={selections.toggleLike}
                onViewDetails={setViewingItem}
              />
            </TabsContent>
        )}
        </Tabs>
      )}

      {/* Client Documents Section - Outside Tabs */}
      {project && project.id !== project.clientId && canViewClientDocuments && (
        <div className="mt-6">
          <ProjectDocumentsSection
            projectId={project.id}
            project={project}
            clientData={clientData}
            activeDraftItems={activeDraftItems}
            activeDraftMultiplier={activeDraftMultiplier}
            tabIdentifier="lookbook"
            readOnly={clientDocumentsReadOnly}
            userRole={userRole}
          />
        </div>
      )}

      {/* Item Details Dialog */}
      <ItemDetailsDialog
        item={viewingItem}
        open={!!viewingItem}
        onOpenChange={(open) => !open && setViewingItem(null)}
        hidePrices={hidePrices}
        isLiked={viewingItem?.id ? selections.selectedItemIds.has(viewingItem.id) : false}
        onToggleLike={selections.toggleLike}
        readOnly={selectionTabReadOnly}
      />
    </div>
  );
}
