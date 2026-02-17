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
import { CrewMember, WorkspaceMember } from '@/hooks/activity/useProjectCrewAssignments';

interface ProjectCrewSectionProps {
  crewMembers: CrewMember[];
  availableMembers: WorkspaceMember[];
  selectedMemberId: string;
  onSelectMember: (memberId: string) => void;
  onAddCrewMember: () => void;
  onRemoveCrewMember: (assignmentId: string) => void;
  loading: boolean;
  readOnly?: boolean;
}

export function ProjectCrewSection({
  crewMembers,
  availableMembers,
  selectedMemberId,
  onSelectMember,
  onAddCrewMember,
  onRemoveCrewMember,
  loading,
  readOnly = false,
}: ProjectCrewSectionProps) {
  return (
    <div className="md:col-span-2">
      <p className="text-sm text-muted-foreground mb-2">Crew</p>
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : crewMembers.length > 0 ? (
        <div className="space-y-2">
          {crewMembers.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between px-3 py-2 bg-muted rounded-md"
            >
              <span className="text-sm font-medium text-foreground">
                {member.name || member.email || 'Unknown'}
              </span>
              {!readOnly && (
                <button
                  onClick={() => onRemoveCrewMember(member.id)}
                  className="text-muted-foreground/70 hover:text-destructive transition-colors"
                  title="Remove crew member"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No crew members assigned</p>
      )}
      {!readOnly && (
        <div className="mt-3 flex gap-2">
          <Select
            value={selectedMemberId}
            onValueChange={onSelectMember}
          >
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select crew member..." />
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
            onClick={onAddCrewMember}
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
