import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DraftSelectorProps {
  drafts: any[];
  selectedDraftId: string;
  isDropdownOpen: boolean;
  setIsDropdownOpen: (open: boolean) => void;
  onDraftSelect: (draftId: string) => void;
}

export function DraftSelector({
  drafts,
  selectedDraftId,
  isDropdownOpen,
  setIsDropdownOpen,
  onDraftSelect,
}: DraftSelectorProps) {
  return (
    <Card className="rounded-2xl border bg-blue-50">
      <CardHeader>
        <CardTitle className="text-base">Select Draft to Modify</CardTitle>
      </CardHeader>
      <CardContent>
        <Popover open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={isDropdownOpen}
              className="w-full justify-between bg-background"
            >
              {selectedDraftId
                ? (() => {
                    const draft = drafts.find((d) => d.version_id === selectedDraftId);
                    const statusLabel = draft?.is_active ? `${draft.status} (Active)` : draft?.status;
                    const displayName = draft?.name || statusLabel;
                    return displayName;
                  })()
                : 'Select a draft to modify...'}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0 bg-background border shadow-lg z-50">
            <Command>
              <CommandInput placeholder="Search drafts..." />
              <CommandEmpty>No drafts found.</CommandEmpty>
              <CommandGroup className="max-h-60 overflow-auto">
                {drafts.map((draft) => {
                  const statusLabel = draft.is_active ? `${draft.status} (Active)` : draft.status;
                  const displayName = draft.name || statusLabel;
                  return (
                    <CommandItem
                      key={draft.version_id}
                      value={displayName}
                      onSelect={() => {
                        onDraftSelect(draft.version_id);
                        setIsDropdownOpen(false);
                      }}
                      className="hover:bg-gray-100 cursor-pointer"
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          selectedDraftId === draft.version_id ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      <div className="flex flex-col">
                        <div className="font-medium">{displayName}</div>
                        <div className="text-xs text-muted-foreground">
                          {statusLabel} • Multiplier: {draft.multiplier}
                        </div>
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>
      </CardContent>
    </Card>
  );
}
