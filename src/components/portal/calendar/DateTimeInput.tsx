import React from 'react';
import { Input } from '@/components/ui/input';

interface DateTimeInputProps {
  date?: string;
  time?: string;
  onDateChange: (value: string) => void;
  onTimeChange: (value: string) => void;
  disabled?: boolean;
}

export function DateTimeInput({
  date,
  time,
  onDateChange,
  onTimeChange,
  disabled,
}: DateTimeInputProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">
          Date <span className="text-red-500">*</span>
        </label>
        <Input
          type="date"
          value={date || ''}
          onChange={(e) => onDateChange(e.target.value)}
          className="rounded-xl"
          disabled={disabled}
          required
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">
          Time <span className="text-red-500">*</span>
        </label>
        <Input
          type="time"
          value={time || ''}
          onChange={(e) => onTimeChange(e.target.value)}
          className="rounded-xl"
          disabled={disabled}
          required
        />
      </div>
    </div>
  );
}
