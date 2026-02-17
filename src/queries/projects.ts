import { supabase } from '@/integrations/supabase/client';
import { Project } from '@/types';
import { isDemoMode } from '@/utils/demoMode';
import { getMockDbProjects, getMockClients } from '@/utils/mockData';

/**
 * Fetch projects created by a specific user
 */
export const fetchUserProjects = async (userId: string, workspaceId: string, limit = 50, offset = 0) => {
  if (isDemoMode()) {
    // Return mock projects with client names attached
    const mockProjects = getMockDbProjects();
    const mockClients = getMockClients();
    return mockProjects.map(project => ({
      ...project,
      clients: { name: mockClients.find(c => c.client_id === project.client_id)?.name || 'Unknown Client' }
    }));
  }

  // COMMENTED OUT IN DEMO MODE - using mock data instead
  const { data, error } = await (supabase as any)
    .from("projects")
    .select("*, clients(name)")
    .eq("created_by", userId)
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return data || [];
};

/**
 * Calculate project totals from active version and change orders
 */
export const calculateProjectTotals = async (projectId: string, workspaceId: string) => {
  if (isDemoMode()) {
    // In demo mode, return mock totals
    return { totalCost: 0, totalPaid: 0 };
  }

  let totalCost = 0;
  let totalPaid = 0;

  // Get project with active version
  // COMMENTED OUT IN DEMO MODE - using mock data instead
  const { data: projectData, error: projectError } = await (supabase as any)
    .from("projects")
    .select("active_version")
    .eq("project_id", projectId)
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  if (projectError || !projectData?.active_version) {
    return { totalCost: 0, totalPaid: 0 };
  }

  // Calculate from active version
  // COMMENTED OUT IN DEMO MODE - using mock data instead
  const { data: activeVersion } = await (supabase as any)
    .from("project_versions")
    .select("version_id, multiplier")
    .eq("version_id", projectData.active_version)
    .maybeSingle();

  if (activeVersion) {
    // COMMENTED OUT IN DEMO MODE - using mock data instead
    const { data: laborItems } = await (supabase as any)
      .from("version_labor")
      .select("quantity, price")
      .eq("version_id", activeVersion.version_id);

    // COMMENTED OUT IN DEMO MODE - using mock data instead
    const { data: materialItems } = await (supabase as any)
      .from("version_materials")
      .select("quantity, price, waste_pct")
      .eq("version_id", activeVersion.version_id);

    const laborCost = (laborItems || []).reduce((sum, item) => sum + item.quantity * item.price, 0);
    const materialCost = (materialItems || []).reduce((sum, item) => {
      const qtyWithWaste = item.quantity * (1 + (item.waste_pct || 0) / 100);
      return sum + qtyWithWaste * item.price;
    }, 0);
    const tax = materialCost * 0.06;
    const multiplier = Number(activeVersion.multiplier) || 1;
    totalCost = (laborCost + materialCost + tax) * multiplier;
  }

  // Add active change orders
  // COMMENTED OUT IN DEMO MODE - using mock data instead
  const { data: changeOrders } = await (supabase as any)
    .from("project_versions")
    .select("version_id, multiplier")
    .eq("project_id", projectId)
    .eq("is_active", true)
    .ilike("status", "%change order%");

  if (changeOrders && changeOrders.length > 0) {
    for (const co of changeOrders) {
      // COMMENTED OUT IN DEMO MODE - using mock data instead
      const { data: coLabor } = await (supabase as any)
        .from("version_labor")
        .select("quantity, price")
        .eq("version_id", co.version_id);

      // COMMENTED OUT IN DEMO MODE - using mock data instead
      const { data: coMaterials } = await (supabase as any)
        .from("version_materials")
        .select("quantity, price, waste_pct")
        .eq("version_id", co.version_id);

      const coLaborCost = (coLabor || []).reduce((sum, item) => sum + item.quantity * item.price, 0);
      const coMaterialCost = (coMaterials || []).reduce((sum, item) => {
        const qtyWithWaste = item.quantity * (1 + (item.waste_pct || 0) / 100);
        return sum + qtyWithWaste * item.price;
      }, 0);
      const coTax = coMaterialCost * 0.06;
      const coMultiplier = Number(co.multiplier) || 1;
      totalCost += (coLaborCost + coMaterialCost + coTax) * coMultiplier;
    }
  }

  // Get total paid (incoming payments)
  // COMMENTED OUT IN DEMO MODE - using mock data instead
  const { data: payments } = await (supabase as any)
    .from("payments")
    .select("amount")
    .eq("project_id", projectId)
    .eq("type", "I")
    .eq("workspace_id", workspaceId);

  totalPaid = (payments || []).reduce((sum, payment) => sum + payment.amount, 0);

  return { totalCost, totalPaid };
};

/**
 * Map database project to Project type with calculated totals
 */
export const mapProjectWithTotals = async (dbProject: any, workspaceId: string): Promise<Project> => {
  const { totalCost, totalPaid } = await calculateProjectTotals(dbProject.project_id, workspaceId);

  // Handle client name - check multiple possible structures
  let clientName = "Unknown Client";
  if (dbProject.clients) {
    if (typeof dbProject.clients === 'object' && !Array.isArray(dbProject.clients)) {
      clientName = dbProject.clients.name || "Unknown Client";
    } else if (Array.isArray(dbProject.clients) && dbProject.clients.length > 0) {
      clientName = dbProject.clients[0].name || "Unknown Client";
    }
  }
  
  // If still unknown and we have client_id, try to fetch it
  // COMMENTED OUT IN DEMO MODE - using mock data instead
  if (clientName === "Unknown Client" && dbProject.client_id && !isDemoMode()) {
    try {
      const { data: clientData } = await (supabase as any)
        .from("clients")
        .select("name")
        .eq("client_id", dbProject.client_id)
        .eq("workspace_id", workspaceId)
        .maybeSingle();
      
      if (clientData?.name) {
        clientName = clientData.name;
      }
    } catch (error) {
      console.error("Error fetching client name:", error);
    }
  }

  return {
    id: dbProject.project_id,
    clientId: dbProject.client_id || "",
    clientName: clientName,
    project: dbProject.name || "Untitled Project",
    residence: dbProject.address || "No address provided",
    crew: "TBD",
    note: dbProject.notes || "No notes",
    phaseIndex: 0,
    paid: totalPaid,
    totalCost: totalCost,
    nextPayment: 0,
    dueStage: "TBD",
    status: dbProject.status || null,
    assignedUserId: dbProject.created_by || undefined,
    quickNote: "",
  };
};

/**
 * Fetch a single project by ID
 */
export const fetchProjectById = async (projectId: string, workspaceId: string) => {
  if (isDemoMode()) {
    const mockProjects = getMockDbProjects();
    const mockClients = getMockClients();
    const project = mockProjects.find(p => p.project_id === projectId);
    if (!project) return null;
    return {
      ...project,
      clients: { name: mockClients.find(c => c.client_id === project.client_id)?.name || 'Unknown Client' }
    };
  }

  // COMMENTED OUT IN DEMO MODE - using mock data instead
  const { data, error } = await (supabase as any)
    .from("projects")
    .select("*, clients(name)")
    .eq("project_id", projectId)
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  if (error) throw error;
  return data;
};

/**
 * Fetch all projects for a specific client
 */
export const fetchProjectsByClient = async (clientId: string, workspaceId: string) => {
  if (isDemoMode()) {
    const mockProjects = getMockDbProjects();
    return mockProjects.filter(p => p.client_id === clientId);
  }

  // COMMENTED OUT IN DEMO MODE - using mock data instead
  const { data, error } = await (supabase as any)
    .from("projects")
    .select("*")
    .eq("client_id", clientId)
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
};

/**
 * Fetch projects for a specific client
 */
export const fetchClientProjects = async (clientId: string, workspaceId: string, limit = 50, offset = 0) => {
  if (isDemoMode()) {
    const mockProjects = getMockDbProjects();
    return mockProjects
      .filter(p => p.client_id === clientId)
      .slice(offset, offset + limit);
  }

  // COMMENTED OUT IN DEMO MODE - using mock data instead
  const { data, error } = await (supabase as any)
    .from("projects")
    .select("*")
    .eq("client_id", clientId)
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return data || [];
};

/**
 * Update project status
 * Accepts either status name (string) or status_id (string)
 * If status name is provided, looks up the status_id first
 */
export const updateProjectStatus = async (projectId: string, status: string | null, workspaceId: string) => {
  let statusId: string | null = null;
  
  // If status is provided, look up the status_id
  if (status) {
    const { data: statusData, error: statusError } = await (supabase as any)
      .from("project_statuses")
      .select("id")
      .eq("workspace_id", workspaceId)
      .eq("name", status)
      .maybeSingle();
    
    if (statusError) throw statusError;
    statusId = statusData?.id || null;
  }

  // Update using status_id - trigger will sync the status text field
  const { data, error } = await (supabase as any)
    .from("projects")
    .update({ status_id: statusId } as any)
    .eq("project_id", projectId)
    .eq("workspace_id", workspaceId)
    .select();

  if (error) throw error;
  return data;
};

/**
 * Update project quick note
 */
export const updateProjectQuickNote = async (projectId: string, quickNote: string, workspaceId: string, _userId?: string) => {
  if (isDemoMode()) {
    return; // No-op in demo; UI still updates via local state in Index
  }

  const updateData: any = {
    quick_note: quickNote || null,
  };

  const { data, error } = await (supabase as any)
    .from("projects")
    .update(updateData)
    .eq("project_id", projectId)
    .eq("workspace_id", workspaceId)
    .select();

  if (error) throw error;
  return data;
};

/**
 * Update project notes
 */
export const updateProjectNotes = async (projectId: string, notes: string, workspaceId: string, _userId?: string) => {
  if (isDemoMode()) return;

  const updateData: any = { notes: notes || null };
  const { data, error } = await (supabase as any)
    .from("projects")
    .update(updateData)
    .eq("project_id", projectId)
    .eq("workspace_id", workspaceId)
    .select();
  if (error) throw error;
  return data;
};

/**
 * Delete a project. In demo mode, no-op.
 */
export const deleteProject = async (projectId: string, workspaceId: string, _userId?: string) => {
  if (isDemoMode()) return;
  const { error } = await (supabase as any)
    .from("projects")
    .delete()
    .eq("project_id", projectId)
    .eq("workspace_id", workspaceId);
  if (error) throw error;
};

/**
 * Load a project by ID with all calculated totals
 */
export const loadProjectById = async (projectId: string, workspaceId: string, clientIdFromRoute?: string): Promise<Project | null> => {
  try {
    let clientId = clientIdFromRoute;
    let clientName = "Unknown Client";

    const projectData = await fetchProjectById(projectId, workspaceId);
    if (!projectData) return null;

    if (!clientId) {
      clientId = projectData.client_id;
    }

    if (projectData.clients && typeof projectData.clients === 'object' && !Array.isArray(projectData.clients)) {
      clientName = (projectData.clients as any).name || "Unknown Client";
    } else if (projectData.clients && Array.isArray(projectData.clients) && projectData.clients.length > 0) {
      clientName = projectData.clients[0].name || "Unknown Client";
    } else if (clientId) {
      const { data: clientData } = await (supabase as any)
        .from("clients")
        .select("name")
        .eq("client_id", clientId)
        .maybeSingle();

      if (clientData) {
        clientName = clientData.name || "Unknown Client";
      }
    }

    const { totalCost, totalPaid } = await calculateProjectTotals(projectId, workspaceId);

    return {
      id: projectData.project_id,
      clientId: clientId || "",
      clientName: clientName,
      project: projectData.name || "Untitled Project",
      residence: projectData.address || "No address provided",
      crew: "TBD",
      note: projectData.notes || "",
      phaseIndex: 0,
      paid: totalPaid,
      totalCost: totalCost,
      nextPayment: 0,
      dueStage: "TBD",
      status: projectData.status || null,
      assignedUserId: projectData.created_by || undefined,
      quickNote: "",
    };
  } catch (error) {
    console.error("Error loading project:", error);
    return null;
  }
};

