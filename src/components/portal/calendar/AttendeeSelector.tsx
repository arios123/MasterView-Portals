import React from 'react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { WorkspaceMember } from '@/hooks/calendar/useWorkspaceMembers';
import { X } from 'lucide-react';

interface AttendeeSelectorProps {
  members: WorkspaceMember[];
  selectedMemberIds: string[]; // workspace_member_ids
  onSelectMember: (memberId: string) => void;
  onRemoveMember: (memberId: string) => void;
  disabled?: boolean;
  currentUserId?: string; // To highlight the current user
}

export function AttendeeSelector({
  members,
  selectedMemberIds,
  onSelectMember,
  onRemoveMember,
  disabled,
  currentUserId,
}: AttendeeSelectorProps) {
  const availableMembers = members.filter(
    (member) => !selectedMemberIds.includes(member.id)
  );

  const getMemberDisplayName = (member: WorkspaceMember) => {
    return member.name || member.email || 'Unknown';
  };

  const getMemberDisplayText = (member: WorkspaceMember) => {
    const name = getMemberDisplayName(member);
    const role = member.role ? ` - ${member.role}` : '';
    return `${name}${role}`;
  };

  return (
    <div className="space-y-2">
      <Label>Attendees (Optional)</Label>
      <Select
        value=""
        onValueChange={(value) => {
          if (value && !selectedMemberIds.includes(value)) {
            onSelectMember(value);
          }
        }}
        disabled={disabled || availableMembers.length === 0}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select attendees..." />
        </SelectTrigger>
        <SelectContent>
          {availableMembers.map((member) => (
            <SelectItem key={member.id} value={member.id}>
              {getMemberDisplayText(member)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {selectedMemberIds.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {selectedMemberIds.map((memberId) => {
            const member = members.find((m) => m.id === memberId);
            if (!member) return null;

            const isCurrentUser = member.user_id === currentUserId;

            return (
              <div
                key={memberId}
                className={`flex items-center gap-1 px-2 py-1 bg-muted rounded-md text-sm ${
                  isCurrentUser ? 'ring-2 ring-primary' : ''
                }`}
              >
                <span>{getMemberDisplayText(member)}</span>
                <button
                  type="button"
                  onClick={() => onRemoveMember(memberId)}
                  disabled={disabled}
                  className="ml-1 text-muted-foreground hover:text-foreground disabled:opacity-50"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

