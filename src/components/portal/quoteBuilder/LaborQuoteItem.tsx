import React, { useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Trash2 } from 'lucide-react';
import { LineItem } from '@/types';
import { Money } from '@/contexts/PriceContext';

interface LaborQuoteItemProps {
  item: any; // Item with calculated waste, qtyWithWaste, total
  onUpdateName: (id: string, name: string) => void;
  onUpdateQty: (id: string, qty: number) => void;
  onUpdatePrice: (id: string, price: number) => void;
  onRemove: (id: string) => void;
  readOnly: boolean;
  showPrices: boolean;
}

export function LaborQuoteItem({
  item,
  onUpdateName,
  onUpdateQty,
  onUpdatePrice,
  onRemove,
  readOnly,
  showPrices,
}: LaborQuoteItemProps) {
  const subtotal = (item.qty || 0) * (item.unitPrice || 0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [item.name]);

  return (
    <div className="border rounded-xl p-2 flex flex-col gap-1 min-w-0 max-w-full overflow-x-hidden">
      <Textarea
        ref={textareaRef}
        className="min-h-[32px] resize-none w-full min-w-0 text-sm overflow-hidden border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 p-0"
        value={item.name ?? ''}
        onChange={(e) => {
          onUpdateName(item.id, e.target.value);
          const textarea = e.target;
          textarea.style.height = 'auto';
          textarea.style.height = `${textarea.scrollHeight}px`;
        }}
        disabled={readOnly}
        rows={1}
      />
      <div className="flex items-center gap-1 md:gap-2 min-w-0 max-w-full overflow-x-hidden">
        <div className="flex flex-col items-start">
          <Label className="text-[10px] text-muted-foreground mb-0.5">Qty</Label>
          <Input
            className="h-8 w-16 md:w-20 flex-shrink-0 border-0 shadow-none focus-visible:border focus-visible:border-input focus-visible:ring-0 focus-visible:ring-offset-0 px-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            type="number"
            value={item.qty ?? ''}
            onChange={(e) => {
              const value = e.target.value;
              onUpdateQty(item.id, value === '' ? undefined : (isNaN(parseFloat(value)) ? undefined : parseFloat(value)));
            }}
            disabled={readOnly}
          />
        </div>
        {showPrices && (
          <>
            <div className="flex flex-col items-start">
              <Label className="text-[10px] text-muted-foreground mb-0.5">Price</Label>
              <Input
                className="h-8 w-20 md:w-24 flex-shrink-0 border-0 shadow-none focus-visible:border focus-visible:border-input focus-visible:ring-0 focus-visible:ring-offset-0 px-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                type="number"
                value={item.unitPrice ?? ''}
                onChange={(e) => {
                  const value = e.target.value;
                  onUpdatePrice(item.id, value === '' ? undefined : (isNaN(parseFloat(value)) ? undefined : parseFloat(value)));
                }}
                disabled={readOnly}
              />
            </div>
            <span className="text-sm text-muted-foreground flex-shrink-0 min-w-[50px] md:min-w-[60px]">
              <Money value={subtotal} />
            </span>
          </>
        )}
        {!readOnly && (
          <Button size="sm" variant="ghost" className="rounded-xl flex-shrink-0" onClick={() => onRemove(item.id)} title="Remove">
            <Trash2 className="h-4 w-4 text-red-600" />
          </Button>
        )}
      </div>
    </div>
  );
}

