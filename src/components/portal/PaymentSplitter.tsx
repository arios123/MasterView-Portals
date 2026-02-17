import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";

interface PaymentSplitterProps {
  totalAmount: number;
  onValidationChange?: (isValid: boolean) => void;
  onPaymentsChange?: (payments: number[]) => void;
  initialPayments?: number[];
  readOnly?: boolean;
  showPrices?: boolean;
}

export function PaymentSplitter({ totalAmount, onValidationChange, onPaymentsChange, initialPayments, readOnly = false, showPrices = true }: PaymentSplitterProps) {
  const [payments, setPayments] = useState([
    { label: "1st Payment", percentage: initialPayments?.[0] ?? 40 },
    { label: "2nd Payment", percentage: initialPayments?.[1] ?? 30 },
    { label: "3rd Payment", percentage: initialPayments?.[2] ?? 20 },
    { label: "Last Payment", percentage: initialPayments?.[3] ?? 10 }
  ]);

  const updatePayment = (index: number, percentage: number) => {
    const newPayments = [...payments];
    newPayments[index] = { ...newPayments[index], percentage };
    setPayments(newPayments);
  };

  const updatePaymentByDollar = (index: number, dollarAmount: number) => {
    if (totalAmount <= 0) return;
    const percentage = (dollarAmount / totalAmount) * 100;
    updatePayment(index, Math.min(100, Math.max(0, percentage)));
  };

  const totalPercentage = payments.reduce((sum, p) => sum + p.percentage, 0);

  useEffect(() => {
    if (onValidationChange) {
      onValidationChange(totalPercentage === 100);
    }
    if (onPaymentsChange) {
      onPaymentsChange(payments.map(p => p.percentage));
    }
  }, [totalPercentage, payments, onValidationChange, onPaymentsChange]);

  return (
    <Card className="rounded-2xl border bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Payment Split</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {payments.map((payment, index) => {
          const dollarAmount = (payment.percentage / 100) * totalAmount;
          return (
            <div key={index} className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                {payment.label}
              </label>
              <div className="flex items-center gap-2">
                <Slider
                  value={[payment.percentage]}
                  onValueChange={([value]) => updatePayment(index, value)}
                  min={0}
                  max={100}
                  step={1}
                  className="flex-1"
                  disabled={readOnly}
                />
                <span className="text-xs text-muted-foreground">%</span>
                <Input
                  type="number"
                  value={payment.percentage.toFixed(0)}
                  onChange={(e) => updatePayment(index, parseFloat(e.target.value) || 0)}
                  className="w-14 h-7 text-xs px-1.5"
                  min={0}
                  max={100}
                  disabled={readOnly}
                />
                {showPrices && (
                  <>
                <span className="text-xs text-muted-foreground">$</span>
                <Input
                  type="number"
                  value={dollarAmount.toFixed(2)}
                  onChange={(e) => updatePaymentByDollar(index, parseFloat(e.target.value) || 0)}
                  className="w-20 h-7 text-xs px-1.5"
                  min={0}
                  disabled={readOnly}
                />
                  </>
                )}
              </div>
            </div>
          );
        })}
        <div className="pt-2 border-t">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Total:</span>
            <span className={totalPercentage === 100 ? "text-success font-medium" : "text-warning font-medium"}>
              {totalPercentage.toFixed(0)}%
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
