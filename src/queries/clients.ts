import { supabase } from '@/integrations/supabase/client';
import { Project } from '@/types';
import { calculateProjectTotals, mapProjectWithTotals } from './projects';
import { getWorkspaceMemberId } from './clientAssignments';
import { logInsert, logUpdate, logDelete } from '@/lib/auditLog';
import { isDemoMode, blockDemoWrite } from '@/utils/demoMode';
import { getMockClients, getMockDbProjects, getMockClientAssignments, getMockProjects } from '@/utils/mockData';

/**
 * Fetch clients assigned to a specific user (via workspace_member_id)
 */
export const fetchClientsAssignedToUser = async (workspaceMemberId: string, workspaceId: string, limit = 50, offset = 0) => {
  if (isDemoMode()) {
    // In demo mode, return clients 1-5 (assigned to demo user)
    const mockClients = getMockClients();
    const mockAssignments = getMockClientAssignments();
    const assignedClientIds = mockAssignments.map(a => a.client_id);
    const assignedClients = mockClients.filter(c => assignedClientIds.includes(c.client_id));
    return assignedClients.slice(offset, offset + limit);
  }

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
 */
export const fetchClientsNotAssignedToUser = async (userId: string, workspaceId: string, limit = 50, offset = 0) => {
  if (isDemoMode()) {
    // In demo mode, return clients 6-10 (not assigned to demo user)
    const mockClients = getMockClients();
    const mockAssignments = getMockClientAssignments();
    const assignedClientIds = mockAssignments.map(a => a.client_id);
    const unassignedClients = mockClients.filter(c => !assignedClientIds.includes(c.client_id));
    return unassignedClients.slice(offset, offset + limit);
  }

  // Get workspace_member_id from user_id
  const workspaceMemberId = await getWorkspaceMemberId(userId, workspaceId);
  if (!workspaceMemberId) {
    // If user is not a member, return all clients in the workspace
    // COMMENTED OUT IN DEMO MODE - using mock data instead
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
  // COMMENTED OUT IN DEMO MODE - using mock data instead
  const { data: assignments, error: assignmentsError } = await (supabase as any)
    .from("client_assignments")
    .select("client_id")
    .eq("workspace_member_id", workspaceMemberId)
    .eq("workspace_id", workspaceId);

  if (assignmentsError) throw assignmentsError;
  
  const assignedClientIds = (assignments || []).map((a: any) => a.client_id);

  // Fetch all clients in the workspace
  // COMMENTED OUT IN DEMO MODE - using mock data instead
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
  if (isDemoMode()) {
    // Return mock clients with active projects (only assigned clients)
    const mockClients = getMockClients();
    const mockProjects = getMockProjects();
    const mockAssignments = getMockClientAssignments();
    const assignedClientIds = mockAssignments.map(a => a.client_id);
    const assignedClients = mockClients.filter(c => assignedClientIds.includes(c.client_id));
    
    return assignedClients.slice(offset, offset + limit).map(client => ({
      clientId: client.client_id,
      clientName: client.name,
      clientEmail: client.email || undefined,
      clientPhone: client.phone || undefined,
      activeProject: mockProjects.find(p => p.id === client.active_project) || null,
    }));
  }

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
        // COMMENTED OUT IN DEMO MODE - using mock data instead
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

  return clientsWithProjectsData;
};

/**
 * Fetch a single client by ID
 */
export const fetchClientById = async (clientId: string, workspaceId: string) => {
  if (isDemoMode()) {
    const mockClients = getMockClients();
    return mockClients.find(c => c.client_id === clientId) || null;
  }

  // COMMENTED OUT IN DEMO MODE - using mock data instead
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
  if (blockDemoWrite('create client')) {
    throw new Error('Demo mode is read-only');
  }

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
 * Bulk create clients (no audit log).
 * In demo mode, writes are blocked.
 */
export const bulkCreateClients = async (
  workspaceId: string,
  clients: { name: string; email?: string; phone?: string }[],
  userId?: string
) => {
  if (blockDemoWrite('bulk import clients')) {
    throw new Error('Demo mode is read-only');
  }
  if (!clients.length) return [];

  const { data, error } = await (supabase as any)
    .from('clients')
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
 * Fetch all clients for a workspace for CSV export.
 * Returns name, phone, email, assigned_staff (comma-separated staff names).
 */
export const fetchAllClientsForExport = async (
  workspaceId: string
): Promise<Array<{ name: string; phone: string; email: string; assigned_staff: string }>> => {
  if (isDemoMode()) {
    const mockClients = getMockClients();
    const mockAssignments = getMockClientAssignments();
    const assignedClientIds = new Set(mockAssignments.map((a: any) => a.client_id));
    return mockClients.map((c: any) => ({
      name: c.name || '',
      phone: c.phone || '',
      email: c.email || '',
      assigned_staff: assignedClientIds.has(c.client_id) ? 'Demo User' : '',
    }));
  }

  const { data: clients, error: clientsError } = await (supabase as any)
    .from('clients')
    .select('client_id, name, email, phone')
    .eq('workspace_id', workspaceId)
    .order('name');

  if (clientsError) throw clientsError;
  if (!clients || clients.length === 0) return [];

  const clientIds = clients.map((c: any) => c.client_id);

  const { data: assignments, error: assignmentsError } = await (supabase as any)
    .from('client_assignments')
    .select('client_id, workspace_member_id')
    .eq('workspace_id', workspaceId)
    .in('client_id', clientIds);

  if (assignmentsError) throw assignmentsError;

  const assignmentByClientId = new Map<string, string[]>();
  (assignments || []).forEach((a: any) => {
    const arr = assignmentByClientId.get(a.client_id) || [];
    arr.push(a.workspace_member_id);
    assignmentByClientId.set(a.client_id, arr);
  });

  const workspaceMemberIds = [...new Set((assignments || []).map((a: any) => a.workspace_member_id))];
  if (workspaceMemberIds.length === 0) {
    return clients.map((c: any) => ({
      name: c.name || '',
      phone: c.phone || '',
      email: c.email || '',
      assigned_staff: '',
    }));
  }

  const { data: members, error: membersError } = await (supabase as any)
    .from('workspace_members')
    .select('id, user_id')
    .in('id', workspaceMemberIds)
    .eq('workspace_id', workspaceId);

  if (membersError) throw membersError;

  const userIds = [...new Set((members || []).map((m: any) => m.user_id).filter(Boolean))];
  const memberIdToUserId = new Map((members || []).map((m: any) => [m.id, m.user_id]));

  if (userIds.length === 0) {
    return clients.map((c: any) => ({
      name: c.name || '',
      phone: c.phone || '',
      email: c.email || '',
      assigned_staff: '',
    }));
  }

  const { data: users, error: usersError } = await (supabase as any)
    .from('users')
    .select('user_id, name')
    .in('user_id', userIds);

  if (usersError) throw usersError;

  const userMap = new Map((users || []).map((u: any) => [u.user_id, u.name || '']));
  const memberIdToName = new Map<string, string>();
  memberIdToUserId.forEach((userId, memberId) => {
    const name = userMap.get(userId);
    if (name) memberIdToName.set(memberId, name);
  });

  return clients.map((c: any) => {
    const memberIds = assignmentByClientId.get(c.client_id) || [];
    const staffNames = memberIds.map((mid: string) => memberIdToName.get(mid)).filter(Boolean);
    return {
      name: c.name || '',
      phone: c.phone || '',
      email: c.email || '',
      assigned_staff: staffNames.join(', '),
    };
  });
};

/**
 * Delete a client and all projects associated with them.
 * In demo mode, writes are blocked.
 */
export const deleteClient = async (clientId: string, workspaceId: string, userId?: string) => {
  if (blockDemoWrite('delete client')) {
    throw new Error('Demo mode is read-only');
  }
  const beforeData = await fetchClientById(clientId, workspaceId);
  if (!beforeData) throw new Error('Client not found');

  const { data: projectsToDelete } = await (supabase as any)
    .from('projects')
    .select('project_id')
    .eq('client_id', clientId)
    .eq('workspace_id', workspaceId);

  if (projectsToDelete?.length) {
    for (const p of projectsToDelete) {
      const { error: projectError } = await (supabase as any)
        .from('projects')
        .delete()
        .eq('project_id', p.project_id)
        .eq('workspace_id', workspaceId);
      if (projectError) throw projectError;
    }
  }

  const { error } = await (supabase as any)
    .from('clients')
    .delete()
    .eq('client_id', clientId)
    .eq('workspace_id', workspaceId);

  if (error) throw error;
  if (userId && beforeData) {
    await logDelete(workspaceId, userId, 'clients', clientId, beforeData, 'Clients');
  }
  return { success: true };
};

