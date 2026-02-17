import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface WorkspaceMember {
  id: string; // workspace_member_id
  user_id: string;
  name: string | null;
  email: string | null;
  role: string | null;
}

export function useWorkspaceMembers(workspaceId: string | undefined) {
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchMembers = useCallback(async () => {
    if (!workspaceId) {
      setMembers([]);
      return;
    }

    setIsLoading(true);
    try {
      // First, fetch workspace members with their roles
      const { data: membersData, error: membersError } = await (supabase as any)
        .from('workspace_members')
        .select(`
          id,
          user_id,
          workspace_member_roles (
            roles (
              name
            )
          )
        `)
        .eq('workspace_id', workspaceId);

      if (membersError) throw membersError;

      if (!membersData || membersData.length === 0) {
        setMembers([]);
        return;
      }

      // Extract user IDs
      const userIds = membersData.map((m: any) => m.user_id).filter(Boolean);

      if (userIds.length === 0) {
        setMembers([]);
        return;
      }

      // Fetch user details from users table
      const { data: usersData, error: usersError } = await (supabase as any)
        .from('users')
        .select('user_id, name, email')
        .in('user_id', userIds);

      if (usersError) throw usersError;

      // Create a map of user_id to user data
      const usersMap = new Map(
        (usersData || []).map((u: any) => [u.user_id, u])
      );

      // Combine workspace_members with user data and roles
      const membersWithDetails = membersData.map((member: any) => {
        const user = usersMap.get(member.user_id);
        
        // Get the first role from workspace_member_roles
        let role: string | null = null;
        if (
          member.workspace_member_roles &&
          Array.isArray(member.workspace_member_roles) &&
          member.workspace_member_roles.length > 0
        ) {
          const firstRole = member.workspace_member_roles[0];
          if (firstRole.roles) {
            role = firstRole.roles.name;
          }
        }

        return {
          id: member.id, // workspace_member_id
          user_id: member.user_id,
          name: user?.name || null,
          email: user?.email || null,
          role: role,
        };
      });

      setMembers(membersWithDetails);
    } catch (error: any) {
      console.error('Error fetching workspace members:', error);
      toast({
        title: 'Error',
        description: error?.message || 'Failed to load workspace members',
        variant: 'destructive',
      });
      setMembers([]);
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  return { members, isLoading, refreshMembers: fetchMembers };
}

