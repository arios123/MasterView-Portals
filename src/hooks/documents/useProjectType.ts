import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useProjectType(projectId: string) {
  const [projectType, setProjectType] = useState<string>('');

  useEffect(() => {
    const fetchProjectType = async () => {
      try {
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

