import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X } from "lucide-react";
import { AssignedStaff, WorkspaceMember } from '@/hooks/activity/useClientAssignments';

interface ClientAssignmentsSectionProps {
  assignedStaff: AssignedStaff[];
  availableMembers: WorkspaceMember[];
  selectedMemberId: string;
  onSelectMember: (memberId: string) => void;
  onAddStaff: () => void;
  onRemoveStaff: (assignmentId: string) => void;
  onUpdateStaff?: (memberId: string) => void;
  currentStaffMemberId?: string;
  loading: boolean;
  readOnly?: boolean;
}

export function ClientAssignmentsSection({
  assignedStaff,
  availableMembers,
  selectedMemberId,
  onSelectMember,
  onAddStaff,
  onRemoveStaff,
  onUpdateStaff,
  currentStaffMemberId = '',
  loading,
  readOnly = false,
}: ClientAssignmentsSectionProps) {
  const allMembers = [
    ...(assignedStaff.length > 0 ? [{
      id: assignedStaff[0].workspaceMemberId,
      name: assignedStaff[0].name,
      email: assignedStaff[0].email,
    }] : []),
    ...availableMembers
  ];

  const handleValueChange = (value: string) => {
    if (onUpdateStaff) {
      onUpdateStaff(value || '');
    } else {
      onSelectMember(value);
    }
  };

  return (
    <div className="md:col-span-2">
      <p className="text-sm text-muted-foreground mb-2">Assigned Staff</p>
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : !readOnly && onUpdateStaff ? (
        <Select
          value={currentStaffMemberId || undefined}
          onValueChange={handleValueChange}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select staff member..." />
          </SelectTrigger>
          <SelectContent>
            {allMembers.map((member) => (
              <SelectItem key={member.id} value={member.id}>
                {member.name || member.email || 'Unknown'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : assignedStaff.length > 0 ? (
        <div className="space-y-2">
          {assignedStaff.map((staff) => (
            <div
              key={staff.assignmentId}
              className="flex items-center justify-between px-3 py-2 bg-muted rounded-md"
            >
              <span className="text-sm font-medium text-foreground">
                {staff.name || staff.email || 'Unknown'}
              </span>
              {!readOnly && (
                <button
                  onClick={() => onRemoveStaff(staff.assignmentId)}
                  className="text-muted-foreground/70 hover:text-destructive transition-colors"
                  title="Remove staff member"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No assigned staff</p>
      )}
      {!readOnly && !onUpdateStaff && (
        <div className="mt-3 flex gap-2">
          <Select
            value={selectedMemberId}
            onValueChange={onSelectMember}
          >
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select staff member..." />
            </SelectTrigger>
            <SelectContent>
              {availableMembers.map((member) => (
                <SelectItem key={member.id} value={member.id}>
                  {member.name || member.email || 'Unknown'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={onAddStaff}
            disabled={!selectedMemberId}
            size="sm"
          >
            Add
          </Button>
        </div>
      )}
    </div>
  );
}

