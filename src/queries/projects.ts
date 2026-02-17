import { supabase } from '@/integrations/supabase/client';
import { Project } from '@/types';
import { fetchClientAssignments } from './clientAssignments';
import { fetchProjectCrewAssignments } from './projectCrewAssignments';
import { logUpdate, logDelete } from '@/lib/auditLog';
import { getMaterialsTaxRate } from './workspaces';

/**
 * Fetch projects created by a specific user
 */
export const fetchUserProjects = async (userId: string, workspaceId: string, limit = 50, offset = 0) => {
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
  let totalCost = 0;
  let totalPaid = 0;

  // Get tax rate for the workspace
  const taxRate = await getMaterialsTaxRate(workspaceId);

  // Get project with active version
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
  const { data: activeVersion } = await (supabase as any)
    .from("project_versions")
    .select("version_id, multiplier")
    .eq("version_id", projectData.active_version)
    .maybeSingle();

  if (activeVersion) {
    const { data: laborItems } = await (supabase as any)
      .from("version_labor")
      .select("quantity, price")
      .eq("version_id", activeVersion.version_id);

    const { data: materialItems } = await (supabase as any)
      .from("version_materials")
      .select("quantity, price, waste_pct")
      .eq("version_id", activeVersion.version_id);

    const laborCost = (laborItems || []).reduce((sum, item) => sum + item.quantity * item.price, 0);
    const materialCost = (materialItems || []).reduce((sum, item) => {
      const qtyWithWaste = item.quantity * (1 + (item.waste_pct || 0) / 100);
      return sum + qtyWithWaste * item.price;
    }, 0);
    const tax = materialCost * taxRate;
    const multiplier = Number(activeVersion.multiplier) || 1;
    totalCost = (laborCost + materialCost + tax) * multiplier;
  }

  // Add active change orders
  const { data: changeOrders } = await (supabase as any)
    .from("project_versions")
    .select("version_id, multiplier")
    .eq("project_id", projectId)
    .eq("is_active", true)
    .ilike("status", "%change order%");

  if (changeOrders && changeOrders.length > 0) {
    for (const co of changeOrders) {
      const { data: coLabor } = await (supabase as any)
        .from("version_labor")
        .select("quantity, price")
        .eq("version_id", co.version_id);

      const { data: coMaterials } = await (supabase as any)
        .from("version_materials")
        .select("quantity, price, waste_pct")
        .eq("version_id", co.version_id);

      const coLaborCost = (coLabor || []).reduce((sum, item) => sum + item.quantity * item.price, 0);
      const coMaterialCost = (coMaterials || []).reduce((sum, item) => {
        const qtyWithWaste = item.quantity * (1 + (item.waste_pct || 0) / 100);
        return sum + qtyWithWaste * item.price;
      }, 0);
      const coTax = coMaterialCost * taxRate;
      const coMultiplier = Number(co.multiplier) || 1;
      totalCost += (coLaborCost + coMaterialCost + coTax) * coMultiplier;
    }
  }

  // Get total paid (incoming payments) — payments table holds incoming only; type is payment method (Check, Cash, etc.)
  const { data: payments } = await (supabase as any)
    .from("payments")
    .select("amount")
    .eq("project_id", projectId)
    .eq("workspace_id", workspaceId);

  totalPaid = (payments || []).reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0);

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
  if (clientName === "Unknown Client" && dbProject.client_id) {
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

  // Fetch crew for this project (project-level crew assignments)
  let crew = "No crew assigned";
  if (dbProject.project_id) {
    try {
      const crewAssignments = await fetchProjectCrewAssignments(dbProject.project_id, workspaceId);
      const crewMembers = crewAssignments
        .map((a: any) => a.user)
        .filter(Boolean)
        .map((user: any) => user.name || user.email || "Unknown")
        .filter(Boolean);
      
      if (crewMembers.length > 0) {
        crew = crewMembers.join(", ");
      }
    } catch (error) {
      console.error("Error fetching crew for project:", error);
    }
  }

  return {
    id: dbProject.project_id,
    clientId: dbProject.client_id || "",
    clientName: clientName,
    project: dbProject.name || "Untitled Project",
    residence: dbProject.address || "No address provided",
    crew: crew,
    note: dbProject.notes || "No notes",
    phaseIndex: 0,
    paid: totalPaid,
    totalCost: totalCost,
    nextPayment: 0,
    dueStage: "TBD",
    status: dbProject.status || null,
    assignedUserId: dbProject.created_by || undefined,
    quickNote: dbProject.quick_note || "",
  };
};

/**
 * Fetch a single project by ID
 */
export const fetchProjectById = async (projectId: string, workspaceId: string) => {
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
 * Fetch projects for a specific client
 */
export const fetchClientProjects = async (clientId: string, workspaceId: string, limit = 50, offset = 0) => {
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
export const updateProjectStatus = async (projectId: string, status: string | null, workspaceId: string, userId?: string) => {
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

  // Fetch before data for audit log
  const { data: beforeData } = await (supabase as any)
    .from("projects")
    .select("*")
    .eq("project_id", projectId)
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  // Update using status_id - trigger will sync the status text field
  const { data, error } = await (supabase as any)
    .from("projects")
    .update({ status_id: statusId } as any)
    .eq("project_id", projectId)
    .eq("workspace_id", workspaceId)
    .select();

  if (error) throw error;

  // Log audit event for project status change
  if (userId && workspaceId && beforeData && data && data.length > 0) {
    await logUpdate(workspaceId, userId, 'projects', projectId, beforeData, data[0], 'Projects');
  }

  return data;
};

/**
 * Update project quick_note
 */
export const updateProjectQuickNote = async (projectId: string, quickNote: string, workspaceId: string, userId?: string) => {
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
export const updateProjectNotes = async (projectId: string, notes: string, workspaceId: string, userId?: string) => {
  const updateData: any = {
    notes: notes || null,
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

    // Fetch crew for this project (project-level crew assignments)
    let crew = "No crew assigned";
    if (projectData.project_id) {
      try {
        const crewAssignments = await fetchProjectCrewAssignments(projectData.project_id, workspaceId);
        const crewMembers = crewAssignments
          .map((a: any) => a.user)
          .filter(Boolean)
          .map((user: any) => user.name || user.email || "Unknown")
          .filter(Boolean);
        
        if (crewMembers.length > 0) {
          crew = crewMembers.join(", ");
        }
      } catch (error) {
        console.error("Error fetching crew for project:", error);
      }
    }

    return {
      id: projectData.project_id,
      clientId: clientId || "",
      clientName: clientName,
      project: projectData.name || "Untitled Project",
      residence: projectData.address || "No address provided",
      crew: crew,
      note: projectData.notes || "",
      phaseIndex: 0,
      paid: totalPaid,
      totalCost: totalCost,
      nextPayment: 0,
      dueStage: "TBD",
      status: projectData.status || null,
      assignedUserId: projectData.created_by || undefined,
      quickNote: projectData.quick_note || "",
    };
  } catch (error) {
    console.error("Error loading project:", error);
    return null;
  }
};

/**
 * Record that the current user just opened this project (for "last used" sorting in Projects tab).
 * Upserts into project_last_used so the project appears at the top of the list for this user.
 */
export const touchProjectLastUsed = async (
  userId: string,
  projectId: string,
  workspaceId: string
): Promise<void> => {
  const { error } = await (supabase as any)
    .from("project_last_used")
    .upsert(
      {
        user_id: userId,
        project_id: projectId,
        workspace_id: workspaceId,
        last_used_at: new Date().toISOString(),
      },
      { onConflict: "user_id,project_id" }
    );

  if (error) {
    console.error("Error touching project last used:", error);
  }
};

/**
 * Delete a project. This is irreversible - the project and all associated data
 * (versions, payments, crew assignments, etc.) will be permanently deleted.
 */
export const deleteProject = async (
  projectId: string,
  workspaceId: string,
  userId?: string
) => {
  const { data: beforeData, error: fetchError } = await (supabase as any)
    .from("projects")
    .select("*")
    .eq("project_id", projectId)
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  if (fetchError) throw fetchError;
  if (!beforeData) throw new Error('Project not found');

  const { error } = await (supabase as any)
    .from("projects")
    .delete()
    .eq("project_id", projectId)
    .eq("workspace_id", workspaceId);

  if (error) throw error;

  if (userId && beforeData) {
    await logDelete(workspaceId, userId, 'projects', projectId, beforeData, 'Projects');
  }

  return { success: true };
};

