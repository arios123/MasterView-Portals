import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Money } from '@/contexts/PriceContext';
import { DatePicker } from '@/components/ui/date-picker';
import { useWorkspaceTaxRate } from '@/hooks/useWorkspaceTaxRate';

interface QuoteSummaryProps {
  laborSub: number;
  matSub: number;
  tax: number;
  multiplier: number;
  onMultiplierChange: (value: number) => void;
  grand: number;
  readOnly: boolean;
  estimatedStartDate?: Date;
  onEstimatedStartDateChange: (date: Date | undefined) => void;
  estimatedConstructionTime?: number;
  onEstimatedConstructionTimeChange: (weeks: number | undefined) => void;
  canViewTimeframe?: boolean;
  canEditTimeframe?: boolean;
}

export function QuoteSummary({
  laborSub,
  matSub,
  tax,
  multiplier,
  onMultiplierChange,
  grand,
  readOnly,
  estimatedStartDate,
  onEstimatedStartDateChange,
  estimatedConstructionTime,
  onEstimatedConstructionTimeChange,
  canViewTimeframe = true,
  canEditTimeframe = true,
}: QuoteSummaryProps) {
  // Timeframe editability: component-level edit permission overrides readOnly prop
  const timeframeReadOnly = readOnly || !canEditTimeframe;
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
        <Input
          type="number"
          className="w-24"
          value={multiplier}
          onChange={(e) => onMultiplierChange(parseFloat(e.target.value) || 1)}
          disabled={readOnly}
        />
      </div>
      <div className="font-semibold">
        Grand Total: <Money value={grand} />
      </div>
      
      {/* Estimated Start Date and Construction Time */}
      {canViewTimeframe && (
        <div className="space-y-2 pt-2 border-t">
          <div className="flex flex-col md:flex-row md:items-center gap-2">
            <Label className="text-sm whitespace-nowrap">Estimated Start Date:</Label>
            <DatePicker
              date={estimatedStartDate}
              onDateChange={onEstimatedStartDateChange}
              disabled={timeframeReadOnly}
              placeholder="Select start date"
              className="w-full md:flex-1"
            />
          </div>
          <div className="flex flex-col md:flex-row md:items-center gap-2">
            <Label className="text-sm whitespace-nowrap">Estimated Construction Time:</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                step="0.1"
                className="w-24"
                value={estimatedConstructionTime ?? ''}
                onChange={(e) => {
                  const value = e.target.value === '' ? undefined : parseFloat(e.target.value);
                  onEstimatedConstructionTimeChange(value);
                }}
                disabled={timeframeReadOnly}
                placeholder="0"
              />
              <span className="text-sm text-muted-foreground">weeks</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

