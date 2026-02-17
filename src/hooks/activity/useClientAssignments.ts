import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { fetchClientAssignments, createClientAssignment, deleteClientAssignment, updateClientAssignments } from '@/queries/clientAssignments';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type AssignedStaff = {
  assignmentId: string;
  workspaceMemberId: string;
  name: string | null;
  email: string | null;
};

export type WorkspaceMember = {
  id: string;
  name: string | null;
  email: string | null;
};

export const useClientAssignments = (clientId: string | undefined) => {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const workspaceId = currentWorkspace?.id;

  const [assignedStaff, setAssignedStaff] = useState<AssignedStaff[]>([]);
  const [workspaceMembers, setWorkspaceMembers] = useState<WorkspaceMember[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const fetchAssignedStaff = useCallback(async () => {
    if (!workspaceId || !clientId) return;

    setLoading(true);
    try {
      const assignments = await fetchClientAssignments(clientId, workspaceId);
      const staff: AssignedStaff[] = assignments.map((a: any) => ({
        assignmentId: a.id,
        workspaceMemberId: a.workspace_member_id,
        name: a.user?.name || null,
        email: a.user?.email || null,
      }));
      setAssignedStaff(staff);
    } catch (error) {
      console.error('Error fetching assigned staff:', error);
      toast.error('Failed to load assigned staff');
    } finally {
      setLoading(false);
    }
  }, [workspaceId, clientId]);

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

  const handleAddStaff = useCallback(async () => {
    if (!selectedMemberId || !workspaceId || !clientId || !user) return;

    // Check if already assigned
    if (assignedStaff.some(s => s.workspaceMemberId === selectedMemberId)) {
      toast.error('This staff member is already assigned');
      return;
    }

    try {
      // Use updateClientAssignments to replace any existing assignment with the new one
      // This ensures only one staff member is assigned (single assignment constraint)
      await updateClientAssignments(workspaceId, clientId, [selectedMemberId], user.id);
      toast.success('Staff member assigned successfully');
      setSelectedMemberId('');
      await fetchAssignedStaff();
    } catch (error) {
      console.error('Error assigning staff:', error);
      toast.error('Failed to assign staff member');
    }
  }, [selectedMemberId, workspaceId, clientId, user, assignedStaff, fetchAssignedStaff]);

  const handleUpdateStaff = useCallback(async (memberId: string) => {
    if (!workspaceId || !clientId || !user) return;

    try {
      // If memberId is empty, remove all assignments
      // Otherwise, update to the selected member (replacing any existing)
      const memberIds = memberId ? [memberId] : [];
      await updateClientAssignments(workspaceId, clientId, memberIds, user.id);
      if (memberId) {
        toast.success('Staff member updated successfully');
      } else {
        toast.success('Staff member removed successfully');
      }
      await fetchAssignedStaff();
    } catch (error) {
      console.error('Error updating staff:', error);
      toast.error('Failed to update staff member');
    }
  }, [workspaceId, clientId, user, fetchAssignedStaff]);

  const handleRemoveStaff = useCallback(async (assignmentId: string) => {
    if (!user) return;

    try {
      await deleteClientAssignment(assignmentId, workspaceId, user.id);
      toast.success('Staff member removed successfully');
      await fetchAssignedStaff();
    } catch (error) {
      console.error('Error removing staff:', error);
      toast.error('Failed to remove staff member');
    }
  }, [user, fetchAssignedStaff]);

  // Fetch data on mount and when dependencies change
  useEffect(() => {
    if (workspaceId && clientId) {
      fetchAssignedStaff();
      fetchWorkspaceMembers();
    }
  }, [workspaceId, clientId, fetchAssignedStaff, fetchWorkspaceMembers]);

  // Get available members (not already assigned)
  const availableMembers = workspaceMembers.filter(
    member => !assignedStaff.some(s => s.workspaceMemberId === member.id)
  );

  // Get currently assigned staff member ID (should be only one due to constraint)
  const currentStaffMemberId = assignedStaff.length > 0 ? assignedStaff[0].workspaceMemberId : '';

  return {
    assignedStaff,
    workspaceMembers: availableMembers,
    selectedMemberId,
    setSelectedMemberId,
    loading,
    handleAddStaff,
    handleRemoveStaff,
    handleUpdateStaff,
    currentStaffMemberId,
    refetch: fetchAssignedStaff,
  };
};

