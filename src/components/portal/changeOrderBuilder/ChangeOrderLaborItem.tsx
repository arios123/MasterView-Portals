import React, { useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Trash2, RotateCcw } from 'lucide-react';
import { Money } from '@/contexts/PriceContext';
import { cn } from '@/lib/utils';

interface ChangeOrderLaborItemProps {
  item: any;
  isAdded?: boolean;
  isNameModified?: boolean;
  qtyChange?: 'increased' | 'decreased' | null;
  priceChange?: 'increased' | 'decreased' | null;
  baselineQty?: number;
  baselinePrice?: number;
  baselineTotal?: number;
  onUpdateName: (id: string, name: string) => void;
  onUpdateQty: (id: string, qty: number) => void;
  onUpdatePrice: (id: string, price: number) => void;
  onRemove: (id: string) => void;
  onRestore?: (id: string) => void;
  readOnly: boolean;
  showPrices: boolean;
}

export function ChangeOrderLaborItem({
  item,
  isAdded = false,
  isNameModified = false,
  qtyChange = null,
  priceChange = null,
  baselineQty,
  baselinePrice,
  baselineTotal,
  onUpdateName,
  onUpdateQty,
  onUpdatePrice,
  onRemove,
  onRestore,
  readOnly,
  showPrices,
}: ChangeOrderLaborItemProps) {
  const subtotal = (item.qty || 0) * (item.unitPrice || 0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isDeleted = item.isDeleted === true;

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [item.name]);

  return (
    <div
      className={cn(
        'border rounded-xl p-2 flex flex-col gap-1 min-w-0 max-w-full overflow-x-hidden',
        isDeleted && 'border-destructive border-2',
        !isDeleted && isAdded && 'border-green-500 border-2'
      )}
    >
      <Textarea
        ref={textareaRef}
        className={cn(
          'min-h-[32px] resize-none w-full min-w-0 text-sm overflow-hidden border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 p-0',
          isDeleted && 'line-through text-muted-foreground',
          !isDeleted && isNameModified && 'border-blue-500 border-2 rounded'
        )}
        value={item.name ?? ''}
        onChange={(e) => {
          onUpdateName(item.id, e.target.value);
          const textarea = e.target;
          textarea.style.height = 'auto';
          textarea.style.height = `${textarea.scrollHeight}px`;
        }}
        disabled={readOnly || isDeleted || !isAdded}
        rows={1}
      />
      <div className="flex items-center gap-1 md:gap-2 min-w-0 max-w-full overflow-x-hidden">
        <div className="flex flex-col items-start">
          <Label className="text-[10px] text-muted-foreground mb-0.5">Qty</Label>
          <Input
            className={cn(
              'h-8 w-16 md:w-20 flex-shrink-0 border-0 shadow-none focus-visible:border focus-visible:border-input focus-visible:ring-0 focus-visible:ring-offset-0 px-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none',
              isDeleted && 'line-through',
              !isDeleted && qtyChange === 'increased' && 'border-green-500 border-2 rounded',
              !isDeleted && qtyChange === 'decreased' && 'border-red-500 border-2 rounded'
            )}
            type="number"
            value={item.qty ?? ''}
            onChange={(e) => {
              const value = e.target.value;
              onUpdateQty(item.id, value === '' || isNaN(parseFloat(value)) ? 0 : parseFloat(value));
            }}
            disabled={readOnly || isDeleted}
          />
          {qtyChange && baselineQty !== undefined && (
            <span className="text-[9px] text-muted-foreground mt-0.5">Was: {baselineQty}</span>
          )}
        </div>
        {showPrices && (
          <>
            <div className="flex flex-col items-start">
              <Label className="text-[10px] text-muted-foreground mb-0.5">Price</Label>
              <Input
                className={cn(
                  'h-8 w-20 md:w-24 flex-shrink-0 border-0 shadow-none focus-visible:border focus-visible:border-input focus-visible:ring-0 focus-visible:ring-offset-0 px-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none',
                  isDeleted && 'line-through',
                  !isDeleted && priceChange === 'increased' && 'border-green-500 border-2 rounded',
                  !isDeleted && priceChange === 'decreased' && 'border-red-500 border-2 rounded'
                )}
                type="number"
                value={item.unitPrice ?? ''}
                onChange={(e) => {
                  const value = e.target.value;
                  onUpdatePrice(item.id, value === '' || isNaN(parseFloat(value)) ? 0 : parseFloat(value));
                }}
                disabled={readOnly || isDeleted}
              />
              {priceChange && baselinePrice !== undefined && (
                <span className="text-[9px] text-muted-foreground mt-0.5">
                  Was: <Money value={baselinePrice} />
                </span>
              )}
            </div>
            <div className="flex flex-col items-start">
              <span
                className={cn(
                  'text-sm text-muted-foreground flex-shrink-0 min-w-[50px] md:min-w-[60px]',
                  isDeleted && 'line-through'
                )}
              >
                <Money value={subtotal} />
              </span>
              {(qtyChange || priceChange) && baselineTotal !== undefined && (
                <span className="text-[9px] text-muted-foreground mt-0.5">
                  Was: <Money value={baselineTotal} />
                </span>
              )}
            </div>
          </>
        )}
        {!readOnly && (
          <>
            {isDeleted ? (
              onRestore && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="rounded-xl flex-shrink-0"
                  onClick={() => onRestore(item.id)}
                  title="Restore"
                >
                  <RotateCcw className="h-4 w-4 text-green-600" />
                </Button>
              )
            ) : (
              <Button
                size="sm"
                variant="ghost"
                className="rounded-xl flex-shrink-0"
                onClick={() => onRemove(item.id)}
                title="Remove"
              >
                <Trash2 className="h-4 w-4 text-red-600" />
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
