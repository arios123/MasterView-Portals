import React from 'react';
import { Input } from '@/components/ui/input';

interface TimeInputProps {
  value: string | undefined;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function TimeInput({ value, onChange, disabled }: TimeInputProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Time *</label>
      <Input
        type="time"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-xl"
        disabled={disabled}
      />
    </div>
  );
}

