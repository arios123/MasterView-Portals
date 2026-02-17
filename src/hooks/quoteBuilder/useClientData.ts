import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useClientData(clientId: string | undefined, workspaceId: string | undefined) {
  const [clientData, setClientData] = useState<any>(null);

  useEffect(() => {
    const fetchClientData = async () => {
      if (!clientId || !workspaceId) {
        setClientData(null);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('clients')
          .select('*')
          .eq('client_id', clientId)
          .eq('workspace_id', workspaceId)
          .maybeSingle();

        if (error) {
          console.error('Error fetching client:', error);
        } else if (data) {
          setClientData(data);
        }
      } catch (error) {
        console.error('Error fetching client:', error);
      }
    };

    fetchClientData();
  }, [clientId, workspaceId]);

  return { clientData };
}

