import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useClientData(clientId: string | undefined) {
  const [clientData, setClientData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchClientData = async () => {
      if (!clientId) {
        setClientData(null);
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('clients')
          .select('*')
          .eq('client_id', clientId)
          .maybeSingle();

        if (error) {
          console.error('Error fetching client:', error);
        } else if (data) {
          setClientData(data);
        }
      } catch (error) {
        console.error('Error fetching client:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchClientData();
  }, [clientId]);

  return { clientData, loading };
}

