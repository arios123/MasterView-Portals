import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { toast } from 'sonner';
import { LineItem } from '@/types';

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
      const { data: projectData, error: projectError } = await (supabase as any)
        .from('projects')
        .select('active_version')
        .eq('project_id', projectId)
        .eq('workspace_id', workspaceId)
        .single();

      if (projectError) {
        console.error('Error fetching project:', projectError);
      }

      const { data, error } = await (supabase as any)
        .from('project_versions')
        .select('*')
        .eq('project_id', projectId)
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        const userIds = [...new Set(data.map((v: any) => v.created_by).filter(Boolean))] as string[];
        const { data: userData, error: userError } = await (supabase as any)
          .from('users')
          .select('user_id, name')
          .in('user_id', userIds);

        if (!userError && userData) {
          const versionsWithUsers = data.map((version: any) => ({
            ...version,
            creator_name: (userData as any[]).find((u: any) => u.user_id === version.created_by)?.name || 'Unknown User',
            isActive: (projectData as any)?.active_version === version.version_id
          }));
          setVersions(versionsWithUsers);
        } else {
          setVersions(data.map(v => ({
            ...v,
            creator_name: 'Unknown User',
            isActive: (projectData as any)?.active_version === v.version_id
          })));
        }
      } else {
        setVersions([]);
      }
    } catch (error) {
      console.error('Error fetching versions:', error);
      toast.error('Failed to load project versions');
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

  const fetchActiveDraft = async () => {
    if (!shouldFetch || !workspaceId || !projectId) {
      setActiveDraftItems([]);
      setActiveVersionId(null);
      return;
    }
    
    try {
      const { data: projectData, error: projectError } = await (supabase as any)
        .from('projects')
        .select('active_version')
        .eq('project_id', projectId)
        .eq('workspace_id', workspaceId)
        .single();

      if (projectError || !projectData?.active_version) {
        setActiveDraftItems([]);
        setActiveVersionId(null);
        return;
      }

      const versionId = projectData.active_version;
      setActiveVersionId(versionId);

      const { data: versionData } = await (supabase as any)
        .from('project_versions')
        .select('multiplier, name, status')
        .eq('version_id', versionId)
        .eq('workspace_id', workspaceId)
        .single();

      if (versionData) {
        setActiveDraftMultiplier(Number(versionData.multiplier) || 1);
        setActiveDraftName(versionData.name || versionData.status || 'Active Draft');
      }

      const { data: laborData } = await (supabase as any)
        .from('version_labor')
        .select('*, labor_options (*)')
        .eq('version_id', versionId);

      const { data: materialData } = await (supabase as any)
        .from('version_materials')
        .select('*, material_options (*)')
        .eq('version_id', versionId);

      const items: LineItem[] = [];

      laborData?.forEach((item: any) => {
        items.push({
          id: item.id,
          kind: 'labor',
          name: item.item_name || item.labor_options?.name || '', // Use saved name if available, otherwise catalog name
          qty: Number(item.quantity),
          unitPrice: Number(item.price)
        });
      });

      materialData?.forEach((item: any) => {
        items.push({
          id: item.id,
          kind: 'material',
          name: item.item_name || item.material_options?.name || '', // Use saved name if available, otherwise catalog name
          qty: Number(item.quantity),
          unitPrice: Number(item.price),
          wastePct: Number(item.waste_pct || 0)
        });
      });

      setActiveDraftItems(items);
    } catch (error) {
      console.error('Error fetching active draft:', error);
      setActiveDraftItems([]);
    }
  };

  useEffect(() => {
    fetchActiveDraft();
  }, [projectId, shouldFetch, workspaceId]);

  return { activeDraftItems, activeDraftMultiplier, activeVersionId, activeDraftName, refetch: fetchActiveDraft };
};

export const useChangeOrders = (projectId: string, shouldFetch: boolean) => {
  const { currentWorkspace } = useWorkspace();
  const workspaceId = currentWorkspace?.id;
  const [changeOrderVersions, setChangeOrderVersions] = useState<any[]>([]);
  const [activeChangeOrders, setActiveChangeOrders] = useState<any[]>([]);

  const fetchChangeOrders = async () => {
    if (!shouldFetch || !workspaceId || !projectId) {
      setChangeOrderVersions([]);
      setActiveChangeOrders([]);
      return;
    }
    
    try {
      const { data, error } = await (supabase as any)
        .from('project_versions')
        .select('*')
        .eq('project_id', projectId)
        .eq('workspace_id', workspaceId)
        .ilike('status', '%Change Order%')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const changeOrdersWithItems = await Promise.all(
        (data || []).map(async (version) => {
          const { data: laborData } = await (supabase as any)
            .from('version_labor')
            .select('*, labor_options:labor_id (*)')
            .eq('version_id', version.version_id);

          const { data: materialData } = await (supabase as any)
            .from('version_materials')
            .select('*, material_options:material_id (*)')
            .eq('version_id', version.version_id);

          const laborItems: (LineItem & { isAdded: boolean })[] = [];
          const materialItems: (LineItem & { isAdded: boolean })[] = [];

          laborData?.forEach(item => {
            if (item.labor_options) {
              const qty = Number(item.quantity);
              laborItems.push({
                id: item.labor_options.id,
                name: item.item_name || item.labor_options.name, // Use saved name if available, otherwise catalog name
                qty: qty,
                unitPrice: Math.abs(Number(item.price)),
                kind: 'labor',
                isAdded: qty >= 0
              });
            }
          });

          materialData?.forEach(item => {
            if (item.material_options) {
              const qty = Number(item.quantity);
              materialItems.push({
                id: item.material_options.id,
                name: item.item_name || item.material_options.name, // Use saved name if available, otherwise catalog name
                qty: qty,
                unitPrice: Math.abs(Number(item.price)),
                wastePct: Number(item.waste_pct) || 0,
                kind: 'material',
                isAdded: qty >= 0
              });
            }
          });

          const items: LineItem[] = [];
          laborData?.forEach(item => {
            if (item.labor_options) {
              items.push({
                id: item.labor_options.id,
                name: item.item_name || item.labor_options.name, // Use saved name if available, otherwise catalog name
                qty: Number(item.quantity),
                unitPrice: Number(item.price),
                kind: 'labor'
              });
            }
          });
          materialData?.forEach(item => {
            if (item.material_options) {
              items.push({
                id: item.material_options.id,
                name: item.item_name || item.material_options.name, // Use saved name if available, otherwise catalog name
                qty: Number(item.quantity),
                unitPrice: Number(item.price),
                wastePct: Number(item.waste_pct) || 0,
                kind: 'material'
              });
            }
          });

          return {
            ...version,
            items,
            laborItems,
            materialItems
          };
        })
      );

      setChangeOrderVersions(changeOrdersWithItems);
      const activeOnes = changeOrdersWithItems.filter(co => co.is_active);
      setActiveChangeOrders(activeOnes);
    } catch (error) {
      console.error('Error fetching change orders:', error);
    }
  };

  useEffect(() => {
    fetchChangeOrders();
  }, [projectId, shouldFetch, workspaceId]);

  return { changeOrderVersions, activeChangeOrders, refetch: fetchChangeOrders };
};

export const usePayments = (projectId: string, shouldFetch: boolean) => {
  const { currentWorkspace } = useWorkspace();
  const workspaceId = currentWorkspace?.id;
  const [incoming, setIncoming] = useState<any[]>([]);

  const fetchPayments = async () => {
    if (!shouldFetch || !workspaceId || !projectId) {
      setIncoming([]);
      return;
    }
    
    try {
      const { data, error } = await (supabase as any)
        .from('payments')
        .select('*')
        .eq('project_id', projectId)
        .eq('workspace_id', workspaceId)
        .order('date', { ascending: false });

      if (error) throw error;

      if (data) {
        const payments = data.map(payment => ({
          id: payment.payment_id,
          date: payment.date,
          amount: payment.amount,
          type: payment.type,
          received_by: payment.received_by || '',
          for_field: payment.for_field || '',
          note: payment.note || '',
          created_by: payment.created_by,
          created_at: payment.created_at,
          updated_by: payment.updated_by,
          updated_at: payment.updated_at,
        }));
        setIncoming(payments);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast.error('Failed to load payments');
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [projectId, shouldFetch, workspaceId]);

  return { incoming, refetch: fetchPayments };
};

export const useAssignedUser = (assignedUserId?: string) => {
  const [assignedUserName, setAssignedUserName] = useState<string>('Unassigned');

  useEffect(() => {
    const fetchUser = async () => {
      if (!assignedUserId) {
        setAssignedUserName('Unassigned');
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
