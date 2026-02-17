import React from 'react';
import { Input } from '@/components/ui/input';

interface NewProjectFieldsProps {
  projectName: string | undefined;
  projectType: string | undefined;
  address: string | undefined;
  onProjectNameChange: (value: string) => void;
  onProjectTypeChange: (value: string) => void;
  onAddressChange: (value: string) => void;
}

export function NewProjectFields({
  projectName,
  projectType,
  address,
  onProjectNameChange,
  onProjectTypeChange,
  onAddressChange,
}: NewProjectFieldsProps) {
  return (
    <>
      <div className="space-y-2">
        <label className="text-sm font-medium">Project Name *</label>
        <Input
          placeholder="e.g., Smith Kitchen Remodel"
          value={projectName || ''}
          onChange={(e) => onProjectNameChange(e.target.value)}
          className="rounded-xl"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Project Type *</label>
        <Input
          placeholder="Kitchen, Bath, etc."
          value={projectType || ''}
          onChange={(e) => onProjectTypeChange(e.target.value)}
          className="rounded-xl"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Address *</label>
        <Input
          placeholder="Enter address"
          value={address || ''}
          onChange={(e) => onAddressChange(e.target.value)}
          className="rounded-xl"
        />
      </div>
    </>
  );
}

