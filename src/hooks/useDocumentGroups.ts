import { useState, useEffect } from 'react';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { fetchDocumentGroups } from '@/queries/documentGroups';
import { DocumentGroup } from '@/stores/adminStore';
import { toast } from 'sonner';

export function useDocumentGroups() {
  const { currentWorkspace } = useWorkspace();
  const workspaceId = currentWorkspace?.id;
  const [groups, setGroups] = useState<DocumentGroup[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (workspaceId) {
      loadGroups();
    } else {
      setGroups([]);
    }
  }, [workspaceId]);

  const loadGroups = async () => {
    if (!workspaceId) return;
    
    setLoading(true);
    try {
      const data = await fetchDocumentGroups(workspaceId);
      setGroups(data);
    } catch (error) {
      console.error('Error loading document groups:', error);
      toast.error('Failed to load document groups');
    } finally {
      setLoading(false);
    }
  };

  return {
    groups,
    loading,
    refetch: loadGroups,
  };
}

