import { useMemo } from 'react';
import { LineItem } from '@/types';
import { useWorkspaceTaxRate } from '@/hooks/useWorkspaceTaxRate';

export function useQuoteCalculations(items: LineItem[], multiplier: number) {
  const { taxRate } = useWorkspaceTaxRate();
  
  const rows = useMemo(
    () =>
      items.map((r) => {
        const waste = r.kind === 'material' ? (r.wastePct ?? (/tile|countertop/i.test(r.name) ? 20 : 0)) : 0;
        const qtyWithWaste = r.kind === 'material' ? r.qty * (1 + waste / 100) : r.qty;
        const total = qtyWithWaste * r.unitPrice;
        return { ...r, waste, qtyWithWaste, total };
      }),
    [items]
  );

  const { laborSub, matSub, tax, sub, grand } = useMemo(() => {
    const laborTotal = rows.filter((r) => r.kind === 'labor').reduce((a, r) => a + r.total, 0);
    const matTotal = rows.filter((r) => r.kind === 'material').reduce((a, r) => a + r.total, 0);
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
  }, [rows, multiplier, taxRate]);

  return {
    rows,
    laborSub,
    matSub,
    tax,
    sub,
    grand,
  };
}

