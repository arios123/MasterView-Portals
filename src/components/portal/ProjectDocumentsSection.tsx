import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { LineItem, Project } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useProjectType } from '@/hooks/documents/useProjectType';
import { useDocumentChangeOrders } from '@/hooks/documents/useDocumentChangeOrders';
import { useGeneratedDocuments } from '@/hooks/documents/useGeneratedDocuments';
import { useDocumentActions } from '@/hooks/documents/useDocumentActions';
import { useDocumentGeneration } from '@/hooks/documents/useDocumentGeneration';
import { requiresChangeOrder } from '@/hooks/documents/useDocumentTypes';
import { useDocumentGroupsForTab } from '@/hooks/documents/useDocumentGroupsForTab';
import { TabIdentifier } from '@/queries/documentGroupTabConfigurations';
import { DocumentGenerationForm } from './documents/DocumentGenerationForm';
import { GeneratedDocumentsList } from './documents/GeneratedDocumentsList';

interface ProjectDocumentsSectionProps {
  projectId: string;
  project: Project;
  clientData: any;
  activeDraftItems: LineItem[];
  activeDraftMultiplier: number;
  tabIdentifier: TabIdentifier;
  title?: string;
  readOnly?: boolean;
  userRole?: string;
}

export function ProjectDocumentsSection({
  projectId,
  project,
  clientData,
  activeDraftItems,
  activeDraftMultiplier,
  tabIdentifier,
  title = 'Client Documents',
  readOnly = false,
}: ProjectDocumentsSectionProps) {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const workspaceId = currentWorkspace?.id;
  const shouldHideGeneration = false;
  const canGenerateDocuments = !readOnly;

  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [documentName, setDocumentName] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedChangeOrderId, setSelectedChangeOrderId] = useState<string>('');

  const { projectType } = useProjectType(projectId);

  // Get configured document groups for this tab
  const { documentGroups: configuredGroups, loading: configuredGroupsLoading } = useDocumentGroupsForTab(tabIdentifier);
  
  // Convert configured groups to document types format
  // If no groups are configured, documentTypes will be empty array
  const documentTypes = useMemo(() => {
    return configuredGroups.map(group => ({
      value: group.slug,
      label: group.name,
    }));
  }, [configuredGroups]);
  
  const documentTypesLoading = configuredGroupsLoading;
  
  // Create a map of slug -> label for document utilities (use configured groups)
  const slugToLabelMap = useMemo(() => {
    const map: Record<string, string> = {};
    configuredGroups.forEach(group => {
      map[group.slug] = group.name;
    });
    return map;
  }, [configuredGroups]);

  const requiresChangeOrderForTemplate = useMemo(() => {
    return selectedTemplate ? requiresChangeOrder(selectedTemplate) : false;
  }, [selectedTemplate]);

  // Set default selection to first available type
  useEffect(() => {
    if (documentTypes.length > 0 && !selectedTemplate && documentTypes[0]?.value) {
      setSelectedTemplate(documentTypes[0].value);
    }
  }, [documentTypes, selectedTemplate]);

  // Fetch change orders when needed
  const { changeOrders } = useDocumentChangeOrders(projectId, requiresChangeOrderForTemplate);

  // Clear change order selection when switching away from change order document types
  useEffect(() => {
    if (!requiresChangeOrderForTemplate) {
      setSelectedChangeOrderId('');
    }
  }, [requiresChangeOrderForTemplate]);

  // Fetch generated documents - get all slugs from configured document groups for filtering
  const allDocumentSlugs = useMemo(() => configuredGroups.map(g => g.slug), [configuredGroups]);
  const { sortedDocuments, sortBy, setSortBy, showActiveOnly, setShowActiveOnly, refetch } = useGeneratedDocuments(
    projectId,
    allDocumentSlugs,
    workspaceId
  );

  // Document actions
  const { handleDownload, handleDelete, handleSetActive, handleDeactivate } = useDocumentActions(
    projectId,
    workspaceId,
    user?.id,
    refetch
  );

  // Document generation
  const { generateDocument, isGenerating } = useDocumentGeneration(refetch);

  const handleGenerateDocument = async () => {
    const success = await generateDocument({
      documentName,
      selectedTemplate,
      selectedChangeOrderId,
      requiresChangeOrder: requiresChangeOrderForTemplate,
      projectId,
      project,
      clientData,
      activeDraftItems,
      activeDraftMultiplier,
      projectType,
      userId: user?.id,
      workspaceId,
    });

    if (success) {
      setDocumentName('');
      setSelectedChangeOrderId('');
    }
  };

  // Hide entire component for certain roles
  if (shouldHideGeneration) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center justify-between">
          <CardTitle>{title}</CardTitle>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent className="space-y-4">
          {(documentTypesLoading || configuredGroupsLoading) ? (
            <div className="text-center py-4 text-muted-foreground">Loading document types...</div>
          ) : (
            <DocumentGenerationForm
              selectedTemplate={selectedTemplate}
              onTemplateChange={setSelectedTemplate}
              documentName={documentName}
              onDocumentNameChange={setDocumentName}
              onGenerate={handleGenerateDocument}
              allowedTypes={documentTypes}
              requiresChangeOrder={requiresChangeOrderForTemplate}
              selectedChangeOrderId={selectedChangeOrderId}
              onChangeOrderSelect={setSelectedChangeOrderId}
              changeOrders={changeOrders}
              canGenerate={canGenerateDocuments}
              isGenerating={isGenerating}
            />
          )}

          <GeneratedDocumentsList
            documents={sortedDocuments}
            sortBy={sortBy}
            onSortChange={setSortBy}
            showActiveOnly={showActiveOnly}
            onShowActiveChange={setShowActiveOnly}
            onSetActive={handleSetActive}
            onDeactivate={handleDeactivate}
            onDownload={handleDownload}
            onDelete={handleDelete}
            readOnly={readOnly}
            slugToLabelMap={slugToLabelMap}
          />
        </CardContent>
      )}
    </Card>
  );
}
