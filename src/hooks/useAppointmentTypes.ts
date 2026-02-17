import { useState, useEffect } from 'react';
import { CalendarAppointmentType } from '@/types/calendar';
import { appointmentTypesQueries } from '@/queries/appointmentTypes';
import { toast } from 'sonner';

export function useAppointmentTypes(workspaceId: string | undefined) {
  const [appointmentTypes, setAppointmentTypes] = useState<CalendarAppointmentType[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAppointmentTypes = async () => {
    if (!workspaceId) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const data = await appointmentTypesQueries.getByWorkspace(workspaceId);
      setAppointmentTypes(data);
    } catch (error) {
      console.error('Error fetching appointment types:', error);
      toast.error('Failed to load appointment types');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointmentTypes();
  }, [workspaceId]);

  return {
    appointmentTypes,
    loading,
    refetch: fetchAppointmentTypes,
  };
}

