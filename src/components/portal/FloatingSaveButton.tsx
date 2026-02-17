import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Save } from "lucide-react";

interface FloatingSaveButtonProps {
  onSave: () => void;
  label?: string;
  draftName?: string;
  onDraftNameChange?: (name: string) => void;
  placeholder?: string;
  showNameInput?: boolean;
}

export function FloatingSaveButton({ 
  onSave, 
  label = "Save",
  draftName = "",
  onDraftNameChange,
  placeholder = "Draft name...",
  showNameInput = false
}: FloatingSaveButtonProps) {
  const isDraftNameEmpty = !draftName || draftName.trim() === '';
  
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3">
      {showNameInput && onDraftNameChange && (
        <div className="bg-background border rounded-lg shadow-lg p-3 min-w-[280px]">
          <Input
            value={draftName}
            onChange={(e) => onDraftNameChange(e.target.value)}
            placeholder={placeholder}
            className={`w-full ${isDraftNameEmpty ? 'border-destructive' : ''}`}
            required
          />
          {isDraftNameEmpty && (
            <p className="text-xs text-destructive mt-1">Draft name is required</p>
          )}
        </div>
      )}
      <Button
        onClick={onSave}
        size="lg"
        className="rounded-full shadow-lg hover:shadow-xl transition-all bg-primary text-primary-foreground h-14 px-6"
      >
        <Save className="h-5 w-5 mr-2" />
        {label}
      </Button>
    </div>
  );
}
