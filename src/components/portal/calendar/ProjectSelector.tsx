import React from 'react';
import { Select, SelectTrigger, SelectItem, SelectContent, SelectValue } from '@/components/ui/select';
import { ClientProject } from '@/types/calendar';

interface ProjectSelectorProps {
  projects: ClientProject[];
  selectedProjectId: string;
  onSelectProject: (projectId: string) => void;
  disabled?: boolean;
}

export function ProjectSelector({
  projects,
  selectedProjectId,
  onSelectProject,
  disabled,
}: ProjectSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Project *</label>
      <Select value={selectedProjectId} onValueChange={onSelectProject} disabled={disabled}>
        <SelectTrigger className="rounded-xl bg-card border-border">
          <SelectValue placeholder="Select project..." />
        </SelectTrigger>
        <SelectContent className="bg-popover z-[60]">
          <SelectItem value="new">
            <span className="font-semibold">+ New Project</span>
          </SelectItem>
          {projects.map((project) => (
            <SelectItem key={project.project_id} value={project.project_id}>
              {project.name || project.project_type || 'Unnamed Project'}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

