import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface DocumentListControlsProps {
  sortBy: 'name' | 'type' | 'date-asc' | 'date-desc';
  onSortChange: (value: 'name' | 'type' | 'date-asc' | 'date-desc') => void;
  showActiveOnly: boolean;
  onShowActiveChange: (checked: boolean) => void;
}

export function DocumentListControls({
  sortBy,
  onSortChange,
  showActiveOnly,
  onShowActiveChange,
}: DocumentListControlsProps) {
  return (
    <div className="flex items-center justify-between mb-2">
      <div className="text-sm font-medium">Generated Documents</div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Checkbox
            id="show-active-only"
            checked={showActiveOnly}
            onCheckedChange={(checked) => onShowActiveChange(checked === true)}
          />
          <Label htmlFor="show-active-only" className="text-sm font-normal cursor-pointer">
            Show Active
          </Label>
        </div>
        <Select value={sortBy} onValueChange={onSortChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="type">Type</SelectItem>
            <SelectItem value="date-desc">Date (Newest)</SelectItem>
            <SelectItem value="date-asc">Date (Oldest)</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

