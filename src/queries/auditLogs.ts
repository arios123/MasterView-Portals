import { supabase } from '@/integrations/supabase/client';

export interface AuditLog {
  id: string;
  workspace_id: string;
  user_id: string;
  action: 'insert' | 'update' | 'delete';
  resource_type: string;
  resource_id: string;
  resource_location: string | null;
  before_data: Record<string, any> | null;
  after_data: Record<string, any> | null;
  changed_fields: string[] | null;
  created_at: string;
  // Joined user data
  user_name?: string | null;
  user_email?: string | null;
}

export interface AuditLogFilters {
  resourceType?: string;
  action?: 'insert' | 'update' | 'delete';
  userId?: string;
  startDate?: string;
  endDate?: string;
  resourceId?: string;
}

/**
 * Fetch audit logs for a workspace with optional filters
 */
export async function fetchAuditLogs(
  workspaceId: string,
  filters: AuditLogFilters = {},
  limit = 100,
  offset = 0
): Promise<AuditLog[]> {
  let query = (supabase as any)
    .from('audit_logs')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  // Apply filters
  if (filters.resourceType) {
    query = query.eq('resource_type', filters.resourceType);
  }

  if (filters.action) {
    query = query.eq('action', filters.action);
  }

  if (filters.userId) {
    query = query.eq('user_id', filters.userId);
  }

  if (filters.startDate) {
    query = query.gte('created_at', filters.startDate);
  }

  if (filters.endDate) {
    query = query.lte('created_at', filters.endDate);
  }

  if (filters.resourceId) {
    query = query.eq('resource_id', filters.resourceId);
  }

  const { data, error } = await query;

  if (error) throw error;

  if (!data || data.length === 0) return [];

  // Fetch user data for all unique user IDs
  const userIds = Array.from(new Set((data || []).map((log: any) => log.user_id).filter(Boolean))) as string[];
  const usersMap = new Map<string, { name: string | null; email: string | null }>();

  if (userIds.length > 0) {
    try {
      const { data: users, error: usersError } = await (supabase as any)
        .from('users')
        .select('user_id, name, email')
        .in('user_id', userIds);

      if (!usersError && users) {
        (users as any[]).forEach((user: any) => {
          usersMap.set(user.user_id, {
            name: user.name || null,
            email: user.email || null,
          });
        });
      }
    } catch (err) {
      console.error('Error fetching user data for audit logs:', err);
      // Continue without user data if fetch fails
    }
  }

  // Transform the data to include user info
  return (data || []).map((log: any) => {
    const user = usersMap.get(log.user_id);
    return {
      ...log,
      user_name: user?.name || null,
      user_email: user?.email || null,
    };
  });
}

/**
 * Get count of audit logs for a workspace (for pagination)
 */
export async function getAuditLogCount(
  workspaceId: string,
  filters: AuditLogFilters = {}
): Promise<number> {
  let query = (supabase as any)
    .from('audit_logs')
    .select('id', { count: 'exact', head: true })
    .eq('workspace_id', workspaceId);

  // Apply filters
  if (filters.resourceType) {
    query = query.eq('resource_type', filters.resourceType);
  }

  if (filters.action) {
    query = query.eq('action', filters.action);
  }

  if (filters.userId) {
    query = query.eq('user_id', filters.userId);
  }

  if (filters.startDate) {
    query = query.gte('created_at', filters.startDate);
  }

  if (filters.endDate) {
    query = query.lte('created_at', filters.endDate);
  }

  if (filters.resourceId) {
    query = query.eq('resource_id', filters.resourceId);
  }

  const { count, error } = await query;

  if (error) throw error;

  return count || 0;
}

/**
 * Get unique resource types for a workspace (for filter dropdown)
 */
export async function getAuditLogResourceTypes(workspaceId: string): Promise<string[]> {
  const { data, error } = await (supabase as any)
    .from('audit_logs')
    .select('resource_type')
    .eq('workspace_id', workspaceId)
    .order('resource_type');

  if (error) throw error;

  // Get unique resource types
  const uniqueTypes: string[] = Array.from(new Set((data || []).map((log: any) => log.resource_type as string)));
  return uniqueTypes.sort();
}

/**
 * Get unique users who have performed actions in a workspace (for filter dropdown)
 */
export async function getAuditLogUsers(workspaceId: string): Promise<Array<{ id: string; name: string | null; email: string | null }>> {
  const { data, error } = await (supabase as any)
    .from('audit_logs')
    .select('user_id')
    .eq('workspace_id', workspaceId);

  if (error) throw error;

  // Get unique user IDs
  const userIds = Array.from(new Set((data || []).map((log: any) => log.user_id).filter((id): id is string => Boolean(id))));

  if (userIds.length === 0) return [];

  // Fetch user data
  const { data: users, error: usersError } = await (supabase as any)
    .from('users')
    .select('user_id, name, email')
    .in('user_id', userIds);

  if (usersError) {
    console.error('Error fetching users for audit log filter:', usersError);
    // Return user IDs without names if fetch fails
    return userIds.map((id: string) => ({ id, name: null, email: null }));
  }

  // Create a map for quick lookup
  const usersMap = new Map<string, { name: string | null; email: string | null }>();
  (users as any[] || []).forEach((u: any) => {
    usersMap.set(u.user_id, {
      name: u.name || null,
      email: u.email || null,
    });
  });

  // Return all unique users with their data
  return userIds.map((userId: string) => {
    const user = usersMap.get(userId);
    return {
      id: userId,
      name: user?.name || null,
      email: user?.email || null,
    };
  }).sort((a, b) => {
    const nameA = a.name || a.email || '';
    const nameB = b.name || b.email || '';
    return nameA.localeCompare(nameB);
  });
}

