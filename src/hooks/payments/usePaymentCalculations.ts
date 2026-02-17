import { useMemo } from 'react';
import { PaymentCalculations } from '@/types/payments';
import type { IncomingPayment, OutgoingPayment } from '@/types/payments';

interface UsePaymentCalculationsProps {
  activeDraftItems: any[];
  activeDraftMultiplier: number;
  activeChangeOrders: any[];
  incomingPayments: IncomingPayment[];
  outgoingPayments: OutgoingPayment[];
}

export function usePaymentCalculations({
  activeDraftItems,
  activeDraftMultiplier,
  activeChangeOrders,
  incomingPayments,
  outgoingPayments,
}: UsePaymentCalculationsProps): PaymentCalculations {
  return useMemo(() => {
    // Calculate contract total
    const laborTotal = activeDraftItems
      .filter(item => item.kind === 'labor')
      .reduce((sum, item) => {
        const qty = Number(item.qty) || 0;
        const unitPrice = Number(item.unitPrice) || 0;
        return sum + (qty * unitPrice);
      }, 0);

    const materialTotal = activeDraftItems
      .filter(item => item.kind === 'material')
      .reduce((sum, item) => {
        const qty = Number(item.qty) || 0;
        const unitPrice = Number(item.unitPrice) || 0;
        const wastePct = (item.wastePct ?? (/tile|countertop/i.test(item.name) ? 20 : 0)) as number;
        const qtyWithWaste = qty * (1 + Number(wastePct) / 100);
        return sum + (qtyWithWaste * unitPrice);
      }, 0);

    const materialTax = materialTotal * 0.06;
    const subtotal = laborTotal + materialTotal + materialTax;
    const multiplier = Number(activeDraftMultiplier) || 1;
    const contractTotal = subtotal * multiplier;

    // Calculate change orders total
    const changeOrdersTotal = activeChangeOrders.reduce((sum, co) => {
      const coLaborTotal = (co.laborItems || []).reduce((lSum: number, item: any) => {
        const qty = Number(item.qty) || 0;
        const unitPrice = Number(item.unitPrice) || 0;
        return lSum + (qty * unitPrice);
      }, 0);

      const coMaterialTotal = (co.materialItems || []).reduce((mSum: number, item: any) => {
        const qty = Number(item.qty) || 0;
        const unitPrice = Number(item.unitPrice) || 0;
        const wastePct = (item.wastePct ?? (/tile|countertop/i.test(item.name) ? 20 : 0)) as number;
        const qtyWithWaste = qty * (1 + Number(wastePct) / 100);
        return mSum + (qtyWithWaste * unitPrice);
      }, 0);

      const coMaterialTax = coMaterialTotal * 0.06;
      const coSubtotal = coLaborTotal + coMaterialTotal + coMaterialTax;
      const coMultiplier = Number(co.multiplier) || 1;
      return sum + (coSubtotal * coMultiplier);
    }, 0);

    const projectTotal = contractTotal + changeOrdersTotal;
    const paidTotal = incomingPayments.reduce((s, i) => s + Number(i.amount || 0), 0);
    const balance = projectTotal - paidTotal;
    const nextPayment = 0;

    const totalProjectCost = projectTotal;
    const totalSpentOnProject = outgoingPayments.reduce((sum, o) => sum + Number(o.totalPrice || 0), 0);
    const totalProfit = totalProjectCost - totalSpentOnProject;

    return {
      contractTotal,
      changeOrdersTotal,
      projectTotal,
      paidTotal,
      balance,
      nextPayment,
      totalProjectCost,
      totalSpentOnProject,
      totalProfit,
    };
  }, [activeDraftItems, activeDraftMultiplier, activeChangeOrders, incomingPayments, outgoingPayments]);
}

