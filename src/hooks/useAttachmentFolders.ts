import { useState, useEffect } from 'react';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { fetchAttachmentFolders } from '@/queries/attachmentFolders';
import { AttachmentFolder } from '@/stores/adminStore';
import { toast } from 'sonner';

export function useAttachmentFolders() {
  const { currentWorkspace } = useWorkspace();
  const workspaceId = currentWorkspace?.id;
  const [folders, setFolders] = useState<AttachmentFolder[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (workspaceId) {
      loadFolders();
    } else {
      setFolders([]);
    }
  }, [workspaceId]);

  const loadFolders = async () => {
    if (!workspaceId) return;
    
    setLoading(true);
    try {
      const data = await fetchAttachmentFolders(workspaceId);
      setFolders(data);
    } catch (error) {
      console.error('Error loading attachment folders:', error);
      toast.error('Failed to load attachment folders');
    } finally {
      setLoading(false);
    }
  };

  return {
    folders,
    loading,
    refetch: loadFolders,
  };
}

