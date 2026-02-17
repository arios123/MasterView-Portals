import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { isDemoMode } from '@/utils/demoMode';

export function useProjectType(projectId: string) {
  const [projectType, setProjectType] = useState<string>('');

  useEffect(() => {
    const fetchProjectType = async () => {
      if (isDemoMode()) {
        // In demo mode, get project type from mock projects
        try {
          const { getMockDbProjects } = await import('@/utils/mockData');
          const mockProjects = getMockDbProjects();
          const project = mockProjects.find(p => p.project_id === projectId);
          setProjectType(project?.project_type || '');
        } catch (error) {
          console.error('Error fetching project type:', error);
        }
        return;
      }

      try {
        // COMMENTED OUT IN DEMO MODE - using mock data instead
        const { data, error } = await supabase
          .from('projects')
          .select('project_type')
          .eq('project_id', projectId)
          .single();

        if (error) {
          console.error('Error fetching project type:', error);
          return;
        }

        setProjectType(data?.project_type || '');
      } catch (error) {
        console.error('Error fetching project type:', error);
      }
    };

    fetchProjectType();
  }, [projectId]);

  return { projectType };
}

