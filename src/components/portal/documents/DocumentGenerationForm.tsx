import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { DocumentType, DocumentChangeOrder } from '@/types/documents';

interface DocumentGenerationFormProps {
  selectedTemplate: string;
  onTemplateChange: (value: string) => void;
  documentName: string;
  onDocumentNameChange: (value: string) => void;
  onGenerate: () => void;
  allowedTypes: DocumentType[];
  requiresChangeOrder: boolean;
  selectedChangeOrderId: string;
  onChangeOrderSelect: (value: string) => void;
  changeOrders: DocumentChangeOrder[];
  canGenerate: boolean;
  isGenerating: boolean;
  changeOrderError?: string | null;
}

export function DocumentGenerationForm({
  selectedTemplate,
  onTemplateChange,
  documentName,
  onDocumentNameChange,
  onGenerate,
  allowedTypes,
  requiresChangeOrder,
  selectedChangeOrderId,
  onChangeOrderSelect,
  changeOrders,
  canGenerate,
  isGenerating,
  changeOrderError,
}: DocumentGenerationFormProps) {
  return (
    <div className="flex flex-col gap-3">
      {/* Desktop: Group type + Name + Generate button on one line */}
      {/* Mobile: Stack vertically */}
      <div className="flex flex-col md:flex-row md:items-center gap-3">
        <Select value={selectedTemplate} onValueChange={onTemplateChange} disabled={!canGenerate || isGenerating}>
          <SelectTrigger className="w-full md:w-[280px]">
            <SelectValue placeholder="Select document template" />
          </SelectTrigger>
          <SelectContent>
            {allowedTypes.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex-1">
          <Input
            placeholder="Name"
            value={documentName}
            onChange={(e) => onDocumentNameChange(e.target.value)}
            disabled={!canGenerate || isGenerating}
          />
        </div>
        {/* Desktop: Generate button on same line */}
        <Button 
          variant="outline" 
          onClick={onGenerate} 
          disabled={!canGenerate || isGenerating}
          className="hidden md:inline-flex"
        >
          {isGenerating ? 'Generating...' : 'Generate'}
        </Button>
      </div>

      {/* Change Order Selection Dropdown - Always visible */}
      <div className="flex flex-col md:flex-row md:items-center gap-3">
        <label className="text-sm font-medium md:w-[280px]">Change Order:</label>
        <Select 
          value={selectedChangeOrderId || undefined} 
          onValueChange={(value) => onChangeOrderSelect(value || '')} 
          disabled={!canGenerate || isGenerating}
        >
          <SelectTrigger className="w-full md:flex-1">
            <SelectValue placeholder="Select a change order (optional)" />
          </SelectTrigger>
          <SelectContent>
            {changeOrders.length === 0 ? (
              <div className="px-2 py-1.5 text-sm text-muted-foreground">No change orders found</div>
            ) : (
              changeOrders.map((co) => {
                let displayName = co.name || co.status;
                if (!displayName && co.created_at) {
                  try {
                    displayName = `Change Order ${format(new Date(co.created_at), 'MM/dd/yyyy')}`;
                  } catch (e) {
                    displayName = `Change Order ${co.version_id.slice(0, 8)}`;
                  }
                }
                if (!displayName) {
                  displayName = `Change Order ${co.version_id.slice(0, 8)}`;
                }
                return (
                  <SelectItem key={co.version_id} value={co.version_id}>
                    {displayName}
                  </SelectItem>
                );
              })
            )}
          </SelectContent>
        </Select>
      </div>
      
      {/* Error message if change order is required but not selected */}
      {changeOrderError && (
        <div className="text-sm text-destructive">{changeOrderError}</div>
      )}

      {/* Mobile: Generate button below change order */}
      <Button 
        variant="outline" 
        onClick={onGenerate} 
        disabled={!canGenerate || isGenerating}
        className="w-full md:hidden"
      >
        {isGenerating ? 'Generating...' : 'Generate'}
      </Button>
    </div>
  );
}

