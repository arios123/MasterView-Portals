import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { IncomingPayment } from '@/types/payments';
import { useLocalStorageCache, getCacheKey } from '@/hooks/useLocalStorageCache';

interface UseIncomingPaymentsProps {
  projectId: string;
  workspaceId: string | undefined;
  userId: string | undefined;
  incomingPaymentsData: any[];
  refetchPayments: () => void;
}

interface UseIncomingPaymentsReturn {
  incoming: IncomingPayment[];
  incomingForm: IncomingPayment;
  setIncomingForm: (form: IncomingPayment) => void;
  editingId: string | null;
  editingData: Partial<IncomingPayment>;
  setEditingData: (data: Partial<IncomingPayment>) => void;
  validationErrors: Record<string, boolean>;
  deleteId: string | null;
  setDeleteId: (id: string | null) => void;
  handleAdd: () => Promise<void>;
  handleEdit: (payment: IncomingPayment) => void;
  handleSave: (paymentId: string) => Promise<void>;
  handleCancel: () => void;
  handleDelete: () => Promise<void>;
}

export function useIncomingPayments({
  projectId,
  workspaceId,
  userId,
  incomingPaymentsData,
  refetchPayments,
}: UseIncomingPaymentsProps): UseIncomingPaymentsReturn {
  const [incoming, setIncoming] = useState<IncomingPayment[]>([]);
  
  // Cache form state to localStorage (with user/workspace scoping)
  const cachePrefix = `incomingpayments.${projectId}`;
  const userIdSafe = userId || 'anonymous';
  const workspaceIdSafe = workspaceId || 'no-workspace';
  const [incomingForm, setIncomingForm, clearIncomingFormCache] = useLocalStorageCache<IncomingPayment>(
    getCacheKey(cachePrefix, userIdSafe, workspaceIdSafe, projectId, undefined, 'incomingForm'),
    {
      date: '',
      amount: '',
      type: '',
      receivedBy: '',
      forField: '',
      notes: '',
    }
  );
  const [editingId, setEditingId] = useLocalStorageCache<string | null>(
    getCacheKey(cachePrefix, userIdSafe, workspaceIdSafe, projectId, undefined, 'editingId'),
    null
  );
  const [editingData, setEditingData, clearEditingDataCache] = useLocalStorageCache<Partial<IncomingPayment>>(
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

  // Load incoming payments from hook data
  useEffect(() => {
    if (incomingPaymentsData.length > 0) {
      const formattedPayments = incomingPaymentsData.map((p: any) => ({
        id: String(p.payment_id || p.id || ''),
        date: p.date || '',
        amount: p.amount || '',
        type: p.type || '',
        receivedBy: p.received_by || '',
        forField: p.for_field || '',
        notes: p.note || '',
        created_by: p.created_by,
        created_at: p.created_at,
        updated_by: p.updated_by,
        updated_at: p.updated_at,
      }));
      setIncoming(formattedPayments);
    }
  }, [incomingPaymentsData]);

  const handleAdd = async () => {
    if (!incomingForm.amount || !incomingForm.date) {
      toast.error('Please enter date and amount');
      return;
    }

    if (!workspaceId) {
      toast.error('Workspace not available');
      return;
    }

    try {
      const { error } = await (supabase as any)
        .from('payments')
        .insert({
          project_id: projectId,
          date: incomingForm.date,
          amount: Number(incomingForm.amount),
          type: incomingForm.type || null,
          received_by: incomingForm.receivedBy || null,
          for_field: incomingForm.forField || null,
          note: incomingForm.notes || null,
          workspace_id: workspaceId,
          created_by: userId || null,
          updated_by: userId || null,
        });

      if (error) throw error;
      toast.success('Payment added successfully');
      const emptyForm = { date: '', amount: '', type: '', receivedBy: '', forField: '', notes: '' };
      setIncomingForm(emptyForm);
      clearIncomingFormCache();
      refetchPayments();
    } catch (error) {
      console.error('Error adding payment:', error);
      toast.error('Failed to add payment');
    }
  };

  const handleEdit = (payment: IncomingPayment) => {
    const paymentId = payment.id ? String(payment.id) : null;
    if (!paymentId) {
      console.error('Cannot edit payment: missing id', payment);
      toast.error('Cannot edit payment: missing ID');
      return;
    }
    setEditingId(paymentId);
    setEditingData({
      amount: payment.amount ?? '',
      type: payment.type ?? '',
      receivedBy: payment.receivedBy ?? '',
      forField: payment.forField ?? '',
      notes: payment.notes ?? '',
    });
    setValidationErrors({});
  };

  const handleSave = async (paymentId: string) => {
    if (!workspaceId || !userId) return;

    // Validate required fields
    const errors: Record<string, boolean> = {};
    if (!editingData.amount || editingData.amount.toString().trim() === '') {
      errors.amount = true;
    }
    if (!editingData.type || editingData.type.trim() === '') {
      errors.type = true;
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      toast.error('Please fill in all required fields');
      return;
    }

    setValidationErrors({});

    try {
      const { error } = await (supabase as any)
        .from('payments')
        .update({
          amount: Number(editingData.amount) || 0,
          type: editingData.type || null,
          received_by: editingData.receivedBy || null,
          for_field: editingData.forField || null,
          note: editingData.notes || null,
          updated_by: userId,
          updated_at: new Date().toISOString(),
        })
        .eq('payment_id', paymentId)
        .eq('workspace_id', workspaceId);

      if (error) throw error;

      toast.success('Payment updated successfully');
      setEditingId(null);
      setEditingData({});
      setValidationErrors({});
      clearEditingDataCache();
      refetchPayments();
    } catch (error) {
      console.error('Error updating payment:', error);
      toast.error('Failed to update payment');
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditingData({});
    setValidationErrors({});
    clearEditingDataCache();
  };

  const handleDelete = async () => {
    if (!deleteId || !workspaceId) return;

    try {
      const { error } = await (supabase as any)
        .from('payments')
        .delete()
        .eq('payment_id', deleteId)
        .eq('workspace_id', workspaceId);

      if (error) throw error;

      toast.success('Payment deleted successfully');
      setDeleteId(null);
      refetchPayments();
    } catch (error) {
      console.error('Error deleting payment:', error);
      toast.error('Failed to delete payment');
    }
  };

  return {
    incoming,
    incomingForm,
    setIncomingForm,
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
  };
}

