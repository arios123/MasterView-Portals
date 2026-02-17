import React from 'react';
import { Select, SelectTrigger, SelectItem, SelectContent, SelectValue } from '@/components/ui/select';
import { useAppointmentTypes } from '@/hooks/useAppointmentTypes';
import { useWorkspace } from '@/contexts/WorkspaceContext';

interface AppointmentTypeSelectProps {
  value: string | undefined;
  onValueChange: (value: string) => void;
  disabled?: boolean;
}

export function AppointmentTypeSelect({ value, onValueChange, disabled }: AppointmentTypeSelectProps) {
  const { currentWorkspace } = useWorkspace();
  const { appointmentTypes, loading } = useAppointmentTypes(currentWorkspace?.id);

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Appointment Type *</label>
      <Select value={value} onValueChange={onValueChange} disabled={disabled || loading}>
        <SelectTrigger className="rounded-xl bg-card border-border">
          <SelectValue placeholder={loading ? "Loading..." : "Select appointment type..."} />
        </SelectTrigger>
        <SelectContent className="bg-popover z-[60]">
          {appointmentTypes.map((type) => (
            <SelectItem key={type.id} value={type.id}>
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full border"
                  style={{ backgroundColor: type.color }}
                />
                {type.name}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

