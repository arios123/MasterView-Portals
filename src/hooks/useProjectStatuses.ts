import { useState, useEffect } from 'react';
import { ProjectStatus, projectStatusesQueries } from '@/queries/projectStatuses';
import { toast } from 'sonner';

export function useProjectStatuses(workspaceId: string | undefined) {
  const [projectStatuses, setProjectStatuses] = useState<ProjectStatus[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProjectStatuses = async () => {
    if (!workspaceId) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const data = await projectStatusesQueries.getByWorkspace(workspaceId);
      setProjectStatuses(data);
    } catch (error) {
      console.error('Error fetching project statuses:', error);
      toast.error('Failed to load project statuses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectStatuses();
  }, [workspaceId]);

  return {
    projectStatuses,
    loading,
    refetch: fetchProjectStatuses,
  };
}


