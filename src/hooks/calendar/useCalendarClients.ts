import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { DatabaseClient } from '@/types/calendar';

export function useCalendarClients(workspaceId: string | undefined) {
  const [clients, setClients] = useState<DatabaseClient[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchClients = useCallback(async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('clients')
        .select('client_id, name, email, phone');

      if (workspaceId) {
        query = query.eq('workspace_id', workspaceId);
      }

      const { data, error } = await query.order('name');

      if (error) {
        console.error('Error fetching clients:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch clients from database',
          variant: 'destructive',
        });
        return;
      }

      setClients(data || []);
    } catch (error) {
      console.error('Error loading clients:', error);
      toast({
        title: 'Error',
        description: 'Failed to load clients',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  return { clients, isLoading, refreshClients: fetchClients };
}

