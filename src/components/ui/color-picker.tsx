import { useState, useEffect } from 'react';
import { HexColorPicker, HexColorInput } from 'react-colorful';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  disabled?: boolean;
  className?: string;
  swatchClassName?: string;
}

export function ColorPicker({
  color,
  onChange,
  disabled = false,
  className,
  swatchClassName,
}: ColorPickerProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            "h-10 w-full justify-start text-left font-normal",
            !color && "text-muted-foreground",
            className
          )}
        >
          <div className="flex items-center gap-2 w-full">
            <div
              className={cn(
                "h-6 w-6 rounded border border-border shrink-0",
                swatchClassName
              )}
              style={{ backgroundColor: color }}
            />
            <span className="flex-1 text-sm">{color}</span>
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-4" align="start">
        <div className="space-y-3">
          <HexColorPicker color={color} onChange={onChange} />
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium whitespace-nowrap">Hex:</label>
            <HexColorInput
              color={color}
              onChange={onChange}
              prefixed
              className="w-full px-2 py-1 text-sm font-mono border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Compact version for inline use (like in status/edit items)
interface CompactColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  disabled?: boolean;
  className?: string;
}

export function CompactColorPicker({
  color,
  onChange,
  disabled = false,
  className,
}: CompactColorPickerProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "w-20 h-10 rounded border border-border cursor-pointer disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          style={{ backgroundColor: color }}
          aria-label="Pick a color"
        />
      </PopoverTrigger>
      <PopoverContent className="w-auto p-4" align="start">
        <div className="space-y-3">
          <HexColorPicker color={color} onChange={onChange} />
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium whitespace-nowrap">Hex:</label>
            <HexColorInput
              color={color}
              onChange={onChange}
              prefixed
              className="w-full px-2 py-1 text-sm font-mono border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
