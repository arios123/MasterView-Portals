import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LaborQuoteItem } from './LaborQuoteItem';
import { MaterialQuoteItem } from './MaterialQuoteItem';

interface CurrentQuoteCardsProps {
  rows: any[]; // Items with calculated waste, qtyWithWaste, total
  onUpdateName: (id: string, name: string) => void;
  onUpdateQty: (id: string, qty: number) => void;
  onUpdatePrice: (id: string, price: number) => void;
  onRemoveItem: (id: string) => void;
  readOnly: boolean;
  showPrices: boolean;
}

export function CurrentQuoteCards({
  rows,
  onUpdateName,
  onUpdateQty,
  onUpdatePrice,
  onRemoveItem,
  readOnly,
  showPrices,
}: CurrentQuoteCardsProps) {
  const laborRows = rows.filter((r) => r.kind === 'labor');
  const materialRows = rows.filter((r) => r.kind === 'material');

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card className="rounded-2xl border bg-card">
        <CardHeader>
          <CardTitle className="text-base">Labor in Current Quote</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 max-h-[520px] overflow-auto pr-1">
          {laborRows.map((item) => (
            <LaborQuoteItem
              key={item.id}
              item={item}
              onUpdateName={onUpdateName}
              onUpdateQty={onUpdateQty}
              onUpdatePrice={onUpdatePrice}
              onRemove={onRemoveItem}
              readOnly={readOnly}
              showPrices={showPrices}
            />
          ))}
        </CardContent>
      </Card>

      <Card className="rounded-2xl border bg-card">
        <CardHeader>
          <CardTitle className="text-base">Materials in Current Quote</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 max-h-[520px] overflow-auto pr-1">
          {materialRows.map((item) => (
            <MaterialQuoteItem
              key={item.id}
              item={item}
              onUpdateName={onUpdateName}
              onUpdateQty={onUpdateQty}
              onUpdatePrice={onUpdatePrice}
              onRemove={onRemoveItem}
              readOnly={readOnly}
              showPrices={showPrices}
            />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

