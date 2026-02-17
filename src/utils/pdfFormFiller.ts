import { PDFDocument } from 'pdf-lib';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { buildProjectDocumentPath } from '@/lib/utils';

/**
 * Configuration for PDF form field mapping
 * Edit this object to map form fields to data sources
 */
export const PDF_FORM_FIELD_MAPPING = {
  // Map PDF field names to data paths
  'Name': (data: PdfFormData) => data.projectName,
  'Name 2': (data: PdfFormData) => data.clientPhone,
  'Name 3': (data: PdfFormData) => data.clientEmail,
  // Add more field mappings here as needed
  // 'FieldName': (data: PdfFormData) => data.someProperty,
};

export interface PdfFormData {
  projectName: string;
  clientPhone: string;
  clientEmail: string;
  clientName?: string;
  projectAddress?: string;
  projectType?: string;
  // Add more properties as needed
}

/**
 * Fetches a PDF template from Supabase storage
 */
async function fetchPdfTemplate(templatePath: string, workspaceId: string): Promise<ArrayBuffer> {
  const { data, error } = await supabase.storage
    .from('contract_templates')
    .download(`${workspaceId}/${templatePath}`);

  if (error) {
    throw new Error(`Failed to fetch PDF template: ${error.message}`);
  }

  return await data.arrayBuffer();
}

/**
 * Fills PDF form fields with provided data
 */
async function fillPdfForm(pdfBytes: ArrayBuffer, formData: PdfFormData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const form = pdfDoc.getForm();
  
  // Get all fields in the PDF for debugging
  const fields = form.getFields();
  console.log('Available PDF fields:', fields.map(f => f.getName()));

  // Fill form fields based on mapping configuration
  Object.entries(PDF_FORM_FIELD_MAPPING).forEach(([fieldName, getValue]) => {
    try {
      const field = form.getTextField(fieldName);
      const value = getValue(formData);
      if (value) {
        field.setText(value);
      }
    } catch (error) {
      console.warn(`Field "${fieldName}" not found or cannot be filled:`, error);
    }
  });

  // Flatten form to prevent further editing (optional)
  // form.flatten();

  return await pdfDoc.save();
}

/**
 * Downloads the filled PDF to the user's device
 */
function downloadPdf(pdfBytes: Uint8Array, filename: string): void {
  const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Main function: Fetches PDF template, fills form, uploads to storage, records in database, and downloads
 */
export async function generateAndDownloadContractPdf(
  templatePath: string,
  formData: PdfFormData,
  downloadFilename: string,
  workspaceId: string,
  projectId: string,
  documentType: string,
  userId?: string,
): Promise<void> {
  try {
    // Fetch the PDF template from storage
    const pdfBytes = await fetchPdfTemplate(templatePath, workspaceId);
    
    // Fill the form with data
    const filledPdfBytes = await fillPdfForm(pdfBytes, formData);

    // Build a consistent file name with date stamp
    const dateStr = format(new Date(), 'yyyy-MM-dd');
    const fullFileName = `${downloadFilename}_${dateStr}.pdf`;
    const filePath = buildProjectDocumentPath(workspaceId, projectId, fullFileName);

    // Upload the filled PDF to Supabase storage (project-attachments bucket)
    const pdfBlob = new Blob([filledPdfBytes], { type: 'application/pdf' });
    const { error: uploadError } = await supabase.storage
      .from('project-attachments')
      .upload(filePath, pdfBlob, {
        upsert: false,
        contentType: 'application/pdf',
      });

    if (uploadError) {
      throw uploadError;
    }

    // Record the document in project_documents table
    const nowIso = new Date().toISOString();
    const { error: docError } = await supabase
      .from('project_documents')
      .upsert(
        {
          workspace_id: workspaceId,
          project_id: projectId,
          file_path: filePath,
          document_type: documentType,
          is_active: false,
          created_by: userId || null,
          created_at: nowIso,
          updated_by: userId || null,
          updated_at: nowIso,
        },
        {
          // Match existing unique constraint used for project_documents upserts
          onConflict: 'project_id,file_path',
        },
      );

    if (docError) {
      // Surface migration-related issues clearly but still allow download
      console.error('Error saving PDF document record:', docError);
    }

    // Download the filled PDF for the user
    downloadPdf(filledPdfBytes, fullFileName);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
}
