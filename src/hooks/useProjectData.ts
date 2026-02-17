import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { toast } from 'sonner';
import { LineItem } from '@/types';
import { fetchProjectVersions } from '@/queries/versions';
import { fetchActiveDraft } from '@/queries/versions';
import { fetchChangeOrders } from '@/queries/versions';
import { fetchProjectPayments } from '@/queries/payments';
import { isDemoMode } from '@/utils/demoMode';
import { getMockUserRecord } from '@/utils/mockData';

export const useProjectVersions = (projectId: string) => {
  const { currentWorkspace } = useWorkspace();
  const workspaceId = currentWorkspace?.id;
  const [versions, setVersions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchVersions = async () => {
    if (!workspaceId || !projectId) {
      setVersions([]);
      return;
    }

    setIsLoading(true);
    try {
      const data = await fetchProjectVersions(projectId, workspaceId);
      setVersions(data);
    } catch (error) {
      console.error('Error fetching versions:', error);
      toast.error('Failed to load project versions');
      setVersions([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVersions();
  }, [projectId, workspaceId]);

  return { versions, isLoading, refetch: fetchVersions };
};

export const useActiveDraft = (projectId: string, shouldFetch: boolean) => {
  const { currentWorkspace } = useWorkspace();
  const workspaceId = currentWorkspace?.id;
  const [activeDraftItems, setActiveDraftItems] = useState<LineItem[]>([]);
  const [activeDraftMultiplier, setActiveDraftMultiplier] = useState(1);
  const [activeVersionId, setActiveVersionId] = useState<string | null>(null);
  const [activeDraftName, setActiveDraftName] = useState<string>('');

  const fetchActiveDraftData = async () => {
    if (!shouldFetch || !workspaceId || !projectId) {
      setActiveDraftItems([]);
      setActiveVersionId(null);
      return;
    }
    
    try {
      const draftData = await fetchActiveDraft(projectId, workspaceId);
      
      setActiveDraftItems(draftData.items);
      setActiveDraftMultiplier(draftData.multiplier);
      setActiveVersionId(draftData.versionId);
      setActiveDraftName(draftData.name);
    } catch (error) {
      console.error('Error fetching active draft:', error);
      setActiveDraftItems([]);
      setActiveVersionId(null);
    }
  };

  useEffect(() => {
    fetchActiveDraftData();
  }, [projectId, shouldFetch, workspaceId]);

  return { activeDraftItems, activeDraftMultiplier, activeVersionId, activeDraftName, refetch: fetchActiveDraftData };
};

export const useChangeOrders = (projectId: string, shouldFetch: boolean) => {
  const { currentWorkspace } = useWorkspace();
  const workspaceId = currentWorkspace?.id;
  const [changeOrderVersions, setChangeOrderVersions] = useState<any[]>([]);
  const [activeChangeOrders, setActiveChangeOrders] = useState<any[]>([]);

  const fetchChangeOrdersData = async () => {
    if (!shouldFetch || !workspaceId || !projectId) {
      setChangeOrderVersions([]);
      setActiveChangeOrders([]);
      return;
    }
    
    try {
      const changeOrders = await fetchChangeOrders(projectId, workspaceId);
      setChangeOrderVersions(changeOrders);
      const activeOnes = changeOrders.filter(co => co.is_active);
      setActiveChangeOrders(activeOnes);
    } catch (error) {
      console.error('Error fetching change orders:', error);
      setChangeOrderVersions([]);
      setActiveChangeOrders([]);
    }
  };

  useEffect(() => {
    fetchChangeOrdersData();
  }, [projectId, shouldFetch, workspaceId]);

  return { changeOrderVersions, activeChangeOrders, refetch: fetchChangeOrdersData };
};

export const usePayments = (projectId: string, shouldFetch: boolean) => {
  const { currentWorkspace } = useWorkspace();
  const workspaceId = currentWorkspace?.id;
  const [incoming, setIncoming] = useState<any[]>([]);

  const fetchPaymentsData = async () => {
    if (!shouldFetch || !workspaceId || !projectId) {
      setIncoming([]);
      return;
    }
    
    try {
      const payments = await fetchProjectPayments(projectId, workspaceId);
      setIncoming(payments);
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast.error('Failed to load payments');
      setIncoming([]);
    }
  };

  useEffect(() => {
    fetchPaymentsData();
  }, [projectId, shouldFetch, workspaceId]);

  return { incoming, refetch: fetchPaymentsData };
};

export const useAssignedUser = (assignedUserId?: string) => {
  const [assignedUserName, setAssignedUserName] = useState<string>('Unassigned');

  useEffect(() => {
    const fetchUser = async () => {
      if (!assignedUserId) {
        setAssignedUserName('Unassigned');
        return;
      }

      if (isDemoMode()) {
        // In demo mode, return demo user name
        const mockUser = getMockUserRecord();
        setAssignedUserName(mockUser.name || 'Demo User');
        return;
      }

      try {
        const { data, error } = await (supabase as any)
          .from('users')
          .select('name')
          .eq('user_id', assignedUserId)
          .maybeSingle();

        if (error) throw error;
        setAssignedUserName(data?.name || 'Unknown User');
      } catch (error) {
        console.error('Error fetching assigned user:', error);
        setAssignedUserName('Unknown User');
      }
    };

    fetchUser();
  }, [assignedUserId]);

  return assignedUserName;
};
