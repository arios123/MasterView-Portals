import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { money } from '@/utils/materialsUtils';

interface MaterialsSummaryCardsProps {
  contractTotal: number;
  actualTotal: number;
}

export function MaterialsSummaryCards({ contractTotal, actualTotal }: MaterialsSummaryCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <Card className="border rounded-lg shadow-sm hover:shadow-md transition">
        <CardHeader className="py-2">
          <CardTitle className="text-base font-medium">In Contract Total</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-lg font-semibold">{money(contractTotal)}</div>
        </CardContent>
      </Card>
      <Card className="border rounded-lg shadow-sm hover:shadow-md transition">
        <CardHeader className="py-2">
          <CardTitle className="text-base font-medium">Revised Total</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-lg font-semibold">{money(actualTotal)}</div>
        </CardContent>
      </Card>
    </div>
  );
}

