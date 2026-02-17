import { useMemo } from 'react';
import { LineItem } from '@/types';
import { useWorkspaceTaxRate } from '@/hooks/useWorkspaceTaxRate';

interface UseChangeOrderCalculationsParams {
  items: LineItem[];
  baselineItems: LineItem[];
  multiplier: number;
  editingVersionId: string | null | undefined;
}

export function useChangeOrderCalculations({
  items,
  baselineItems,
  multiplier,
  editingVersionId,
}: UseChangeOrderCalculationsParams) {
  const { taxRate } = useWorkspaceTaxRate();
  
  const rows = useMemo(
    () =>
      items.map((r) => {
        const waste = r.kind === 'material' ? (r.wastePct ?? (/tile|countertop/i.test(r.name) ? 20 : 0)) : 0;
        // For deleted items, use 0 quantity for calculations (they're shown but don't affect totals)
        const effectiveQty = r.isDeleted ? 0 : r.qty;
        const qtyWithWaste = r.kind === 'material' ? effectiveQty * (1 + waste / 100) : effectiveQty;
        const total = qtyWithWaste * r.unitPrice;
        return { ...r, waste, qtyWithWaste, total } as any;
      }),
    [items]
  );

  // Calculate delta for change orders
  // Always use baselineItems for delta calculation, even when editing
  const { laborSub, matSub, tax, sub, grand } = useMemo(() => {
    if (baselineItems.length > 0) {
      // Filter out deleted items when comparing (they should be treated as removed)
      const activeItems = items.filter((item) => !item.isDeleted);
      const currentItemIds = new Set(activeItems.map((i) => i.id));
      const baselineItemIds = new Set(baselineItems.map((i) => i.id));

      // Create baseline map for quick lookup
      const baselineMap = new Map(baselineItems.map((item) => [item.id, item]));

      // Helper function to calculate item total
      const calculateItemTotal = (item: LineItem): number => {
        if (item.kind === 'labor') {
          return (item.qty || 0) * (item.unitPrice || 0);
        } else {
          // material
          const waste = item.wastePct ?? (/tile|countertop/i.test(item.name) ? 20 : 0);
          const qtyWithWaste = (item.qty || 0) * (1 + waste / 100);
          return qtyWithWaste * (item.unitPrice || 0);
        }
      };

      let deltaLabor = 0;
      let deltaMat = 0;

      // Process current active items
      activeItems.forEach((currentItem) => {
        const baselineItem = baselineMap.get(currentItem.id);
        const currentTotal = calculateItemTotal(currentItem);

        if (baselineItem) {
          // Item exists in both - calculate delta (current - baseline)
          const baselineTotal = calculateItemTotal(baselineItem);
          const delta = currentTotal - baselineTotal;

          if (currentItem.kind === 'labor') {
            deltaLabor += delta;
          } else {
            deltaMat += delta;
          }
        } else {
          // Item is newly added (not in baseline) - add current total
          if (currentItem.kind === 'labor') {
            deltaLabor += currentTotal;
          } else {
            deltaMat += currentTotal;
          }
        }
      });

      // Process removed items (in baseline but not in current active items)
      baselineItems.forEach((baselineItem) => {
        if (!currentItemIds.has(baselineItem.id)) {
          // Item was removed - subtract baseline total
          const baselineTotal = calculateItemTotal(baselineItem);
          if (baselineItem.kind === 'labor') {
            deltaLabor -= baselineTotal;
          } else {
            deltaMat -= baselineTotal;
          }
        }
      });

      const deltaTax = deltaMat * taxRate;
      const deltaSub = deltaLabor + deltaMat + deltaTax;
      const deltaGrand = deltaSub * multiplier;

      return {
        laborSub: deltaLabor,
        matSub: deltaMat,
        tax: deltaTax,
        sub: deltaSub,
        grand: deltaGrand,
      };
    } else {
      // Normal calculation when no baseline (editing existing change order)
      // Exclude deleted items from totals
      const activeRows = rows.filter((r: any) => !r.isDeleted);
      const laborTotal = activeRows.filter((r: any) => r.kind === 'labor').reduce((a: number, r: any) => a + r.total, 0);
      const matTotal = activeRows.filter((r: any) => r.kind === 'material').reduce((a: number, r: any) => a + r.total, 0);
      const taxTotal = matTotal * taxRate;
      const subTotal = laborTotal + matTotal + taxTotal;
      const grandTotal = subTotal * multiplier;

      return {
        laborSub: laborTotal,
        matSub: matTotal,
        tax: taxTotal,
        sub: subTotal,
        grand: grandTotal,
      };
    }
  }, [items, baselineItems, rows, multiplier, editingVersionId, taxRate]);

  return {
    rows,
    laborSub,
    matSub,
    tax,
    sub,
    grand,
  };
}
