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
  disabled 
}: DateTimeInputProps) {
  // Convert 24-hour time to 12-hour format for display
  const to12HourFormat = (time24: string): string => {
    if (!time24) return '';
    const [hours, minutes] = time24.split(':');
    let hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12 || 12; // Convert 0 to 12
    return `${hour.toString().padStart(2, '0')}:${minutes} ${ampm}`;
  };

  // Convert 12-hour time to 24-hour format for storage
  const to24HourFormat = (time12: string): string => {
    if (!time12) return '';
    const match = time12.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!match) return time12; // Return as-is if format doesn't match
    
    let [, hours, minutes, period] = match;
    let hour = parseInt(hours, 10);
    
    if (period.toUpperCase() === 'PM' && hour !== 12) {
      hour += 12;
    } else if (period.toUpperCase() === 'AM' && hour === 12) {
      hour = 0;
    }
    
    return `${hour.toString().padStart(2, '0')}:${minutes}`;
  };

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
