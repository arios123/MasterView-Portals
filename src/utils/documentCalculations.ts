import { LineItem } from '@/types';

const TAX_RATE = 0.06;

export function calculateContractTotal(items: LineItem[], multiplier: number): number {
  const labor = items.filter((i) => i.kind === 'labor').reduce((a, i) => a + i.qty * i.unitPrice, 0);
  const mats = items
    .filter((i) => i.kind === 'material')
    .reduce((a, i) => a + i.qty * (1 + ((i.wastePct || 0) / 100)) * i.unitPrice, 0);
  const tax = mats * TAX_RATE;
  return (labor + mats + tax) * multiplier;
}

export function calculateChangeOrderTotal(items: LineItem[], multiplier: number): string {
  const laborTotal = items
    .filter((item) => item.kind === 'labor')
    .reduce((sum, item) => {
      const qty = Number(item.qty) || 0;
      const price = Number(item.unitPrice) || 0;
      return sum + qty * price;
    }, 0);

  const materialTotal = items
    .filter((item) => item.kind === 'material')
    .reduce((sum, item) => {
      const qty = Number(item.qty) || 0;
      const price = Number(item.unitPrice) || 0;
      const waste = item.wastePct ?? (/tile|countertop/i.test(item.name) ? 20 : 0);
      const qtyWithWaste = qty * (1 + waste / 100);
      return sum + qtyWithWaste * price;
    }, 0);

  const materialTax = materialTotal * TAX_RATE;
  const subtotal = laborTotal + materialTotal + materialTax;
  const grandTotal = subtotal * multiplier;

  // Format as currency string with dollar sign (after negative sign if present)
  if (grandTotal < 0) {
    return `-$${Math.abs(grandTotal).toFixed(2)}`;
  } else {
    return `$${grandTotal.toFixed(2)}`;
  }
}

export function calculatePaymentAmounts(projectTotal: number, paymentSplits: number[]) {
  return {
    p1: projectTotal * (paymentSplits[0] / 100),
    p2: projectTotal * (paymentSplits[1] / 100),
    p3: projectTotal * (paymentSplits[2] / 100),
    p4: projectTotal * (paymentSplits[3] / 100),
  };
}

export function formatCurrency(amount: number): string {
  return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

