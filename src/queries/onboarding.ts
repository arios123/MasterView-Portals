import { supabase } from '@/integrations/supabase/client';

/**
 * Check if owner onboarding has been completed for a workspace
 */
export const checkOwnerOnboardingCompleted = async (workspaceId: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from('workspaces')
    .select('owner_onboarding_completed')
    .eq('id', workspaceId)
    .single();

  if (error) {
    console.error('Error checking onboarding status:', error);
    return false; // Default to false if error
  }

  return data?.owner_onboarding_completed ?? false;
};

/**
 * Mark owner onboarding as completed for a workspace
 */
export const markOwnerOnboardingCompleted = async (workspaceId: string): Promise<void> => {
  const { error } = await supabase
    .from('workspaces')
    .update({ owner_onboarding_completed: true })
    .eq('id', workspaceId);

  if (error) {
    console.error('Error marking onboarding as completed:', error);
    throw error;
  }
};
