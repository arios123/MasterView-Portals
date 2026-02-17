import { supabase } from '@/integrations/supabase/client';

export type AuditAction = 'insert' | 'update' | 'delete';

export interface AuditLogParams {
  workspaceId: string;
  userId: string;
  action: AuditAction;
  resourceType: string;
  resourceId: string;
  resourceLocation?: string;
  beforeData?: Record<string, any> | null;
  afterData?: Record<string, any> | null;
}

/**
 * Maps resource types to their default UI locations/tabs
 */
const RESOURCE_LOCATION_MAP: Record<string, string> = {
  // Clients
  clients: 'Clients',
  client_assignments: 'Clients',
  
  // Projects
  projects: 'Projects',
  project_versions: 'Projects',
  project_documents: 'Projects',
  project_folders: 'Projects',
  version_materials: 'Projects',
  version_labor: 'Projects',
  material_revisions: 'Projects',
  project_crew_assignments: 'Projects',
  
  // Calendar
  calendar_events: 'Calendar',
  calendar_event_attendees: 'Calendar',
  
  // Payments
  payments: 'Payments',
  outgoing_payments: 'Payments',
  
  // Materials & Labor
  material_options: 'Admin > Pricing',
  labor_options: 'Admin > Pricing',
  
  // Lookbook
  lookbooks: 'LookBook',
  lookbook_options: 'Admin > LookBook',
  project_lookbook_selections: 'LookBook',
  lookbook_questions: 'LookBook',
  lookbook_answers: 'LookBook',
  
  // Admin
  workspace_members: 'Admin > Staff',
  roles: 'Admin > Roles & Permissions',
  role_permissions: 'Admin > Roles & Permissions',
  permissions: 'Admin > Roles & Permissions',
  packages: 'Admin > Pricing',
  document_templates: 'Admin > Documents',
};

/**
 * Calculates which fields changed between before and after data
 */
function calculateChangedFields(
  beforeData: Record<string, any> | null,
  afterData: Record<string, any> | null
): string[] {
  if (!beforeData || !afterData) return [];
  
  const changedFields: string[] = [];
  const allKeys = new Set([...Object.keys(beforeData), ...Object.keys(afterData)]);
  
  for (const key of allKeys) {
    const beforeValue = beforeData[key];
    const afterValue = afterData[key];
    
    // Deep comparison for objects/arrays
    if (JSON.stringify(beforeValue) !== JSON.stringify(afterValue)) {
      changedFields.push(key);
    }
  }
  
  return changedFields;
}

/**
 * Removes sensitive or unnecessary fields from audit data
 * (You can customize this based on your needs)
 */
function sanitizeAuditData(data: Record<string, any> | null): Record<string, any> | null {
  if (!data) return null;
  
  // Create a copy to avoid mutating the original
  const sanitized = { ...data };
  
  // Remove internal fields that aren't useful for auditing
  // Keep created_by, updated_by as they're useful for accountability
  // You can add more fields to exclude if needed
  
  return sanitized;
}

/**
 * Main function to log an audit event
 */
export async function logAuditEvent(params: AuditLogParams): Promise<void> {
  try {
    const {
      workspaceId,
      userId,
      action,
      resourceType,
      resourceId,
      resourceLocation,
      beforeData,
      afterData,
    } = params;

    // Determine resource location if not provided
    const location = resourceLocation || RESOURCE_LOCATION_MAP[resourceType] || 'Unknown';

    // Sanitize data
    const sanitizedBefore = sanitizeAuditData(beforeData);
    const sanitizedAfter = sanitizeAuditData(afterData);

    // Calculate changed fields for updates
    const changedFields =
      action === 'update' && sanitizedBefore && sanitizedAfter
        ? calculateChangedFields(sanitizedBefore, sanitizedAfter)
        : null;

    // Insert audit log
    const { error } = await (supabase as any).from('audit_logs').insert({
      workspace_id: workspaceId,
      user_id: userId,
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      resource_location: location,
      before_data: sanitizedBefore,
      after_data: sanitizedAfter,
      changed_fields: changedFields,
    });

    if (error) {
      console.error('Error logging audit event:', error);
      // Don't throw - audit logging should not break the main operation
    }
  } catch (error) {
    console.error('Error in logAuditEvent:', error);
    // Don't throw - audit logging should not break the main operation
  }
}

/**
 * Convenience function for logging INSERT operations
 */
export async function logInsert(
  workspaceId: string,
  userId: string,
  resourceType: string,
  resourceId: string,
  afterData: Record<string, any>,
  resourceLocation?: string
): Promise<void> {
  await logAuditEvent({
    workspaceId,
    userId,
    action: 'insert',
    resourceType,
    resourceId,
    resourceLocation,
    afterData,
  });
}

/**
 * Convenience function for logging UPDATE operations
 */
export async function logUpdate(
  workspaceId: string,
  userId: string,
  resourceType: string,
  resourceId: string,
  beforeData: Record<string, any> | null,
  afterData: Record<string, any>,
  resourceLocation?: string
): Promise<void> {
  await logAuditEvent({
    workspaceId,
    userId,
    action: 'update',
    resourceType,
    resourceId,
    resourceLocation,
    beforeData,
    afterData,
  });
}

/**
 * Convenience function for logging DELETE operations
 */
export async function logDelete(
  workspaceId: string,
  userId: string,
  resourceType: string,
  resourceId: string,
  beforeData: Record<string, any>,
  resourceLocation?: string
): Promise<void> {
  await logAuditEvent({
    workspaceId,
    userId,
    action: 'delete',
    resourceType,
    resourceId,
    resourceLocation,
    beforeData,
  });
}

