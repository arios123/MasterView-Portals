import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { LineItem, Project } from '@/types';
import { TemplateData } from '@/types/documents';
import { calculateContractTotal, calculatePaymentAmounts, formatCurrency } from './documentCalculations';
import { computeTotals } from './calculations';
import { fetchClientAssignments } from '@/queries/clientAssignments';
import { fetchProjectCrewAssignments } from '@/queries/projectCrewAssignments';
import { getMaterialsTaxRate } from '@/queries/workspaces';
import { getChangeOrderDeltaMaterials, getChangeOrderDeltaLabor } from './changeOrderHelpers';

export function formatMaterialItems(items: LineItem[]): string {
  const materialItems = items.filter((item) => item.kind === 'material');
  return materialItems
    .map((item) => {
      const waste = item.wastePct ?? (/tile|countertop/i.test(item.name) ? 20 : 0);
      const qtyWithWaste = item.qty * (1 + waste / 100);
      const total = qtyWithWaste * item.unitPrice;
      const name = item.name.padEnd(35, ' ');
      const qtyPrice = `Qty: ${item.qty}   $${item.unitPrice.toFixed(2)}`.padEnd(25, ' ');
      const totalPrice = `$${total.toFixed(2)}`;
      return `${name}${qtyPrice}${totalPrice}`;
    })
    .join('\n');
}

export function formatChangeOrderItems(items: LineItem[]): string {
  if (items.length === 0) return '';
  return items.map((item) => `Qty: ${item.qty}\t${item.name}`).join('\n');
}

export async function fetchLookbookQuestionsAndAnswers(projectId: string, workspaceId: string) {
  try {
    // First, fetch all questions for this project
    const { data: questions, error: questionsError } = await (supabase as any)
      .from('lookbook_questions')
      .select('*')
      .eq('project_id', projectId)
      .eq('workspace_id', workspaceId)
      .order('display_order', { ascending: true });

    if (questionsError) {
      console.error('Error fetching lookbook questions:', questionsError);
      return [];
    }

    if (!questions || questions.length === 0) {
      console.log('No lookbook questions found for project:', projectId);
      return [];
    }

    console.log(`Found ${questions.length} lookbook questions for project`);

    // Get all question IDs
    const questionIds = questions.map((q: any) => q.id);

    // Fetch all answers for these questions and this project
    const { data: answers, error: answersError } = await (supabase as any)
      .from('lookbook_answers')
      .select('question_id, answer_text')
      .eq('project_id', projectId)
      .eq('workspace_id', workspaceId)
      .in('question_id', questionIds);

    if (answersError) {
      console.error('Error fetching lookbook answers:', answersError);
      return [];
    }

    console.log(`Found ${answers?.length || 0} lookbook answers for project`);

    // Create a map of answers by question_id
    const answersMap = new Map(
      (answers || []).map((a: any) => [a.question_id, a.answer_text])
    );

    // Combine questions with their answers
    return questions.map((question: any) => ({
      LookbookQQuestions: question.label || '',
      LookbookQAnswers: answersMap.get(question.id) || '',
    }));
  } catch (error) {
    console.error('Error fetching lookbook questions and answers:', error);
    return [];
  }
}

export async function fetchMaterialRevisions(versionId: string) {
  try {
    const { data: revisions, error } = await supabase
      .from('material_revisions')
      .select('*')
      .eq('version_id', versionId)
      .order('created_at', { ascending: true });

    if (error || !revisions || !Array.isArray(revisions)) {
      return [];
    }

    return revisions
      .filter((rev) => rev != null && rev.name)
      .map((rev) => {
        const qty = Number(rev.quantity) || 0;
        const price = Number(rev.price) || 0;
        const total = qty * price;
        return {
          MaterialsLinkedTo: String(rev.linked_to_name || '').trim(),
          MaterialsTitle: String(rev.name || '').trim(),
          MaterialsLink: String(rev.link || '').trim(),
          MaterialsQuantity: qty,
          MaterialsNotes: String(rev.notes || '').trim(),
          MaterialsPrice: price.toFixed(2),
          MaterialsTotal: total.toFixed(2),
        };
      })
      .filter((item) => item.MaterialsTitle !== '');
  } catch (error) {
    console.error('Error fetching material revisions:', error);
    return [];
  }
}

export async function fetchLookbookSelectionsArray(projectId: string, workspaceId: string): Promise<Array<{
  LookbookSCategory: string;
  LookbookSTitle: string;
  LookbookSBrand: string;
  LookbookSStyle: string;
  LookbookSFinish: string;
  LookbookSLink: string;
  LookbookSPrice: string;
  LookbookSModel: string;
  LookbookSCollection: string;
}>> {
  try {
    const { data, error } = await (supabase as any)
      .from('project_lookbook_selections')
      .select('lookbook_option_id, lookbook_options (*)')
      .eq('project_id', projectId)
      .eq('workspace_id', workspaceId);

    if (error || !data) return [];

    return data
      .filter((item: any) => item.lookbook_options)
      .map((item: any) => {
        const opt = item.lookbook_options;
        const price = Number(opt.price) || 0;
        return {
          LookbookSCategory: String(opt.category || '').trim(),
          LookbookSTitle: String(opt.style || '').trim(),
          LookbookSBrand: String(opt.brand || '').trim(),
          LookbookSStyle: String(opt.style || '').trim(),
          LookbookSFinish: String(opt.finish || '').trim(),
          LookbookSLink: String(opt.link || '').trim(),
          LookbookSPrice: price.toFixed(2),
          LookbookSModel: String(opt.model_number || '').trim(),
          LookbookSCollection: String(opt.collection || '').trim(),
        };
      });
  } catch (error) {
    console.error('Error fetching lookbook selections:', error);
    return [];
  }
}

export async function fetchChangeOrderMaterialRevisions(versionId: string) {
  try {
    const { data: revisions, error } = await supabase
      .from('material_revisions')
      .select('*')
      .eq('version_id', versionId)
      .order('created_at', { ascending: true });

    if (error || !revisions || !Array.isArray(revisions)) {
      return [];
    }

    return revisions
      .filter((rev) => rev != null && rev.name)
      .map((rev) => {
        const qty = Number(rev.quantity) || 0;
        const price = Number(rev.price) || 0;
        const total = qty * price;
        return {
          ChangeOrderMaterialsLinkedTo: String(rev.linked_to_name || '').trim(),
          ChangeOrderMaterialsTitle: String(rev.name || '').trim(),
          ChangeOrderMaterialsLink: String(rev.link || '').trim(),
          ChangeOrderMaterialsQuantity: qty,
          ChangeOrderMaterialsNotes: String(rev.notes || '').trim(),
          ChangeOrderMaterialsPrice: price.toFixed(2),
          ChangeOrderMaterialsTotal: total.toFixed(2),
        };
      })
      .filter((item) => item.ChangeOrderMaterialsTitle !== '');
  } catch (error) {
    console.error('Error fetching change order material revisions:', error);
    return [];
  }
}

export async function fetchOutgoingPaymentsArray(projectId: string, workspaceId: string): Promise<Array<{
  OutgoingPaymentsDate: string;
  OutgoingPaymentsItem: string;
  OutgoingPaymentsLink: string;
  OutgoingPaymentsTotalPrice: string;
  OutgoingPaymentsQty: string;
  OutgoingPaymentsTracking: string;
  OutgoingPaymentsNotes: string;
}>> {
  try {
    const { data: paymentsData, error } = await (supabase as any)
      .from('outgoing_payments')
      .select('*')
      .eq('project_id', projectId)
      .eq('workspace_id', workspaceId)
      .order('date', { ascending: false });

    if (error || !paymentsData) return [];

    return paymentsData.map((payment: any) => {
      // Format date as MM/dd/yyyy
      let formattedDate = '';
      if (payment.date) {
        try {
          const date = new Date(payment.date);
          formattedDate = format(date, 'MM/dd/yyyy');
        } catch (e) {
          formattedDate = payment.date || '';
        }
      }

      // Format total price as number string (e.g., "1500.00")
      const totalPrice = Number(payment.budget) || 0;
      const formattedTotalPrice = totalPrice.toFixed(2);

      // Format quantity as number string (e.g., "5")
      const qty = Number(payment.qty) || 0;
      const formattedQty = qty.toString();

      return {
        OutgoingPaymentsDate: formattedDate,
        OutgoingPaymentsItem: payment.material_name || '',
        OutgoingPaymentsLink: payment.link || '',
        OutgoingPaymentsTotalPrice: formattedTotalPrice,
        OutgoingPaymentsQty: formattedQty,
        OutgoingPaymentsTracking: payment.tracking || '',
        OutgoingPaymentsNotes: payment.notes || '',
      };
    });
  } catch (error) {
    console.error('Error fetching outgoing payments:', error);
    return [];
  }
}

export async function fetchIncomingPaymentsArray(projectId: string, workspaceId: string): Promise<Array<{
  IncomingPaymentsDate: string;
  IncomingPaymentsAmount: string;
  IncomingPaymentsType: string;
  IncomingPaymentsReceivedBy: string;
  IncomingPaymentsFor: string;
  IncomingPaymentsNotes: string;
}>> {
  try {
    const { data: paymentsData, error } = await (supabase as any)
      .from('payments')
      .select('*')
      .eq('project_id', projectId)
      .eq('workspace_id', workspaceId)
      .order('date', { ascending: false });

    if (error || !paymentsData) return [];

    return paymentsData.map((payment: any) => {
      // Format date as MM/dd/yyyy
      let formattedDate = '';
      if (payment.date) {
        try {
          const date = new Date(payment.date);
          formattedDate = format(date, 'MM/dd/yyyy');
        } catch (e) {
          formattedDate = payment.date || '';
        }
      }

      // Format amount as number string (e.g., "1500.00")
      const amount = Number(payment.amount) || 0;
      const formattedAmount = amount.toFixed(2);

      return {
        IncomingPaymentsDate: formattedDate,
        IncomingPaymentsAmount: formattedAmount,
        IncomingPaymentsType: payment.type || '',
        IncomingPaymentsReceivedBy: payment.received_by || '',
        IncomingPaymentsFor: payment.for_field || '',
        IncomingPaymentsNotes: payment.note || '',
      };
    });
  } catch (error) {
    console.error('Error fetching incoming payments:', error);
    return [];
  }
}

export async function fetchLaborArray(versionId: string): Promise<Array<{
  LaborTitle: string;
  LaborQty: number;
  LaborPrice: string;
  LaborTotal: string;
}>> {
  try {
    const { data: laborData, error } = await supabase
      .from('version_labor')
      .select('*, labor_options:labor_id (*)')
      .eq('version_id', versionId);

    if (error || !laborData) return [];

    return laborData
      .filter((item) => item.labor_options != null)
      .map((item) => {
        const qty = Number(item.quantity) || 0;
        const unitPrice = Number(item.price) || 0;
        const total = qty * unitPrice;
        
        // Use item_name if available, otherwise fall back to labor_options.name
        const name = (item as any).item_name || item.labor_options?.name || 'Unknown Labor';

        return {
          LaborTitle: name,
          LaborQty: qty,
          LaborPrice: unitPrice.toFixed(2),
          LaborTotal: total.toFixed(2),
        };
      });
  } catch (error) {
    console.error('Error fetching labor:', error);
    return [];
  }
}

export async function fetchProjectMaterialsArray(versionId: string): Promise<Array<{
  ProjectMaterialsTitle: string;
  ProjectMaterialsQty: number;
  ProjectMaterialsPrice: string;
  ProjectMaterialsTotal: string;
}>> {
  try {
    const { data: materialData, error } = await supabase
      .from('version_materials')
      .select('*, material_options:material_id (*)')
      .eq('version_id', versionId);

    if (error || !materialData) return [];

    return materialData
      .filter((item) => item.material_options != null)
      .map((item) => {
        const qty = Number(item.quantity) || 0;
        const unitPrice = Number(item.price) || 0;
        const total = qty * unitPrice;
        
        // Use item_name if available, otherwise fall back to material_options.name
        const name = (item as any).item_name || item.material_options?.name || 'Unknown Material';

        return {
          ProjectMaterialsTitle: name,
          ProjectMaterialsQty: qty,
          ProjectMaterialsPrice: unitPrice.toFixed(2),
          ProjectMaterialsTotal: total.toFixed(2),
        };
      });
  } catch (error) {
    console.error('Error fetching project materials:', error);
    return [];
  }
}

/** Format a number as a signed delta string: "+5", "-3", "0" */
function formatDelta(val: number): string {
  if (val > 0) return `+${val}`;
  if (val < 0) return String(val);
  return '0';
}

/** Format a number as currency string with 2 decimals, with sign for deltas */
function formatDeltaCurrency(val: number): string {
  if (val > 0) return `+${val.toFixed(2)}`;
  if (val < 0) return val.toFixed(2); // already has minus sign
  return '0.00';
}

export interface ChangeOrderProjectMaterialRow {
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
}

export async function fetchChangeOrderProjectMaterialsArray(
  changeOrderVersionId: string
): Promise<ChangeOrderProjectMaterialRow[]> {
  try {
    const deltas = await getChangeOrderDeltaMaterials(changeOrderVersionId);

    return deltas.map((d) => ({
      // Before
      ChangeOrderProjectMaterialsTitleB: d.titleB,
      ChangeOrderProjectMaterialsQtyB: d.qtyB ? String(d.qtyB) : '',
      ChangeOrderProjectMaterialsPriceB: d.priceB ? d.priceB.toFixed(2) : '',
      ChangeOrderProjectMaterialsTotalB: d.totalB ? d.totalB.toFixed(2) : '',
      // After
      ChangeOrderProjectMaterialsTitleA: d.titleA,
      ChangeOrderProjectMaterialsQtyA: String(d.qtyA),
      ChangeOrderProjectMaterialsPriceA: d.priceA.toFixed(2),
      ChangeOrderProjectMaterialsTotalA: d.totalA.toFixed(2),
      // Delta
      ChangeOrderProjectMaterialsQtyD: formatDelta(d.qtyD),
      ChangeOrderProjectMaterialsPriceD: formatDeltaCurrency(d.priceD),
      ChangeOrderProjectMaterialsTotalD: formatDeltaCurrency(d.totalD),
      // Change type
      ChangeOrderProjectMaterialsChange: d.changeType,
    }));
  } catch (error) {
    console.error('Error fetching change order project materials:', error);
    return [];
  }
}

export interface ChangeOrderLaborRow {
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
}

export async function fetchChangeOrderLaborArray(
  changeOrderVersionId: string
): Promise<ChangeOrderLaborRow[]> {
  try {
    const deltas = await getChangeOrderDeltaLabor(changeOrderVersionId);

    return deltas.map((d) => ({
      // Before
      ChangeOrderLaborTitleB: d.titleB,
      ChangeOrderLaborQtyB: d.qtyB ? String(d.qtyB) : '',
      ChangeOrderLaborPriceB: d.priceB ? d.priceB.toFixed(2) : '',
      ChangeOrderLaborTotalB: d.totalB ? d.totalB.toFixed(2) : '',
      // After
      ChangeOrderLaborTitleA: d.titleA,
      ChangeOrderLaborQtyA: String(d.qtyA),
      ChangeOrderLaborPriceA: d.priceA.toFixed(2),
      ChangeOrderLaborTotalA: d.totalA.toFixed(2),
      // Delta
      ChangeOrderLaborQtyD: formatDelta(d.qtyD),
      ChangeOrderLaborPriceD: formatDeltaCurrency(d.priceD),
      ChangeOrderLaborTotalD: formatDeltaCurrency(d.totalD),
      // Change type
      ChangeOrderLaborChange: d.changeType,
    }));
  } catch (error) {
    console.error('Error fetching change order labor:', error);
    return [];
  }
}

export async function fetchPaymentSplits(versionId: string): Promise<number[]> {
  const defaultSplits = [40, 30, 20, 10];

  try {
    const { data: versionData } = await supabase
      .from('project_versions')
      .select('payment_1_percentage, payment_2_percentage, payment_3_percentage, payment_4_percentage')
      .eq('version_id', versionId)
      .single();

    if (!versionData) return defaultSplits;

    return [
      versionData.payment_1_percentage !== null ? Number(versionData.payment_1_percentage) : 40,
      versionData.payment_2_percentage !== null ? Number(versionData.payment_2_percentage) : 30,
      versionData.payment_3_percentage !== null ? Number(versionData.payment_3_percentage) : 20,
      versionData.payment_4_percentage !== null ? Number(versionData.payment_4_percentage) : 10,
    ];
  } catch (error) {
    console.error('Error fetching payment splits:', error);
    return defaultSplits;
  }
}

export async function calculateChangeOrdersTotal(projectId: string, workspaceId: string): Promise<number> {
  try {
    // Get tax rate for the workspace
    const taxRate = await getMaterialsTaxRate(workspaceId);
    
    const { data: activeChangeOrders, error } = await supabase
      .from('project_versions')
      .select('version_id, multiplier')
      .eq('project_id', projectId)
      .eq('status', 'Change Order')
      .eq('is_active', true);

    if (error || !activeChangeOrders) return 0;

    let total = 0;
    for (const changeOrder of activeChangeOrders) {
      const { data: coLaborData } = await supabase
        .from('version_labor')
        .select('*, labor_options:labor_id (*)')
        .eq('version_id', changeOrder.version_id);

      const { data: coMaterialData } = await supabase
        .from('version_materials')
        .select('*, material_options:material_id (*)')
        .eq('version_id', changeOrder.version_id);

      const coItems: LineItem[] = [];
      if (coLaborData) {
        (coLaborData as any[]).forEach((item: any) => {
          if (item.labor_options) {
            coItems.push({
              id: item.labor_options.id,
              name: item.item_name || item.labor_options.name || 'Unknown Labor',
              qty: Number(item.quantity),
              unitPrice: Number(item.price) || 0,
              kind: 'labor',
            });
          }
        });
      }
      if (coMaterialData) {
        (coMaterialData as any[]).forEach((item: any) => {
          if (item.material_options) {
            coItems.push({
              id: item.material_options.id,
              name: item.item_name || item.material_options.name || 'Unknown Material',
              qty: Number(item.quantity),
              unitPrice: Number(item.price) || 0,
              wastePct: Number(item.waste_pct) || 0,
              kind: 'material',
            });
          }
        });
      }

      const { laborSub, matSub, tax } = computeTotals(coItems, taxRate);
      const sub = laborSub + matSub + tax;
      const grand = sub * (Number(changeOrder.multiplier) || 1);
      total += grand;
    }

    return total;
  } catch (error) {
    console.error('Error calculating change orders total:', error);
    return 0;
  }
}

/**
 * Calculate the total for a single selected change order by fetching its items from the DB.
 * Returns a formatted currency string.
 */
async function calculateSelectedChangeOrderTotal(
  changeOrderVersionId: string,
  workspaceId: string
): Promise<string> {
  try {
    const taxRate = await getMaterialsTaxRate(workspaceId);

    const { data: versionData } = await supabase
      .from('project_versions')
      .select('multiplier')
      .eq('version_id', changeOrderVersionId)
      .single();

    const multiplier = versionData ? Number(versionData.multiplier) || 1 : 1;

    const { data: coLaborData } = await supabase
      .from('version_labor')
      .select('*, labor_options:labor_id (*)')
      .eq('version_id', changeOrderVersionId);

    const { data: coMaterialData } = await supabase
      .from('version_materials')
      .select('*, material_options:material_id (*)')
      .eq('version_id', changeOrderVersionId);

    const coItems: LineItem[] = [];

    if (coLaborData) {
      (coLaborData as any[]).forEach((item: any) => {
        if (item.labor_options) {
          coItems.push({
            id: item.labor_options.id,
            name: item.item_name || item.labor_options.name || 'Unknown Labor',
            qty: Number(item.quantity),
            unitPrice: Number(item.price) || 0,
            kind: 'labor',
          });
        }
      });
    }

    if (coMaterialData) {
      (coMaterialData as any[]).forEach((item: any) => {
        if (item.material_options) {
          coItems.push({
            id: item.material_options.id,
            name: item.item_name || item.material_options.name || 'Unknown Material',
            qty: Number(item.quantity),
            unitPrice: Number(item.price) || 0,
            wastePct: Number(item.waste_pct) || 0,
            kind: 'material',
          });
        }
      });
    }

    const { laborSub, matSub, tax } = computeTotals(coItems, taxRate);
    const sub = laborSub + matSub + tax;
    const grand = sub * multiplier;

    return formatCurrency(grand);
  } catch (error) {
    console.error('Error calculating selected change order total:', error);
    return '$0.00';
  }
}

export async function prepareTemplateData(
  projectId: string,
  project: Project,
  clientData: any,
  activeDraftItems: LineItem[],
  activeDraftMultiplier: number,
  activeVersionId: string | null,
  itemsToUse: LineItem[],
  multiplierToUse: number,
  requiresChangeOrder: boolean,
  projectType: string,
  workspaceId: string,
  selectedChangeOrderId?: string | null
): Promise<TemplateData> {
  // Get tax rate for the workspace
  const taxRate = await getMaterialsTaxRate(workspaceId);
  
  // Calculate totals
  const contractTotal = calculateContractTotal(activeDraftItems, activeDraftMultiplier, taxRate);
  const changeOrdersTotal = await calculateChangeOrdersTotal(projectId, workspaceId);
  const projectTotal = contractTotal + changeOrdersTotal;
  const pt10 = projectTotal * 1.1;
  
  // Calculate balance (totalPaid from project.paid)
  const totalPaid = typeof project.paid === 'number' ? project.paid : 0;
  const balance = projectTotal - totalPaid;

  // Format items
  const materialString = formatMaterialItems(itemsToUse);

  // Change order specific
  let changeOrderString = '';
  let changeOrderTotal = '$0.00';
  if (requiresChangeOrder && itemsToUse.length > 0) {
    changeOrderString = formatChangeOrderItems(itemsToUse);
  }
  // Always compute ChangeOrderTotal from the selected CO directly (fetches from DB)
  if (selectedChangeOrderId) {
    changeOrderTotal = await calculateSelectedChangeOrderTotal(selectedChangeOrderId, workspaceId);
  }

  // Fetch labor, material revisions, and project materials
  const laborArray = activeVersionId ? await fetchLaborArray(activeVersionId) : [];
  const materialsArray = activeVersionId ? await fetchMaterialRevisions(activeVersionId) : [];
  const projectMaterialsArray = activeVersionId ? await fetchProjectMaterialsArray(activeVersionId) : [];
  
  // Fetch change order data if a change order is selected
  let changeOrderProjectMaterialsArray: ChangeOrderProjectMaterialRow[] = [];
  let changeOrderLaborArray: ChangeOrderLaborRow[] = [];
  let changeOrderMaterialRevisionsArray: Array<{
    ChangeOrderMaterialsLinkedTo: string;
    ChangeOrderMaterialsTitle: string;
    ChangeOrderMaterialsLink: string;
    ChangeOrderMaterialsQuantity: number;
    ChangeOrderMaterialsNotes: string;
    ChangeOrderMaterialsPrice: string;
    ChangeOrderMaterialsTotal: string;
  }> = [];

  if (selectedChangeOrderId) {
    try {
      changeOrderProjectMaterialsArray = await fetchChangeOrderProjectMaterialsArray(selectedChangeOrderId);
    } catch (error) {
      console.error('Error fetching change order project materials:', error);
    }
    try {
      changeOrderLaborArray = await fetchChangeOrderLaborArray(selectedChangeOrderId);
    } catch (error) {
      console.error('Error fetching change order labor:', error);
    }
    try {
      changeOrderMaterialRevisionsArray = await fetchChangeOrderMaterialRevisions(selectedChangeOrderId);
    } catch (error) {
      console.error('Error fetching change order material revisions:', error);
    }
  }
  
  // Fetch incoming and outgoing payments for this project
  const incomingPaymentsArray = await fetchIncomingPaymentsArray(projectId, workspaceId);
  const outgoingPaymentsArray = await fetchOutgoingPaymentsArray(projectId, workspaceId);

  // Fetch payment splits
  const paymentSplits = activeVersionId ? await fetchPaymentSplits(activeVersionId) : [40, 30, 20, 10];
  const payments = calculatePaymentAmounts(projectTotal, paymentSplits);

  // Fetch estimated start date and construction time from active version
  let startDate = format(new Date(), 'MM/dd/yyyy');
  let weeks = '';
  
  if (activeVersionId) {
    try {
      const { data: versionData } = await supabase
        .from('project_versions')
        .select('estimated_start_date, estimated_construction_time')
        .eq('version_id', activeVersionId)
        .single();

      if (versionData) {
        // Format estimated start date
        if (versionData.estimated_start_date) {
          // Parse date string in local timezone to avoid timezone conversion issues
          const [year, month, day] = versionData.estimated_start_date.split('-').map(Number);
          const date = new Date(year, month - 1, day);
          startDate = format(date, 'MM/dd/yyyy');
        }
        
        // Format estimated construction time (weeks)
        if (versionData.estimated_construction_time !== null && versionData.estimated_construction_time !== undefined) {
          weeks = String(versionData.estimated_construction_time);
        }
      }
    } catch (error) {
      console.error('Error fetching estimated start date and construction time:', error);
      // Use defaults if fetch fails
    }
  }

  // Fetch assigned staff from client assignments
  let assignedStaffName = 'No staff assigned';
  let assignedStaffEmail = '';
  
  if (project.clientId && workspaceId) {
    try {
      const assignments = await fetchClientAssignments(project.clientId, workspaceId);
      if (assignments && assignments.length > 0) {
        const firstAssignment = assignments[0];
        if (firstAssignment.user) {
          assignedStaffName = firstAssignment.user.name || firstAssignment.user.email || 'No staff assigned';
          assignedStaffEmail = firstAssignment.user.email || '';
        }
      }
    } catch (error) {
      console.error('Error fetching assigned staff:', error);
      // Use defaults if fetch fails
    }
  }

  // Fetch assigned crew from project crew assignments
  let assignedCrewArray: Array<{ AssignedCrewName: string; AssignedCrewEmail: string }> = [];
  
  if (projectId && workspaceId) {
    try {
      const crewAssignments = await fetchProjectCrewAssignments(projectId, workspaceId);
      if (crewAssignments && crewAssignments.length > 0) {
        assignedCrewArray = crewAssignments
          .filter((assignment: any) => assignment.user)
          .map((assignment: any) => ({
            AssignedCrewName: assignment.user.name || assignment.user.email || 'Unknown',
            AssignedCrewEmail: assignment.user.email || '',
          }));
      }
    } catch (error) {
      console.error('Error fetching assigned crew:', error);
      // Use empty array if fetch fails
    }
  }

  // Fetch lookbook questions and answers for this project
  let lookbookQuestionsArray: Array<{ LookbookQQuestions: string; LookbookQAnswers: string }> = [];
  
  if (projectId && workspaceId) {
    try {
      lookbookQuestionsArray = await fetchLookbookQuestionsAndAnswers(projectId, workspaceId);
    } catch (error) {
      console.error('Error fetching lookbook questions and answers:', error);
      // Use empty array if fetch fails
    }
  }

  // Fetch lookbook liked/selected items for this project
  let lookbookSelectionsArray: Array<{
    LookbookSCategory: string;
    LookbookSTitle: string;
    LookbookSBrand: string;
    LookbookSStyle: string;
    LookbookSFinish: string;
    LookbookSLink: string;
    LookbookSPrice: string;
    LookbookSModel: string;
    LookbookSCollection: string;
  }> = [];

  if (projectId && workspaceId) {
    try {
      lookbookSelectionsArray = await fetchLookbookSelectionsArray(projectId, workspaceId);
    } catch (error) {
      console.error('Error fetching lookbook selections:', error);
    }
  }

  return {
    Date: format(new Date(), 'MM/dd/yyyy'),
    QuoteNo: `Q-${projectId.slice(0, 8)}`,
    StartDate: startDate,
    Weeks: weeks,
    Multiplier: String(activeDraftMultiplier),
    ClientName: clientData.name || '',
    ClientEmail: clientData.email || '',
    ClientPhoneNumber: clientData.phone || '',
    AssignedStaffName: assignedStaffName,
    AssignedStaffEmail: assignedStaffEmail,
    ProjectTitle: project.project || 'Untitled Project',
    ProjectType: projectType || '',
    ProjectAddress: project.residence || 'No address provided',
    ProjectStatus: project.status || 'No Status',
    QuickNotes: project.quickNote || 'No quick notes',
    Notes: project.note || 'No notes',
    Labor: laborArray,
    MaterialsText: materialString || 'No material items',
    Materials: materialsArray,
    AssignedCrew: assignedCrewArray,
    LookbookQ: lookbookQuestionsArray,
    LookbookS: lookbookSelectionsArray,
    ProjectMaterials: projectMaterialsArray,
    ChangeOrderProjectMaterials: changeOrderProjectMaterialsArray,
    ChangeOrderLabor: changeOrderLaborArray,
    ChangeOrderMaterials: changeOrderMaterialRevisionsArray,
    IncomingPayments: incomingPaymentsArray,
    OutgoingPayments: outgoingPaymentsArray,
    ChangeOrder: changeOrderString,
    ContractTotal: formatCurrency(contractTotal),
    ChangeOrderTotal: changeOrderTotal || '$0.00',
    AllChangeOrderTotal: formatCurrency(changeOrdersTotal),
    ProjectTotal: formatCurrency(projectTotal),
    TotalPaid: formatCurrency(totalPaid),
    Balance: formatCurrency(balance),
    PTTen: formatCurrency(pt10),
    hasFirstPayment: paymentSplits[0] > 0,
    hasSecondPayment: paymentSplits[1] > 0,
    hasThirdPayment: paymentSplits[2] > 0,
    hasLastPayment: paymentSplits[3] > 0,
    Payment1: formatCurrency(payments.p1),
    Payment2: formatCurrency(payments.p2),
    Payment3: formatCurrency(payments.p3),
    Payment4: formatCurrency(payments.p4),
  };
}

