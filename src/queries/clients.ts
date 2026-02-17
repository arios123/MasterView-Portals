import { supabase } from '@/integrations/supabase/client';
import { Project } from '@/types';
import { calculateProjectTotals, mapProjectWithTotals } from './projects';
import { getWorkspaceMemberId } from './clientAssignments';
import { logInsert, logUpdate, logDelete } from '@/lib/auditLog';

/**
 * Fetch clients assigned to a specific user (via workspace_member_id)
 */
export const fetchClientsAssignedToUser = async (workspaceMemberId: string, workspaceId: string, limit = 50, offset = 0) => {
  const { data: assignments, error: assignmentsError } = await (supabase as any)
    .from("client_assignments")
    .select("client_id")
    .eq("workspace_member_id", workspaceMemberId)
    .eq("workspace_id", workspaceId);

  if (assignmentsError) throw assignmentsError;
  
  if (!assignments || assignments.length === 0) return [];

  const clientIds = assignments.map((a: any) => a.client_id);

  const { data, error } = await (supabase as any)
    .from("clients")
    .select("*")
    .in("client_id", clientIds)
    .eq("workspace_id", workspaceId)
    .order("name")
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return data || [];
};

/**
 * Fetch clients not assigned to a specific user (via user_id)
 * Note: This accepts user_id and looks up workspace_member_id internally
 * DEPRECATED: Use fetchClientsAssignedToUserOrCrew instead
 */
export const fetchClientsNotAssignedToUser = async (userId: string, workspaceId: string, limit = 50, offset = 0) => {
  // Get workspace_member_id from user_id
  const workspaceMemberId = await getWorkspaceMemberId(userId, workspaceId);
  if (!workspaceMemberId) {
    // If user is not a member, return all clients in the workspace
    const { data, error } = await (supabase as any)
      .from("clients")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("name")
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data || [];
  }

  // Get all client IDs that ARE assigned to this user
  const { data: assignments, error: assignmentsError } = await (supabase as any)
    .from("client_assignments")
    .select("client_id")
    .eq("workspace_member_id", workspaceMemberId)
    .eq("workspace_id", workspaceId);

  if (assignmentsError) throw assignmentsError;
  
  const assignedClientIds = (assignments || []).map((a: any) => a.client_id);

  // Fetch all clients in the workspace
  const { data: allClients, error } = await (supabase as any)
    .from("clients")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("name")
    .range(offset, offset + limit - 1);

  if (error) throw error;

  // Filter out clients that are assigned to this user
  if (assignedClientIds.length > 0) {
    return (allClients || []).filter((client: any) => !assignedClientIds.includes(client.client_id));
  }

  return allClients || [];
};

/**
 * Fetch clients where user is assigned staff OR projects where user is crew
 * Returns unique clients (deduplicated if user is both assigned staff and crew on a project)
 */
export const fetchClientsAssignedToUserOrCrew = async (userId: string, workspaceId: string, limit = 50, offset = 0) => {
  // Get workspace_member_id from user_id
  const workspaceMemberId = await getWorkspaceMemberId(userId, workspaceId);
  if (!workspaceMemberId) {
    // If user is not a member, return empty array
    return [];
  }

  const clientIds = new Set<string>();

  // 1. Get clients where user is assigned staff
  const { data: clientAssignments, error: clientAssignmentsError } = await (supabase as any)
    .from("client_assignments")
    .select("client_id")
    .eq("workspace_member_id", workspaceMemberId)
    .eq("workspace_id", workspaceId);

  if (clientAssignmentsError) throw clientAssignmentsError;
  
  if (clientAssignments) {
    clientAssignments.forEach((a: any) => clientIds.add(a.client_id));
  }

  // 2. Get projects where user is crew, then get their client_ids
  const { data: crewAssignments, error: crewAssignmentsError } = await (supabase as any)
    .from("project_crew_assignments")
    .select("project_id, projects(client_id)")
    .eq("workspace_member_id", workspaceMemberId)
    .eq("workspace_id", workspaceId);

  if (crewAssignmentsError) throw crewAssignmentsError;
  
  if (crewAssignments) {
    crewAssignments.forEach((a: any) => {
      if (a.projects && a.projects.client_id) {
        clientIds.add(a.projects.client_id);
      }
    });
  }

  if (clientIds.size === 0) {
    return [];
  }

  // Fetch all unique clients
  const { data: clients, error } = await (supabase as any)
    .from("clients")
    .select("*")
    .in("client_id", Array.from(clientIds))
    .eq("workspace_id", workspaceId)
    .order("name")
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return clients || [];
};

/**
 * Fetch clients with their active projects
 * Note: This now accepts user_id and looks up workspace_member_id internally
 */
export const fetchClientsWithActiveProjects = async (
  userId: string,
  workspaceId: string,
  limit = 50,
  offset = 0
): Promise<Array<{
  clientId: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  activeProject: Project | null;
}>> => {
  // Get workspace_member_id from user_id
  const workspaceMemberId = await getWorkspaceMemberId(userId, workspaceId);
  if (!workspaceMemberId) {
    return []; // User is not a member of this workspace
  }

  const clientsData = await fetchClientsAssignedToUser(workspaceMemberId, workspaceId, limit, offset);

  const clientsWithProjectsData = await Promise.all(
    clientsData.map(async (client) => {
      let activeProject: Project | null = null;

      if (client.active_project) {
        const { data: projectData, error: projectError } = await (supabase as any)
          .from("projects")
          .select("*, clients(name)")
          .eq("project_id", client.active_project)
          .eq("workspace_id", workspaceId)
          .maybeSingle();

        if (projectData && !projectError) {
          activeProject = await mapProjectWithTotals(projectData, workspaceId);
          // Ensure client name is set correctly (use client.name as fallback if relation didn't work)
          if (activeProject && (!activeProject.clientName || activeProject.clientName === "Unknown Client")) {
            activeProject.clientName = client.name;
          }
        }
      }

      return {
        clientId: client.client_id,
        clientName: client.name,
        clientEmail: client.email,
        clientPhone: client.phone,
        activeProject,
      };
    })
  );

  // Fetch per-user last_used_at for these projects so we can sort by "last used"
  const projectIds = clientsWithProjectsData
    .map((c) => c.activeProject?.id)
    .filter((id): id is string => !!id);
  let lastUsedMap: Record<string, string> = {};
  if (projectIds.length > 0) {
    const { data: lastUsedRows } = await (supabase as any)
      .from("project_last_used")
      .select("project_id, last_used_at")
      .eq("user_id", userId)
      .in("project_id", projectIds);
    if (lastUsedRows?.length) {
      lastUsedRows.forEach((row: { project_id: string; last_used_at: string }) => {
        lastUsedMap[row.project_id] = row.last_used_at;
      });
    }
  }

  // Sort by last used (most recent first), then by client name. Clients with no project or no last_used go last.
  const sorted = [...clientsWithProjectsData].sort((a, b) => {
    const aAt = a.activeProject?.id ? lastUsedMap[a.activeProject.id] : null;
    const bAt = b.activeProject?.id ? lastUsedMap[b.activeProject.id] : null;
    if (aAt && bAt) return new Date(bAt).getTime() - new Date(aAt).getTime();
    if (aAt) return -1;
    if (bAt) return 1;
    return (a.clientName || "").localeCompare(b.clientName || "");
  });

  return sorted;
};

/**
 * Fetch all clients for a workspace for CSV export.
 * Returns name, phone, email, assigned_staff (comma-separated staff names).
 */
export const fetchAllClientsForExport = async (
  workspaceId: string
): Promise<Array<{ name: string; phone: string; email: string; assigned_staff: string }>> => {
  const { data: clients, error: clientsError } = await (supabase as any)
    .from("clients")
    .select("client_id, name, email, phone")
    .eq("workspace_id", workspaceId)
    .order("name");

  if (clientsError) throw clientsError;
  if (!clients || clients.length === 0) {
    return [];
  }

  const clientIds = clients.map((c: any) => c.client_id);

  const { data: assignments, error: assignmentsError } = await (supabase as any)
    .from("client_assignments")
    .select("client_id, workspace_member_id")
    .eq("workspace_id", workspaceId)
    .in("client_id", clientIds);

  if (assignmentsError) throw assignmentsError;

  const workspaceMemberIds = [...new Set((assignments || []).map((a: any) => a.workspace_member_id))];
  const assignmentByClientId = new Map<string, string[]>();
  (assignments || []).forEach((a: any) => {
    const arr = assignmentByClientId.get(a.client_id) || [];
    arr.push(a.workspace_member_id);
    assignmentByClientId.set(a.client_id, arr);
  });

  if (workspaceMemberIds.length === 0) {
    return clients.map((c: any) => ({
      name: c.name || "",
      phone: c.phone || "",
      email: c.email || "",
      assigned_staff: "",
    }));
  }

  const { data: members, error: membersError } = await (supabase as any)
    .from("workspace_members")
    .select("id, user_id")
    .in("id", workspaceMemberIds)
    .eq("workspace_id", workspaceId);

  if (membersError) throw membersError;

  const userIds = [...new Set((members || []).map((m: any) => m.user_id).filter(Boolean))];
  const memberIdToUserId = new Map((members || []).map((m: any) => [m.id, m.user_id]));

  if (userIds.length === 0) {
    return clients.map((c: any) => ({
      name: c.name || "",
      phone: c.phone || "",
      email: c.email || "",
      assigned_staff: "",
    }));
  }

  const { data: users, error: usersError } = await (supabase as any)
    .from("users")
    .select("user_id, name")
    .in("user_id", userIds);

  if (usersError) throw usersError;

  const userMap = new Map((users || []).map((u: any) => [u.user_id, u.name || ""]));
  const memberIdToName = new Map<string, string>();
  memberIdToUserId.forEach((userId, memberId) => {
    const name = userMap.get(userId);
    if (name) memberIdToName.set(memberId, name);
  });

  return clients.map((c: any) => {
    const memberIds = assignmentByClientId.get(c.client_id) || [];
    const staffNames = memberIds
      .map((mid: string) => memberIdToName.get(mid))
      .filter(Boolean);
    return {
      name: c.name || "",
      phone: c.phone || "",
      email: c.email || "",
      assigned_staff: staffNames.join(", "),
    };
  });
};

/**
 * Fetch a single client by ID
 */
export const fetchClientById = async (clientId: string, workspaceId: string) => {
  const { data, error } = await (supabase as any)
    .from("clients")
    .select("*")
    .eq("client_id", clientId)
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  if (error) throw error;
  return data;
};

/**
 * Create a new client
 */
export const createClient = async (
  workspaceId: string,
  clientData: {
    name: string;
    email?: string;
    phone?: string;
  },
  userId?: string
) => {
  const { data, error } = await (supabase as any)
    .from("clients")
    .insert({
      name: clientData.name,
      email: clientData.email,
      phone: clientData.phone,
      workspace_id: workspaceId,
      created_by: userId || null,
      updated_by: userId || null,
    })
    .select()
    .single();

  if (error) throw error;

  // Log audit event
  if (userId && data) {
    await logInsert(workspaceId, userId, 'clients', data.client_id, data, 'Clients');
  }

  return data;
};

/**
 * Bulk create clients (no audit log).
 */
export const bulkCreateClients = async (
  workspaceId: string,
  clients: { name: string; email?: string; phone?: string }[],
  userId?: string
) => {
  if (!clients.length) return [];

  const { data, error } = await (supabase as any)
    .from("clients")
    .insert(
      clients.map((client) => ({
        name: client.name,
        email: client.email || null,
        phone: client.phone || null,
        workspace_id: workspaceId,
        created_by: userId || null,
        updated_by: userId || null,
      }))
    )
    .select();

  if (error) throw error;
  return data || [];
};

/**
 * Update client active project
 */
export const updateClientActiveProject = async (clientId: string, projectId: string | null, workspaceId: string, userId?: string) => {
  // Fetch before data for audit log
  const beforeData = await fetchClientById(clientId, workspaceId);

  const { data, error } = await (supabase as any)
    .from("clients")
    .update({ 
      active_project: projectId,
      updated_by: userId || null,
    })
    .eq("client_id", clientId)
    .eq("workspace_id", workspaceId)
    .select()
    .single();

  if (error) throw error;

  // Log audit event
  if (userId && data && beforeData) {
    await logUpdate(workspaceId, userId, 'clients', clientId, beforeData, data, 'Clients');
  }

  return data;
};

/**
 * Delete a client and all projects associated with them.
 * This is irreversible - the client and all their projects will be permanently deleted.
 */
export const deleteClient = async (
  clientId: string,
  workspaceId: string,
  userId?: string
) => {
  // Fetch before data for audit log
  const beforeData = await fetchClientById(clientId, workspaceId);
  if (!beforeData) {
    throw new Error('Client not found');
  }

  // Delete all projects for this client first (projects have ON DELETE SET NULL for client_id,
  // so we must explicitly delete projects to remove them and their cascading data)
  const { data: projectsToDelete } = await (supabase as any)
    .from('projects')
    .select('project_id')
    .eq('client_id', clientId)
    .eq('workspace_id', workspaceId);

  if (projectsToDelete && projectsToDelete.length > 0) {
    for (const p of projectsToDelete) {
      const { error: projectError } = await (supabase as any)
        .from('projects')
        .delete()
        .eq('project_id', p.project_id)
        .eq('workspace_id', workspaceId);
      if (projectError) throw projectError;
    }
  }

  // Delete the client (client_assignments and other FKs will cascade or need explicit handling)
  const { error } = await (supabase as any)
    .from('clients')
    .delete()
    .eq('client_id', clientId)
    .eq('workspace_id', workspaceId);

  if (error) throw error;

  // Log audit event
  if (userId && beforeData) {
    await logDelete(workspaceId, userId, 'clients', clientId, beforeData, 'Clients');
  }

  return { success: true };
};

