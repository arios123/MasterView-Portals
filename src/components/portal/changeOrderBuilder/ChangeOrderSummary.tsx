import React from 'react';
import { Input } from '@/components/ui/input';
import { Money } from '@/contexts/PriceContext';
import { useWorkspaceTaxRate } from '@/hooks/useWorkspaceTaxRate';

interface ChangeOrderSummaryProps {
  laborSub: number;
  matSub: number;
  tax: number;
  multiplier: number;
  grand: number;
}

export function ChangeOrderSummary({ laborSub, matSub, tax, multiplier, grand }: ChangeOrderSummaryProps) {
  const { taxRate } = useWorkspaceTaxRate();
  const taxRatePercent = (taxRate * 100).toFixed(2);
  
  return (
    <div className="space-y-3">
      <div className="text-sm space-y-1">
        <div>
          Labor Subtotal: <Money value={laborSub} />
        </div>
        <div>
          Materials Subtotal: <Money value={matSub} />
        </div>
        <div>
          Materials Tax ({taxRatePercent}%): <Money value={tax} />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span>Multiplier</span>
        <Input type="number" className="w-24" value={multiplier} disabled={true} />
      </div>
      <div className="font-semibold">
        Change Order Total: <Money value={grand} />
      </div>
    </div>
  );
}
