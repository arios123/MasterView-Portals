import { supabase } from '@/integrations/supabase/client';
import { getWorkspaceMemberId } from './clientAssignments';
import { logInsert, logUpdate, logDelete } from '@/lib/auditLog';

/**
 * Fetch all project crew assignments for a specific project with user details
 */
export const fetchProjectCrewAssignments = async (projectId: string, workspaceId: string) => {
  // First, fetch project crew assignments with workspace_member_id
  const { data: assignments, error: assignmentsError } = await (supabase as any)
    .from("project_crew_assignments")
    .select(`
      id,
      workspace_id,
      project_id,
      workspace_member_id,
      created_by,
      created_at,
      updated_by,
      updated_at
    `)
    .eq("project_id", projectId)
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
 * Fetch all projects where a specific workspace member is part of the crew
 */
export const fetchProjectsWithCrewMember = async (workspaceMemberId: string, workspaceId: string) => {
  const { data, error } = await (supabase as any)
    .from("project_crew_assignments")
    .select(`
      id,
      project_id,
      projects (
        project_id,
        name,
        client_id,
        address,
        project_type
      )
    `)
    .eq("workspace_member_id", workspaceMemberId)
    .eq("workspace_id", workspaceId);

  if (error) throw error;
  return data || [];
};

/**
 * Create a new project crew assignment
 */
export const createProjectCrewAssignment = async (
  workspaceId: string,
  projectId: string,
  workspaceMemberId: string,
  userId?: string
) => {
  const { data, error } = await (supabase as any)
    .from("project_crew_assignments")
    .insert({
      workspace_id: workspaceId,
      project_id: projectId,
      workspace_member_id: workspaceMemberId,
      created_by: userId || null,
      updated_by: userId || null,
    })
    .select()
    .single();

  if (error) throw error;

  // Log audit event for project crew assignment creation
  if (userId && workspaceId && data) {
    await logInsert(workspaceId, userId, 'project_crew_assignments', data.id, data, 'Projects');
  }

  return data;
};

/**
 * Create multiple project crew assignments at once
 */
export const createProjectCrewAssignments = async (
  workspaceId: string,
  projectId: string,
  workspaceMemberIds: string[],
  userId?: string
) => {
  if (workspaceMemberIds.length === 0) return [];

  const assignments = workspaceMemberIds.map(workspaceMemberId => ({
    workspace_id: workspaceId,
    project_id: projectId,
    workspace_member_id: workspaceMemberId,
    created_by: userId || null,
    updated_by: userId || null,
  }));

  const { data, error } = await (supabase as any)
    .from("project_crew_assignments")
    .insert(assignments)
    .select();

  if (error) throw error;

  // Log audit events for each project crew assignment creation
  if (userId && workspaceId && data && data.length > 0) {
    await Promise.all(
      data.map((assignment: any) =>
        logInsert(workspaceId, userId, 'project_crew_assignments', assignment.id, assignment, 'Projects')
      )
    );
  }

  return data || [];
};

/**
 * Delete a project crew assignment
 */
export const deleteProjectCrewAssignment = async (assignmentId: string, workspaceId: string, userId?: string) => {
  // Fetch before data for audit log
  const { data: beforeData } = await (supabase as any)
    .from("project_crew_assignments")
    .select("*")
    .eq("id", assignmentId)
    .maybeSingle();

  const { data, error } = await (supabase as any)
    .from("project_crew_assignments")
    .delete()
    .eq("id", assignmentId)
    .select()
    .single();

  if (error) throw error;

  // Log audit event for project crew assignment deletion
  if (userId && workspaceId && beforeData) {
    await logDelete(workspaceId, userId, 'project_crew_assignments', assignmentId, beforeData, 'Projects');
  }

  return data;
};

/**
 * Delete all crew assignments for a project (useful when updating assignments)
 */
export const deleteAllProjectCrewAssignments = async (projectId: string, workspaceId: string) => {
  const { error } = await (supabase as any)
    .from("project_crew_assignments")
    .delete()
    .eq("project_id", projectId)
    .eq("workspace_id", workspaceId);

  if (error) throw error;
};

/**
 * Update project crew assignments (delete all existing and create new ones)
 */
export const updateProjectCrewAssignments = async (
  workspaceId: string,
  projectId: string,
  workspaceMemberIds: string[],
  userId?: string
) => {
  // Fetch before data for audit log (all existing assignments)
  const { data: beforeAssignments } = await (supabase as any)
    .from("project_crew_assignments")
    .select("*")
    .eq("project_id", projectId)
    .eq("workspace_id", workspaceId);

  // Delete all existing assignments
  await deleteAllProjectCrewAssignments(projectId, workspaceId);

  // Log audit events for deleted assignments
  if (userId && workspaceId && beforeAssignments && beforeAssignments.length > 0) {
    await Promise.all(
      beforeAssignments.map((assignment: any) =>
        logDelete(workspaceId, userId, 'project_crew_assignments', assignment.id, assignment, 'Projects')
      )
    );
  }
  
  // Create new assignments
  if (workspaceMemberIds.length > 0) {
    return await createProjectCrewAssignments(workspaceId, projectId, workspaceMemberIds, userId);
  }
  
  return [];
};
