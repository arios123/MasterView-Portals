import React, { useEffect, useState, useCallback } from "react";
import { useDrag, useDrop } from 'react-dnd';
import { Link as LinkIcon, Split, Trash2, Tag, Save, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useMaterialRevisions } from "@/hooks/useMaterialRevisions";
import { PaymentSplitter } from "./PaymentSplitter";
import { usePrice } from "@/contexts/PriceContext";
import { LinkDialog } from "./materials/LinkDialog";
import { useLocalStorageCache, useCacheKey } from "@/hooks/useLocalStorageCache";
import { ensureNumber } from "@/utils/materialsUtils";
import { toast } from "sonner";

const money = (n: number) => n.toLocaleString(undefined, { style: "currency", currency: "USD" });
const uid = () => Math.random().toString(36).slice(2);

interface Item {
  id: string;
  name: string;
  qty: number;
  price: number;
  linkedTo?: string;
  linkedName?: string;
  unmodified?: boolean;
  link?: string;
  notes?: string;
}

interface ChangeOrder {
  id: string;
  title: string;
  itemsA: Item[];
  itemsB: Item[];
  soldContractTotal?: number;
}

interface ChangeOrderSectionProps {
  changeOrder: ChangeOrder;
  hoveredLink: string | null;
  setHoveredLink: (id: string | null) => void;
  showPaymentSplitter?: boolean;
  readOnly?: boolean;
  showInContractPrices?: boolean;
  showRevisedPrices?: boolean;
  canViewSaveButton?: boolean;
  canEditSaveButton?: boolean;
  onSaveRef?: (saveFn: (() => Promise<void>) | null) => void;
}

export function ChangeOrderSection({ changeOrder, hoveredLink, setHoveredLink, showPaymentSplitter = true, readOnly = false, showInContractPrices = false, showRevisedPrices = false, canViewSaveButton = true, canEditSaveButton = true, onSaveRef }: ChangeOrderSectionProps) {
  // Cache state to localStorage (with user/workspace scoping)
  const cacheKey = useCacheKey();
  const cachePrefix = `changeordersection.${changeOrder.id}`;
  const [itemsB, setItemsB, clearItemsBCache] = useLocalStorageCache<Item[]>(
    cacheKey(cachePrefix, undefined, undefined, 'itemsB'),
    changeOrder.itemsB
  );
  const [isPaymentValid, setIsPaymentValid] = useLocalStorageCache<boolean>(
    cacheKey(cachePrefix, undefined, undefined, 'isPaymentValid'),
    true
  );
  const { revisions, loading, saveRevisions } = useMaterialRevisions(changeOrder.id);
  const { hidden } = usePrice();
  
  // Link dialog state
  const [linkDialogOpen, setLinkDialogOpen] = useLocalStorageCache<boolean>(
    cacheKey(cachePrefix, undefined, undefined, 'linkDialogOpen'),
    false
  );
  const [linkDialogItemId, setLinkDialogItemId] = useLocalStorageCache<string | null>(
    cacheKey(cachePrefix, undefined, undefined, 'linkDialogItemId'),
    null
  );
  const [linkDialogUrl, setLinkDialogUrl] = useLocalStorageCache<string>(
    cacheKey(cachePrefix, undefined, undefined, 'linkDialogUrl'),
    ''
  );
  
  // Ref to store the local values getter from DropSection
  const localValuesGetterRef = React.useRef<(() => Record<string, Partial<Item>>) | null>(null);
  // Local overrides from Revised section inputs so we can compute difference in real time
  const [localOverrides, setLocalOverrides] = React.useState<Record<string, Partial<Item>>>({});

  // Load saved revisions from DB, or default Revised = mirror of "In Contract" (linked, like drag-and-drop)
  useEffect(() => {
    if (loading) return; // Wait for revisions fetch to complete

    setLocalOverrides({}); // Reset so difference uses itemsB until DropSection reports
    if (revisions.length > 0) {
      // DB has saved revisions — use them (server wins over cache)
      setItemsB(revisions);
    } else if (changeOrder.itemsA.length > 0) {
      // No saved revisions: default Revised = exact mirror of "In Contract", each item linked
      const mirrored = changeOrder.itemsA.map((it) => ({
        ...it,
        linkedTo: it.id,
        linkedName: it.name,
        id: uid(),
        unmodified: true,
      }));
      setItemsB(mirrored);
    }
  }, [changeOrder.id, changeOrder.itemsA.length, loading, revisions.length]);

  const handleDrop = (item: Item) => {
    const newItem: Item = { 
      ...item, 
      linkedTo: item.id, 
      linkedName: item.name, 
      id: uid(), 
      unmodified: true 
    };
    setItemsB((prev) => [...prev, newItem]);
  };

  const handleSave = useCallback(async () => {
    if (!isPaymentValid) {
      toast.error("Payment split must total 100% before saving");
      return;
    }
    
    // Merge local values into itemsB before saving (coerce blank qty/price to 0 so nothing is left blank)
    let itemsToSave = itemsB;
    if (localValuesGetterRef.current) {
      const localValues = localValuesGetterRef.current();
      itemsToSave = itemsB.map((it) => {
        const local = localValues[it.id];
        if (local) {
          return {
            ...it,
            ...local,
            qty: ensureNumber(local.qty, it.qty),
            price: ensureNumber(local.price, it.price),
            unmodified: false,
          };
        }
        return it;
      });
    }
    
    const success = await saveRevisions(itemsToSave);
    if (success) {
      setItemsB(itemsToSave);
      toast.success("Revised materials saved successfully");
    } else {
      toast.error("Failed to save revised materials");
    }
  }, [itemsB, isPaymentValid, saveRevisions]);
  
  // Handler for link dialog save
  const handleLinkSave = () => {
    if (linkDialogItemId && linkDialogUrl.trim()) {
      setItemsB((prev) => 
        prev.map((it) => 
          it.id === linkDialogItemId 
            ? { ...it, link: linkDialogUrl.trim(), unmodified: false } 
            : it
        )
      );
    }
    setLinkDialogOpen(false);
    setLinkDialogItemId(null);
    setLinkDialogUrl('');
  };

  // Register save function with parent component
  useEffect(() => {
    if (onSaveRef) {
      onSaveRef(handleSave);
      return () => {
        onSaveRef(null);
      };
    }
  }, [handleSave, onSaveRef]);

  const totalA = changeOrder.itemsA.reduce((s, it) => s + it.qty * it.price, 0);
  const totalB = React.useMemo(
    () =>
      itemsB.reduce((s, it) => {
        const qty = ensureNumber(localOverrides[it.id]?.qty, it.qty);
        const price = ensureNumber(localOverrides[it.id]?.price, it.price);
        return s + qty * price;
      }, 0),
    [itemsB, localOverrides]
  );
  const difference = totalB - totalA; // Revision − CO total
  const soldContractTotal = changeOrder.soldContractTotal ?? 0;

  return (
    <>
      <Card className="shadow-sm border rounded-lg hover:shadow-md transition">
        <CardHeader className="py-2">
          <CardTitle className="text-base font-medium">{changeOrder.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Three summary cards: Original Sold Contract, In Contract (CO total), Revised total */}
          {!hidden && (showInContractPrices || showRevisedPrices) && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Card className="border rounded-lg shadow-sm">
                <CardHeader className="py-2 px-3">
                  <CardTitle className="text-xs font-medium">Original Sold Contract</CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-3 pt-0">
                  <div className="text-base font-semibold">{money(soldContractTotal)}</div>
                </CardContent>
              </Card>
              <Card className="border rounded-lg shadow-sm">
                <CardHeader className="py-2 px-3">
                  <CardTitle className="text-xs font-medium">In Contract (CO Total)</CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-3 pt-0">
                  <div className="text-base font-semibold">{money(totalA)}</div>
                </CardContent>
              </Card>
              <Card className="border rounded-lg shadow-sm">
                <CardHeader className="py-2 px-3">
                  <CardTitle className="text-xs font-medium">Revised Total</CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-3 pt-0">
                  <div className="text-base font-semibold">{money(totalB)}</div>
                </CardContent>
              </Card>
            </div>
          )}

          <h4 className="text-xs font-semibold">In Contract</h4>
          {changeOrder.itemsA.map((it) => (
            <DraggableItem
              key={it.id}
              item={it}
              linked={itemsB.some((b) => b.linkedTo === it.id)}
              hoveredLink={hoveredLink}
              setHoveredLink={setHoveredLink}
              readOnly={readOnly}
              showPrice={showInContractPrices}
            />
          ))}
          {!hidden && showInContractPrices && <Footer label="Total" amount={money(totalA)} />}

          <DropSection
            title="Revised"
            onDrop={handleDrop}
            items={itemsB}
            setItems={setItemsB}
            hoveredLink={hoveredLink}
            setHoveredLink={setHoveredLink}
            onSave={handleSave}
            hideSaveButton={true}
            hidden={hidden}
            readOnly={readOnly}
            showPrice={showRevisedPrices}
            onOpenLinkDialog={(itemId, currentLink) => {
              setLinkDialogItemId(itemId);
              setLinkDialogUrl(currentLink || '');
              setLinkDialogOpen(true);
            }}
            onGetLocalValues={(getter) => {
              localValuesGetterRef.current = getter;
            }}
            onLocalValuesChange={setLocalOverrides}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {!hidden && showRevisedPrices && (
              <div className="flex justify-between border-t pt-2 text-xs items-center">
                <span>Difference</span>
                <span className={`${difference > 0 ? 'text-red-600' : 'text-green-600'} font-semibold`}>
                  {money(difference)}
                </span>
              </div>
            )}
            
            {showPaymentSplitter && (
              <PaymentSplitter 
                totalAmount={totalB} 
                onValidationChange={setIsPaymentValid}
              />
            )}
          </div>

          {!readOnly && canViewSaveButton && (
            <div className="border-t border-border/60 pt-3 mt-3 flex justify-end">
              <Button
                onClick={handleSave}
                size="sm"
                disabled={!canEditSaveButton}
                className="!h-8 min-h-8 py-0 gap-1.5 rounded-md shrink-0"
              >
                <Save className="h-3.5 w-3.5" />
                Save
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      <LinkDialog
        open={linkDialogOpen}
        onOpenChange={setLinkDialogOpen}
        url={linkDialogUrl}
        onUrlChange={setLinkDialogUrl}
        onSave={handleLinkSave}
      />
    </>
  );
}

interface DraggableItemProps {
  item: Item;
  linked: boolean;
  hoveredLink: string | null;
  setHoveredLink: (id: string | null) => void;
  readOnly?: boolean;
  showPrice?: boolean;
}

function DraggableItem({ item, linked, hoveredLink, setHoveredLink, readOnly = false, showPrice = false }: DraggableItemProps) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'ITEM',
    item,
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
    canDrag: !readOnly,
  }));

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
      {showPrice && <span className="text-xs font-medium">{money(item.qty * item.price)}</span>}
    </div>
  );
}

interface DropSectionProps {
  title: string;
  onDrop: (item: Item) => void;
  items: Item[];
  setItems: (items: Item[] | ((prev: Item[]) => Item[])) => void;
  hoveredLink: string | null;
  setHoveredLink: (id: string | null) => void;
  onSave?: () => void;
  hideSaveButton?: boolean;
  hidden?: boolean;
  readOnly?: boolean;
  showPrice?: boolean;
  onOpenLinkDialog?: (itemId: string, currentLink?: string) => void;
  onGetLocalValues?: (getter: () => Record<string, Partial<Item>>) => void;
  onLocalValuesChange?: (values: Record<string, Partial<Item>>) => void;
}

function DropSection({ title, onDrop, items, setItems, hoveredLink, setHoveredLink, onSave, hideSaveButton = false, hidden = false, readOnly = false, showPrice = false, onOpenLinkDialog, onGetLocalValues, onLocalValuesChange }: DropSectionProps) {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'ITEM',
    drop: (item: Item) => !readOnly && onDrop(item),
    collect: (monitor) => ({ isOver: monitor.isOver() }),
    canDrop: () => !readOnly,
  }));

  // Local state for ALL input values - only updates on save, not on every keystroke
  const [localValues, setLocalValues] = useState<Record<string, Partial<Item>>>({});

  // Initialize local values from items when items change (but only if not already set)
  useEffect(() => {
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
  useEffect(() => {
    if (onGetLocalValues) {
      onGetLocalValues(() => localValues);
    }
  }, [onGetLocalValues]); // Only when callback changes, not on every localValues change

  // Notify parent of local value changes so difference can update in real time
  useEffect(() => {
    onLocalValuesChange?.(localValues);
  }, [localValues, onLocalValuesChange]);

  // Function to update local value (doesn't update items)
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

  const groupByBaseName = (items: Item[]): Record<string, Item[]> => {
    const groups: Record<string, Item[]> = {};
    items.forEach(it => {
      const baseName = it.name.replace(/\s*\(Part \d+\)$/i, '').trim();
      if (!groups[baseName]) groups[baseName] = [];
      groups[baseName].push(it);
    });
    return groups;
  };

  const grouped = groupByBaseName(items);
  const total = items.reduce((s, it) => s + it.qty * it.price, 0);

  return (
    <Card 
      ref={drop} 
      className={`border ${isOver ? 'border-primary bg-primary/5' : 'border-border'} rounded-lg shadow-sm hover:shadow-md transition`}
    >
      <CardHeader className="py-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">{title}</CardTitle>
          {onSave && !hideSaveButton && (
            <Button 
              onClick={onSave}
              size="sm"
              className="h-7 gap-1.5"
            >
              <Save className="h-3.5 w-3.5" />
              Save
            </Button>
          )}
        </div>
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
                  className={`flex flex-col md:flex-row md:justify-between md:items-center gap-2 border p-1.5 rounded-lg cursor-pointer hover:bg-accent/50 transition ${
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
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-5 px-2 text-[10px]" 
                          onClick={() => handleSplit(it.id)}
                        >
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
                          className="min-w-12 w-auto max-w-full h-6 text-xs border-0 shadow-none focus-visible:border focus-visible:border-input focus-visible:ring-0 focus-visible:ring-offset-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          disabled={readOnly}
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
                        className="min-w-12 w-auto max-w-full h-6 text-xs border-0 shadow-none focus-visible:border focus-visible:border-input focus-visible:ring-0 focus-visible:ring-offset-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        disabled={readOnly}
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
        {!hidden && showPrice && <Footer label="Total" amount={money(total)} />}
      </CardContent>
    </Card>
  );
}

interface FooterProps {
  label: string;
  amount: string;
}

function Footer({ label, amount }: FooterProps) {
  return (
    <div className="flex justify-between border-t pt-1 mt-1 text-[10px]">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{amount}</span>
    </div>
  );
}
