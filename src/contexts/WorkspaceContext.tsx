/* @refresh reset */
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/integrations/supabase/client';

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  owner_id?: string | null;
}

export interface WorkspaceMember {
  id: string;
  workspace_id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

interface WorkspaceContextType {
  currentWorkspace: Workspace | null;
  workspaces: Workspace[];
  workspaceMembers: WorkspaceMember[];
  currentUserRole: string | null; // User's role in the current workspace
  loading: boolean;
  setCurrentWorkspace: (workspace: Workspace | null) => void;
  refreshWorkspaces: () => Promise<void>;
  createWorkspace: (name: string, slug: string) => Promise<Workspace>;
  switchWorkspace: (workspaceId: string) => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
};

interface WorkspaceProviderProps {
  children: React.ReactNode;
}

export const WorkspaceProvider: React.FC<WorkspaceProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [workspaceMembers, setWorkspaceMembers] = useState<WorkspaceMember[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Helper function to fetch user role from RBAC system
  const fetchUserRoleFromRBAC = useCallback(async (workspaceMemberId: string, workspaceId: string): Promise<string | null> => {
    try {
      // Get user's roles from workspace_member_roles -> roles
      const { data, error } = await supabase
        .from('workspace_member_roles')
        .select(`
          role_id,
          roles!inner (
            id,
            name,
            workspace_id
          )
        `)
        .eq('workspace_member_id', workspaceMemberId)
        .eq('roles.workspace_id', workspaceId)
        .limit(1);

      if (error) throw error;
      if (data && data.length > 0) {
        return (data[0] as any).roles.name;
      }
      return null;
    } catch (error) {
      console.error('Error fetching user role from RBAC:', error);
      return null;
    }
  }, []);

  // Load workspaces for the current user
  const refreshWorkspaces = useCallback(async () => {
    if (!user) {
      setWorkspaces([]);
      setWorkspaceMembers([]);
      setCurrentWorkspace(null);
      setLoading(false);
      return;
    }

    try {
      // Get all workspaces the user is a member of
      const { data: members, error: membersError } = await supabase
        .from('workspace_members')
        .select('*, workspaces(*)')
        .eq('user_id', user.id);

      if (membersError) throw membersError;

      // Get user's default_workspace_id
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('default_workspace_id')
        .eq('user_id', user.id)
        .single();

      if (userError && userError.code !== 'PGRST116') {
        console.warn('Error fetching user default workspace:', userError);
      }

      const defaultWorkspaceId = userData?.default_workspace_id;

      const workspaceList: Workspace[] = [];
      const memberList: WorkspaceMember[] = [];

      (members || []).forEach((member: any) => {
        if (member.workspaces) {
          workspaceList.push(member.workspaces);
          memberList.push({
            id: member.id,
            workspace_id: member.workspace_id,
            user_id: member.user_id,
            created_at: member.created_at,
            updated_at: member.updated_at,
          });
        }
      });

      setWorkspaces(workspaceList);
      setWorkspaceMembers(memberList);

      // If no current workspace is set, prioritize default_workspace_id, then localStorage, then first workspace
      setCurrentWorkspace(prev => {
        const workspaceToSet = (() => {
          if (prev && workspaceList.find(w => w.id === prev.id)) {
            // Current workspace still exists, keep it
            return prev;
          }
          
          if (workspaceList.length > 0) {
            // Priority: default_workspace_id > localStorage > first workspace
            let workspace: Workspace | undefined;
            
            if (defaultWorkspaceId) {
              workspace = workspaceList.find(w => w.id === defaultWorkspaceId);
            }
            
            if (!workspace) {
              const savedWorkspaceId = localStorage.getItem('currentWorkspaceId');
              workspace = savedWorkspaceId
                ? workspaceList.find(w => w.id === savedWorkspaceId)
                : undefined;
            }
            
            if (!workspace) {
              workspace = workspaceList[0];
            }
            
            if (workspace) {
              localStorage.setItem('currentWorkspaceId', workspace.id);
              return workspace;
            }
          }
          
          return null;
        })();

        // Update current user role based on the workspace we just set
        // Get role from RBAC system (workspace_member_roles -> roles)
        if (workspaceToSet) {
          const member = memberList.find(m => m.workspace_id === workspaceToSet.id && m.user_id === user.id);
          if (member) {
            fetchUserRoleFromRBAC(member.id, workspaceToSet.id).then(role => {
              setCurrentUserRole(role);
            }).catch(() => {
              setCurrentUserRole(null);
            });
          } else {
            setCurrentUserRole(null);
          }
        } else {
          setCurrentUserRole(null);
        }

        return workspaceToSet;
      });
    } catch (error) {
      console.error('Error loading workspaces:', error);
    } finally {
      setLoading(false);
    }
  }, [user, fetchUserRoleFromRBAC]);

  useEffect(() => {
    refreshWorkspaces();
  }, [refreshWorkspaces]);

  // Save current workspace to localStorage when it changes and update user role
  useEffect(() => {
    if (currentWorkspace && user) {
      localStorage.setItem('currentWorkspaceId', currentWorkspace.id);
      // Find user's role in current workspace from RBAC system
      const member = workspaceMembers.find(m => m.workspace_id === currentWorkspace.id && m.user_id === user.id);
      if (member) {
        fetchUserRoleFromRBAC(member.id, currentWorkspace.id).then(role => {
          setCurrentUserRole(role);
        }).catch(() => {
          setCurrentUserRole(null);
        });
      } else {
        setCurrentUserRole(null);
      }
    } else {
      localStorage.removeItem('currentWorkspaceId');
      setCurrentUserRole(null);
    }
  }, [currentWorkspace, user, workspaceMembers, fetchUserRoleFromRBAC]);

  const createWorkspace = async (name: string, slug: string): Promise<Workspace> => {
    if (!user) {
      throw new Error('User must be authenticated to create a workspace');
    }

    try {
      // Create the workspace
      const { data: workspace, error: workspaceError } = await supabase
        .from('workspaces')
        .insert({
          name,
          slug,
          created_by: user.id,
          owner_id: user.id,
        })
        .select()
        .single();

      if (workspaceError) throw workspaceError;

      // Add the creator as a workspace member (no role column)
      const { data: memberData, error: memberError } = await supabase
        .from('workspace_members')
        .insert({
          workspace_id: workspace.id,
          user_id: user.id,
        })
        .select()
        .single();

      if (memberError) throw memberError;

      // Create Admin role for this workspace and assign it to the creator
      // Note: This should ideally use the create_workspace_with_creator function,
      // but we'll do it manually here for now
      const { data: adminRole, error: roleError } = await supabase
        .from('roles')
        .insert({
          workspace_id: workspace.id,
          name: 'Admin',
        })
        .select()
        .single();

      if (roleError) throw roleError;

      // Assign Admin role to the workspace creator
      const { error: assignError } = await supabase
        .from('workspace_member_roles')
        .insert({
          workspace_member_id: memberData.id,
          role_id: adminRole.id,
        });

      if (assignError) throw assignError;

      // Set this workspace as the default if it's the first workspace or the only one
      const { data: existingWorkspaces } = await supabase
        .from('workspace_members')
        .select('workspace_id')
        .eq('user_id', user.id);

      const workspaceCount = existingWorkspaces?.length || 0;
      
      // If this is the first workspace (count = 1, meaning only the one we just created)
      // or if there's only one workspace total, set it as default
      if (workspaceCount === 1) {
        const { error: updateError } = await supabase
          .from('users')
          .update({ default_workspace_id: workspace.id })
          .eq('user_id', user.id);

        if (updateError) {
          console.warn('Error setting default workspace:', updateError);
        }
      }

      // Refresh workspaces and set the new one as current
      await refreshWorkspaces();
      setCurrentWorkspace(workspace);

      return workspace;
    } catch (error) {
      console.error('Error creating workspace:', error);
      throw error;
    }
  };

  const switchWorkspace = async (workspaceId: string) => {
    const workspace = workspaces.find(w => w.id === workspaceId);
    if (workspace && user) {
      setCurrentWorkspace(workspace);
      localStorage.setItem('currentWorkspaceId', workspaceId);
      
      // Update user's default_workspace_id
      const { error: updateError } = await supabase
        .from('users')
        .update({ default_workspace_id: workspaceId })
        .eq('user_id', user.id);

      if (updateError) {
        console.warn('Error updating default workspace:', updateError);
      }
    }
  };

  const value = {
    currentWorkspace,
    workspaces,
    workspaceMembers,
    currentUserRole,
    loading,
    setCurrentWorkspace,
    refreshWorkspaces,
    createWorkspace,
    switchWorkspace,
  };

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
};


