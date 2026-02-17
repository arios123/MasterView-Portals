import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

/**
 * Configuration for DOCX template field mapping
 * Add new fields here to automatically fill them in templates
 */
export interface DocxTemplateData {
  // System fields (camelCase matching template)
  Date?: string;
  QuoteNo?: string;
  StartDate?: string;
  Weeks?: string;
  Multiplier?: string;

  // Client fields (camelCase matching template)
  ClientName?: string;
  ClientEmail?: string;
  ClientPhoneNumber?: string;

  // Assigned staff fields
  AssignedStaffName?: string;
  AssignedStaffEmail?: string;

  // Project fields
  ProjectTitle?: string;
  ProjectType?: string;
  ProjectAddress?: string;
  ProjectStatus?: string;
  QuickNotes?: string;
  Notes?: string;

  // Financial/Labor fields
  Labor?: Array<any>; // Labor items from version_labor (compound macro)
  Materials?: string | Array<any>; // Can be string or array for nested loops
  ProjectMaterials?: Array<any>; // Materials from version_materials (compound macro)
  ChangeOrderProjectMaterials?: Array<{
    // Before (baseline)
    ChangeOrderProjectMaterialsTitleB: string;
    ChangeOrderProjectMaterialsQtyB: string;
    ChangeOrderProjectMaterialsPriceB: string;
    ChangeOrderProjectMaterialsTotalB: string;
    // After (CO result)
    ChangeOrderProjectMaterialsTitleA: string;
    ChangeOrderProjectMaterialsQtyA: string;
    ChangeOrderProjectMaterialsPriceA: string;
    ChangeOrderProjectMaterialsTotalA: string;
    // Delta (After − Before)
    ChangeOrderProjectMaterialsQtyD: string;
    ChangeOrderProjectMaterialsPriceD: string;
    ChangeOrderProjectMaterialsTotalD: string;
    // Change type
    ChangeOrderProjectMaterialsChange: string;
  }>; // Change order Before/After/Delta materials; Change = "Added"|"Modified"|"Removed"
  ChangeOrderLabor?: Array<{
    // Before (baseline)
    ChangeOrderLaborTitleB: string;
    ChangeOrderLaborQtyB: string;
    ChangeOrderLaborPriceB: string;
    ChangeOrderLaborTotalB: string;
    // After (CO result)
    ChangeOrderLaborTitleA: string;
    ChangeOrderLaborQtyA: string;
    ChangeOrderLaborPriceA: string;
    ChangeOrderLaborTotalA: string;
    // Delta (After − Before)
    ChangeOrderLaborQtyD: string;
    ChangeOrderLaborPriceD: string;
    ChangeOrderLaborTotalD: string;
    // Change type
    ChangeOrderLaborChange: string;
  }>; // Change order Before/After/Delta labor; Change = "Added"|"Modified"|"Removed"
  ChangeOrderMaterials?: Array<{
    ChangeOrderMaterialsLinkedTo: string;
    ChangeOrderMaterialsTitle: string;
    ChangeOrderMaterialsLink: string;
    ChangeOrderMaterialsQuantity: number;
    ChangeOrderMaterialsNotes: string;
    ChangeOrderMaterialsPrice: string;
    ChangeOrderMaterialsTotal: string;
  }>; // Material revisions for the selected change order (same format as Materials but for the CO)
  AssignedCrew?: Array<any>; // Crew members assigned to the project
  LookbookQ?: Array<any>; // Lookbook questions and answers for the project
  LookbookS?: Array<{
    LookbookSCategory: string;
    LookbookSTitle: string;
    LookbookSBrand: string;
    LookbookSStyle: string;
    LookbookSFinish: string;
    LookbookSLink: string;
    LookbookSPrice: string;
    LookbookSModel: string;
    LookbookSCollection: string;
  }>; // Liked/selected lookbook items for the project
  IncomingPayments?: Array<any>; // Incoming payments for the project
  OutgoingPayments?: Array<any>; // Outgoing payments for the project
  ContractTotal?: string;
  ChangeOrderTotal?: string; // Specific change order total
  AllChangeOrderTotal?: string; // Cumulative total of all change orders
  ProjectTotal?: string;
  TotalPaid?: string;
  Balance?: string;
  PTTen?: string; // Project Total + 10%

  // Payment split fields
  hasFirstPayment?: boolean;
  hasSecondPayment?: boolean;
  hasThirdPayment?: boolean;
  hasLastPayment?: boolean;
  Payment1?: string; // First payment amount
  Payment2?: string; // Second payment amount
  Payment3?: string; // Third payment amount
  Payment4?: string; // Last payment amount

  // Add more fields as needed here
}

/**
 * Fetches a DOCX template from Supabase storage
 * Ensures binary integrity by preserving the blob as-is without any text processing
 */
async function fetchDocxTemplate(templatePath: string, workspaceId: string): Promise<Blob> {
  const { data: templateData, error: downloadError } = await supabase.storage
    .from("contract_templates")
    .download(`${workspaceId}/${templatePath}/${templatePath}.docx`);

  if (downloadError) {
    // Try to list files to find the actual filename
    const { data: files } = await supabase.storage.from("contract_templates").list(`${workspaceId}/${templatePath}`);

    if (!files || files.length === 0) {
      throw new Error("Template not found. Please upload a template first.");
    }

    // Try with the first file found
    const { data: templateData2, error: downloadError2 } = await supabase.storage
      .from("contract_templates")
      .download(`${workspaceId}/${templatePath}/${files[0].name}`);

    if (downloadError2) throw downloadError2;
    
    // Supabase download returns a Blob - return it as-is to preserve binary integrity
    // No text processing or modification is done
    return templateData2;
  }

  // Supabase download returns a Blob - return it as-is to preserve binary integrity
  // No text processing or modification is done
  return templateData;
}

/**
 * Fills DOCX template with provided data
 * Uses docxtemplater to replace placeholders like {Date}, {Customer_Name}, etc.
 */
async function fillDocxTemplate(templateBlob: Blob, templateData: DocxTemplateData): Promise<Blob> {
  // console.log("🔍 Starting fillDocxTemplate");
  // console.log("📦 Template data received:", {
  //   keys: Object.keys(templateData),
  //   hasMaterials: 'Materials' in templateData,
  //   materialsType: typeof templateData.Materials,
  //   materialsIsArray: Array.isArray(templateData.Materials),
  // });

  // Log LookbookQ data specifically
  console.log("📚 LookbookQ data:", templateData.LookbookQ);

  // Convert blob to array buffer
  const arrayBuffer = await templateBlob.arrayBuffer();
  // console.log("📦 Template blob converted to array buffer, size:", arrayBuffer.byteLength);

  // Load the docx file as binary content
  const zip = new PizZip(arrayBuffer);
  // console.log("📦 ZIP loaded");

  // Debug: Check the actual XML content to see if tags are present
  try {
    const documentXml = zip.files['word/document.xml'];
    if (documentXml) {
      const xmlContent = documentXml.asText();
      
      // Check for Materials tags
      const hasOpenTag = xmlContent.includes('{{#Materials}}');
      const hasCloseTag = xmlContent.includes('{{/Materials}}');
      const openTagIndex = xmlContent.indexOf('{{#Materials}}');
      const closeTagIndex = xmlContent.indexOf('{{/Materials}}');
      
      // console.log("🔍 Materials tag check:", {
      //   hasOpenTag,
      //   hasCloseTag,
      //   openTagIndex,
      //   closeTagIndex,
      // });
      
      // Find all instances of Materials tags
      const openTagMatches = xmlContent.match(/\{\{#Materials\}\}/g);
      const closeTagMatches = xmlContent.match(/\{\{\/Materials\}\}/g);
      
      // Check for truncated or split tags
      const truncatedCloseTag = xmlContent.match(/\{\{\/Material[^}]*/g);
      const splitTagPatterns = [
        xmlContent.match(/\{\{\/Mater[^}]*/g),
        xmlContent.match(/\{\{\/Mate[^}]*/g),
        xmlContent.match(/\{\{\/Mat[^}]*/g),
        xmlContent.match(/\{\{\/Ma[^}]*/g),
        xmlContent.match(/\{\{\/M[^}]*/g),
      ];
      
      // console.log("🔍 Materials tag matches:", {
      //   openTagCount: openTagMatches?.length || 0,
      //   closeTagCount: closeTagMatches?.length || 0,
      //   truncatedCloseTag: truncatedCloseTag || [],
      //   splitTagPatterns: splitTagPatterns.filter(p => p && p.length > 0),
      // });
      
      // Show context around the tags if found
      if (openTagIndex !== -1) {
        const openContext = xmlContent.substring(Math.max(0, openTagIndex - 100), Math.min(xmlContent.length, openTagIndex + 200));
        // console.log("📄 Context around {{#Materials}}:", openContext);
      }
      
      if (closeTagIndex !== -1) {
        const closeContext = xmlContent.substring(Math.max(0, closeTagIndex - 100), Math.min(xmlContent.length, closeTagIndex + 200));
        // console.log("📄 Context around {{/Materials}}:", closeContext);
      } else {
        // Search for partial closing tags
        const partialCloseMatches = [
          xmlContent.indexOf('{{/Material'),
          xmlContent.indexOf('{{/Mater'),
          xmlContent.indexOf('{{/Mate'),
          xmlContent.indexOf('{{/Mat'),
          xmlContent.indexOf('{{/Ma'),
          xmlContent.indexOf('{{/M'),
        ].filter(idx => idx !== -1);
        
        if (partialCloseMatches.length > 0) {
          const firstPartial = Math.min(...partialCloseMatches);
          const partialContext = xmlContent.substring(Math.max(0, firstPartial - 100), Math.min(xmlContent.length, firstPartial + 200));
          // console.log("⚠️ Found partial closing tag at index", firstPartial, "Context:", partialContext);
        }
      }
      
      // Search for tags that might be split across XML nodes
      // Look for patterns like {{/Mater and ial}} or similar splits
      const splitPattern1 = xmlContent.match(/\{\{\/[^}]*\}\}/g);
      const materialsRelated = splitPattern1?.filter(tag => tag.toLowerCase().includes('mater'));
      if (materialsRelated && materialsRelated.length > 0) {
        // console.log("⚠️ Found potential split or malformed Materials tags:", materialsRelated);
      }
    }
  } catch (xmlError) {
    // console.warn("⚠️ Could not inspect XML content:", xmlError);
  }

  // Parse the template - this will throw an error if template is invalid
  let doc;
  try {
    // console.log("🔍 Attempting to create Docxtemplater instance...");
    doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });
    // console.log("✅ Docxtemplater instance created successfully");
  } catch (error: any) {
    console.error("❌ Error parsing template:", error);
    console.error("❌ Error details:", {
      message: error.message,
      name: error.name,
      stack: error.stack,
      properties: error.properties,
    });
    
    // Log detailed error information if it's a MultiError
    if (error.properties && error.properties.errors) {
      console.error("❌ Multiple errors found:");
      error.properties.errors.forEach((err: any, index: number) => {
        console.error(`  Error ${index + 1}:`, {
          name: err.name,
          message: err.message,
          raw: err.properties?.raw,
          offset: err.properties?.offset,
          explanation: err.properties?.explanation,
        });
      });
    }
    
    // Also check for specific error types
    if (error.properties) {
      console.error("❌ Error properties:", JSON.stringify(error.properties, null, 2));
    }
    
    throw new Error(`Template parsing failed: ${error.message}`);
  }

  // Debug: Log all tags found in the template
  const tags = doc.getTags();
  // console.log("📋 Template placeholders found:", tags);
  // console.log("📋 Tags type:", typeof tags, Array.isArray(tags));
  // console.log("📋 All tags (detailed):", JSON.stringify(tags, null, 2));
  
  // Convert tags to array if it's not already an array
  const tagsArray = Array.isArray(tags) ? tags : (tags ? Object.values(tags) : []);
  // console.log("📋 Tags as array:", tagsArray);
  
  // Check specifically for Materials loop tags
  const materialsTags = tagsArray.filter((tag: any) => {
    if (typeof tag === 'string') {
      return tag === 'Materials' || tag.includes('Materials');
    }
    if (typeof tag === 'object' && tag !== null) {
      return tag.tag === 'Materials' || tag.tag?.includes('Materials');
    }
    return false;
  });
  // console.log("📋 Materials-related tags found:", materialsTags);
  
  // Check for loop tags specifically
  const loopTags = tagsArray.filter((tag: any) => {
    if (typeof tag === 'object' && tag !== null && tag.type) {
      return tag.type === 'loop' || tag.type === 'section';
    }
    return false;
  });
  // console.log("📋 Loop tags found:", loopTags);
  // console.log("📝 Data we are providing:", {
  //   ...templateData,
  //   Materials: Array.isArray(templateData.Materials) 
  //     ? `[Array with ${templateData.Materials.length} items]` 
  //     : templateData.Materials
  // });
  // console.log("📝 Materials array details:", {
  //   isArray: Array.isArray(templateData.Materials),
  //   length: Array.isArray(templateData.Materials) ? templateData.Materials.length : 'N/A',
  //   type: typeof templateData.Materials,
  //   firstItem: Array.isArray(templateData.Materials) && templateData.Materials.length > 0 ? templateData.Materials[0] : null,
  // });

  try {
    // Render the document - replaces all {placeholder} values
    // console.log("🔄 Attempting to render template...");
    doc.render(templateData);
    // console.log("✅ Template rendered successfully");
  } catch (error: any) {
    console.error("❌ Error rendering template:", error);
    console.error("❌ Error type:", error.name);
    console.error("❌ Error message:", error.message);

    // Log detailed error information
    if (error.properties) {
      console.error("❌ Error properties:", JSON.stringify(error.properties, null, 2));
      
      // If it's a MultiError, log all individual errors
      if (error.properties.errors && Array.isArray(error.properties.errors)) {
        console.error("❌ Multiple rendering errors found:");
        error.properties.errors.forEach((err: any, index: number) => {
          console.error(`  Rendering Error ${index + 1}:`, {
            name: err.name,
            message: err.message,
            raw: err.properties?.raw,
            offset: err.properties?.offset,
            explanation: err.properties?.explanation,
            tag: err.properties?.tag,
            lIndex: err.properties?.lIndex,
          });
        });
      }
    }

    throw new Error(`Template rendering failed: ${error.message}`);
  }

  // Generate the output as a blob
  const buf = doc.getZip().generate({
    type: "blob",
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });

  return buf;
}

/**
 * Uploads the filled DOCX to Supabase storage
 */
async function uploadDocx(projectId: string, fileName: string, templateType: string, docxBlob: Blob, workspaceId: string): Promise<void> {
  const dateStr = format(new Date(), "yyyy-MM-dd");
  const fullFileName = `${fileName}_${templateType}_${dateStr}.docx`;
  const filePath = `${workspaceId}/${projectId}/pdfs/${fullFileName}`;

  const { error: uploadError } = await supabase.storage
    .from("project-attachments")
    .upload(filePath, docxBlob, { upsert: true });

  if (uploadError) throw uploadError;
}

/**
 * Main function: Generates a filled DOCX from a template and uploads it
 *
 * @param templateType - The template type (e.g., 'contract', 'quote-material-list')
 * @param fileName - The base name for the generated file
 * @param projectId - The project ID for storage organization
 * @param templateData - The data to fill into the template
 *
 * @example
 * await generateDocxFromTemplate(
 *   'contract',
 *   'Client Contract',
 *   project.id,
 *   {
 *     Date: format(new Date(), 'MM/dd/yyyy'),
 *     clientName: 'John Doe',
 *     projectAddress: '123 Main St',
 *     contractTotal: '$50,000'
 *   }
 * );
 */
export async function generateDocxFromTemplate(
  templateType: string,
  fileName: string,
  projectId: string,
  templateData: DocxTemplateData,
  workspaceId: string,
): Promise<void> {
  // Fetch the template
  const templateBlob = await fetchDocxTemplate(templateType, workspaceId);

  // Add system fields if not provided
  const fullTemplateData: DocxTemplateData = {
    Date: format(new Date(), "MM/dd/yyyy"),
    ...templateData,
  };

  // Fill the template
  const filledDocx = await fillDocxTemplate(templateBlob, fullTemplateData);

  // Upload to storage
  await uploadDocx(projectId, fileName, templateType, filledDocx, workspaceId);
}

/**
 * Generates a filled DOCX blob from a template without uploading
 * 
 * @param templateType - The template type (e.g., 'contract', 'quote-material-list')
 * @param templateData - The data to fill into the template
 * @returns The filled DOCX as a Blob
 */
export async function generateDocxFromTemplateBlob(
  templateType: string,
  templateData: DocxTemplateData,
  workspaceId: string,
): Promise<Blob> {
  // console.log("🚀 generateDocxFromTemplateBlob called", { templateType, templateDataKeys: Object.keys(templateData) });
  
  try {
    // Fetch the template
    // console.log("📥 Fetching template:", templateType);
    const templateBlob = await fetchDocxTemplate(templateType, workspaceId);
    // console.log("✅ Template fetched, size:", templateBlob.size);

    // Add system fields if not provided; ensure compound-macro arrays are never undefined
    const fullTemplateData: DocxTemplateData = {
      Date: format(new Date(), "MM/dd/yyyy"),
      ...templateData,
      ChangeOrderProjectMaterials: Array.isArray(templateData.ChangeOrderProjectMaterials)
        ? templateData.ChangeOrderProjectMaterials
        : [],
    };
    // console.log("📝 Full template data prepared, keys:", Object.keys(fullTemplateData));

    // Fill the template and return blob
    // console.log("🔄 Calling fillDocxTemplate...");
    const result = await fillDocxTemplate(templateBlob, fullTemplateData);
    // console.log("✅ fillDocxTemplate completed, result size:", result.size);
    return result;
  } catch (error: any) {
    console.error("❌ Error in generateDocxFromTemplateBlob:", error);
    console.error("❌ Error stack:", error.stack);
    throw error;
  }
}
