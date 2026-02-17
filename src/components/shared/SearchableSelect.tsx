import React, { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchableSelectProps<T> {
  items: T[];
  value: string;
  onSelect: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  getItemValue: (item: T) => string;
  getItemLabel: (item: T) => string;
  renderItem?: (item: T) => ReactNode;
  disabled?: boolean;
  className?: string;
}

export function SearchableSelect<T>({
  items,
  value,
  onSelect,
  placeholder = 'Select item...',
  searchPlaceholder = 'Search...',
  emptyMessage = 'No item found.',
  getItemValue,
  getItemLabel,
  renderItem,
  disabled = false,
  className,
}: SearchableSelectProps<T>) {
  const [open, setOpen] = React.useState(false);

  const selectedItem = items.find((item) => getItemValue(item) === value);
  const selectedLabel = selectedItem ? getItemLabel(selectedItem) : placeholder;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('w-full justify-between rounded-xl bg-card border-border', className)}
          disabled={disabled}
        >
          {selectedLabel}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0 z-[60]" align="start">
        <Command className="bg-popover text-popover-foreground">
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup className="text-popover-foreground">
              {items.map((item) => {
                const itemValue = getItemValue(item);
                const itemLabel = getItemLabel(item);
                return (
                  <CommandItem
                    key={itemValue}
                    value={itemLabel}
                    onSelect={() => {
                      onSelect(itemValue);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn('mr-2 h-4 w-4', value === itemValue ? 'opacity-100' : 'opacity-0')}
                    />
                    {renderItem ? renderItem(item) : itemLabel}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

