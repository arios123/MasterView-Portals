import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { EventItem, Client, User } from '@/types';
import { MonthGrid } from './MonthGrid';
import { supabase } from '@/integrations/supabase/client';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useCalendarEvents } from '@/hooks/calendar/useCalendarEvents';
import { useCalendarClients } from '@/hooks/calendar/useCalendarClients';
import { useClientProjects } from '@/hooks/calendar/useClientProjects';
import { useEventCRUD } from '@/hooks/calendar/useEventCRUD';
import { CalendarHeader } from './calendar/CalendarHeader';
import { AddEventDialog } from './calendar/AddEventDialog';
import { EventPreviewDialog } from './calendar/EventPreviewDialog';
import { useLocalStorageCache, useCacheKey } from '@/hooks/useLocalStorageCache';

interface DatabaseUser {
  id: string;
  user_id: string | null;
  name: string;
  email: string | null;
  role: string | null;
}

export function CalendarTab({
  events,
  addEvent,
  removeEvent,
  clients,
  users,
  meId,
  meRole,
  canSeeAll,
  onLogActivity,
  typeColors,
  designerColors,
  canEdit = false,
}: {
  events: EventItem[];
  addEvent: (e: EventItem) => void;
  removeEvent: (eventId: string) => void;
  clients: Client[];
  users: User[];
  meId: string;
  meRole: string;
  canSeeAll: boolean;
  onLogActivity: (clientId: string, line: string) => void;
  typeColors: Record<string, string>;
  designerColors: Record<string, string>;
  canEdit?: boolean;
}) {
  // Cache UI state to localStorage (calendar-wide, not project-specific)
  // Uses user/workspace scoping for security
  const cacheKey = useCacheKey();
  const cachePrefix = 'calendartab';
  const [currentMonth, setCurrentMonth] = useLocalStorageCache<Date>(
    cacheKey(cachePrefix, undefined, undefined, 'currentMonth'),
    new Date(),
    {
      serialize: (date) => date.toISOString(),
      deserialize: (str) => new Date(str),
    }
  );
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useLocalStorageCache<boolean>(
    cacheKey(cachePrefix, undefined, undefined, 'isAddDialogOpen'),
    false
  );
  const [isEventPreviewOpen, setIsEventPreviewOpen] = useLocalStorageCache<boolean>(
    cacheKey(cachePrefix, undefined, undefined, 'isEventPreviewOpen'),
    false
  );
  const [selectedEvent, setSelectedEvent] = useLocalStorageCache<EventItem | null>(
    cacheKey(cachePrefix, undefined, undefined, 'selectedEvent'),
    null
  );
  const [selectedClientId, setSelectedClientId] = useLocalStorageCache<string>(
    cacheKey(cachePrefix, undefined, undefined, 'selectedClientId'),
    ''
  );
  const [addDialogInitialDate, setAddDialogInitialDate] = useLocalStorageCache<string | undefined>(
    cacheKey(cachePrefix, undefined, undefined, 'addDialogInitialDate'),
    undefined
  );

  const { currentWorkspace } = useWorkspace();
  const workspaceId = currentWorkspace?.id;

  // Get current user
  useEffect(() => {
    const getCurrentUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }
    };
    getCurrentUser();
  }, []);

  // Fetch calendar events from database
  useCalendarEvents({ workspaceId, initialEvents: events, addEvent });

  // Fetch clients for workspace
  const { clients: dbClients, refreshClients } = useCalendarClients(workspaceId);

  // Fetch projects for selected client
  const { projects: clientProjects } = useClientProjects(selectedClientId);

  // CRUD operations
  const eventCRUD = useEventCRUD({
    workspaceId,
    currentUserId,
    addEvent,
    removeEvent,
    onLogActivity,
  });

  // Month navigation handlers
  const goToPreviousMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
  };

  // Event handlers
  const handleDayClick = (date: string) => {
    if (!canEdit) return;
    setAddDialogInitialDate(date);
    setSelectedClientId('');
    setIsAddDialogOpen(true);
  };

  const handleClientSelect = (clientId: string) => {
    setSelectedClientId(clientId);
  };

  const handleEventClick = (event: EventItem) => {
    setSelectedEvent(event);
    setIsEventPreviewOpen(true);
  };

  const handleAddEvent = async (formData: any, selectedProjectId: string, isNewProject: boolean, attendeeMemberIds: string[] = []) => {
    const result = await eventCRUD.createEvent(
      formData,
      selectedProjectId,
      isNewProject,
      dbClients,
      clientProjects,
      attendeeMemberIds
    );
    return result;
  };

  const handleUpdateEvent = async (eventId: string, formData: any, attendeeMemberIds?: string[]) => {
    const result = await eventCRUD.updateEvent(eventId, formData, dbClients, attendeeMemberIds);
    if (result.success && result.updatedEvent) {
      setSelectedEvent(result.updatedEvent);
    }
    return result;
  };

  const handleDeleteEvent = async (eventId: string) => {
    const result = await eventCRUD.deleteEvent(eventId);
    return result;
  };

  return (
    <div className="space-y-4">
      <Card className="rounded-2xl border bg-card">
        <CardHeader>
          <CalendarHeader
            onPreviousMonth={goToPreviousMonth}
            onToday={goToToday}
            onNextMonth={goToNextMonth}
          />
        </CardHeader>
        <CardContent className="space-y-4">
          <MonthGrid
            date={currentMonth}
            events={events}
            canSeeAll={canSeeAll}
            meId={meId}
            meRole={meRole}
            typeColors={typeColors}
            designerColors={designerColors}
            onEventClick={handleEventClick}
            onDayClick={canEdit ? handleDayClick : undefined}
          />
        </CardContent>
      </Card>

      {/* Add Event Dialog */}
      <AddEventDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        clients={dbClients}
        projects={clientProjects}
        initialDate={addDialogInitialDate}
        isCreating={eventCRUD.isCreatingEvent}
        isCreatingProject={eventCRUD.isCreatingProject}
        onSubmit={handleAddEvent}
        onClientSelect={handleClientSelect}
        onClientCreated={refreshClients}
      />

      {/* Event Preview Dialog */}
      <EventPreviewDialog
        open={isEventPreviewOpen}
        onOpenChange={setIsEventPreviewOpen}
        event={selectedEvent}
        clients={dbClients}
        isUpdating={eventCRUD.isUpdatingEvent}
        isDeleting={eventCRUD.isDeletingEvent}
        canEdit={canEdit}
        onUpdate={handleUpdateEvent}
        onDelete={handleDeleteEvent}
      />
    </div>
  );
}
