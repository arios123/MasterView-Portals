import { supabase } from '@/integrations/supabase/client';

export type PendingInvite = {
  workspaceId: string;
  workspaceName?: string;
  role: string;
  invitedBy?: string;
};

/**
 * Get pending workspace invites from user metadata
 * First tries to get from edge function (reads from raw_user_meta_data),
 * then falls back to user_metadata from client
 */
export async function getPendingWorkspaceInvites(userId: string): Promise<PendingInvite[]> {
  try {
    // First, try to get invites from edge function (reads from database raw_user_meta_data)
    // This is more reliable because it reads directly from auth.users table
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data, error } = await supabase.functions.invoke('get-user-invites', {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (!error && data?.invites && Array.isArray(data.invites) && data.invites.length > 0) {
          console.log('Found invites from edge function (raw_user_meta_data):', data.invites);
          return data.invites.map((inv: any) => ({
            workspaceId: inv.workspaceId,
            role: inv.role,
            invitedBy: inv.invited_by,
            workspaceName: inv.workspaceName,
          }));
        }
      }
    } catch (edgeFunctionError) {
      console.warn('Edge function get-user-invites failed, falling back to user_metadata:', edgeFunctionError);
      // Continue to fallback method
    }

    // Fallback: Get user metadata from auth.users via client SDK
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('Error getting user for invites:', userError);
      throw new Error('User not found');
    }

    const invites: PendingInvite[] = [];
    const metadata = user.user_metadata || {};
    
    console.log('Reading invite metadata from user_metadata:', {
      userId: user.id,
      email: user.email,
      metadata: metadata,
      hasWorkspaceId: !!metadata.workspace_id,
      hasRole: !!metadata.role,
      hasPendingInvites: !!metadata.pending_invites,
    });

    // Check if there are multiple invites (stored as array) - check this first
    if (metadata.pending_invites && Array.isArray(metadata.pending_invites)) {
      metadata.pending_invites.forEach((invite: any) => {
        if (invite.workspace_id && invite.role) {
          // Avoid duplicates
          if (!invites.find(inv => inv.workspaceId === invite.workspace_id)) {
            invites.push({
              workspaceId: invite.workspace_id,
              role: invite.role,
              invitedBy: invite.invited_by,
              workspaceName: invite.workspace_name,
            });
          }
        }
      });
    }

    // Check if there's a single invite (workspace_id and role in metadata)
    // Only add if not already in the array from pending_invites
    if (metadata.workspace_id && metadata.role) {
      const existingInvite = invites.find(inv => inv.workspaceId === metadata.workspace_id);
      if (!existingInvite) {
        invites.push({
          workspaceId: metadata.workspace_id,
          role: metadata.role,
          invitedBy: metadata.invited_by,
          workspaceName: metadata.workspace_name,
        });
      }
    }

    // Fetch workspace names for each invite
    if (invites.length > 0) {
      const workspaceIds = invites.map(inv => inv.workspaceId);
      const { data: workspaces, error: workspaceError } = await (supabase as any)
        .from('workspaces')
        .select('id, name')
        .in('id', workspaceIds);

      if (!workspaceError && workspaces) {
        const workspaceMap = new Map(workspaces.map((w: any) => [w.id, w.name]));
        invites.forEach(invite => {
          invite.workspaceName = workspaceMap.get(invite.workspaceId);
        });
      }
    }

    return invites;
  } catch (error) {
    console.error('Error getting pending invites:', error);
    return [];
  }
}

/**
 * Complete a workspace invitation
 * Adds user to workspace and assigns the specified role
 */
export async function completeWorkspaceInvite(
  userId: string,
  workspaceId: string,
  roleName: string
): Promise<{ success: boolean; message: string }> {
  try {
    // Normalize role name (capitalize first letter)
    const normalizedRoleName = roleName.charAt(0).toUpperCase() + roleName.slice(1).toLowerCase();

    // Use SECURITY DEFINER function to add/update member and assign role
    // This bypasses RLS policies for both workspace_members and workspace_member_roles
    // The function handles both new and existing members using ON CONFLICT
    const { data: workspaceMemberId, error: addMemberError } = await (supabase as any)
      .rpc('add_workspace_member_with_role', {
        _workspace_id: workspaceId,
        _user_id: userId,
        _role_name: normalizedRoleName
      });

    if (addMemberError) {
      throw new Error(`Failed to add user to workspace: ${addMemberError.message}`);
    }

    return {
      success: true,
      message: `Successfully added to workspace with role "${normalizedRoleName}"`,
    };
  } catch (error: any) {
    console.error('Error completing workspace invite:', error);
    return {
      success: false,
      message: error.message || 'Failed to complete workspace invitation',
    };
  }
}

/**
 * Remove invite metadata from user after completing invite
 */
export async function clearInviteMetadata(workspaceId: string): Promise<void> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return;
    }

    const metadata = user.user_metadata || {};
    const updatedMetadata: any = { ...metadata };

    // Remove single invite if it matches
    if (metadata.workspace_id === workspaceId) {
      delete updatedMetadata.workspace_id;
      delete updatedMetadata.role;
      delete updatedMetadata.invited_by;
    }

    // Remove from pending_invites array if it exists
    if (metadata.pending_invites && Array.isArray(metadata.pending_invites)) {
      updatedMetadata.pending_invites = metadata.pending_invites.filter(
        (invite: any) => invite.workspace_id !== workspaceId
      );
      
      // If array is empty, remove it
      if (updatedMetadata.pending_invites.length === 0) {
        delete updatedMetadata.pending_invites;
      }
    }

    // Update user metadata
    await supabase.auth.updateUser({
      data: updatedMetadata,
    });
  } catch (error) {
    console.error('Error clearing invite metadata:', error);
    // Don't throw - this is cleanup, not critical
  }
}

