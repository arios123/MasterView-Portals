import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Item } from '@/types/materials';
import { DraggableItem } from './DraggableItem';
import { MaterialsFooter } from './MaterialsFooter';
import { money, total } from '@/utils/materialsUtils';
import { usePrice } from '@/contexts/PriceContext';

interface ContractMaterialsCardProps {
  items: Item[];
  actualItems: Item[];
  hoveredLink: string | null;
  setHoveredLink: (id: string | null) => void;
  readOnly?: boolean;
  showPrice?: boolean;
}

export function ContractMaterialsCard({
  items,
  actualItems,
  hoveredLink,
  setHoveredLink,
  readOnly = false,
  showPrice = false,
}: ContractMaterialsCardProps) {
  const { hidden } = usePrice();
  const contractTotal = total(items);

  return (
    <Card className="shadow-sm border rounded-lg hover:shadow-md transition">
      <CardHeader className="py-2">
        <CardTitle className="text-base font-medium">In Contract</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.map((it) => (
          <DraggableItem
            key={it.id}
            item={it}
            linked={actualItems.some((a) => a.linkedTo === it.id)}
            hoveredLink={hoveredLink}
            setHoveredLink={setHoveredLink}
            readOnly={readOnly}
            showPrice={showPrice}
          />
        ))}
        {!hidden && showPrice && <MaterialsFooter label="Total" amount={money(contractTotal)} />}
      </CardContent>
    </Card>
  );
}

