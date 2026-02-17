import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Money } from '@/contexts/PriceContext';
import { LineItem } from '@/types';

interface ChangeOrderOptionsCardsProps {
  availableLaborOptions: LineItem[];
  availableMaterialOptions: LineItem[];
  filterLabor: string;
  setFilterLabor: (value: string) => void;
  filterMat: string;
  setFilterMat: (value: string) => void;
  onAddItem: (item: LineItem) => void;
  showPrices: boolean;
  showAddButton?: boolean;
}

export function ChangeOrderOptionsCards({
  availableLaborOptions,
  availableMaterialOptions,
  filterLabor,
  setFilterLabor,
  filterMat,
  setFilterMat,
  onAddItem,
  showPrices,
  showAddButton = true,
}: ChangeOrderOptionsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card className="rounded-2xl border bg-card">
        <CardHeader>
          <CardTitle className="text-base">Labor Options</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Input placeholder="Search labor..." value={filterLabor} onChange={(e) => setFilterLabor(e.target.value)} />
          <div className="space-y-2 max-h-[420px] overflow-auto pr-1">
            {availableLaborOptions
              .filter((l) => l.name.toLowerCase().includes(filterLabor.toLowerCase()))
              .map((l) => (
                <div key={l.id} className="border rounded-xl p-2">
                  <div className="font-medium text-sm">{l.name}</div>
                  {showPrices && (
                    <div className="text-xs text-muted-foreground">
                      <Money value={l.unitPrice} /> / ea
                    </div>
                  )}
                  {showAddButton && (
                    <Button size="sm" variant="outline" className="mt-2 rounded-xl" onClick={() => onAddItem(l)}>
                      Add →
                    </Button>
                  )}
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border bg-card">
        <CardHeader>
          <CardTitle className="text-base">Material Options</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Input
            placeholder="Search materials..."
            value={filterMat}
            onChange={(e) => setFilterMat(e.target.value)}
          />
          <div className="space-y-2 max-h-[420px] overflow-auto pr-1">
            {availableMaterialOptions
              .filter((m) => m.name.toLowerCase().includes(filterMat.toLowerCase()))
              .map((m) => (
                <div key={m.id} className="border rounded-xl p-2">
                  <div className="font-medium text-sm">{m.name}</div>
                  {showPrices && (
                    <div className="text-xs text-muted-foreground">
                      <Money value={m.unitPrice} /> / unit
                    </div>
                  )}
                  {showAddButton && (
                    <Button size="sm" variant="outline" className="mt-2 rounded-xl" onClick={() => onAddItem(m)}>
                      Add →
                    </Button>
                  )}
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
