import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { LineItem, Project } from '@/types';
import { TemplateData } from '@/types/documents';
import { calculateContractTotal, calculatePaymentAmounts, formatCurrency, calculateChangeOrderTotal } from './documentCalculations';
import { computeTotals } from './calculations';

export function formatLaborItems(items: LineItem[]): string {
  const laborItems = items.filter((item) => item.kind === 'labor');
  return laborItems.map((item) => `Qty: ${item.qty}\t${item.name}`).join('\n');
}

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
      .map((rev) => ({
        LinkedTo: String(rev.linked_to_name || '').trim(),
        Title: String(rev.name || '').trim(),
        Link: String(rev.link || '').trim(),
        Quantity: Number(rev.quantity) || 0,
      }))
      .filter((item) => item.Title !== '');
  } catch (error) {
    console.error('Error fetching material revisions:', error);
    return [];
  }
}

export async function fetchProjectMaterials(versionId: string): Promise<string> {
  try {
    const { data: materialData, error } = await supabase
      .from('version_materials')
      .select('*, material_options:material_id (*)')
      .eq('version_id', versionId);

    if (error || !materialData) return '';

    const projectMaterials = materialData
      .filter((item) => item.material_options != null)
      .map((item) => {
        const qty = Number(item.quantity) || 0;
        const name = item.material_options?.name || 'Unknown Material';
        return `Qty: ${qty}\t${name}`;
      });

    return projectMaterials.join('\n');
  } catch (error) {
    console.error('Error fetching project materials:', error);
    return '';
  }
}

export async function fetchPaymentSplits(versionId: string): Promise<number[]> {
  const defaultSplits = [40, 30, 20, 10];

  const { isDemoMode } = await import('@/utils/demoMode');
  if (isDemoMode()) {
    // In demo mode, get payment splits from mock versions
    try {
      const { getMockProjectVersions } = await import('@/utils/mockData');
      const mockVersions = getMockProjectVersions();
      const version = mockVersions.find(v => v.version_id === versionId);
      if (version) {
        return [
          version.payment_1_percentage !== null ? Number(version.payment_1_percentage) : 40,
          version.payment_2_percentage !== null ? Number(version.payment_2_percentage) : 30,
          version.payment_3_percentage !== null ? Number(version.payment_3_percentage) : 20,
          version.payment_4_percentage !== null ? Number(version.payment_4_percentage) : 10,
        ];
      }
    } catch (error) {
      console.error('Error fetching payment splits:', error);
    }
    return defaultSplits;
  }

  try {
    // COMMENTED OUT IN DEMO MODE - using mock data instead
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

export async function calculateChangeOrdersTotal(projectId: string): Promise<number> {
  try {
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
        coLaborData.forEach((item) => {
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
        coMaterialData.forEach((item) => {
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

      const { laborSub, matSub, tax } = computeTotals(coItems);
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
  projectType: string
): Promise<TemplateData> {
  // Calculate totals
  const contractTotal = calculateContractTotal(activeDraftItems, activeDraftMultiplier);
  const changeOrdersTotal = await calculateChangeOrdersTotal(projectId);
  const projectTotal = contractTotal + changeOrdersTotal;
  const pt10 = projectTotal * 1.1;

  // Format items
  const laborString = formatLaborItems(itemsToUse);
  const materialString = formatMaterialItems(itemsToUse);

  // Change order specific
  let changeOrderString = '';
  let changeOrderTotal = '';
  if (requiresChangeOrder && itemsToUse.length > 0) {
    changeOrderString = formatChangeOrderItems(itemsToUse);
    changeOrderTotal = calculateChangeOrderTotal(itemsToUse, multiplierToUse);
  }

  // Fetch material revisions and project materials
  const materialsArray = activeVersionId ? await fetchMaterialRevisions(activeVersionId) : [];
  const projectMaterialsString = activeVersionId ? await fetchProjectMaterials(activeVersionId) : '';

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

  return {
    Date: format(new Date(), 'MM/dd/yyyy'),
    QuoteNo: `Q-${projectId.slice(0, 8)}`,
    StartDate: startDate,
    Weeks: weeks,
    CustomerName: clientData.name || '',
    CustomerAddress: project.residence || '',
    CustomerEmail: clientData.email || '',
    CustomerPhoneNumber: clientData.phone || '',
    Labor: laborString || 'No labor items',
    MaterialsText: materialString || 'No material items',
    Materials: materialsArray,
    ProjectMaterials: projectMaterialsString || 'No materials',
    ChangeOrder: changeOrderString,
    ChangeOrderTotal: changeOrderTotal,
    ProjectType: projectType,
    ProjectTotal: formatCurrency(projectTotal),
    PTTen: formatCurrency(pt10),
    hasFirstPayment: paymentSplits[0] > 0,
    hasSecondPayment: paymentSplits[1] > 0,
    hasThirdPayment: paymentSplits[2] > 0,
    hasLastPayment: paymentSplits[3] > 0,
    p1: formatCurrency(payments.p1),
    p2: formatCurrency(payments.p2),
    p3: formatCurrency(payments.p3),
    p4: formatCurrency(payments.p4),
  };
}

