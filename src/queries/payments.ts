import { supabase } from '@/integrations/supabase/client';
import { logInsert, logUpdate, logDelete } from '@/lib/auditLog';

/**
 * Fetch payments for a project
 */
export const fetchProjectPayments = async (projectId: string, workspaceId: string, limit = 100, offset = 0) => {
  const { data, error } = await (supabase as any)
    .from('payments')
    .select('*')
    .eq('project_id', projectId)
    .eq('workspace_id', workspaceId)
    .order('date', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;

  return (data || []).map((payment: any) => ({
    id: payment.payment_id,
    date: payment.date,
    amount: payment.amount,
    type: payment.type,
    received_by: payment.received_by || '',
    for_field: payment.for_field || '',
    note: payment.note || ''
  }));
};

/**
 * Create a new payment
 */
export const createPayment = async (
  workspaceId: string,
  paymentData: {
    project_id: string;
    date: string;
    amount: number;
    type: string;
    received_by?: string;
    for_field?: string;
    note?: string;
  },
  userId?: string
) => {
  const { data, error } = await (supabase as any)
    .from('payments')
    .insert({
      ...paymentData,
      workspace_id: workspaceId,
      created_by: userId || null,
      updated_by: userId || null,
    })
    .select()
    .single();

  if (error) throw error;

  // Log audit event
  if (userId && data) {
    await logInsert(workspaceId, userId, 'payments', data.payment_id, data, 'Payments');
  }

  return data;
};

/**
 * Update a payment
 */
export const updatePayment = async (paymentId: string, paymentData: Partial<{
  date: string;
  amount: number;
  type: string;
  received_by?: string;
  for_field?: string;
  note?: string;
}>, workspaceId: string, userId?: string) => {
  // Fetch before data for audit log
  const { data: beforeData } = await (supabase as any)
    .from('payments')
    .select('*')
    .eq('payment_id', paymentId)
    .eq('workspace_id', workspaceId)
    .maybeSingle();

  const { data, error } = await (supabase as any)
    .from('payments')
    .update({
      ...paymentData,
      updated_by: userId || null,
    })
    .eq('payment_id', paymentId)
    .eq('workspace_id', workspaceId)
    .select()
    .single();

  if (error) throw error;

  // Log audit event
  if (userId && data && beforeData) {
    await logUpdate(workspaceId, userId, 'payments', paymentId, beforeData, data, 'Payments');
  }

  return data;
};

/**
 * Delete a payment
 */
export const deletePayment = async (paymentId: string, workspaceId: string, userId?: string) => {
  // Fetch before data for audit log
  const { data: beforeData } = await (supabase as any)
    .from('payments')
    .select('*')
    .eq('payment_id', paymentId)
    .eq('workspace_id', workspaceId)
    .maybeSingle();

  const { error } = await (supabase as any)
    .from('payments')
    .delete()
    .eq('payment_id', paymentId)
    .eq('workspace_id', workspaceId);

  if (error) throw error;

  // Log audit event
  if (userId && beforeData) {
    await logDelete(workspaceId, userId, 'payments', paymentId, beforeData, 'Payments');
  }
};

