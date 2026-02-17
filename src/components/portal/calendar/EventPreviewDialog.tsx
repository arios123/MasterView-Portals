import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EventItem } from '@/types';
import { EventFormData, DatabaseClient, EventItemWithAccountability } from '@/types/calendar';
import { AccountabilityInfo } from '@/components/AccountabilityInfo';
import { TitleInput } from './TitleInput';
import { DateTimeInput } from './DateTimeInput';
import { ClientPicker } from './ClientPicker';
import { AppointmentTypeSelect } from './AppointmentTypeSelect';
import { AttendeeSelector } from './AttendeeSelector';
import { useWorkspaceMembers } from '@/hooks/calendar/useWorkspaceMembers';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useAuth } from '@/contexts/AuthContext';
import { useAppointmentTypes } from '@/hooks/useAppointmentTypes';

interface EventPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: EventItem | null;
  clients: DatabaseClient[];
  isUpdating: boolean;
  isDeleting: boolean;
  canEdit: boolean;
  onUpdate: (eventId: string, formData: EventFormData, attendeeMemberIds?: string[]) => Promise<{ success: boolean; updatedEvent?: EventItem }>;
  onDelete: (eventId: string) => Promise<{ success: boolean }>;
}

export function EventPreviewDialog({
  open,
  onOpenChange,
  event,
  clients,
  isUpdating,
  isDeleting,
  canEdit,
  onUpdate,
  onDelete,
}: EventPreviewDialogProps) {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const { members: workspaceMembers } = useWorkspaceMembers(currentWorkspace?.id);
  const { appointmentTypes } = useAppointmentTypes(currentWorkspace?.id);
  
  const [isEditMode, setIsEditMode] = useState(false);
  const [editForm, setEditForm] = useState<EventFormData>({});
  const [selectedAttendeeMemberIds, setSelectedAttendeeMemberIds] = useState<string[]>([]);

  // Reset edit mode when dialog opens/closes or event changes
  useEffect(() => {
    if (open && event) {
      setEditForm({
        ...event,
        assignedToUserId: event.assignedTo?.[0] || '',
      });
      setIsEditMode(false);
      
      // Load attendee member IDs from event
      const eventWithAttendees = event as EventItemWithAccountability;
      if (eventWithAttendees.attendees && workspaceMembers.length > 0) {
        // Map attendees to workspace_member_ids
        const memberIds = eventWithAttendees.attendees
          .map((attendee) => {
            const member = workspaceMembers.find((m) => m.user_id === attendee.user_id);
            return member?.id;
          })
          .filter((id): id is string => id !== undefined);
        setSelectedAttendeeMemberIds(memberIds);
      } else {
        // Fallback: try to find members from assignedTo user_ids
        if (event.assignedTo && workspaceMembers.length > 0) {
          const memberIds = event.assignedTo
            .map((userId) => {
              const member = workspaceMembers.find((m) => m.user_id === userId);
              return member?.id;
            })
            .filter((id): id is string => id !== undefined);
          setSelectedAttendeeMemberIds(memberIds);
        } else {
          setSelectedAttendeeMemberIds([]);
        }
      }
    }
  }, [open, event, workspaceMembers]);

  if (!event) return null;

  const handleUpdate = async () => {
    const result = await onUpdate(event.id, editForm, selectedAttendeeMemberIds);
    if (result.success) {
      setIsEditMode(false);
    }
  };

  const handleDelete = async () => {
    const result = await onDelete(event.id);
    if (result.success) {
      onOpenChange(false);
    }
  };

  const handleCancel = () => {
    setEditForm({
      ...event,
      assignedToUserId: event.assignedTo?.[0] || '',
    });
    setIsEditMode(false);
    
    // Reset attendees
    const eventWithAttendees = event as EventItemWithAccountability;
    if (eventWithAttendees.attendees && workspaceMembers.length > 0) {
      const memberIds = eventWithAttendees.attendees
        .map((attendee) => {
          const member = workspaceMembers.find((m) => m.user_id === attendee.user_id);
          return member?.id;
        })
        .filter((id): id is string => id !== undefined);
      setSelectedAttendeeMemberIds(memberIds);
    } else {
      setSelectedAttendeeMemberIds([]);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        onOpenChange(open);
        if (!open) setIsEditMode(false);
      }}
    >
      <DialogContent className="bg-background z-50 max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Event' : 'Event Details'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 p-4">
          {!isEditMode ? (
            <div className="grid grid-cols-2 gap-4">
              {/* 1. Title */}
              <div className="col-span-2">
                <label className="text-sm font-medium text-muted-foreground">Title</label>
                <p className="text-base font-semibold">{event.title}</p>
              </div>
              
              {/* 2. Date & Time */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">Date</label>
                <p className="text-base">{new Date(event.date).toLocaleDateString()}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Time</label>
                <p className="text-base">{event.time}</p>
              </div>
              
              {/* 3. Event Type (Optional) */}
              {event.appointmentTypeId && (
                <div className="col-span-2">
                  <label className="text-sm font-medium text-muted-foreground">Event Type</label>
                  <p className="text-base">
                    {appointmentTypes.find((t) => t.id === event.appointmentTypeId)?.name || 'Not specified'}
                  </p>
                </div>
              )}
              
              {/* 4. Attendees */}
              {(event as EventItemWithAccountability).attendees && (event as EventItemWithAccountability).attendees!.length > 0 && (
                <div className="col-span-2">
                  <label className="text-sm font-medium text-muted-foreground">Attendees</label>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    {(event as EventItemWithAccountability).attendees!.map((attendee, index) => (
                      <li key={index} className="text-base">
                        {attendee.name}{attendee.role ? ` - ${attendee.role}` : ''}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* 5. Client (Optional) */}
              {event.clientName && (
                <div className="col-span-2">
                  <label className="text-sm font-medium text-muted-foreground">Client</label>
                  <p className="text-base">{event.clientName}</p>
                </div>
              )}
              
              {/* 6. Project Type (Optional) */}
              {event.projectType && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Project Type</label>
                  <p className="text-base">{event.projectType}</p>
                </div>
              )}
              
              {/* 7. Address (Optional) */}
              {event.address && (
                <div className="col-span-2">
                  <label className="text-sm font-medium text-muted-foreground">Address</label>
                  <p className="text-base">{event.address}</p>
                </div>
              )}
              
              {/* Accountability Info */}
              <div className="col-span-2 flex items-center justify-start pt-2 border-t">
                <AccountabilityInfo
                  created_by={(event as EventItemWithAccountability).created_by}
                  created_at={(event as EventItemWithAccountability).created_at}
                  updated_by={(event as EventItemWithAccountability).updated_by}
                  updated_at={(event as EventItemWithAccountability).updated_at}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Edit Mode */}
              <TitleInput
                value={editForm.title}
                onChange={(v) => setEditForm((f) => ({ ...f, title: v }))}
                disabled={isUpdating}
              />

              <DateTimeInput
                date={editForm.date}
                time={editForm.time}
                onDateChange={(v) => setEditForm((f) => ({ ...f, date: v }))}
                onTimeChange={(v) => setEditForm((f) => ({ ...f, time: v }))}
                disabled={isUpdating}
              />

              <AppointmentTypeSelect
                value={editForm.appointmentTypeId}
                onValueChange={(v) => setEditForm((f) => ({ ...f, appointmentTypeId: v }))}
                disabled={isUpdating}
              />

              <AttendeeSelector
                members={workspaceMembers}
                selectedMemberIds={selectedAttendeeMemberIds}
                onSelectMember={(memberId) => {
                  if (!selectedAttendeeMemberIds.includes(memberId)) {
                    setSelectedAttendeeMemberIds([...selectedAttendeeMemberIds, memberId]);
                  }
                }}
                onRemoveMember={(memberId) => {
                  setSelectedAttendeeMemberIds(
                    selectedAttendeeMemberIds.filter((id) => id !== memberId)
                  );
                }}
                disabled={isUpdating}
                currentUserId={user?.id}
              />

              <ClientPicker
                clients={clients}
                selectedClientId={editForm.clientId || ''}
                onSelectClient={(clientId) => {
                  const client = clients.find((c) => c.client_id === clientId);
                  setEditForm((f) => ({ ...f, clientId, clientName: client?.name || '' }));
                }}
                disabled={isUpdating}
              />

              <div className="space-y-2">
                <label className="text-sm font-medium">Project Type</label>
                <Input
                  placeholder="Kitchen, Bath, etc."
                  value={editForm.projectType || ''}
                  onChange={(e) => setEditForm((f) => ({ ...f, projectType: e.target.value }))}
                  className="rounded-xl"
                  disabled={isUpdating}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Address</label>
                <Input
                  placeholder="Enter address"
                  value={editForm.address || ''}
                  onChange={(e) => setEditForm((f) => ({ ...f, address: e.target.value }))}
                  className="rounded-xl"
                  disabled={isUpdating}
                />
              </div>
            </div>
          )}
          <div className="flex justify-between">
            {!isEditMode ? (
              <>
                {canEdit && (
                  <Button
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="rounded-xl"
                  >
                    {isDeleting ? 'Deleting...' : 'Delete Event'}
                  </Button>
                )}
                <div className="flex gap-2 ml-auto">
                  {canEdit && (
                    <Button
                      variant="default"
                      onClick={() => setIsEditMode(true)}
                      className="rounded-xl bg-black text-white hover:bg-gray-900"
                    >
                      Edit
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    className="rounded-xl"
                  >
                    Close
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isUpdating}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  variant="default"
                  onClick={handleUpdate}
                  disabled={isUpdating}
                  className="rounded-xl bg-black text-white hover:bg-gray-900"
                >
                  {isUpdating ? 'Saving...' : 'Save Changes'}
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
