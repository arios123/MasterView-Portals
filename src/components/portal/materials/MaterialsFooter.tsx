import React from 'react';

interface MaterialsFooterProps {
  label: string;
  amount: string;
}

export function MaterialsFooter({ label, amount }: MaterialsFooterProps) {
  return (
    <div className="flex justify-between border-t pt-1 mt-1 text-[10px]">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{amount}</span>
    </div>
  );
}

