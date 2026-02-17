import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Save } from 'lucide-react';

interface ChangeOrderSaveButtonProps {
  draftName: string;
  onDraftNameChange: (name: string) => void;
  onSave: () => void;
  readOnly: boolean;
  isEditing?: boolean; // Whether we're editing an existing change order
}

export function ChangeOrderSaveButton({
  draftName,
  onDraftNameChange,
  onSave,
  readOnly,
  isEditing = false,
}: ChangeOrderSaveButtonProps) {
  if (readOnly) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col md:flex-row md:items-center gap-3">
      <div className="bg-background border rounded-lg shadow-lg p-3 min-w-[280px]">
        <Input
          value={draftName}
          onChange={(e) => onDraftNameChange(e.target.value)}
          placeholder="Change Order name..."
          className={`w-full ${!draftName || draftName.trim() === '' ? 'border-destructive' : ''}`}
          required
        />
        {(!draftName || draftName.trim() === '') && (
          <p className="text-xs text-destructive mt-1">Change order name is required</p>
        )}
      </div>
      <Button
        onClick={onSave}
        size="lg"
        className="rounded-full shadow-lg hover:shadow-xl transition-all bg-primary text-primary-foreground h-14 px-6"
      >
        <Save className="h-5 w-5 mr-2" />
        {isEditing ? 'Save as New Change Order' : 'Create Change Order'}
      </Button>
    </div>
  );
}
