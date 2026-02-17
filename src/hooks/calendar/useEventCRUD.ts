import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { EventItem } from '@/types';
import { EventFormData, DatabaseClient, ClientProject, EventItemWithAccountability } from '@/types/calendar';
import { logInsert, logUpdate, logDelete } from '@/lib/auditLog';
import { isDemoMode } from '@/utils/demoMode';

interface UseEventCRUDProps {
  workspaceId: string | undefined;
  currentUserId: string;
  addEvent: (event: EventItem) => void;
  removeEvent: (eventId: string) => void;
  onLogActivity: (clientId: string, line: string) => void;
}

export function useEventCRUD({
  workspaceId,
  currentUserId,
  addEvent,
  removeEvent,
  onLogActivity,
}: UseEventCRUDProps) {
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [isUpdatingEvent, setIsUpdatingEvent] = useState(false);
  const [isDeletingEvent, setIsDeletingEvent] = useState(false);
  const [isCreatingProject, setIsCreatingProject] = useState(false);

  const createEvent = async (
    formData: EventFormData,
    selectedProjectId: string,
    isNewProject: boolean,
    clients: DatabaseClient[],
    projects: ClientProject[],
    attendeeMemberIds: string[] = []
  ) => {
    if (isDemoMode()) {
      toast({
        title: 'Demo mode',
        description: 'Creating events is disabled in demo mode.',
        variant: 'default',
      });
      return { success: false };
    }

    const missingFields: string[] = [];

    // Required fields: title, date, time
    if (!formData.title) missingFields.push('Title');
    if (!formData.date) missingFields.push('Date');
    if (!formData.time) missingFields.push('Time');

    // If creating new project, validate project fields and client
    if (isNewProject && selectedProjectId === 'new') {
      if (!formData.clientId) missingFields.push('Client (required for new project)');
      if (!formData.projectName) missingFields.push('Project Name');
      if (!formData.projectType) missingFields.push('Project Type');
      if (!formData.address) missingFields.push('Address');
    }

    if (missingFields.length > 0) {
      toast({
        title: 'Missing Required Fields',
        description: `Please complete the following required fields: ${missingFields.join(', ')}`,
        variant: 'destructive',
      });
      return { success: false };
    }

    setIsCreatingEvent(true);

    try {
      const client = clients.find((c) => c.client_id === formData.clientId);
      let projectId = selectedProjectId;
      let projectData: ClientProject | undefined;

      // Create new project if needed
      if (isNewProject && selectedProjectId === 'new') {
        if (!workspaceId) {
          toast({
            title: 'Error',
            description: 'Workspace is required to create a project',
            variant: 'destructive',
          });
          return { success: false };
        }

        setIsCreatingProject(true);

        const { data: newProject, error: projectError } = await supabase
          .from('projects')
          .insert({
            client_id: formData.clientId,
            name: formData.projectName || 'New Project',
            address: formData.address,
            project_type: formData.projectType,
            created_by: currentUserId,
            status: 'Estimate',
            workspace_id: workspaceId,
          })
          .select()
          .single();

        if (projectError) {
          throw projectError;
        }

        projectId = newProject.project_id;
        projectData = newProject;

        // Set this new project as active for the client
        const { error: clientUpdateError } = await supabase
          .from('clients')
          .update({
            active_project: projectId,
            updated_by: currentUserId || null,
          })
          .eq('client_id', formData.clientId);

        if (clientUpdateError) {
          console.error('Error updating client active project:', clientUpdateError);
        }

        toast({
          title: 'Success',
          description: `Project "${formData.projectName}" created and set as active!`,
        });

        setIsCreatingProject(false);
      } else {
        projectData = projects.find((p) => p.project_id === selectedProjectId);
      }

      // Create calendar event
      if (!workspaceId) {
        toast({
          title: 'Error',
          description: 'Workspace is required to create a calendar event',
          variant: 'destructive',
        });
        return { success: false };
      }

      const { data, error } = await supabase
        .from('calendar_events')
        .insert({
          title: formData.title,
          client_id: formData.clientId || null,
          client_name: client?.name || formData.clientName || '',
          project_id: projectId && projectId !== 'new' ? projectId : null,
          project_type: projectData?.project_type || formData.projectType || null,
          appointment_type_id: formData.appointmentTypeId || null,
          address: projectData?.address || formData.address || null,
          event_date: formData.date,
          event_time: formData.time,
          created_by: currentUserId,
          workspace_id: workspaceId,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Log audit event for calendar event creation
      if (workspaceId && currentUserId && data) {
        await logInsert(workspaceId, currentUserId, 'calendar_events', data.id, data, 'Calendar');
      }

      // Create attendee records
      // Get workspace_member_id for current user to ensure they're included
      const { data: currentUserMember } = await supabase
        .from('workspace_members')
        .select('id')
        .eq('user_id', currentUserId)
        .eq('workspace_id', workspaceId)
        .maybeSingle();

      const finalAttendeeIds = [...attendeeMemberIds];
      
      // Auto-add creator if not already in the list
      if (currentUserMember && !finalAttendeeIds.includes(currentUserMember.id)) {
        finalAttendeeIds.push(currentUserMember.id);
      }

      // Insert all attendees
      if (data && finalAttendeeIds.length > 0) {
        const attendeeRecords = finalAttendeeIds.map((memberId) => ({
          calendar_event_id: data.id,
          workspace_member_id: memberId,
          workspace_id: workspaceId,
          created_by: currentUserId,
          updated_by: currentUserId,
        }));

        const { error: attendeesError } = await supabase
          .from('calendar_event_attendees')
          .insert(attendeeRecords);

        if (attendeesError) {
          console.error('Error creating attendees:', attendeesError);
          // Don't throw - event is created, attendees can be added later
        }
      }

      // Fetch attendees with full details (names and roles) for the event
      const { data: attendeesData } = await supabase
        .from('calendar_event_attendees')
        .select('workspace_member_id')
        .eq('calendar_event_id', data.id);

      let attendeeUserIds: string[] = [];
      let attendeesWithDetails: Array<{ name: string; role: string | null; user_id: string }> = [];
      
      if (attendeesData && attendeesData.length > 0) {
        const memberIds = attendeesData.map((a: any) => a.workspace_member_id);
        
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
          
          // Build attendees array with names and roles
          membersData.forEach((member: any) => {
            const user = usersMap.get(member.user_id);
            const roleData = member.workspace_member_roles?.[0]?.roles;
            
            attendeeUserIds.push(member.user_id);
            attendeesWithDetails.push({
              user_id: member.user_id,
              name: user?.name || 'Unknown',
              role: roleData?.name || null,
            });
          });
        }
      }

      const ev: EventItemWithAccountability = {
        id: data.id,
        title: formData.title!,
        clientId: formData.clientId,
        clientName: client?.name || formData.clientName,
        projectId: projectId && projectId !== 'new' ? projectId : undefined,
        projectType: projectData?.project_type || formData.projectType,
        appointmentTypeId: formData.appointmentTypeId,
        address: projectData?.address || formData.address,
        assignedTo: attendeeUserIds.length > 0 ? attendeeUserIds : (currentUserId ? [currentUserId] : []),
        date: formData.date!,
        time: formData.time!,
        created_by: currentUserId,
        created_at: data.created_at,
        updated_by: data.updated_by || null,
        updated_at: data.updated_at,
        attendees: attendeesWithDetails,
      };

      addEvent(ev);

      if (ev.clientId) {
        // Fetch appointment type name for activity log
        const { data: appointmentTypeData } = await supabase
          .from('calendar_appointment_types')
          .select('name')
          .eq('id', ev.appointmentTypeId)
          .maybeSingle();
        
        const appointmentTypeName = appointmentTypeData?.name || 'Event';
        
        onLogActivity(
          ev.clientId,
          `Event: ${ev.date} ${ev.time} — ${ev.projectType || 'Event'} (${appointmentTypeName})`
        );
      }

      toast({
        title: 'Success',
        description: isNewProject
          ? 'Project and calendar event created successfully!'
          : 'Calendar event created successfully!',
      });

      return { success: true };
    } catch (error) {
      console.error('Error creating calendar event:', error);
      toast({
        title: 'Error',
        description: 'Failed to create calendar event. Please try again.',
        variant: 'destructive',
      });
      return { success: false };
    } finally {
      setIsCreatingEvent(false);
      setIsCreatingProject(false);
    }
  };

  const updateEvent = async (
    eventId: string,
    formData: EventFormData,
    clients: DatabaseClient[],
    attendeeMemberIds?: string[]
  ) => {
    const missingFields: string[] = [];

    if (!formData.title) missingFields.push('Title');
    if (!formData.date) missingFields.push('Date');
    if (!formData.time) missingFields.push('Time');

    if (missingFields.length > 0) {
      toast({
        title: 'Missing Required Fields',
        description: `Please complete the following required fields: ${missingFields.join(', ')}`,
        variant: 'destructive',
      });
      return { success: false };
    }

    setIsUpdatingEvent(true);
    try {
      const client = clients.find((c) => c.client_id === formData.clientId);

      // Fetch before data for audit log
      const { data: beforeData } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('id', eventId)
        .maybeSingle();

      const { data: afterData, error } = await supabase
        .from('calendar_events')
        .update({
          title: formData.title,
          client_id: formData.clientId || null,
          client_name: client?.name || formData.clientName || '',
          project_id: formData.projectId || null,
          project_type: formData.projectType || null,
          appointment_type_id: formData.appointmentTypeId || null,
          address: formData.address || null,
          event_date: formData.date,
          event_time: formData.time,
          updated_by: currentUserId || null,
        })
        .eq('id', eventId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Log audit event for calendar event update
      if (workspaceId && currentUserId && beforeData && afterData) {
        await logUpdate(workspaceId, currentUserId, 'calendar_events', eventId, beforeData, afterData, 'Calendar');
      }

      // Update attendees if provided
      if (attendeeMemberIds !== undefined && workspaceId) {
        // Delete existing attendees
        const { error: deleteError } = await supabase
          .from('calendar_event_attendees')
          .delete()
          .eq('calendar_event_id', eventId);

        if (deleteError) {
          console.error('Error deleting existing attendees:', deleteError);
        }

        // Insert new attendees
        if (attendeeMemberIds.length > 0) {
          const attendeeRecords = attendeeMemberIds.map((memberId) => ({
            calendar_event_id: eventId,
            workspace_member_id: memberId,
            workspace_id: workspaceId,
            created_by: currentUserId,
            updated_by: currentUserId,
          }));

          const { error: insertError } = await supabase
            .from('calendar_event_attendees')
            .insert(attendeeRecords);

          if (insertError) {
            console.error('Error updating attendees:', insertError);
            // Don't throw - event is updated, attendees can be fixed later
          }
        }
      }

      // Fetch attendees with full details for the updated event
      const { data: attendeesData } = await supabase
        .from('calendar_event_attendees')
        .select('workspace_member_id')
        .eq('calendar_event_id', eventId);

      let attendeeUserIds: string[] = [];
      let attendeesWithDetails: Array<{ name: string; role: string | null; user_id: string }> = [];
      
      if (attendeesData && attendeesData.length > 0) {
        const memberIds = attendeesData.map((a: any) => a.workspace_member_id);
        
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
          
          // Build attendees array with names and roles
          membersData.forEach((member: any) => {
            const user = usersMap.get(member.user_id);
            const roleData = member.workspace_member_roles?.[0]?.roles;
            
            attendeeUserIds.push(member.user_id);
            attendeesWithDetails.push({
              user_id: member.user_id,
              name: user?.name || 'Unknown',
              role: roleData?.name || null,
            });
          });
        }
      }

      // Fetch the event to get accountability fields
      const { data: eventData } = await supabase
        .from('calendar_events')
        .select('created_by, created_at, updated_by, updated_at')
        .eq('id', eventId)
        .single();

      const updatedEvent: EventItemWithAccountability = {
        id: eventId,
        title: formData.title!,
        clientId: formData.clientId,
        clientName: client?.name || formData.clientName,
        projectId: formData.projectId,
        projectType: formData.projectType,
        appointmentTypeId: formData.appointmentTypeId,
        address: formData.address,
        assignedTo: attendeeUserIds.length > 0 ? attendeeUserIds : (currentUserId ? [currentUserId] : []),
        date: formData.date!,
        time: formData.time!,
        created_by: eventData?.created_by,
        created_at: eventData?.created_at,
        updated_by: eventData?.updated_by || null,
        updated_at: eventData?.updated_at,
        attendees: attendeesWithDetails,
      };

      removeEvent(eventId);
      addEvent(updatedEvent);

      toast({
        title: 'Success',
        description: 'Calendar event updated successfully!',
      });

      return { success: true, updatedEvent };
    } catch (error) {
      console.error('Error updating calendar event:', error);
      toast({
        title: 'Error',
        description: 'Failed to update calendar event. Please try again.',
        variant: 'destructive',
      });
      return { success: false };
    } finally {
      setIsUpdatingEvent(false);
    }
  };

  const deleteEvent = async (eventId: string) => {
    setIsDeletingEvent(true);
    try {
      // Fetch before data for audit log
      const { data: beforeData } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('id', eventId)
        .maybeSingle();

      const { error } = await supabase.from('calendar_events').delete().eq('id', eventId);

      if (error) {
        throw error;
      }

      // Log audit event for calendar event deletion
      if (workspaceId && currentUserId && beforeData) {
        await logDelete(workspaceId, currentUserId, 'calendar_events', eventId, beforeData, 'Calendar');
      }

      removeEvent(eventId);

      toast({
        title: 'Success',
        description: 'Calendar event deleted successfully!',
      });

      return { success: true };
    } catch (error) {
      console.error('Error deleting calendar event:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete calendar event. Please try again.',
        variant: 'destructive',
      });
      return { success: false };
    } finally {
      setIsDeletingEvent(false);
    }
  };

  return {
    createEvent,
    updateEvent,
    deleteEvent,
    isCreatingEvent,
    isUpdatingEvent,
    isDeletingEvent,
    isCreatingProject,
  };
}

