import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChangeOrderLaborItem } from './ChangeOrderLaborItem';
import { ChangeOrderMaterialItem } from './ChangeOrderMaterialItem';
import { LineItem } from '@/types';

interface CurrentChangeOrderCardsProps {
  rows: any[];
  baselineItems: LineItem[];
  onUpdateName: (id: string, name: string) => void;
  onUpdateQty: (id: string, qty: number) => void;
  onUpdatePrice: (id: string, price: number) => void;
  onRemoveItem: (id: string) => void;
  onRestoreItem?: (id: string) => void;
  readOnly: boolean;
  showPrices: boolean;
  showChangesOnly?: boolean;
}

export function CurrentChangeOrderCards({
  rows,
  baselineItems,
  onUpdateName,
  onUpdateQty,
  onUpdatePrice,
  onRemoveItem,
  onRestoreItem,
  readOnly,
  showPrices,
  showChangesOnly = false,
}: CurrentChangeOrderCardsProps) {
  const addedItemIds = useMemo(() => {
    if (baselineItems.length === 0) return new Set<string>();
    const baselineItemIds = new Set(baselineItems.map((item) => item.id));
    return new Set(rows.filter((item) => !baselineItemIds.has(item.id) && !item.isDeleted).map((item) => item.id));
  }, [rows, baselineItems]);

  const nameModifiedItemIds = useMemo(() => {
    if (baselineItems.length === 0) return new Set<string>();
    const baselineMap = new Map(baselineItems.map((item) => [item.id, item.name]));
    return new Set(
      rows
        .filter((item) => {
          const baselineName = baselineMap.get(item.id);
          return baselineName !== undefined && baselineName !== item.name && !item.isDeleted;
        })
        .map((item) => item.id)
    );
  }, [rows, baselineItems]);

  const itemChanges = useMemo(() => {
    if (baselineItems.length === 0) return new Map<string, { qtyChange: 'increased' | 'decreased' | null; priceChange: 'increased' | 'decreased' | null; baselineQty?: number; baselinePrice?: number; baselineTotal?: number }>();

    const baselineMap = new Map(baselineItems.map((item) => [item.id, item]));
    const changes = new Map<string, { qtyChange: 'increased' | 'decreased' | null; priceChange: 'increased' | 'decreased' | null; baselineQty?: number; baselinePrice?: number; baselineTotal?: number }>();

    rows.forEach((item) => {
      if (item.isDeleted) return;

      const baselineItem = baselineMap.get(item.id);
      if (!baselineItem) return;

      const qtyChange = item.qty > baselineItem.qty ? 'increased' : item.qty < baselineItem.qty ? 'decreased' : null;
      const priceChange = item.unitPrice > baselineItem.unitPrice ? 'increased' : item.unitPrice < baselineItem.unitPrice ? 'decreased' : null;

      if (qtyChange || priceChange) {
        const baselineTotal = (baselineItem.qty || 0) * (baselineItem.unitPrice || 0);
        changes.set(item.id, {
          qtyChange,
          priceChange,
          baselineQty: baselineItem.qty,
          baselinePrice: baselineItem.unitPrice,
          baselineTotal,
        });
      }
    });

    return changes;
  }, [rows, baselineItems]);

  const filteredRows = useMemo(() => {
    if (!showChangesOnly) return rows;

    return rows.filter((item) => {
      if (addedItemIds.has(item.id)) return true;
      if (item.isDeleted) return true;
      if (itemChanges.has(item.id)) return true;
      if (nameModifiedItemIds.has(item.id)) return true;
      return false;
    });
  }, [rows, showChangesOnly, addedItemIds, itemChanges, nameModifiedItemIds]);

  const laborRows = filteredRows.filter((r) => r.kind === 'labor');
  const materialRows = filteredRows.filter((r) => r.kind === 'material');

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card className="rounded-2xl border bg-card">
        <CardHeader>
          <CardTitle className="text-base">Labor in Current Quote</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 max-h-[520px] overflow-auto pr-1">
          {laborRows.map((item) => {
            const changes = itemChanges.get(item.id);
            return (
              <ChangeOrderLaborItem
                key={item.id}
                item={item}
                isAdded={addedItemIds.has(item.id)}
                isNameModified={nameModifiedItemIds.has(item.id)}
                qtyChange={changes?.qtyChange ?? null}
                priceChange={changes?.priceChange ?? null}
                baselineQty={changes?.baselineQty}
                baselinePrice={changes?.baselinePrice}
                baselineTotal={changes?.baselineTotal}
                onUpdateName={onUpdateName}
                onUpdateQty={onUpdateQty}
                onUpdatePrice={onUpdatePrice}
                onRemove={onRemoveItem}
                onRestore={onRestoreItem}
                readOnly={readOnly}
                showPrices={showPrices}
              />
            );
          })}
        </CardContent>
      </Card>

      <Card className="rounded-2xl border bg-card">
        <CardHeader>
          <CardTitle className="text-base">Materials in Current Quote</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 max-h-[520px] overflow-auto pr-1">
          {materialRows.map((item) => {
            const changes = itemChanges.get(item.id);
            return (
              <ChangeOrderMaterialItem
                key={item.id}
                item={item}
                isAdded={addedItemIds.has(item.id)}
                isNameModified={nameModifiedItemIds.has(item.id)}
                qtyChange={changes?.qtyChange ?? null}
                priceChange={changes?.priceChange ?? null}
                baselineQty={changes?.baselineQty}
                baselinePrice={changes?.baselinePrice}
                baselineTotal={changes?.baselineTotal}
                onUpdateName={onUpdateName}
                onUpdateQty={onUpdateQty}
                onUpdatePrice={onUpdatePrice}
                onRemove={onRemoveItem}
                onRestore={onRestoreItem}
                readOnly={readOnly}
                showPrices={showPrices}
              />
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
