import React from 'react';
import { useDrag } from 'react-dnd';
import { Link as LinkIcon, Tag } from 'lucide-react';
import { Item } from '@/types/materials';
import { money } from '@/utils/materialsUtils';
import { usePrice } from '@/contexts/PriceContext';

interface DraggableItemProps {
  item: Item;
  linked: boolean;
  hoveredLink: string | null;
  setHoveredLink: (id: string | null) => void;
  readOnly?: boolean;
  showPrice?: boolean;
}

export function DraggableItem({
  item,
  linked,
  hoveredLink,
  setHoveredLink,
  readOnly = false,
  showPrice = false,
}: DraggableItemProps) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'ITEM',
    item,
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
    canDrag: !readOnly,
  }));
  const { hidden } = usePrice();

  const isHighlighted = hoveredLink === item.id || hoveredLink === item.linkedTo;

  return (
    <div
      ref={drag}
      onMouseEnter={() => setHoveredLink(item.id)}
      onMouseLeave={() => setHoveredLink(null)}
      className={`flex justify-between items-center px-3 py-1.5 border rounded-lg transition-all duration-150 cursor-pointer hover:bg-accent/50 ${
        isDragging ? 'opacity-50 bg-card border-border' : linked ? 'border-success/40 bg-success/10' : 'border-border bg-card'
      } ${isHighlighted ? 'ring-1 ring-primary/40' : ''}`}
    >
      <div className="flex flex-col text-xs">
        <span className="font-medium flex items-center gap-1">
          {item.name}
          {item.link && (
            <a
              href={item.link.startsWith('http://') || item.link.startsWith('https://') ? item.link : `https://${item.link}`}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
            >
              <LinkIcon className="h-3 w-3 text-primary" />
            </a>
          )}
          {item.unmodified && (
            <span className="text-[10px] bg-muted text-muted-foreground px-1 rounded flex items-center gap-1">
              <Tag className="h-2.5 w-2.5" /> Unmodified
            </span>
          )}
        </span>
        {item.linkedName && (
          <p className="text-[10px] text-muted-foreground">Linked to: {item.linkedName}</p>
        )}
      </div>
      {!hidden && showPrice && <span className="text-xs font-medium">{money(item.price)}</span>}
    </div>
  );
}

