import React, { useState, useCallback, useMemo } from 'react';
import { useDrop } from 'react-dnd';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Link as LinkIcon, Split, Trash2, Tag, Pencil } from 'lucide-react';
import { Item } from '@/types/materials';
import { MaterialsFooter } from './MaterialsFooter';
import { money, total, groupByBaseName, uid } from '@/utils/materialsUtils';
import { usePrice } from '@/contexts/PriceContext';

interface RevisedMaterialsCardProps {
  items: Item[];
  setItems: (items: Item[] | ((prev: Item[]) => Item[])) => void;
  hoveredLink: string | null;
  setHoveredLink: (id: string | null) => void;
  onDrop: (item: Item) => void;
  readOnly?: boolean;
  showPrice?: boolean;
  onOpenLinkDialog?: (itemId: string, currentLink?: string) => void;
  onGetLocalValues?: (getter: () => Record<string, Partial<Item>>) => void;
  onLocalValuesChange?: (values: Record<string, Partial<Item>>) => void;
}

export function RevisedMaterialsCard({
  items,
  setItems,
  hoveredLink,
  setHoveredLink,
  onDrop,
  readOnly = false,
  showPrice = false,
  onOpenLinkDialog,
  onGetLocalValues,
  onLocalValuesChange,
}: RevisedMaterialsCardProps) {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'ITEM',
    drop: (item: Item) => !readOnly && onDrop(item),
    collect: (monitor) => ({ isOver: monitor.isOver() }),
    canDrop: () => !readOnly,
  }));
  const { hidden } = usePrice();

  // Local state for ALL input values - only updates on save, not on every keystroke
  const [localValues, setLocalValues] = useState<Record<string, Partial<Item>>>({});

  // Initialize local values from items when items change (but only if not already set)
  React.useEffect(() => {
    const newLocalValues: Record<string, Partial<Item>> = {};
    items.forEach((item) => {
      if (!localValues[item.id]) {
        // Initialize with current item values
        newLocalValues[item.id] = {
          name: item.name,
          notes: item.notes,
          qty: item.qty,
          price: item.price,
        };
      } else {
        // Keep existing local values
        newLocalValues[item.id] = localValues[item.id];
      }
    });
    // Only update if there are new items
    if (Object.keys(newLocalValues).length > 0) {
      setLocalValues((prev) => ({ ...prev, ...newLocalValues }));
    }
  }, [items.map((i) => i.id).join(',')]); // Only when item IDs change (new items added/removed)

  // Expose function to get current local values
  React.useEffect(() => {
    if (onGetLocalValues) {
      onGetLocalValues(() => localValues);
    }
  }, [onGetLocalValues]); // Only when callback changes, not on every localValues change

  // Notify parent of local value changes so difference can update in real time
  React.useEffect(() => {
    onLocalValuesChange?.(localValues);
  }, [localValues, onLocalValuesChange]);

  // Function to update local value (doesn't update actualItems)
  const updateLocalValue = useCallback((id: string, field: keyof Item, value: any) => {
    setLocalValues((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
      },
    }));
  }, []);

  const handleSplit = (itemId: string) => {
    const item = items.find((i) => i.id === itemId);
    if (!item) return;
    const baseName = (localValues[itemId]?.name || item.name).replace(/\s*\(Part \d+\)$/i, '').trim();
    const existingParts = items.filter((i) => {
      const name = localValues[i.id]?.name || i.name;
      return name.startsWith(baseName + ' (Part');
    });
    const nextPartNum = existingParts.length + 1;
    const newItem: Item = {
      ...item,
      id: uid(),
      name: `${baseName} (Part ${nextPartNum})`,
      unmodified: false,
      link: undefined, // Ensure split item has no link
    };
    // Update items immediately (UI only, not saved to DB until save button)
    setItems((prev) => prev.flatMap((i) => (i.id === itemId ? [i, newItem] : [i])));
    // Initialize local values for new item (no link)
    setLocalValues((prev) => ({
      ...prev,
      [newItem.id]: {
        name: newItem.name,
        notes: newItem.notes,
        qty: newItem.qty,
        price: newItem.price,
        // Explicitly don't include link - it should be empty
      },
    }));
  };

  const handleDelete = (itemId: string) => {
    // Update items immediately (UI only, not saved to DB until save button)
    setItems((prev) => prev.filter((i) => i.id !== itemId));
    // Remove local values for deleted item
    setLocalValues((prev) => {
      const newValues = { ...prev };
      delete newValues[itemId];
      return newValues;
    });
  };

  const grouped = useMemo(() => groupByBaseName(items), [items]);

  return (
    <Card
      ref={drop}
      className={`border ${isOver ? 'border-primary bg-primary/5' : 'border-border'} rounded-lg shadow-sm hover:shadow-md transition`}
    >
      <CardHeader className="py-2">
        <CardTitle className="text-base font-medium">Revised</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-xs">
        {items.length === 0 && <p className="text-muted-foreground">Drag items here</p>}
        {Object.entries(grouped).map(([base, group]) => (
          <div key={`group-${base}`}>
            {group.map((it) => {
              const isHighlighted = hoveredLink === it.id || hoveredLink === it.linkedTo;

              return (
                <div
                  key={it.id}
                  onMouseEnter={() => setHoveredLink(it.id)}
                  onMouseLeave={() => setHoveredLink(null)}
                  onMouseDown={(e) => {
                    // Don't interfere if clicking on input
                    const target = e.target as HTMLElement;
                    if (target.tagName === 'INPUT' || target.closest('input')) {
                      e.stopPropagation();
                    }
                  }}
                  className={`flex flex-col md:flex-row md:justify-between md:items-center gap-2 border border-border bg-card p-1.5 rounded-lg cursor-pointer hover:bg-accent/50 transition ${
                    isHighlighted ? 'ring-1 ring-primary/40' : ''
                  }`}
                >
                  <div className="flex-1 space-y-0.5" onMouseDown={(e) => e.stopPropagation()}>
                    <Input
                      value={localValues[it.id]?.name !== undefined ? localValues[it.id].name : it.name}
                      onChange={(e) => {
                        e.stopPropagation();
                        updateLocalValue(it.id, 'name', e.target.value);
                      }}
                      onKeyDown={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => e.stopPropagation()}
                      className="h-6 text-xs"
                      disabled={readOnly}
                    />
                    {it.linkedTo && <p className="text-[10px] text-muted-foreground">Linked to: {it.linkedName}</p>}
                    {it.link ? (
                      <div className="flex items-center gap-1">
                        <a
                          href={it.link.startsWith('http://') || it.link.startsWith('https://') ? it.link : `https://${it.link}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] text-blue-600 underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          View Link
                        </a>
                        {!readOnly && onOpenLinkDialog && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenLinkDialog(it.id, it.link);
                            }}
                          >
                            <Pencil className="h-2.5 w-2.5 text-muted-foreground" />
                          </Button>
                        )}
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-5 px-2 text-[10px]"
                        onClick={() => onOpenLinkDialog?.(it.id)}
                        disabled={readOnly}
                      >
                        <LinkIcon className="h-2.5 w-2.5 mr-1" /> Add Link
                      </Button>
                    )}
                    {!readOnly && (
                      <div className="flex gap-1 mt-1">
                        <Button variant="outline" size="sm" className="h-5 px-2 text-[10px]" onClick={() => handleSplit(it.id)}>
                          <Split className="h-2.5 w-2.5 mr-1" /> Split
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 px-2 text-[10px] text-destructive"
                          onClick={() => handleDelete(it.id)}
                        >
                          <Trash2 className="h-2.5 w-2.5" />
                        </Button>
                      </div>
                    )}
                    {/* Mobile: Qty, Price, Total with labels */}
                    <div className="flex items-end gap-2 md:hidden mt-1">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] text-muted-foreground">Qty</span>
                        <Input
                          type="number"
                          size={Math.max(4, String(localValues[it.id]?.qty !== undefined ? localValues[it.id].qty : it.qty).length + 1)}
                          value={localValues[it.id]?.qty !== undefined ? localValues[it.id].qty : it.qty}
                          onChange={(e) => {
                            e.stopPropagation();
                            const raw = e.target.value;
                            updateLocalValue(it.id, 'qty', raw === '' ? ('' as unknown as number) : Number(raw));
                          }}
                          onKeyDown={(e) => e.stopPropagation()}
                          onMouseDown={(e) => e.stopPropagation()}
                          onClick={(e) => e.stopPropagation()}
                          disabled={readOnly}
                          className="min-w-12 w-auto max-w-full h-6 text-xs border-0 shadow-none focus-visible:border focus-visible:border-input focus-visible:ring-0 focus-visible:ring-offset-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </div>
                      {!hidden && showPrice && (
                        <>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[10px] text-muted-foreground">Price</span>
                            <Input
                              type="number"
                              size={Math.max(5, String(localValues[it.id]?.price !== undefined ? localValues[it.id].price : it.price).length + 1)}
                              value={localValues[it.id]?.price !== undefined ? localValues[it.id].price : it.price}
                              onChange={(e) => {
                                e.stopPropagation();
                                const raw = e.target.value;
                                updateLocalValue(it.id, 'price', raw === '' ? ('' as unknown as number) : Number(raw));
                              }}
                              onKeyDown={(e) => e.stopPropagation()}
                              onMouseDown={(e) => e.stopPropagation()}
                              onClick={(e) => e.stopPropagation()}
                              className="min-w-16 w-auto max-w-full h-6 text-xs border-0 shadow-none focus-visible:border focus-visible:border-input focus-visible:ring-0 focus-visible:ring-offset-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              disabled={readOnly}
                            />
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[10px] text-muted-foreground">Total</span>
                            <span className="text-xs font-medium h-6 flex items-center">{money(it.qty * it.price)}</span>
                          </div>
                        </>
                      )}
                    </div>
                    <Input
                      value={localValues[it.id]?.notes !== undefined ? localValues[it.id].notes || '' : it.notes || ''}
                      onChange={(e) => {
                        e.stopPropagation();
                        updateLocalValue(it.id, 'notes', e.target.value);
                      }}
                      onKeyDown={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => e.stopPropagation()}
                      placeholder="Notes..."
                      className="mt-1 h-6 text-xs"
                      disabled={readOnly}
                    />
                    {it.unmodified && (
                      <div className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                        <Tag className="h-2.5 w-2.5" /> Unmodified
                      </div>
                    )}
                  </div>
                  {/* Desktop: Qty, Price, Total with labels */}
                  <div className="hidden md:flex items-end gap-2">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] text-muted-foreground">Qty</span>
                      <Input
                        type="number"
                        size={Math.max(4, String(localValues[it.id]?.qty !== undefined ? localValues[it.id].qty : it.qty).length + 1)}
                        value={localValues[it.id]?.qty !== undefined ? localValues[it.id].qty : it.qty}
                        onChange={(e) => {
                          e.stopPropagation();
                          const raw = e.target.value;
                          updateLocalValue(it.id, 'qty', raw === '' ? ('' as unknown as number) : Number(raw));
                        }}
                        onKeyDown={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => e.stopPropagation()}
                        disabled={readOnly}
                        className="min-w-12 w-auto max-w-full h-6 text-xs border-0 shadow-none focus-visible:border focus-visible:border-input focus-visible:ring-0 focus-visible:ring-offset-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>
                    {!hidden && showPrice && (
                      <>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[10px] text-muted-foreground">Price</span>
                          <Input
                            type="number"
                            size={Math.max(5, String(localValues[it.id]?.price !== undefined ? localValues[it.id].price : it.price).length + 1)}
                            value={localValues[it.id]?.price !== undefined ? localValues[it.id].price : it.price}
                            onChange={(e) => {
                              e.stopPropagation();
                              const raw = e.target.value;
                              updateLocalValue(it.id, 'price', raw === '' ? ('' as unknown as number) : Number(raw));
                            }}
                            onKeyDown={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => e.stopPropagation()}
                            className="min-w-16 w-auto max-w-full h-6 text-xs border-0 shadow-none focus-visible:border focus-visible:border-input focus-visible:ring-0 focus-visible:ring-offset-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            disabled={readOnly}
                          />
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[10px] text-muted-foreground">Total</span>
                          <span className="text-xs font-medium h-6 flex items-center">{money(it.qty * it.price)}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
            {!hidden && showPrice && group.length > 1 && (
              <div className="flex justify-between text-[10px] text-muted-foreground border-t pt-1 mt-1">
                <span>Merged Total for {base}</span>
                <span>
                  {money(group.reduce((s, i) => s + i.qty * i.price, 0))} ({group.reduce((s, i) => s + i.qty, 0)} qty)
                </span>
              </div>
            )}
          </div>
        ))}
        {!hidden && showPrice && <MaterialsFooter label="Total" amount={money(total(items))} />}
      </CardContent>
    </Card>
  );
}

