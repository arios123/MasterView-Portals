import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Save } from 'lucide-react';

interface MaterialsSaveButtonProps {
  draftName: string;
  onDraftNameChange: (name: string) => void;
  onSave: () => void;
  readOnly?: boolean;
  isSoldProject?: boolean;
  currentDraftName?: string | null;
  /** When true, render inline at bottom of section instead of fixed floating */
  inline?: boolean;
  /** When true, disable the save button (e.g. no permission) */
  disabled?: boolean;
}

export function MaterialsSaveButton({
  draftName,
  onDraftNameChange,
  onSave,
  readOnly = false,
  isSoldProject = false,
  currentDraftName = null,
  inline = false,
  disabled = false,
}: MaterialsSaveButtonProps) {
  if (readOnly) return null;

  return (
    <div className={inline ? "flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2 pt-3 border-t border-border/60" : "fixed bottom-6 right-6 z-50 flex flex-col md:flex-row md:items-center gap-3"}>
      {isSoldProject ? (
        <div className={inline ? "bg-muted/30 border border-border/60 rounded-md px-2 flex items-center h-8 min-w-0 w-full sm:w-auto sm:max-w-[200px]" : "bg-background border rounded-lg shadow-lg p-3 min-w-[280px]"}>
          <Input
            value={currentDraftName || 'Sold Version'}
            readOnly
            className={inline ? "w-full h-8 text-xs bg-transparent cursor-not-allowed border-0 focus-visible:ring-0 shadow-none py-0" : "w-full bg-muted cursor-not-allowed"}
          />
          {!inline && <p className="text-xs text-muted-foreground mt-1">Sold project - updating existing version</p>}
        </div>
      ) : (
        <div className={inline ? "border border-border/60 rounded-md px-2 flex items-center h-8 min-w-0 w-full sm:w-auto sm:max-w-[200px]" : "bg-background border rounded-lg shadow-lg p-3 min-w-[280px]"}>
          <Input
            value={draftName}
            onChange={(e) => onDraftNameChange(e.target.value)}
            placeholder="Draft name..."
            className={inline ? `w-full h-8 text-xs border-0 focus-visible:ring-0 shadow-none bg-transparent py-0 ${!draftName || draftName.trim() === '' ? 'placeholder:text-destructive' : ''}` : `w-full ${!draftName || draftName.trim() === '' ? 'border-destructive' : ''}`}
            required
          />
          {(!draftName || draftName.trim() === '') && (
            <p className={`text-[10px] text-destructive mt-0.5 ${inline ? 'leading-tight' : 'text-xs mt-1'}`}>Draft name is required</p>
          )}
        </div>
      )}
      <Button
        onClick={onSave}
        disabled={disabled}
        size={inline ? "sm" : "lg"}
        className={inline ? "!h-8 min-h-8 gap-1.5 rounded-md bg-primary text-primary-foreground shrink-0 py-0" : "rounded-full shadow-lg hover:shadow-xl transition-all bg-primary text-primary-foreground h-14 px-6"}
      >
        <Save className={inline ? "h-3.5 w-3.5" : "h-5 w-5 mr-2"} />
        {isSoldProject ? (inline ? 'Save' : 'Save Changes') : (inline ? 'Save' : 'Save Materials')}
      </Button>
    </div>
  );
}

