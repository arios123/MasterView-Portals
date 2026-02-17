import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Check, ChevronsUpDown, Pencil, Trash2, Check as CheckIcon, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePrice } from '@/contexts/PriceContext';
import { AccountabilityInfo } from '@/components/AccountabilityInfo';
import type { OutgoingPayment, Material } from '@/types/payments';

interface OutgoingPaymentsSectionProps {
  outgoing: OutgoingPayment[];
  outgoingForm: OutgoingPayment;
  onFormChange: (form: OutgoingPayment) => void;
  editingId: string | null;
  editingData: Partial<OutgoingPayment>;
  onEditingDataChange: (data: Partial<OutgoingPayment>) => void;
  validationErrors: Record<string, boolean>;
  materials: Material[];
  onMaterialSelect: (materialId: string) => void;
  onAdd: () => void;
  onEdit: (payment: OutgoingPayment) => void;
  onSave: (paymentId: string) => void;
  onCancel: () => void;
  onDelete: (id: string) => void;
  canViewPrices: boolean;
  readOnly: boolean;
}

const money = (n: number) => n.toLocaleString(undefined, { style: 'currency', currency: 'USD' });

export function OutgoingPaymentsSection({
  outgoing,
  outgoingForm,
  onFormChange,
  editingId,
  editingData,
  onEditingDataChange,
  validationErrors,
  materials,
  onMaterialSelect,
  onAdd,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  canViewPrices,
  readOnly,
}: OutgoingPaymentsSectionProps) {
  const { hidden } = usePrice();
  const [open, setOpen] = useState(false);

  const handleMaterialSelect = (materialId: string) => {
    onMaterialSelect(materialId);
    setOpen(false);
  };

  return (
    <Card className="border rounded-xl shadow-sm">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Outgoing Payments (Materials)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {/* Mobile: Stack vertically, Desktop: Grid layout */}
        <div className={`flex flex-col gap-2 md:grid md:grid-rows-2 ${canViewPrices ? 'md:grid-cols-6' : 'md:grid-cols-5'}`}>
          <Input
            type="date"
            value={outgoingForm.date}
            onChange={(e) => onFormChange({ ...outgoingForm, date: e.target.value })}
            disabled={readOnly}
            className="md:row-start-1"
          />
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="justify-between w-full md:w-auto md:row-start-1"
                disabled={readOnly}
              >
                {outgoingForm.item || 'Pick revised material...'}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0 bg-background" align="start">
              <Command className="bg-background">
                <CommandInput placeholder="Search materials..." />
                <CommandList>
                  <CommandEmpty>No material found.</CommandEmpty>
                  <CommandGroup>
                    {materials.map((mat) => (
                      <CommandItem
                        key={mat.id}
                        value={mat.name}
                        onSelect={() => handleMaterialSelect(mat.id)}
                        className="cursor-pointer"
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            outgoingForm.item === mat.name ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                        <div className="flex flex-col">
                          <span>{mat.name}</span>
                          <span className="text-xs text-muted-foreground">
                            Qty: {mat.qty} • {!hidden && <>Price: {money(mat.price)}</>}
                          </span>
                          {mat.notes && mat.notes.trim() && (
                            <span className="text-xs text-muted-foreground italic mt-0.5">
                              Notes: {mat.notes}
                            </span>
                          )}
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          <Input
            placeholder="Item (manual)"
            value={outgoingForm.item}
            onChange={(e) => onFormChange({ ...outgoingForm, item: e.target.value })}
            disabled={readOnly}
            className="md:row-start-1"
          />
          <Input
            placeholder="Link"
            value={outgoingForm.link}
            onChange={(e) => onFormChange({ ...outgoingForm, link: e.target.value })}
            disabled={readOnly}
            className="md:row-start-1"
          />
          {!hidden && canViewPrices && (
            <Input
              placeholder="Total Price"
              value={outgoingForm.totalPrice}
              onChange={(e) => onFormChange({ ...outgoingForm, totalPrice: e.target.value })}
              disabled={readOnly}
              className="md:row-start-1"
            />
          )}
          <Input
            placeholder="Quantity"
            value={outgoingForm.qty}
            onChange={(e) => onFormChange({ ...outgoingForm, qty: e.target.value })}
            disabled={readOnly}
            className="md:row-start-2 md:col-span-1"
          />
          <Input
            placeholder="Tracking #"
            value={outgoingForm.tracking}
            onChange={(e) => onFormChange({ ...outgoingForm, tracking: e.target.value })}
            disabled={readOnly}
            className="md:row-start-2 md:col-span-1"
          />
          <Input
            placeholder="Notes"
            value={outgoingForm.notes}
            onChange={(e) => onFormChange({ ...outgoingForm, notes: e.target.value })}
            disabled={readOnly}
            className="md:row-start-2 md:col-span-3"
          />
          <Button onClick={onAdd} disabled={readOnly} className="md:row-start-1">
            Add
          </Button>
        </div>

        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left border-b bg-muted/50">
                <th className="p-2">Date</th>
                <th>Item</th>
                <th>Link</th>
                {!hidden && canViewPrices && <th>Total Price</th>}
                <th>Qty</th>
                <th>Tracking #</th>
                <th>Notes</th>
                {!readOnly && <th className="w-20">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {outgoing.map((o, i) => {
                const isEditing = editingId === o.id;
                return (
                  <tr key={o.id || i} className="border-b hover:bg-muted/50">
                    <td className="p-2">
                      <div className="flex items-center gap-2">
                        <span>{o.date}</span>
                        {!isEditing && (
                          <AccountabilityInfo
                            created_by={o.created_by}
                            created_at={o.created_at}
                            updated_by={o.updated_by}
                            updated_at={o.updated_at}
                          />
                        )}
                      </div>
                    </td>
                    <td>{o.item}</td>
                    <td>
                      {isEditing ? (
                        <Input
                          value={editingData.link || o.link || ''}
                          onChange={(e) => onEditingDataChange({ ...editingData, link: e.target.value })}
                          className="h-7 text-xs w-40"
                          placeholder="Link"
                        />
                      ) : o.link ? (
                        readOnly ? (
                          <span className="text-muted-foreground">Link</span>
                        ) : (
                          <a href={o.link} target="_blank" rel="noreferrer" className="text-primary underline">
                            Link
                          </a>
                        )
                      ) : (
                        '—'
                      )}
                    </td>
                    {!hidden && canViewPrices && (
                      <td>
                        {isEditing ? (
                          <Input
                            type="number"
                            value={editingData.totalPrice ?? ''}
                            onChange={(e) => onEditingDataChange({ ...editingData, totalPrice: e.target.value })}
                            className={`h-7 text-xs w-24 ${validationErrors.totalPrice ? 'border-destructive' : ''}`}
                            placeholder="Total Price"
                          />
                        ) : (
                          money(Number(o.totalPrice || 0))
                        )}
                      </td>
                    )}
                    <td>
                      {isEditing ? (
                        <Input
                          type="number"
                          value={editingData.qty ?? ''}
                          onChange={(e) => onEditingDataChange({ ...editingData, qty: e.target.value })}
                          className="h-7 text-xs w-16"
                          placeholder="Qty"
                        />
                      ) : (
                        o.qty
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <Input
                          value={editingData.tracking ?? ''}
                          onChange={(e) => onEditingDataChange({ ...editingData, tracking: e.target.value })}
                          className="h-7 text-xs w-32"
                          placeholder="Tracking #"
                        />
                      ) : (
                        o.tracking
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <Input
                          value={editingData.notes ?? ''}
                          onChange={(e) => onEditingDataChange({ ...editingData, notes: e.target.value })}
                          className="h-7 text-xs w-40"
                          placeholder="Notes"
                        />
                      ) : (
                        o.notes
                      )}
                    </td>
                    {!readOnly && (
                      <td>
                        <div className="flex items-center gap-1">
                          {isEditing ? (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 text-green-600 hover:text-green-700"
                                onClick={() => o.id && onSave(o.id)}
                                title="Save changes"
                              >
                                <CheckIcon className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={onCancel}
                                title="Cancel editing"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => onEdit(o)}
                                title="Edit payment"
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                                onClick={() => onDelete(o.id || '')}
                                title="Delete payment"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

