import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseChangeOrderDraftsParams {
  projectId: string;
  workspaceId: string | undefined;
  isSoldProject: boolean;
}

export function useChangeOrderDrafts({ projectId, workspaceId, isSoldProject }: UseChangeOrderDraftsParams) {
  const [drafts, setDrafts] = useState<any[]>([]);
  const [selectedDraftId, setSelectedDraftId] = useState<string>('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Load drafts for change orders (only if not a sold project)
  useEffect(() => {
    if (!isSoldProject && workspaceId) {
      fetchDrafts();
    }
  }, [projectId, isSoldProject, workspaceId]);

  const fetchDrafts = async () => {
    if (!workspaceId) return;
    try {
      const { data, error } = await (supabase as any)
        .from('project_versions')
        .select('*')
        .eq('project_id', projectId)
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDrafts(data || []);
    } catch (error) {
      console.error('Error fetching drafts:', error);
    }
  };

  return {
    drafts,
    selectedDraftId,
    setSelectedDraftId,
    isDropdownOpen,
    setIsDropdownOpen,
    fetchDrafts,
  };
}
