import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ClientProject } from '@/types/calendar';

export function useClientProjects(clientId: string | undefined) {
  const [projects, setProjects] = useState<ClientProject[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchClientProjects = async () => {
      if (!clientId) {
        setProjects([]);
        return;
      }

      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('project_id, name, address, project_type')
          .eq('client_id', clientId)
          .order('name');

        if (error) {
          console.error('Error fetching projects:', error);
          return;
        }

        setProjects(data || []);
      } catch (error) {
        console.error('Error loading projects:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchClientProjects();
  }, [clientId]);

  return { projects, isLoading };
}

