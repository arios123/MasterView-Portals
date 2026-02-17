import { supabase } from '@/integrations/supabase/client';
import { isDemoMode } from '@/utils/demoMode';
import { getMockAppointmentTypes } from '@/utils/mockData';
import { CalendarAppointmentType } from '@/types/calendar';

export const appointmentTypesQueries = {
  // Fetch all appointment types for a workspace
  async getByWorkspace(workspaceId: string): Promise<CalendarAppointmentType[]> {
    if (isDemoMode()) {
      return getMockAppointmentTypes();
    }

    // COMMENTED OUT IN DEMO MODE - using mock data instead
    const { data, error } = await supabase
      .from('calendar_appointment_types')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Create appointment type
  async create(
    workspaceId: string,
    name: string,
    color: string,
    userId: string
  ): Promise<CalendarAppointmentType> {
    const { data, error } = await supabase
      .from('calendar_appointment_types')
      .insert({
        workspace_id: workspaceId,
        name,
        color,
        is_default: false,
        created_by: userId,
        updated_by: userId,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update appointment type
  async update(
    id: string,
    updates: { name?: string; color?: string },
    userId: string
  ): Promise<CalendarAppointmentType> {
    // First, check if this is a default type (Other)
    const { data: existing, error: fetchError } = await supabase
      .from('calendar_appointment_types')
      .select('is_default')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    // If it's a default type, remove the name from updates
    // Only allow color changes for default types
    const finalUpdates = existing?.is_default && updates.name
      ? { color: updates.color, updated_by: userId }
      : { ...updates, updated_by: userId };

    const { data, error } = await supabase
      .from('calendar_appointment_types')
      .update(finalUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete appointment type
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('calendar_appointment_types')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};

