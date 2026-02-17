import { useState, useEffect } from 'react';
import { ProjectProgressConfigWithSegments, projectProgressConfigQueries } from '@/queries/projectProgressConfig';
import { toast } from 'sonner';

export function useProjectProgressConfig(workspaceId: string | undefined) {
  const [config, setConfig] = useState<ProjectProgressConfigWithSegments | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchConfig = async () => {
    if (!workspaceId) {
      setLoading(false);
      setConfig(null);
      return;
    }
    
    setLoading(true);
    try {
      const data = await projectProgressConfigQueries.getByWorkspace(workspaceId);
      setConfig(data);
    } catch (error) {
      console.error('Error fetching progress config:', error);
      toast.error('Failed to load progress configuration');
      setConfig(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, [workspaceId]);

  return {
    config,
    loading,
    refetch: fetchConfig,
  };
}

