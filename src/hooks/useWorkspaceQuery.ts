import { useWorkspace } from '@/contexts/WorkspaceContext';
import { PostgrestQueryBuilder } from '@supabase/postgrest-js';

/**
 * Helper hook that adds workspace_id filtering to Supabase queries
 * This ensures all queries are automatically scoped to the current workspace
 */
export const useWorkspaceQuery = () => {
  const { currentWorkspace } = useWorkspace();

  /**
   * Wraps a Supabase query to automatically filter by workspace_id
   * @param queryBuilder - The Supabase query builder (e.g., supabase.from('table'))
   * @returns The query builder with workspace_id filter applied
   */
  const withWorkspace = <T>(queryBuilder: any): T => {
    if (!currentWorkspace) {
      // If no workspace is set, return query as-is (will be handled by RLS)
      return queryBuilder;
    }

    // Add workspace_id filter
    return queryBuilder.eq('workspace_id', currentWorkspace.id);
  };

  /**
   * Wraps a Supabase insert to automatically add workspace_id
   * @param data - The data to insert
   * @returns The data with workspace_id added
   */
  const withWorkspaceInsert = <T extends Record<string, any>>(data: T): T => {
    if (!currentWorkspace) {
      return data;
    }

    return {
      ...data,
      workspace_id: currentWorkspace.id,
    };
  };

  return {
    currentWorkspace,
    workspaceId: currentWorkspace?.id,
    withWorkspace,
    withWorkspaceInsert,
  };
};

