import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { EventItem } from '@/types';
import { EventItemWithAccountability } from '@/types/calendar';

interface UseCalendarEventsProps {
  workspaceId: string | undefined;
  initialEvents: EventItem[];
  addEvent: (event: EventItem) => void;
}

export function useCalendarEvents({ workspaceId, initialEvents, addEvent }: UseCalendarEventsProps) {
  const [loadedEventIds, setLoadedEventIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchCalendarEvents = async () => {
      try {
        let query = supabase
          .from('calendar_events')
          .select('*');

        if (workspaceId) {
          query = query.eq('workspace_id', workspaceId);
        }

        const { data, error } = await query.order('event_date', { ascending: true });

        if (error) {
          console.error('Error fetching calendar events:', error);
          return;
        }

        // Fetch attendees for all events
        const eventIds = (data || []).map((e: any) => e.id);
        let attendeesMap = new Map<string, Array<{ name: string; role: string | null; user_id: string }>>();
        
        if (eventIds.length > 0) {
          // First, get all attendees with workspace_member_ids
          const { data: attendeesData } = await supabase
            .from('calendar_event_attendees')
            .select('calendar_event_id, workspace_member_id')
            .in('calendar_event_id', eventIds);

          if (attendeesData && attendeesData.length > 0) {
            // Get unique workspace_member_ids
            const memberIds = [...new Set(attendeesData.map((a: any) => a.workspace_member_id))];
            
            // First, fetch workspace members
            const { data: membersData } = await supabase
              .from('workspace_members')
              .select(`
                id,
                user_id,
                workspace_member_roles (
                  roles (
                    name
                  )
                )
              `)
              .in('id', memberIds);

            if (membersData && membersData.length > 0) {
              // Extract user IDs
              const userIds = membersData.map((m: any) => m.user_id).filter(Boolean);
              
              // Fetch user details
              const { data: usersData } = await supabase
                .from('users')
                .select('user_id, name')
                .in('user_id', userIds);
              
              // Create a map of user_id to user data
              const usersMap = new Map(
                (usersData || []).map((u: any) => [u.user_id, u])
              );
              
              // Create a map of workspace_member_id to member data
              const membersMap = new Map();
              membersData.forEach((member: any) => {
                const user = usersMap.get(member.user_id);
                const roleData = member.workspace_member_roles?.[0]?.roles;
                membersMap.set(member.id, {
                  user_id: member.user_id,
                  name: user?.name || 'Unknown',
                  role: roleData?.name || null,
                });
              });

              // Map attendees to events
              attendeesData.forEach((attendee: any) => {
                const eventId = attendee.calendar_event_id;
                const memberData = membersMap.get(attendee.workspace_member_id);
                
                if (memberData) {
                  if (!attendeesMap.has(eventId)) {
                    attendeesMap.set(eventId, []);
                  }
                  attendeesMap.get(eventId)!.push(memberData);
                }
              });
            }
          }
        }

        // Convert database events to EventItem format
        const dbEvents: EventItemWithAccountability[] = (data || []).map((event) => {
          const attendees = attendeesMap.get(event.id) || [];
          const attendeeUserIds = attendees.map((a) => a.user_id);
          
          return {
            id: event.id,
            title: event.title ?? '',
            clientId: event.client_id,
            clientName: event.client_name,
            projectId: event.project_id,
            projectType: event.project_type,
            appointmentTypeId: event.appointment_type_id,
            address: event.address,
            assignedTo: attendeeUserIds.length > 0 ? attendeeUserIds : (event.assigned_to || []),
            date: event.event_date,
            time: event.event_time,
            created_by: event.created_by,
            created_at: event.created_at,
            updated_by: event.updated_by,
            updated_at: event.updated_at,
            attendees,
          };
        });

        // Add events only if they don't already exist
        dbEvents.forEach((dbEvent) => {
          const existsInEvents = initialEvents.some((existingEvent) => existingEvent.id === dbEvent.id);
          if (!existsInEvents && !loadedEventIds.has(dbEvent.id)) {
            addEvent(dbEvent);
            setLoadedEventIds((prev) => new Set([...prev, dbEvent.id]));
          }
        });
      } catch (error) {
        console.error('Error loading calendar events:', error);
        toast({
          title: 'Error',
          description: 'Failed to load calendar events',
          variant: 'destructive',
        });
      }
    };

    // Only fetch if we haven't loaded any events yet
    if (loadedEventIds.size === 0) {
      fetchCalendarEvents();
    }
  }, [workspaceId]); // Intentionally minimal dependencies to prevent infinite loops

  return { loadedEventIds };
}

