import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { LookbookItem } from '@/types/lookbook';

interface ItemDetailsDialogProps {
  item: LookbookItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hidePrices: boolean;
}

export function ItemDetailsDialog({ item, open, onOpenChange, hidePrices }: ItemDetailsDialogProps) {
  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Item Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Title</Label>
            <p className="text-sm text-muted-foreground">{item.title}</p>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Brand</Label>
            <p className="text-sm text-muted-foreground">{item.brand}</p>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Model #</Label>
            <p className="text-sm text-muted-foreground">{item.model_number || '—'}</p>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Collection</Label>
            <p className="text-sm text-muted-foreground">{item.collection || '—'}</p>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Category</Label>
            <Badge variant="secondary" className="capitalize">
              {item.category}
            </Badge>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Finish</Label>
            <p className="text-sm text-muted-foreground">{item.finish}</p>
          </div>
          {!hidePrices && (
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Price</Label>
              <p className="text-sm text-muted-foreground">{item.price}</p>
            </div>
          )}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Link</Label>
            <a
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline break-all"
            >
              {item.link}
            </a>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Description</Label>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{item.description}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

