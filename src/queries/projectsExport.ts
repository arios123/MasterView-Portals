import { supabase } from '@/integrations/supabase/client';
import { getMaterialsTaxRate } from './workspaces';

export type ProjectExportRow = {
  project_name: string;
  project_type: string;
  address: string;
  client_name: string;
  client_phone: string;
  client_email: string;
  notes: string;
  quick_notes: string;
  status: string;
  project_total: string;
  contract_total: string;
  change_orders: string;
  total_paid: string;
  balance: string;
};

async function calculateProjectTotalsBreakdown(
  projectId: string,
  workspaceId: string
): Promise<{ contractTotal: number; changeOrdersTotal: number; totalCost: number; totalPaid: number }> {
  let contractTotal = 0;
  let changeOrdersTotal = 0;
  let totalPaid = 0;

  const taxRate = await getMaterialsTaxRate(workspaceId);

  const { data: projectData, error: projectError } = await (supabase as any)
    .from('projects')
    .select('active_version')
    .eq('project_id', projectId)
    .eq('workspace_id', workspaceId)
    .maybeSingle();

  if (projectError || !projectData?.active_version) {
    return { contractTotal: 0, changeOrdersTotal: 0, totalCost: 0, totalPaid: 0 };
  }

  const { data: activeVersion } = await (supabase as any)
    .from('project_versions')
    .select('version_id, multiplier')
    .eq('version_id', projectData.active_version)
    .maybeSingle();

  if (activeVersion) {
    const { data: laborItems } = await (supabase as any)
      .from('version_labor')
      .select('quantity, price')
      .eq('version_id', activeVersion.version_id);

    const { data: materialItems } = await (supabase as any)
      .from('version_materials')
      .select('quantity, price, waste_pct')
      .eq('version_id', activeVersion.version_id);

    const laborCost = (laborItems || []).reduce((sum: number, item: any) => sum + item.quantity * item.price, 0);
    const materialCost = (materialItems || []).reduce((sum: number, item: any) => {
      const qtyWithWaste = item.quantity * (1 + (item.waste_pct || 0) / 100);
      return sum + qtyWithWaste * item.price;
    }, 0);
    const tax = materialCost * taxRate;
    const multiplier = Number(activeVersion.multiplier) || 1;
    contractTotal = (laborCost + materialCost + tax) * multiplier;
  }

  const { data: changeOrders } = await (supabase as any)
    .from('project_versions')
    .select('version_id, multiplier')
    .eq('project_id', projectId)
    .eq('is_active', true)
    .ilike('status', '%change order%');

  if (changeOrders && changeOrders.length > 0) {
    for (const co of changeOrders) {
      const { data: coLabor } = await (supabase as any)
        .from('version_labor')
        .select('quantity, price')
        .eq('version_id', co.version_id);

      const { data: coMaterials } = await (supabase as any)
        .from('version_materials')
        .select('quantity, price, waste_pct')
        .eq('version_id', co.version_id);

      const coLaborCost = (coLabor || []).reduce((sum: number, item: any) => sum + item.quantity * item.price, 0);
      const coMaterialCost = (coMaterials || []).reduce((sum: number, item: any) => {
        const qtyWithWaste = item.quantity * (1 + (item.waste_pct || 0) / 100);
        return sum + qtyWithWaste * item.price;
      }, 0);
      const coTax = coMaterialCost * taxRate;
      const coMultiplier = Number(co.multiplier) || 1;
      changeOrdersTotal += (coLaborCost + coMaterialCost + coTax) * coMultiplier;
    }
  }

  const totalCost = contractTotal + changeOrdersTotal;

  const { data: payments } = await (supabase as any)
    .from('payments')
    .select('amount')
    .eq('project_id', projectId)
    .eq('workspace_id', workspaceId);

  totalPaid = (payments || []).reduce((sum: number, payment: any) => sum + (Number(payment.amount) || 0), 0);

  return { contractTotal, changeOrdersTotal, totalCost, totalPaid };
}

/**
 * Fetch all projects for a workspace for CSV export.
 */
export const fetchAllProjectsForExport = async (workspaceId: string): Promise<ProjectExportRow[]> => {
  const { data: projects, error: projectsError } = await (supabase as any)
    .from('projects')
    .select('project_id, name, project_type, address, notes, quick_note, status, client_id')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false });

  if (projectsError) throw projectsError;
  if (!projects || projects.length === 0) return [];

  const clientIds = [...new Set(projects.map((p: any) => p.client_id).filter(Boolean))];
  let clientsMap = new Map<string, { name: string; phone: string; email: string }>();

  if (clientIds.length > 0) {
    const { data: clients, error: clientsError } = await (supabase as any)
      .from('clients')
      .select('client_id, name, phone, email')
      .in('client_id', clientIds)
      .eq('workspace_id', workspaceId);

    if (!clientsError && clients) {
      clients.forEach((c: any) => {
        clientsMap.set(c.client_id, {
          name: c.name || '',
          phone: c.phone || '',
          email: c.email || '',
        });
      });
    }
  }

  const rows: ProjectExportRow[] = [];

  for (const p of projects) {
    const { contractTotal, changeOrdersTotal, totalCost, totalPaid } = await calculateProjectTotalsBreakdown(
      p.project_id,
      workspaceId
    );

    const client = p.client_id ? clientsMap.get(p.client_id) : null;

    rows.push({
      project_name: p.name || '',
      project_type: p.project_type || '',
      address: p.address || '',
      client_name: client?.name ?? '',
      client_phone: client?.phone ?? '',
      client_email: client?.email ?? '',
      notes: p.notes || '',
      quick_notes: p.quick_note || '',
      status: p.status || '',
      project_total: String(totalCost),
      contract_total: String(contractTotal),
      change_orders: String(changeOrdersTotal),
      total_paid: String(totalPaid),
      balance: String(totalCost - totalPaid),
    });
  }

  return rows;
};
