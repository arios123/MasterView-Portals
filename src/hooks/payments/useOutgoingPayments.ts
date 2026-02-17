import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { OutgoingPayment } from '@/types/payments';
import { useLocalStorageCache, getCacheKey } from '@/hooks/useLocalStorageCache';
import { isDemoMode } from '@/utils/demoMode';

interface UseOutgoingPaymentsProps {
  projectId: string;
  workspaceId: string | undefined;
  userId: string | undefined;
}

interface UseOutgoingPaymentsReturn {
  outgoing: OutgoingPayment[];
  outgoingForm: OutgoingPayment;
  setOutgoingForm: (form: OutgoingPayment) => void;
  editingId: string | null;
  editingData: Partial<OutgoingPayment>;
  setEditingData: (data: Partial<OutgoingPayment>) => void;
  validationErrors: Record<string, boolean>;
  deleteId: string | null;
  setDeleteId: (id: string | null) => void;
  handleAdd: () => Promise<void>;
  handleEdit: (payment: OutgoingPayment) => void;
  handleSave: (paymentId: string) => Promise<void>;
  handleCancel: () => void;
  handleDelete: () => Promise<void>;
  refetch: () => Promise<void>;
}

export function useOutgoingPayments({
  projectId,
  workspaceId,
  userId,
}: UseOutgoingPaymentsProps): UseOutgoingPaymentsReturn {
  const [outgoing, setOutgoing] = useState<OutgoingPayment[]>([]);
  
  // Cache form state to localStorage (with user/workspace scoping)
  const cachePrefix = `outgoingpayments.${projectId}`;
  const userIdSafe = userId || 'anonymous';
  const workspaceIdSafe = workspaceId || 'no-workspace';
  const [outgoingForm, setOutgoingForm, clearOutgoingFormCache] = useLocalStorageCache<OutgoingPayment>(
    getCacheKey(cachePrefix, userIdSafe, workspaceIdSafe, projectId, undefined, 'outgoingForm'),
    {
      date: '',
      item: '',
      link: '',
      totalPrice: '',
      qty: '',
      tracking: '',
      notes: '',
    }
  );
  const [editingId, setEditingId] = useLocalStorageCache<string | null>(
    getCacheKey(cachePrefix, userIdSafe, workspaceIdSafe, projectId, undefined, 'editingId'),
    null
  );
  const [editingData, setEditingData, clearEditingDataCache] = useLocalStorageCache<Partial<OutgoingPayment>>(
    getCacheKey(cachePrefix, userIdSafe, workspaceIdSafe, projectId, undefined, 'editingData'),
    {}
  );
  const [validationErrors, setValidationErrors] = useLocalStorageCache<Record<string, boolean>>(
    getCacheKey(cachePrefix, userIdSafe, workspaceIdSafe, projectId, undefined, 'validationErrors'),
    {}
  );
  const [deleteId, setDeleteId] = useLocalStorageCache<string | null>(
    getCacheKey(cachePrefix, userIdSafe, workspaceIdSafe, projectId, undefined, 'deleteId'),
    null
  );

  const fetchOutgoingPayments = async () => {
    if (isDemoMode()) {
      setOutgoing([]);
      return;
    }
    const { data, error } = await supabase
      .from('outgoing_payments')
      .select('*')
      .eq('project_id', projectId)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching outgoing payments:', error);
      return;
    }

    if (data) {
      const formattedPayments = data.map((p: any) => ({
        id: p.id,
        date: p.date || '',
        item: p.material_name || '',
        link: p.link || '',
        totalPrice: p.budget?.toString() || '',
        qty: p.qty?.toString() || '',
        tracking: p.tracking || '',
        notes: p.notes || '',
        created_by: p.created_by,
        created_at: p.created_at,
        updated_by: p.updated_by,
        updated_at: p.updated_at,
      }));
      setOutgoing(formattedPayments);
    }
  };

  // Load outgoing payments on mount
  useEffect(() => {
    fetchOutgoingPayments();
  }, [projectId]);

  const handleAdd = async () => {
    if (isDemoMode()) {
      toast.info('Adding outgoing payments is disabled in demo mode.');
      return;
    }
    if (!outgoingForm.item || !outgoingForm.date) {
      toast.error('Please enter date and item');
      return;
    }

    if (!workspaceId) {
      toast.error('Workspace not available');
      return;
    }

    try {
      const { error } = await (supabase as any)
        .from('outgoing_payments')
        .insert({
          project_id: projectId,
          date: outgoingForm.date,
          material_name: outgoingForm.item,
          budget: Number(outgoingForm.totalPrice) || 0,
          qty: Number(outgoingForm.qty) || 1,
          link: outgoingForm.link || null,
          tracking: outgoingForm.tracking || null,
          notes: outgoingForm.notes || null,
          workspace_id: workspaceId,
          created_by: userId || null,
          updated_by: userId || null,
        });

      if (error) throw error;
      toast.success('Outgoing payment added successfully');
      const emptyForm = { date: '', item: '', link: '', totalPrice: '', qty: '', tracking: '', notes: '' };
      setOutgoingForm(emptyForm);
      clearOutgoingFormCache();
      await fetchOutgoingPayments();
    } catch (error) {
      console.error('Error adding outgoing payment:', error);
      toast.error('Failed to add outgoing payment');
    }
  };

  const handleEdit = (payment: OutgoingPayment) => {
    if (!payment.id) return;
    setEditingId(payment.id);
    setEditingData({
      link: payment.link ?? '',
      totalPrice: payment.totalPrice ?? '',
      qty: payment.qty ?? '',
      tracking: payment.tracking ?? '',
      notes: payment.notes ?? '',
    });
    setValidationErrors({});
  };

  const handleSave = async (paymentId: string) => {
    if (isDemoMode()) {
      toast.info('Saving outgoing payments is disabled in demo mode.');
      return;
    }
    if (!workspaceId || !userId) return;

    // Validate required fields
    const errors: Record<string, boolean> = {};
    if (!editingData.totalPrice || editingData.totalPrice.toString().trim() === '') {
      errors.totalPrice = true;
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      toast.error('Please fill in all required fields');
      return;
    }

    setValidationErrors({});

    try {
      const { error } = await (supabase as any)
        .from('outgoing_payments')
        .update({
          link: editingData.link || null,
          budget: Number(editingData.totalPrice) || 0,
          qty: Number(editingData.qty) || 1,
          tracking: editingData.tracking || null,
          notes: editingData.notes || null,
          updated_by: userId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', paymentId)
        .eq('workspace_id', workspaceId);

      if (error) throw error;

      toast.success('Outgoing payment updated successfully');
      setEditingId(null);
      setEditingData({});
      setValidationErrors({});
      clearEditingDataCache();
      await fetchOutgoingPayments();
    } catch (error) {
      console.error('Error updating outgoing payment:', error);
      toast.error('Failed to update outgoing payment');
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditingData({});
    setValidationErrors({});
    clearEditingDataCache();
  };

  const handleDelete = async () => {
    if (isDemoMode()) {
      toast.info('Deleting outgoing payments is disabled in demo mode.');
      return;
    }
    if (!deleteId || !workspaceId) return;

    try {
      const { error } = await (supabase as any)
        .from('outgoing_payments')
        .delete()
        .eq('id', deleteId)
        .eq('workspace_id', workspaceId);

      if (error) throw error;

      toast.success('Outgoing payment deleted successfully');
      setDeleteId(null);
      await fetchOutgoingPayments();
    } catch (error) {
      console.error('Error deleting outgoing payment:', error);
      toast.error('Failed to delete outgoing payment');
    }
  };

  return {
    outgoing,
    outgoingForm,
    setOutgoingForm,
    editingId,
    editingData,
    setEditingData,
    validationErrors,
    deleteId,
    setDeleteId,
    handleAdd,
    handleEdit,
    handleSave,
    handleCancel,
    handleDelete,
    refetch: fetchOutgoingPayments,
  };
}

