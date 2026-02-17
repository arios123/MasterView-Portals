import React from 'react';
import { Input } from '@/components/ui/input';

interface TitleInputProps {
  value?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function TitleInput({ value, onChange, disabled }: TitleInputProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">
        Event Title <span className="text-red-500">*</span>
      </label>
      <Input
        placeholder="e.g., Kitchen Design Consultation"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-xl"
        disabled={disabled}
        required
      />
    </div>
  );
}
