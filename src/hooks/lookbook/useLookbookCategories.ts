import { useState, useEffect } from 'react';
import { fetchLookbookCategories, LookbookCategory } from '@/queries/lookbookCategories';

export function useLookbookCategories(workspaceId: string | undefined) {
  const [categories, setCategories] = useState<LookbookCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadCategories = async () => {
      if (!workspaceId) {
        setCategories([]);
        return;
      }

      setIsLoading(true);
      try {
        const data = await fetchLookbookCategories(workspaceId);
        setCategories(data);
      } catch (error) {
        console.error('Error loading lookbook categories:', error);
        setCategories([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadCategories();
  }, [workspaceId]);

  return { categories, isLoading };
}

