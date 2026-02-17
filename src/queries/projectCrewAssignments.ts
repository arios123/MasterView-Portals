import { supabase } from '@/integrations/supabase/client';
import { isDemoMode } from '@/utils/demoMode';

/**
 * Fetch all project crew assignments for a project with user details.
 * In demo mode, returns empty array.
 */
export const fetchProjectCrewAssignments = async (projectId: string, workspaceId: string) => {
  if (isDemoMode()) return [];

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

  const workspaceMemberIds = assignments.map((a: any) => a.workspace_member_id).filter(Boolean);
  if (workspaceMemberIds.length === 0) return [];

  const { data: members, error: membersError } = await (supabase as any)
    .from("workspace_members")
    .select("id, user_id")
    .in("id", workspaceMemberIds)
    .eq("workspace_id", workspaceId);

  if (membersError) throw membersError;
  if (!members || members.length === 0) return [];

  const userIds = members.map((m: any) => m.user_id).filter(Boolean);
  if (userIds.length === 0) return [];

  const { data: users, error: usersError } = await (supabase as any)
    .from("users")
    .select("user_id, name, email")
    .in("user_id", userIds);

  if (usersError) throw usersError;

  const membersMap = new Map(members.map((m: any) => [m.id, m]));
  const usersMap = new Map((users || []).map((u: any) => [u.user_id, u]));

  return assignments.map((assignment: any) => {
    const member = membersMap.get(assignment.workspace_member_id);
    const user = member ? usersMap.get(member.user_id) : null;
    return {
      ...assignment,
      user: user ? { user_id: user.user_id, name: user.name, email: user.email } : null,
    };
  });
};

/**
 * Create a new project crew assignment. No-op in demo.
 */
export const createProjectCrewAssignment = async (
  workspaceId: string,
  projectId: string,
  workspaceMemberId: string,
  userId?: string
) => {
  if (isDemoMode()) return null;

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
  return data;
};

/**
 * Delete a project crew assignment. No-op in demo.
 */
export const deleteProjectCrewAssignment = async (assignmentId: string, workspaceId: string, _userId?: string) => {
  if (isDemoMode()) return null;

  const { data, error } = await (supabase as any)
    .from("project_crew_assignments")
    .delete()
    .eq("id", assignmentId)
    .select()
    .single();

  if (error) throw error;
  return data;
};
