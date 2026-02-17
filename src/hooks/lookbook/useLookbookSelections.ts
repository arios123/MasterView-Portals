import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { LookbookItem } from '@/types/lookbook';
import { logInsert, logDelete } from '@/lib/auditLog';
import { useAuth } from '@/contexts/AuthContext';

export function useLookbookSelections(projectId: string, workspaceId: string | undefined) {
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const [likedItems, setLikedItems] = useState<LookbookItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // Load project-specific selections from database
  useEffect(() => {
    const loadProjectSelections = async () => {
      if (!projectId || !workspaceId) return;

      setIsLoading(true);
      try {
        const { data, error } = await (supabase as any)
          .from('project_lookbook_selections')
          .select(`
            lookbook_option_id,
            lookbook_options (*)
          `)
          .eq('project_id', projectId)
          .eq('workspace_id', workspaceId);

        if (error) {
          console.error('Error loading project selections:', error);
          return;
        }

        if (data) {
          const ids = new Set(
            data.map((item: any) => item.lookbook_option_id).filter(Boolean)
          ) as Set<string>;
          setSelectedItemIds(ids);

          const liked: LookbookItem[] = data
            .filter((item: any) => item.lookbook_options)
            .map((item: any) => {
              const opt = item.lookbook_options;
              return {
                id: opt.id,
                title: opt.style,
                brand: opt.brand,
                link: opt.link || '',
                finish: opt.finish,
                price: opt.price ? `$${Number(opt.price).toFixed(2)}` : '$0.00',
                image: opt.image,
                description: `${opt.brand} ${opt.style} in ${opt.finish} finish`,
                category: opt.category,
                model_number: opt.model_number || undefined,
                collection: opt.collection || undefined,
              };
            });
          setLikedItems(liked);
        }
      } catch (error) {
        console.error('Error loading project selections:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (projectId && workspaceId) {
      loadProjectSelections();
    }
  }, [projectId, workspaceId]);

  const toggleLike = async (item: LookbookItem) => {
    if (!projectId || !workspaceId || !item.id) return;

    const isSelected = selectedItemIds.has(item.id);

    try {
      if (isSelected) {
        // Fetch before data for audit log
        const { data: beforeData } = await (supabase as any)
          .from('project_lookbook_selections')
          .select('*')
          .eq('project_id', projectId)
          .eq('lookbook_option_id', item.id)
          .eq('workspace_id', workspaceId)
          .maybeSingle();

        // Remove from database
        const { error } = await (supabase as any)
          .from('project_lookbook_selections')
          .delete()
          .eq('project_id', projectId)
          .eq('lookbook_option_id', item.id)
          .eq('workspace_id', workspaceId);

        if (error) throw error;

        // Log audit event for lookbook item unlike
        if (workspaceId && user && beforeData) {
          await logDelete(workspaceId, user.id, 'project_lookbook_selections', beforeData.id, beforeData, 'LookBook');
        }

        setSelectedItemIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(item.id!);
          return newSet;
        });
        setLikedItems((prev) => prev.filter((liked) => liked.id !== item.id));
      } else {
        // Add to database
        const { data, error } = await (supabase as any)
          .from('project_lookbook_selections')
          .insert({
            project_id: projectId,
            lookbook_option_id: item.id,
            workspace_id: workspaceId,
          })
          .select()
          .single();

        if (error) throw error;

        // Log audit event for lookbook item like
        if (workspaceId && user && data) {
          await logInsert(workspaceId, user.id, 'project_lookbook_selections', data.id, data, 'LookBook');
        }

        setSelectedItemIds((prev) => new Set(prev).add(item.id!));
        setLikedItems((prev) => [...prev, item]);
      }
    } catch (error) {
      console.error('Error toggling selection:', error);
      toast({
        title: 'Error',
        description: `Failed to ${isSelected ? 'remove' : 'add'} selection`,
        variant: 'destructive',
      });
    }
  };

  const clearSelections = async () => {
    if (!projectId || !workspaceId) return false;

    try {
      const { error } = await (supabase as any)
        .from('project_lookbook_selections')
        .delete()
        .eq('project_id', projectId)
        .eq('workspace_id', workspaceId);

      if (error) {
        console.error('Error clearing selections:', error);
        toast({
          title: 'Error',
          description: 'Failed to clear selections',
          variant: 'destructive',
        });
        return false;
      }

      setLikedItems([]);
      setSelectedItemIds(new Set());
      return true;
    } catch (error) {
      console.error('Error clearing selections:', error);
      return false;
    }
  };

  return {
    selectedItemIds,
    likedItems,
    isLoading,
    toggleLike,
    clearSelections,
  };
}

