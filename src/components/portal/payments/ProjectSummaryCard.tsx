import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { usePrice } from '@/contexts/PriceContext';

interface ProjectSummaryCardProps {
  totalProjectCost: number;
  totalSpentOnProject: number;
}

const money = (n: number) => n.toLocaleString(undefined, { style: 'currency', currency: 'USD' });

export function ProjectSummaryCard({
  totalProjectCost,
  totalSpentOnProject,
}: ProjectSummaryCardProps) {
  const { hidden } = usePrice();

  return (
    <Card className="border rounded-xl shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Project Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="divide-y text-sm">
          <div className="flex justify-between py-2 font-semibold">
            <span>Total Project Cost</span>
            <span>{hidden ? '—' : money(totalProjectCost)}</span>
          </div>
          <div className="flex justify-between py-2">
            <span>Outgoing Materials Cost</span>
            <span>{hidden ? '—' : money(totalSpentOnProject)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

