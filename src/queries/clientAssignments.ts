import { supabase } from '@/integrations/supabase/client';
import { logInsert, logUpdate, logDelete } from '@/lib/auditLog';

/**
 * Get workspace_member_id from user_id and workspace_id
 */
export const getWorkspaceMemberId = async (userId: string, workspaceId: string): Promise<string | null> => {
  const { data, error } = await (supabase as any)
    .from("workspace_members")
    .select("id")
    .eq("user_id", userId)
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  if (error) throw error;
  return data?.id || null;
};

/**
 * Fetch all client assignments for a specific client with user details
 */
export const fetchClientAssignments = async (clientId: string, workspaceId: string) => {
  // First, fetch client assignments with workspace_member_id
  const { data: assignments, error: assignmentsError } = await (supabase as any)
    .from("client_assignments")
    .select(`
      id,
      workspace_id,
      client_id,
      workspace_member_id,
      created_by,
      created_at,
      updated_by,
      updated_at
    `)
    .eq("client_id", clientId)
    .eq("workspace_id", workspaceId);

  if (assignmentsError) throw assignmentsError;
  if (!assignments || assignments.length === 0) return [];

  // Extract workspace_member_ids
  const workspaceMemberIds = assignments.map((a: any) => a.workspace_member_id).filter(Boolean);

  if (workspaceMemberIds.length === 0) return [];

  // Fetch workspace_members to get user_ids
  const { data: members, error: membersError } = await (supabase as any)
    .from("workspace_members")
    .select("id, user_id")
    .in("id", workspaceMemberIds)
    .eq("workspace_id", workspaceId);

  if (membersError) throw membersError;
  if (!members || members.length === 0) return [];

  // Extract user_ids
  const userIds = members.map((m: any) => m.user_id).filter(Boolean);

  if (userIds.length === 0) return [];

  // Fetch user details
  const { data: users, error: usersError } = await (supabase as any)
    .from("users")
    .select("user_id, name, email")
    .in("user_id", userIds);

  if (usersError) throw usersError;

  // Create maps for easy lookup
  const membersMap = new Map(members.map((m: any) => [m.id, m]));
  const usersMap = new Map((users || []).map((u: any) => [u.user_id, u]));

  // Combine assignments with user data
  return assignments.map((assignment: any) => {
    const member = membersMap.get(assignment.workspace_member_id);
    const user = member ? usersMap.get(member.user_id) : null;
    
    return {
      ...assignment,
      user: user ? {
        user_id: user.user_id,
        name: user.name,
        email: user.email,
      } : null,
    };
  });
};

/**
 * Fetch all clients assigned to a specific workspace member
 */
export const fetchClientsAssignedToMember = async (workspaceMemberId: string, workspaceId: string) => {
  const { data, error } = await (supabase as any)
    .from("client_assignments")
    .select(`
      id,
      client_id,
      clients (
        client_id,
        name,
        email,
        phone
      )
    `)
    .eq("workspace_member_id", workspaceMemberId)
    .eq("workspace_id", workspaceId);

  if (error) throw error;
  return data || [];
};

/**
 * Create a new client assignment
 */
export const createClientAssignment = async (
  workspaceId: string,
  clientId: string,
  workspaceMemberId: string,
  userId?: string
) => {
  const { data, error } = await (supabase as any)
    .from("client_assignments")
    .insert({
      workspace_id: workspaceId,
      client_id: clientId,
      workspace_member_id: workspaceMemberId,
      created_by: userId || null,
      updated_by: userId || null,
    })
    .select()
    .single();

  if (error) throw error;

  // Log audit event for client assignment creation
  if (userId && workspaceId && data) {
    await logInsert(workspaceId, userId, 'client_assignments', data.id, data, 'Clients');
  }

  return data;
};

/**
 * Create multiple client assignments at once
 */
export const createClientAssignments = async (
  workspaceId: string,
  clientId: string,
  workspaceMemberIds: string[],
  userId?: string
) => {
  if (workspaceMemberIds.length === 0) return [];

  const assignments = workspaceMemberIds.map(workspaceMemberId => ({
    workspace_id: workspaceId,
    client_id: clientId,
    workspace_member_id: workspaceMemberId,
    created_by: userId || null,
    updated_by: userId || null,
  }));

  const { data, error } = await (supabase as any)
    .from("client_assignments")
    .insert(assignments)
    .select();

  if (error) throw error;

  // Log audit events for each client assignment creation
  if (userId && workspaceId && data && data.length > 0) {
    await Promise.all(
      data.map((assignment: any) =>
        logInsert(workspaceId, userId, 'client_assignments', assignment.id, assignment, 'Clients')
      )
    );
  }

  return data || [];
};

/**
 * Delete a client assignment
 */
export const deleteClientAssignment = async (assignmentId: string, workspaceId: string, userId?: string) => {
  // Fetch before data for audit log
  const { data: beforeData } = await (supabase as any)
    .from("client_assignments")
    .select("*")
    .eq("id", assignmentId)
    .maybeSingle();

  const { data, error } = await (supabase as any)
    .from("client_assignments")
    .delete()
    .eq("id", assignmentId)
    .select()
    .single();

  if (error) throw error;

  // Log audit event for client assignment deletion
  if (userId && workspaceId && beforeData) {
    await logDelete(workspaceId, userId, 'client_assignments', assignmentId, beforeData, 'Clients');
  }

  return data;
};

/**
 * Delete all assignments for a client (useful when updating assignments)
 */
export const deleteAllClientAssignments = async (clientId: string, workspaceId: string) => {
  const { error } = await (supabase as any)
    .from("client_assignments")
    .delete()
    .eq("client_id", clientId)
    .eq("workspace_id", workspaceId);

  if (error) throw error;
};

/**
 * Update client assignments (delete all existing and create new ones)
 */
export const updateClientAssignments = async (
  workspaceId: string,
  clientId: string,
  workspaceMemberIds: string[],
  userId?: string
) => {
  // Fetch before data for audit log (all existing assignments)
  const { data: beforeAssignments } = await (supabase as any)
    .from("client_assignments")
    .select("*")
    .eq("client_id", clientId)
    .eq("workspace_id", workspaceId);

  // Delete all existing assignments
  await deleteAllClientAssignments(clientId, workspaceId);

  // Log audit events for deleted assignments
  if (userId && workspaceId && beforeAssignments && beforeAssignments.length > 0) {
    await Promise.all(
      beforeAssignments.map((assignment: any) =>
        logDelete(workspaceId, userId, 'client_assignments', assignment.id, assignment, 'Clients')
      )
    );
  }
  
  // Create new assignments
  if (workspaceMemberIds.length > 0) {
    return await createClientAssignments(workspaceId, clientId, workspaceMemberIds, userId);
  }
  
  return [];
};

