import { supabase } from '@/integrations/supabase/client';
import { EventItem } from '@/types';

/**
 * Fetch calendar events for a workspace
 */
export const fetchCalendarEvents = async (workspaceId: string, limit = 200, offset = 0) => {
  const { data, error } = await (supabase as any)
    .from('calendar_events')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('event_date', { ascending: true })
    .range(offset, offset + limit - 1);

  if (error) throw error;

  return (data || []).map((event: any) => ({
    id: event.id,
    clientId: event.client_id || "",
    clientName: event.client_name,
    projectType: event.project_type || "",
    appointmentTypeId: event.appointment_type_id,
    address: event.address || "",
    phone: event.phone || "",
    email: event.email || "",
    assignedTo: event.assigned_to || [],
    notes: event.notes || "",
    date: event.event_date,
    time: event.event_time,
  } as EventItem));
};

/**
 * Create a calendar event
 */
export const createCalendarEvent = async (
  workspaceId: string,
  eventData: {
    client_id?: string;
    client_name: string;
    project_type?: string;
    appointment_type_id?: string;
    address?: string;
    phone?: string;
    email?: string;
    assigned_to?: string[];
    notes?: string;
    event_date: string;
    event_time?: string;
  }
) => {
  const { data, error } = await (supabase as any)
    .from('calendar_events')
    .insert({
      ...eventData,
      workspace_id: workspaceId,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Update a calendar event
 */
export const updateCalendarEvent = async (eventId: string, eventData: Partial<{
  client_id?: string;
  client_name?: string;
  project_type?: string;
  appointment_type_id?: string;
  address?: string;
  phone?: string;
  email?: string;
  assigned_to?: string[];
  notes?: string;
  event_date?: string;
  event_time?: string;
}>, workspaceId: string) => {
  const { data, error } = await (supabase as any)
    .from('calendar_events')
    .update(eventData)
    .eq('id', eventId)
    .eq('workspace_id', workspaceId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Delete a calendar event
 */
export const deleteCalendarEvent = async (eventId: string, workspaceId: string) => {
  const { error } = await (supabase as any)
    .from('calendar_events')
    .delete()
    .eq('id', eventId)
    .eq('workspace_id', workspaceId);

  if (error) throw error;
};

