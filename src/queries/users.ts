import { supabase } from '@/integrations/supabase/client';
import { isDemoMode } from '@/utils/demoMode';
import { getMockUserRecord } from '@/utils/mockData';

/**
 * Fetch user data by user ID
 * Note: This fetches basic user info. For workspace-specific role, use workspace_members table.
 */
export const fetchUserById = async (userId: string) => {
  if (isDemoMode()) {
    const mockUser = getMockUserRecord();
    return {
      name: mockUser.name,
      email: mockUser.email,
      user_id: mockUser.user_id,
    };
  }

  // COMMENTED OUT IN DEMO MODE - using mock data instead
  const { data, error } = await (supabase as any)
    .from("users")
    .select("name, email, user_id")
    .eq("user_id", userId)
    .single();

  if (error) throw error;
  return data;
};

/**
 * Get user's role in a specific workspace
 * 
 * Architecture:
 * - Queries workspace_members -> workspace_member_roles -> roles to get the role name
 * - Returns the first role if user has multiple roles
 */
export const getUserWorkspaceRole = async (userId: string, workspaceId: string) => {
  const { data, error } = await (supabase as any)
    .from("workspace_members")
    .select(`
      id,
      workspace_member_roles (
        roles (
          name,
          workspace_id
        )
      )
    `)
    .eq("user_id", userId)
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  if (error) throw error;
  
  // Get the first role from workspace_member_roles
  if (data?.workspace_member_roles && Array.isArray(data.workspace_member_roles) && data.workspace_member_roles.length > 0) {
    const firstRole = data.workspace_member_roles[0];
    if (firstRole.roles && firstRole.roles.workspace_id === workspaceId) {
      return firstRole.roles.name;
    }
  }
  
  return null;
};

/**
 * Update user role in a workspace (RBAC system)
 * 
 * Architecture:
 * - workspace_members links users ↔ workspaces
 * - workspace_member_roles links workspace_members ↔ roles
 * - roles table stores role definitions per workspace
 * 
 * This function:
 * 1. Finds or creates the role with the given name in the workspace
 * 2. Gets the workspace_member record for the user
 * 3. Removes all existing role assignments for that member
 * 4. Assigns the new role to the member
 */
export const updateUserRole = async (userId: string, roleName: string, workspaceId: string) => {
  // Step 0: Prevent changing the workspace owner's role (owner must remain Admin)
  const { data: workspace, error: workspaceError } = await (supabase as any)
    .from("workspaces")
    .select("owner_id")
    .eq("id", workspaceId)
    .maybeSingle();

  if (workspaceError) throw workspaceError;

  if (workspace && workspace.owner_id === userId) {
    throw new Error("You cannot change the role of the workspace owner");
  }

  // Step 1: Get or create the role in the workspace
  // Normalize role name: capitalize first letter, rest lowercase (e.g., "Admin", "Designer")
  const normalizedRoleName = roleName.charAt(0).toUpperCase() + roleName.slice(1).toLowerCase();
  let roleId: string;
  
  // Check if role exists (exact match with normalized name)
  const { data: existingRole, error: roleCheckError } = await (supabase as any)
    .from("roles")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("name", normalizedRoleName)
    .maybeSingle();
  
  if (roleCheckError) throw roleCheckError;
  
  if (existingRole) {
    roleId = existingRole.id;
  } else {
    // Create the role if it doesn't exist
    const { data: newRole, error: createRoleError } = await (supabase as any)
      .from("roles")
      .insert({ workspace_id: workspaceId, name: normalizedRoleName })
      .select("id")
      .single();
    
    if (createRoleError) throw createRoleError;
    roleId = newRole.id;
  }
  
  // Step 2: Get the workspace_member record
  const { data: member, error: memberError } = await (supabase as any)
    .from("workspace_members")
    .select("id")
    .eq("user_id", userId)
    .eq("workspace_id", workspaceId)
    .single();
  
  if (memberError) throw memberError;
  if (!member) throw new Error("User is not a member of this workspace");
  
  const workspaceMemberId = member.id;
  
  // Step 3: Remove all existing role assignments for this member
  const { error: deleteError } = await (supabase as any)
    .from("workspace_member_roles")
    .delete()
    .eq("workspace_member_id", workspaceMemberId);
  
  if (deleteError) throw deleteError;
  
  // Step 4: Assign the new role
  const { data: newAssignment, error: insertError } = await (supabase as any)
    .from("workspace_member_roles")
    .insert({ workspace_member_id: workspaceMemberId, role_id: roleId })
    .select()
    .single();
  
  if (insertError) throw insertError;
  
  return { success: true, role: roleName };
};

/**
 * Fetch all users in a workspace (via workspace_members join table)
 * 
 * Architecture:
 * - workspace_members is a JOIN TABLE linking users ↔ workspaces
 * - Roles are now stored in workspace_member_roles -> roles (RBAC system)
 * - This function fetches users who are members of a specific workspace with their roles
 */
export const fetchAllUsers = async (workspaceId: string, limit = 100, offset = 0) => {
  // Fetch workspace members with their roles from the RBAC system and workspace owner info
  const { data: members, error: membersError } = await (supabase as any)
    .from("workspace_members")
    .select(`
      id,
      user_id,
      created_at,
      updated_at,
      workspace_id,
      workspaces (
        owner_id
      ),
      workspace_member_roles (
        roles (
          id,
          name,
          workspace_id
        )
      )
    `)
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (membersError) throw membersError;
  if (!members || members.length === 0) return [];

  // Extract user IDs
  const userIds = members.map((m: any) => m.user_id).filter(Boolean);

  if (userIds.length === 0) return [];

  // Fetch user details from users table
  const { data: users, error: usersError } = await (supabase as any)
    .from("users")
    .select("user_id, name, email")
    .in("user_id", userIds);

  if (usersError) throw usersError;

  // Create a map of user_id to user data
  const usersMap = new Map((users || []).map((u: any) => [u.user_id, u]));

  // Combine members with user data and roles
  return members.map((member: any) => {
    const user = usersMap.get(member.user_id) as { user_id: string; name: string | null; email: string | null } | undefined;
    
    // Get the first role from workspace_member_roles (users can have multiple roles, but we'll use the first one)
    let role: string | null = null;
    if (member.workspace_member_roles && Array.isArray(member.workspace_member_roles) && member.workspace_member_roles.length > 0) {
      const firstRole = member.workspace_member_roles[0];
      if (firstRole.roles && firstRole.roles.workspace_id === workspaceId) {
        role = firstRole.roles.name;
      }
    }

    const isOwner = !!member.workspaces && member.workspaces.owner_id === member.user_id;
    
    return {
      user_id: member.user_id,
      id: member.user_id, // For compatibility
      name: user?.name || null,
      email: user?.email || null,
      role: role,
      created_at: member.created_at,
      updated_at: member.updated_at,
      isOwner,
    };
  });
};

/**
 * Fetch users by IDs within a workspace
 * This ensures users are only fetched if they belong to the workspace
 */
export const fetchUsersByIds = async (userIds: string[], workspaceId?: string) => {
  if (userIds.length === 0) return [];

  // If workspaceId is provided, verify users are in the workspace
  if (workspaceId) {
    // First, get workspace members that match the user IDs
    const { data: members, error: membersError } = await (supabase as any)
      .from("workspace_members")
      .select("user_id")
      .eq("workspace_id", workspaceId)
      .in("user_id", userIds);

    if (membersError) throw membersError;

    // Get the user IDs that are actually in the workspace
    const validUserIds = (members || []).map((m: any) => m.user_id);
    
    if (validUserIds.length === 0) return [];

    // Fetch user details for valid user IDs
    const { data: users, error: usersError } = await (supabase as any)
      .from("users")
      .select("user_id, name, email")
      .in("user_id", validUserIds);

    if (usersError) throw usersError;
    return users || [];
  }
  
  // If no workspaceId, just fetch from users table
  const { data, error } = await (supabase as any)
    .from("users")
    .select("user_id, name, email")
    .in("user_id", userIds);

  if (error) throw error;
  return data || [];
};

/**
 * Check if user has accepted the latest terms and conditions
 * @param userId - The user ID
 * @param currentVersion - The current terms version to check against
 * @returns true if user has accepted the current version, false otherwise
 * In demo mode, checks sessionStorage instead of database
 */
export const hasAcceptedLatestTerms = async (
  userId: string,
  currentVersion: string
): Promise<boolean> => {
  // In demo mode, check sessionStorage (no database calls)
  if (isDemoMode()) {
    return sessionStorage.getItem('demo_terms_accepted') === 'true';
  }

  const { data, error } = await (supabase as any)
    .from("terms_acceptances")
    .select("terms_version")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("Error checking terms acceptance:", error);
    return false;
  }

  // If no record exists, user hasn't accepted
  if (!data) {
    return false;
  }

  // Check if accepted version matches current version
  return data.terms_version === currentVersion;
};

/**
 * Get user's accepted terms version
 * @param userId - The user ID
 * @returns The terms version the user has accepted, or null if none
 */
export const getUserAcceptedTermsVersion = async (
  userId: string
): Promise<string | null> => {
  const { data, error } = await (supabase as any)
    .from("terms_acceptances")
    .select("terms_version")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("Error fetching terms acceptance:", error);
    return null;
  }

  return data?.terms_version || null;
};

/**
 * Record terms and conditions acceptance for a user
 * @param userId - The user ID
 * @param termsVersion - The version of terms accepted (e.g., "v1")
 * In demo mode, stores in sessionStorage instead of database
 */
export const acceptTerms = async (userId: string, termsVersion: string = "v1") => {
  // In demo mode, store in sessionStorage (no database calls)
  if (isDemoMode()) {
    sessionStorage.setItem('demo_terms_accepted', 'true');
    return { user_id: userId, terms_version: termsVersion, accepted_at: new Date().toISOString() };
  }

  const now = new Date().toISOString();
  
  // Use upsert to either insert new acceptance or update existing one
  const { data, error } = await (supabase as any)
    .from("terms_acceptances")
    .upsert(
      {
        user_id: userId,
        terms_version: termsVersion,
        accepted_at: now,
        created_by: userId,
        created_at: now,
        updated_by: userId,
        updated_at: now,
      },
      {
        onConflict: "user_id",
      }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
};

