import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, Check as CheckIcon, X } from 'lucide-react';
import { usePrice } from '@/contexts/PriceContext';
import { AccountabilityInfo } from '@/components/AccountabilityInfo';
import type { IncomingPayment } from '@/types/payments';

interface IncomingPaymentsSectionProps {
  incoming: IncomingPayment[];
  incomingForm: IncomingPayment;
  onFormChange: (form: IncomingPayment) => void;
  editingId: string | null;
  editingData: Partial<IncomingPayment>;
  onEditingDataChange: (data: Partial<IncomingPayment>) => void;
  validationErrors: Record<string, boolean>;
  onAdd: () => void;
  onEdit: (payment: IncomingPayment) => void;
  onSave: (paymentId: string) => void;
  onCancel: () => void;
  onDelete: (id: string) => void;
  canViewPrices: boolean;
  readOnly: boolean;
}

const money = (n: number) => n.toLocaleString(undefined, { style: 'currency', currency: 'USD' });

export function IncomingPaymentsSection({
  incoming,
  incomingForm,
  onFormChange,
  editingId,
  editingData,
  onEditingDataChange,
  validationErrors,
  onAdd,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  canViewPrices,
  readOnly,
}: IncomingPaymentsSectionProps) {
  const { hidden } = usePrice();

  return (
    <Card className="border rounded-xl shadow-sm">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Incoming Payments</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {/* Mobile: Stack vertically, Desktop: Grid layout */}
        <div className={`flex flex-col gap-2 md:grid ${canViewPrices ? 'md:grid-cols-6' : 'md:grid-cols-5'}`}>
          <Input
            type="date"
            value={incomingForm.date}
            onChange={(e) => onFormChange({ ...incomingForm, date: e.target.value })}
            disabled={readOnly}
          />
          {canViewPrices && (
            <Input
              placeholder="Amount"
              value={incomingForm.amount}
              onChange={(e) => onFormChange({ ...incomingForm, amount: e.target.value })}
              disabled={readOnly}
            />
          )}
          <Input
            placeholder="Type of Payment"
            value={incomingForm.type}
            onChange={(e) => onFormChange({ ...incomingForm, type: e.target.value })}
            disabled={readOnly}
          />
          <Input
            placeholder="Received By"
            value={incomingForm.receivedBy}
            onChange={(e) => onFormChange({ ...incomingForm, receivedBy: e.target.value })}
            disabled={readOnly}
          />
          <Input
            placeholder="For"
            value={incomingForm.forField}
            onChange={(e) => onFormChange({ ...incomingForm, forField: e.target.value })}
            disabled={readOnly}
          />
          <Input
            placeholder="Notes"
            value={incomingForm.notes}
            onChange={(e) => onFormChange({ ...incomingForm, notes: e.target.value })}
            disabled={readOnly}
            className="md:col-span-full md:row-start-2"
          />
          <Button onClick={onAdd} disabled={readOnly} className="md:col-span-1 md:row-start-1">
            Add
          </Button>
        </div>

        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left border-b bg-muted/50">
                <th className="p-2">Date</th>
                {canViewPrices && <th>Amount</th>}
                <th>Type</th>
                <th>Received By</th>
                <th>For</th>
                <th>Notes</th>
                {!readOnly && <th className="w-20">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {incoming.map((p, i) => {
                const paymentId = p.id ? String(p.id) : null;
                const isEditing = editingId === paymentId;
                return (
                  <tr key={p.id || i} className="border-b hover:bg-muted/50">
                    <td className="p-2">
                      <div className="flex items-center gap-2">
                        <span>{p.date}</span>
                        {!isEditing && (
                          <AccountabilityInfo
                            created_by={p.created_by}
                            created_at={p.created_at}
                            updated_by={p.updated_by}
                            updated_at={p.updated_at}
                          />
                        )}
                      </div>
                    </td>
                    {canViewPrices && (
                      <td>
                        {isEditing ? (
                          <Input
                            type="number"
                            value={editingData.amount ?? ''}
                            onChange={(e) => {
                              onEditingDataChange({ ...editingData, amount: e.target.value });
                            }}
                            className={`h-7 text-xs w-24 ${validationErrors.amount ? 'border-destructive' : ''}`}
                            placeholder="Amount"
                          />
                        ) : (
                          hidden ? '—' : money(Number(p.amount || 0))
                        )}
                      </td>
                    )}
                    <td>
                      {isEditing ? (
                        <Input
                          value={editingData.type ?? ''}
                          onChange={(e) => onEditingDataChange({ ...editingData, type: e.target.value })}
                          className={`h-7 text-xs w-32 ${validationErrors.type ? 'border-destructive' : ''}`}
                          placeholder="Type"
                        />
                      ) : (
                        p.type
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <Input
                          value={editingData.receivedBy ?? ''}
                          onChange={(e) => onEditingDataChange({ ...editingData, receivedBy: e.target.value })}
                          className="h-7 text-xs w-32"
                          placeholder="Received By"
                        />
                      ) : (
                        p.receivedBy
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <Input
                          value={editingData.forField ?? ''}
                          onChange={(e) => onEditingDataChange({ ...editingData, forField: e.target.value })}
                          className="h-7 text-xs w-32"
                          placeholder="For"
                        />
                      ) : (
                        p.forField
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
                        p.notes
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
                                onClick={() => {
                                  if (paymentId) onSave(paymentId);
                                }}
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
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  onEdit(p);
                                }}
                                title="Edit payment"
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                                onClick={() => onDelete(p.id || '')}
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

