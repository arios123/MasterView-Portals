import { supabase } from '@/integrations/supabase/client';

export interface Subscription {
  id: string;
  workspace_id: string;
  stripe_customer_id: string;
  stripe_subscription_id: string;
  status: 'active' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'past_due' | 'trialing' | 'unpaid' | 'paused';
  price_id: string;
  current_period_end: string;
  created_by: string | null;
  created_at: string;
  updated_by: string | null;
  updated_at: string;
}

/**
 * Get subscription for a workspace
 */
export const getWorkspaceSubscription = async (workspaceId: string): Promise<Subscription | null> => {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
};

/**
 * Check if workspace has an active subscription
 */
export const hasActiveSubscription = async (workspaceId: string): Promise<boolean> => {
  const subscription = await getWorkspaceSubscription(workspaceId);
  if (!subscription) return false;
  
  // Active subscription statuses
  const activeStatuses: Subscription['status'][] = ['active', 'trialing'];
  return activeStatuses.includes(subscription.status);
};

/**
 * Create Stripe checkout session
 */
export const createCheckoutSession = async (workspaceId: string): Promise<{ sessionId: string; url: string }> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error('Not authenticated');
  }

  const { data, error } = await supabase.functions.invoke('create-checkout-session', {
    body: { workspace_id: workspaceId },
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  if (error) throw error;
  return data;
};

/**
 * Create Stripe Customer Portal session for managing subscription
 */
export const createBillingPortalSession = async (workspaceId: string): Promise<{ url: string }> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error('Not authenticated');
  }

  const { data, error } = await supabase.functions.invoke('create-billing-portal-session', {
    body: { workspace_id: workspaceId },
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  if (error) throw error;
  if (data?.error) {
    throw new Error(data.error);
  }
  return data;
};

