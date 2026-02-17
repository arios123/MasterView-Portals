import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { LookbookItem } from '@/types/lookbook';

export function useLookbookItems(workspaceId: string | undefined) {
  const [items, setItems] = useState<LookbookItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadLookbookItems = async () => {
      if (!workspaceId) return;

      setIsLoading(true);
      try {
        const { data, error } = await (supabase as any)
          .from('lookbook_options')
          .select('*')
          .eq('workspace_id', workspaceId)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error loading lookbook items:', error);
          return;
        }

        if (data) {
          const transformedItems: LookbookItem[] = data.map((item) => ({
            id: item.id,
            title: item.title || item.style,
            brand: item.brand,
            link: item.link || '',
            finish: item.finish,
            price: item.price ? `$${Number(item.price).toFixed(2)}` : '$0.00',
            image: item.image,
            description: `${item.brand} ${item.style} in ${item.finish} finish`,
            category: item.category,
            model_number: item.model_number || undefined,
            collection: item.collection || undefined,
          }));
          setItems(transformedItems);
        }
      } catch (error) {
        console.error('Error loading lookbook items:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (workspaceId) {
      loadLookbookItems();
    }
  }, [workspaceId]);

  return { items, isLoading };
}

