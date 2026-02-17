import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DocumentChangeOrder } from '@/types/documents';

export function useDocumentChangeOrders(projectId: string, shouldFetch: boolean) {
  const [changeOrders, setChangeOrders] = useState<DocumentChangeOrder[]>([]);

  useEffect(() => {
    const fetchChangeOrders = async () => {
      if (!shouldFetch) {
        setChangeOrders([]);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('project_versions')
          .select('version_id, name, status, created_at')
          .eq('project_id', projectId)
          .ilike('status', '%Change Order%')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching change orders:', error);
          return;
        }

        setChangeOrders(data || []);
      } catch (error) {
        console.error('Error fetching change orders:', error);
      }
    };

    fetchChangeOrders();
  }, [projectId, shouldFetch]);

  return { changeOrders };
}

