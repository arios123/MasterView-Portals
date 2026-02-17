import { useMemo } from 'react';
import { useDocumentGroups } from '@/hooks/useDocumentGroups';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { fetchDocumentGroupIdsForTab, TabIdentifier } from '@/queries/documentGroupTabConfigurations';
import { useState, useEffect } from 'react';

/**
 * Hook to get document groups configured for a specific tab
 * If no groups are selected, returns empty array (no groups shown)
 */
export function useDocumentGroupsForTab(tabIdentifier: TabIdentifier) {
  const { currentWorkspace } = useWorkspace();
  const workspaceId = currentWorkspace?.id;
  const { groups, loading: groupsLoading } = useDocumentGroups();
  const [configuredGroupIds, setConfiguredGroupIds] = useState<string[]>([]);
  const [loadingConfig, setLoadingConfig] = useState(false);

  // Fetch configured document group IDs for this tab
  useEffect(() => {
    if (!workspaceId) {
      setConfiguredGroupIds([]);
      return;
    }

    setLoadingConfig(true);
    fetchDocumentGroupIdsForTab(workspaceId, tabIdentifier)
      .then(ids => {
        setConfiguredGroupIds(ids);
      })
      .catch(error => {
        console.error('Error fetching document group tab configurations:', error);
        // On error, default to showing no groups
        setConfiguredGroupIds([]);
      })
      .finally(() => {
        setLoadingConfig(false);
      });
  }, [workspaceId, tabIdentifier]);

  // Return filtered groups based on configuration
  const documentGroups = useMemo(() => {
    // If configuration is loading or workspace not available, return empty array
    if (!workspaceId || (groupsLoading || loadingConfig)) {
      return [];
    }

    // If no groups are configured (empty array), return empty array (show none)
    if (configuredGroupIds.length === 0) {
      return [];
    }

    // Return only the configured groups
    return groups.filter(group => configuredGroupIds.includes(group.id));
  }, [groups, configuredGroupIds, groupsLoading, loadingConfig, workspaceId]);

  // Get slugs for the configured groups
  const documentGroupSlugs = useMemo(() => {
    return documentGroups.map(group => group.slug);
  }, [documentGroups]);

  return {
    documentGroups,
    documentGroupSlugs,
    loading: groupsLoading || loadingConfig,
  };
}

