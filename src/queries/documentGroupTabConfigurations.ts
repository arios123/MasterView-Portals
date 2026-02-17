import { supabase } from '@/integrations/supabase/client';

export type TabIdentifier = 'activity' | 'lookbook' | 'contract_builder' | 'change_order' | 'materials' | 'payments';

export interface DocumentGroupTabConfiguration {
  id: string;
  workspaceId: string;
  tabIdentifier: TabIdentifier;
  documentGroupId: string;
  createdBy?: string;
  createdAt: string;
  updatedBy?: string;
  updatedAt: string;
}

/**
 * Fetch all document group tab configurations for a workspace
 */
export async function fetchDocumentGroupTabConfigurations(
  workspaceId: string
): Promise<DocumentGroupTabConfiguration[]> {
  const { data, error } = await supabase
    .from('document_group_tab_configurations')
    .select('*')
    .eq('workspace_id', workspaceId);
  
  if (error) throw error;
  
  return (data || []).map(row => ({
    id: row.id,
    workspaceId: row.workspace_id,
    tabIdentifier: row.tab_identifier as TabIdentifier,
    documentGroupId: row.document_group_id,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedBy: row.updated_by,
    updatedAt: row.updated_at,
  }));
}

/**
 * Fetch document group IDs for a specific tab
 */
export async function fetchDocumentGroupIdsForTab(
  workspaceId: string,
  tabIdentifier: TabIdentifier
): Promise<string[]> {
  const { data, error } = await supabase
    .from('document_group_tab_configurations')
    .select('document_group_id')
    .eq('workspace_id', workspaceId)
    .eq('tab_identifier', tabIdentifier);
  
  if (error) throw error;
  
  return (data || []).map(row => row.document_group_id);
}

/**
 * Save document group tab configurations for a specific tab
 * This replaces all existing configurations for the tab with the new ones
 */
export async function saveDocumentGroupTabConfigurations(
  workspaceId: string,
  tabIdentifier: TabIdentifier,
  documentGroupIds: string[],
  userId: string
): Promise<void> {
  // First, delete all existing configurations for this tab
  const { error: deleteError } = await supabase
    .from('document_group_tab_configurations')
    .delete()
    .eq('workspace_id', workspaceId)
    .eq('tab_identifier', tabIdentifier);
  
  if (deleteError) throw deleteError;
  
  // If no document group IDs provided, we're done (all configs removed)
  if (documentGroupIds.length === 0) {
    return;
  }
  
  // Insert new configurations
  const configurations = documentGroupIds.map(documentGroupId => ({
    workspace_id: workspaceId,
    tab_identifier: tabIdentifier,
    document_group_id: documentGroupId,
    created_by: userId,
    updated_by: userId,
  }));
  
  const { error: insertError } = await supabase
    .from('document_group_tab_configurations')
    .insert(configurations);
  
  if (insertError) throw insertError;
}

/**
 * Delete all document group tab configurations for a specific tab
 */
export async function deleteDocumentGroupTabConfigurations(
  workspaceId: string,
  tabIdentifier: TabIdentifier
): Promise<void> {
  const { error } = await supabase
    .from('document_group_tab_configurations')
    .delete()
    .eq('workspace_id', workspaceId)
    .eq('tab_identifier', tabIdentifier);
  
  if (error) throw error;
}

