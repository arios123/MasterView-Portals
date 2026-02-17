import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { LineItem, Project } from '@/types';
import { generateDocxFromTemplateBlob } from '@/utils/docxFormFiller';
import { prepareTemplateData } from '@/utils/documentDataFormatter';
import { buildProjectDocumentPath } from '@/lib/utils';

interface GenerateDocumentParams {
  documentName: string;
  selectedTemplate: string;
  selectedChangeOrderId: string;
  requiresChangeOrder: boolean;
  projectId: string;
  project: Project;
  clientData: any;
  activeDraftItems: LineItem[];
  activeDraftMultiplier: number;
  projectType: string;
  userId: string | undefined;
  workspaceId: string | undefined;
}

export function useDocumentGeneration(refetch: () => void) {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateDocument = async (params: GenerateDocumentParams) => {
    const {
      documentName,
      selectedTemplate,
      selectedChangeOrderId,
      requiresChangeOrder,
      projectId,
      project,
      clientData,
      activeDraftItems,
      activeDraftMultiplier,
      projectType,
      userId,
      workspaceId,
    } = params;

    if (!workspaceId) {
      toast.error('Workspace not available');
      return;
    }

    if (!documentName.trim()) {
      toast.error('Please enter a name for the document');
      return;
    }

    if (!clientData) {
      toast.error('Client data is not loaded yet. Please wait a moment and try again.');
      return;
    }

    if (requiresChangeOrder && !selectedChangeOrderId) {
      toast.error('Please select a change order');
      return;
    }

    setIsGenerating(true);

    try {
      toast.info('Generating document...');

      // Get active version ID for fetching material revisions
      const { data: projectData } = await supabase
        .from('projects')
        .select('active_version')
        .eq('project_id', projectId)
        .single();

      const activeVersionId = projectData?.active_version || null;

      // Get items to use - either from selected change order or active draft
      let itemsToUse: LineItem[] = activeDraftItems;
      let multiplierToUse = activeDraftMultiplier;

      if (requiresChangeOrder && selectedChangeOrderId) {
        const changeOrderData = await fetchChangeOrderData(selectedChangeOrderId);
        if (!changeOrderData) return;
        itemsToUse = changeOrderData.items;
        multiplierToUse = changeOrderData.multiplier;
      }

      // Prepare template data
      const templateData = await prepareTemplateData(
        projectId,
        project,
        clientData,
        activeDraftItems,
        activeDraftMultiplier,
        activeVersionId,
        itemsToUse,
        multiplierToUse,
        requiresChangeOrder,
        projectType
      );

      console.log('📄 Full Template Data for DOCX Generation:', {
        templateType: selectedTemplate,
        templateDataKeys: Object.keys(templateData),
        materialsArray: templateData.Materials,
        materialsArrayLength: templateData.Materials.length,
      });

      // Generate DOCX from template
      const docxBlob = await generateDocxFromTemplateBlob(selectedTemplate, templateData, workspaceId);

      // Upload DOCX to storage
      const dateStr = format(new Date(), 'yyyy-MM-dd');
      const fullFileName = `${documentName}_${selectedTemplate}_${dateStr}.docx`;
      const filePath = buildProjectDocumentPath(workspaceId, projectId, fullFileName);

      const { error: uploadError } = await supabase.storage.from('project-attachments').upload(filePath, docxBlob, {
        contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        upsert: false,
      });

      if (uploadError) throw uploadError;

      // Create or update document record in database
      const documentType = selectedTemplate;
      const { error: docError } = await supabase
        .from('project_documents')
        .upsert(
          {
            workspace_id: workspaceId,
            project_id: projectId,
            file_path: filePath,
            document_type: documentType,
            is_active: false, // New documents are not active by default
            created_by: userId || null,
            created_at: new Date().toISOString(),
            updated_by: userId || null,
            updated_at: new Date().toISOString(),
          },
          {
            // Use existing unique constraint (project_id,file_path) for upsert
            onConflict: 'project_id,file_path',
          }
        );

      if (docError) {
        if (docError.code === 'PGRST205' || docError.message?.includes('Could not find the table')) {
          console.warn('project_documents table does not exist. Document generated but active status not tracked.');
        } else {
          console.error('Error saving document record:', docError);
        }
      }

      toast.success('Document generated successfully!');
      refetch();
      return true;
    } catch (error: any) {
      console.error('Error generating document:', error);
      toast.error(error.message || 'Failed to generate document');
      return false;
    } finally {
      setIsGenerating(false);
    }
  };

  return { generateDocument, isGenerating };
}

async function fetchChangeOrderData(changeOrderId: string) {
  try {
    const { data: laborData, error: laborError } = await supabase
      .from('version_labor')
      .select('*, labor_options:labor_id (*)')
      .eq('version_id', changeOrderId);

    const { data: materialData, error: materialError } = await supabase
      .from('version_materials')
      .select('*, material_options:material_id (*)')
      .eq('version_id', changeOrderId);

    const { data: versionData, error: versionError } = await supabase
      .from('project_versions')
      .select('multiplier')
      .eq('version_id', changeOrderId)
      .single();

    if (laborError || materialError || versionError) {
      console.error('Error fetching change order data:', { laborError, materialError, versionError });
      toast.error('Failed to load change order data');
      return null;
    }

    const multiplier = versionData ? Number(versionData.multiplier) || 1 : 1;
    const items: LineItem[] = [];

    if (laborData) {
      laborData.forEach((item) => {
        if (item.labor_options) {
          items.push({
            id: item.labor_options.id,
            name: item.item_name || item.labor_options.name || 'Unknown Labor',
            qty: Number(item.quantity),
            unitPrice: Math.abs(Number(item.price) || 0),
            kind: 'labor',
          });
        }
      });
    }

    if (materialData) {
      materialData.forEach((item) => {
        if (item.material_options) {
          items.push({
            id: item.material_options.id,
            name: item.item_name || item.material_options.name || 'Unknown Material',
            qty: Number(item.quantity),
            unitPrice: Math.abs(Number(item.price) || 0),
            wastePct: Number(item.waste_pct) || 0,
            kind: 'material',
          });
        }
      });
    }

    return { items, multiplier };
  } catch (error) {
    console.error('Error processing change order:', error);
    toast.error('Failed to process change order data');
    return null;
  }
}

