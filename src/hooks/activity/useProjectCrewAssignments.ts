import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { 
  fetchProjectCrewAssignments, 
  createProjectCrewAssignment,
  deleteProjectCrewAssignment,
  updateProjectCrewAssignments
} from '@/queries/projectCrewAssignments';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type CrewMember = {
  id: string;
  workspaceMemberId: string;
  name: string | null;
  email: string | null;
};

export type WorkspaceMember = {
  id: string;
  name: string | null;
  email: string | null;
};

export const useProjectCrewAssignments = (projectId: string | undefined) => {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const workspaceId = currentWorkspace?.id;
  
  const [crewMembers, setCrewMembers] = useState<CrewMember[]>([]);
  const [workspaceMembers, setWorkspaceMembers] = useState<WorkspaceMember[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const fetchCrewMembers = useCallback(async () => {
    if (!workspaceId || !projectId) {
      setCrewMembers([]);
      return;
    }

    setLoading(true);
    try {
      const assignments = await fetchProjectCrewAssignments(projectId, workspaceId);
      const crew: CrewMember[] = assignments.map((a: any) => ({
        id: a.id,
        workspaceMemberId: a.workspace_member_id,
        name: a.user?.name || null,
        email: a.user?.email || null,
      }));
      setCrewMembers(crew);
    } catch (error) {
      console.error('Error fetching crew members:', error);
      toast.error('Failed to load crew members');
    } finally {
      setLoading(false);
    }
  }, [workspaceId, projectId]);

  const fetchWorkspaceMembers = useCallback(async () => {
    if (!workspaceId) return;

    try {
      // Fetch workspace members with user details
      const { data: membersData, error: membersError } = await (supabase as any)
        .from("workspace_members")
        .select("id, user_id")
        .eq("workspace_id", workspaceId);

      if (membersError) throw membersError;
      if (!membersData || membersData.length === 0) return;

      const userIds = membersData.map((m: any) => m.user_id).filter(Boolean);
      if (userIds.length === 0) return;

      const { data: usersData, error: usersError } = await (supabase as any)
        .from("users")
        .select("user_id, name, email")
        .in("user_id", userIds);

      if (usersError) throw usersError;

      const membersMap = new Map(membersData.map((m: any) => [m.user_id, m.id]));
      const members: WorkspaceMember[] = (usersData || []).map((u: any) => ({
        id: membersMap.get(u.user_id) || '',
        name: u.name,
        email: u.email,
      }));

      setWorkspaceMembers(members);
    } catch (error) {
      console.error('Error fetching workspace members:', error);
    }
  }, [workspaceId]);

  const handleAddCrewMember = useCallback(async () => {
    if (!selectedMemberId || !workspaceId || !projectId || !user) return;

    // Check if already assigned
    if (crewMembers.some(c => c.workspaceMemberId === selectedMemberId)) {
      toast.error('This crew member is already assigned');
      return;
    }

    try {
      await createProjectCrewAssignment(workspaceId, projectId, selectedMemberId, user.id);
      toast.success('Crew member added successfully');
      setSelectedMemberId('');
      await fetchCrewMembers();
    } catch (error) {
      console.error('Error adding crew member:', error);
      toast.error('Failed to add crew member');
    }
  }, [selectedMemberId, workspaceId, projectId, user, crewMembers, fetchCrewMembers]);

  const handleRemoveCrewMember = useCallback(async (assignmentId: string) => {
    if (!user) return;

    try {
      await deleteProjectCrewAssignment(assignmentId, workspaceId, user.id);
      toast.success('Crew member removed successfully');
      await fetchCrewMembers();
    } catch (error) {
      console.error('Error removing crew member:', error);
      toast.error('Failed to remove crew member');
    }
  }, [user, fetchCrewMembers]);

  useEffect(() => {
    if (workspaceId && projectId) {
      fetchCrewMembers();
      fetchWorkspaceMembers();
    }
  }, [workspaceId, projectId, fetchCrewMembers, fetchWorkspaceMembers]);

  const availableMembers = workspaceMembers.filter(
    member => !crewMembers.some(c => c.workspaceMemberId === member.id)
  );

  return {
    crewMembers,
    workspaceMembers: availableMembers,
    selectedMemberId,
    setSelectedMemberId,
    loading,
    handleAddCrewMember,
    handleRemoveCrewMember,
    refetch: fetchCrewMembers,
  };
};
