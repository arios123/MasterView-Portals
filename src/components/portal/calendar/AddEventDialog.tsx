import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { DatabaseClient, ClientProject, EventFormData } from '@/types/calendar';
import { TitleInput } from './TitleInput';
import { DateTimeInput } from './DateTimeInput';
import { ClientPicker } from './ClientPicker';
import { AppointmentTypeSelect } from './AppointmentTypeSelect';
import { ProjectSelector } from './ProjectSelector';
import { NewProjectFields } from './NewProjectFields';
import { NewClientDialog } from '@/components/portal/NewClientDialog';
import { AttendeeSelector } from './AttendeeSelector';
import { useWorkspaceMembers } from '@/hooks/calendar/useWorkspaceMembers';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useAuth } from '@/contexts/AuthContext';

interface AddEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clients: DatabaseClient[];
  projects: ClientProject[];
  initialDate?: string;
  isCreating: boolean;
  isCreatingProject: boolean;
  onSubmit: (formData: EventFormData, selectedProjectId: string, isNewProject: boolean, attendeeMemberIds: string[]) => Promise<{ success: boolean }>;
  onClientSelect: (clientId: string) => void;
  onClientCreated?: () => void;
}

export function AddEventDialog({
  open,
  onOpenChange,
  clients,
  projects,
  initialDate,
  isCreating,
  isCreatingProject,
  onSubmit,
  onClientSelect,
  onClientCreated,
}: AddEventDialogProps) {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const { members: workspaceMembers } = useWorkspaceMembers(currentWorkspace?.id);

  const [formData, setFormData] = useState<EventFormData>({
    time: '09:00',
    date: initialDate,
  });
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [isNewProject, setIsNewProject] = useState(false);
  const [isNewClientDialogOpen, setIsNewClientDialogOpen] = useState(false);
  const [selectedAttendeeMemberIds, setSelectedAttendeeMemberIds] = useState<string[]>([]);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setFormData({
        time: '09:00',
        date: initialDate,
      });
      setSelectedClientId('');
      setSelectedProjectId('');
      setIsNewProject(false);

      if (user && workspaceMembers.length > 0) {
        const currentUserMember = workspaceMembers.find((m) => m.user_id === user.id);
        if (currentUserMember) {
          setSelectedAttendeeMemberIds([currentUserMember.id]);
        } else {
          setSelectedAttendeeMemberIds([]);
        }
      } else {
        setSelectedAttendeeMemberIds([]);
      }
    }
  }, [open, initialDate, user, workspaceMembers]);

  const handleClientSelect = (clientId: string) => {
    const client = clients.find((c) => c.client_id === clientId);
    if (!client) return;

    setSelectedClientId(clientId);
    setSelectedProjectId('');
    setIsNewProject(false);
    setFormData((f) => ({
      ...f,
      clientId: client.client_id,
      clientName: client.name,
      projectId: undefined,
      address: undefined,
      projectType: undefined,
    }));

    onClientSelect(clientId);
  };

  const handleProjectSelect = (projectId: string) => {
    setSelectedProjectId(projectId);
    setIsNewProject(projectId === 'new');
    if (projectId !== 'new') {
      const project = projects.find((p) => p.project_id === projectId);
      if (project) {
        setFormData((f) => ({
          ...f,
          projectId: project.project_id,
          projectType: project.project_type || '',
          address: project.address || '',
        }));
      }
    } else {
      setFormData((f) => ({
        ...f,
        projectId: undefined,
        projectName: '',
        projectType: '',
        address: '',
      }));
    }
  };

  const handleSubmit = async () => {
    const result = await onSubmit(formData, selectedProjectId, isNewProject, selectedAttendeeMemberIds);
    if (result.success) {
      onOpenChange(false);
    }
  };

  const handleClientCreated = () => {
    setIsNewClientDialogOpen(false);
    if (onClientCreated) {
      onClientCreated();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-background z-50 max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Event</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 p-4">
          <div className="space-y-4">
            {/* 1. Title Field (Required, Always Visible) */}
            <TitleInput
              value={formData.title}
              onChange={(v) => setFormData((f) => ({ ...f, title: v }))}
              disabled={isCreating || isCreatingProject}
            />

            {/* 2. Date & Time (Required, Always Visible) */}
            <DateTimeInput
              date={formData.date}
              time={formData.time}
              onDateChange={(v) => setFormData((f) => ({ ...f, date: v }))}
              onTimeChange={(v) => setFormData((f) => ({ ...f, time: v }))}
              disabled={isCreating || isCreatingProject}
            />

            {/* 3. Event Type (Optional, Always Visible) */}
            <AppointmentTypeSelect
              value={formData.appointmentTypeId}
              onValueChange={(v) => setFormData((f) => ({ ...f, appointmentTypeId: v }))}
              disabled={isCreating || isCreatingProject}
            />

            {/* 4. Attendees (Optional, Always Visible) */}
            <AttendeeSelector
              members={workspaceMembers}
              selectedMemberIds={selectedAttendeeMemberIds}
              onSelectMember={(memberId) => {
                if (!selectedAttendeeMemberIds.includes(memberId)) {
                  setSelectedAttendeeMemberIds([...selectedAttendeeMemberIds, memberId]);
                }
              }}
              onRemoveMember={(memberId) => {
                setSelectedAttendeeMemberIds(selectedAttendeeMemberIds.filter((id) => id !== memberId));
              }}
              disabled={isCreating || isCreatingProject}
              currentUserId={user?.id}
            />

            {/* 5. Client Selection (Optional, Always Visible) */}
            <ClientPicker
              clients={clients}
              selectedClientId={selectedClientId}
              onSelectClient={handleClientSelect}
              onAddNewClient={() => setIsNewClientDialogOpen(true)}
              disabled={isCreating || isCreatingProject}
            />

            {/* 6. Project Selection (Only shown if client selected) */}
            {selectedClientId && (
              <ProjectSelector
                projects={projects}
                selectedProjectId={selectedProjectId}
                onSelectProject={handleProjectSelect}
                disabled={isCreating || isCreatingProject}
              />
            )}

            {/* 7. New Project Fields (Only shown if creating new project) */}
            {isNewProject && selectedProjectId === 'new' && (
              <NewProjectFields
                projectName={formData.projectName}
                projectType={formData.projectType}
                address={formData.address}
                onProjectNameChange={(v) => setFormData((f) => ({ ...f, projectName: v }))}
                onProjectTypeChange={(v) => setFormData((f) => ({ ...f, projectType: v }))}
                onAddressChange={(v) => setFormData((f) => ({ ...f, address: v }))}
              />
            )}
          </div>
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-xl"
              disabled={isCreating || isCreatingProject}
            >
              Cancel
            </Button>
            <Button
              className="rounded-xl bg-black text-white hover:bg-gray-900"
              onClick={handleSubmit}
              disabled={isCreating || isCreatingProject}
            >
              {isCreatingProject
                ? 'Creating Project...'
                : isCreating
                  ? 'Creating Event...'
                  : 'Create Event'}
            </Button>
          </div>
        </div>
      </DialogContent>

      <NewClientDialog
        open={isNewClientDialogOpen}
        onOpenChange={setIsNewClientDialogOpen}
        onClientCreated={handleClientCreated}
        showTrigger={false}
      />
    </Dialog>
  );
}
