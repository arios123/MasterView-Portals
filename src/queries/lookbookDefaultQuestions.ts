import { supabase } from '@/integrations/supabase/client';
import { LookbookDefaultQuestion } from '@/types/lookbook';

/**
 * Fetch all default questions for a workspace
 */
export async function fetchLookbookDefaultQuestions(workspaceId: string): Promise<LookbookDefaultQuestion[]> {
  const { data, error } = await (supabase as any)
    .from('lookbook_default_questions')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('display_order', { ascending: true });

  if (error) throw error;
  return data || [];
}

/**
 * Create a default question
 */
export async function createLookbookDefaultQuestion(
  workspaceId: string,
  label: string,
  isLong: boolean,
  displayOrder: number,
  userId: string
): Promise<LookbookDefaultQuestion> {
  const { data, error } = await (supabase as any)
    .from('lookbook_default_questions')
    .insert({
      workspace_id: workspaceId,
      label,
      is_long: isLong,
      display_order: displayOrder,
      created_by: userId,
      updated_by: userId,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update a default question
 */
export async function updateLookbookDefaultQuestion(
  id: string,
  workspaceId: string,
  updates: { label?: string; is_long?: boolean },
  userId: string
): Promise<void> {
  const { error } = await (supabase as any)
    .from('lookbook_default_questions')
    .update({
      ...updates,
      updated_by: userId,
    })
    .eq('id', id)
    .eq('workspace_id', workspaceId);

  if (error) throw error;
}

/**
 * Delete a default question
 */
export async function deleteLookbookDefaultQuestion(
  id: string,
  workspaceId: string
): Promise<void> {
  const { error } = await (supabase as any)
    .from('lookbook_default_questions')
    .delete()
    .eq('id', id)
    .eq('workspace_id', workspaceId);

  if (error) throw error;
}

/**
 * Update display orders for multiple default questions
 */
export async function updateLookbookDefaultQuestionOrders(
  workspaceId: string,
  orders: { id: string; display_order: number }[],
  userId: string
): Promise<void> {
  // Update each question's display_order
  const updates = orders.map(({ id, display_order }) =>
    (supabase as any)
      .from('lookbook_default_questions')
      .update({ display_order, updated_by: userId })
      .eq('id', id)
      .eq('workspace_id', workspaceId)
  );

  await Promise.all(updates);
}

