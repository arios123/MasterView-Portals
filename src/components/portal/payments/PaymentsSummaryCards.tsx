import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { usePrice } from '@/contexts/PriceContext';

interface PaymentsSummaryCardsProps {
  projectTotal: number;
  contractTotal: number;
  changeOrdersTotal: number;
  paidTotal: number;
  balance: number;
  nextPayment: number;
}

const money = (n: number) => n.toLocaleString(undefined, { style: 'currency', currency: 'USD' });

function SummaryCard({ title, amount }: { title: string; amount: number }) {
  const { hidden } = usePrice();
  return (
    <Card className="border rounded-lg shadow-sm text-center">
      <CardHeader className="py-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-lg font-semibold">{hidden ? '—' : money(amount)}</div>
      </CardContent>
    </Card>
  );
}

export function PaymentsSummaryCards({
  projectTotal,
  contractTotal,
  changeOrdersTotal,
  paidTotal,
  balance,
  nextPayment,
}: PaymentsSummaryCardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      <SummaryCard title="Project Total" amount={projectTotal} />
      <SummaryCard title="Contract Total" amount={contractTotal} />
      <SummaryCard title="Change Orders Total" amount={changeOrdersTotal} />
      <SummaryCard title="Total Paid" amount={paidTotal} />
      <SummaryCard title="Balance" amount={balance} />
      {/* Next Payment card - not shown in main
      <SummaryCard title="Next Payment" amount={nextPayment} />
      */}
    </div>
  );
}

