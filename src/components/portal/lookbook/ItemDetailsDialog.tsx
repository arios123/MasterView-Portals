import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';
import { LookbookItem } from '@/types/lookbook';

interface ItemDetailsDialogProps {
  item: LookbookItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hidePrices: boolean;
  isLiked: boolean;
  onToggleLike: (item: LookbookItem) => void;
  readOnly: boolean;
}

export function ItemDetailsDialog({ 
  item, 
  open, 
  onOpenChange, 
  hidePrices, 
  isLiked, 
  onToggleLike, 
  readOnly 
}: ItemDetailsDialogProps) {
  if (!item) return null;

  const handleToggleLike = () => {
    onToggleLike(item);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto p-0 gap-0">
        {/* Heart icon button - positioned to the left of X button on desktop */}
        <div className="absolute top-4 right-12 z-50 hidden md:block">
          {!readOnly && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleToggleLike}
              aria-label={isLiked ? 'Unlike' : 'Like'}
            >
              <Heart
                className={`w-5 h-5 transition-colors ${
                  isLiked ? 'fill-red-500 text-red-500' : 'text-muted-foreground'
                }`}
              />
            </Button>
          )}
          {readOnly && isLiked && (
            <div className="flex items-center justify-center">
              <Heart className="w-5 h-5 fill-red-500 text-red-500" />
            </div>
          )}
        </div>

        <div className="flex flex-col md:flex-row">
          {/* Image Section - Left side on desktop, top on mobile */}
          <div className="w-full md:w-1/2 flex-shrink-0 p-6 bg-muted/30">
            <div className="sticky top-0">
              <img
                src={item.image}
                alt={item.title}
                className="w-full max-h-[70vh] object-contain rounded-lg bg-background p-4"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src =
                    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 200'%3E%3Crect width='100%25' height='100%25' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%239ca3af' font-size='14'%3EImage unavailable%3C/text%3E%3C/svg%3E";
                }}
              />
            </div>
          </div>

          {/* Details Section - Right side on desktop, bottom on mobile */}
          <div className="w-full md:w-1/2 flex flex-col p-6">
            <DialogHeader className="pb-4 border-b">
              <div className="flex items-start justify-between gap-4">
                <DialogTitle className="text-2xl font-bold pr-8">
                  {item.title ? `${item.brand} - ${item.title}` : item.brand}
                </DialogTitle>
                {/* Heart icon button - shown on mobile only */}
                <div className="md:hidden flex-shrink-0">
                  {!readOnly && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleToggleLike}
                      aria-label={isLiked ? 'Unlike' : 'Like'}
                    >
                      <Heart
                        className={`w-5 h-5 transition-colors ${
                          isLiked ? 'fill-red-500 text-red-500' : 'text-muted-foreground'
                        }`}
                      />
                    </Button>
                  )}
                  {readOnly && isLiked && (
                    <div className="flex items-center justify-center">
                      <Heart className="w-5 h-5 fill-red-500 text-red-500" />
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary" className="capitalize">
                  {item.category}
                </Badge>
              </div>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto space-y-4 pt-4">
              {!hidePrices && (
                <div className="space-y-1">
                  <Label className="text-sm font-semibold text-muted-foreground">Price</Label>
                  <p className="text-2xl font-bold">{item.price}</p>
                </div>
              )}
              
              <div className="space-y-1">
                <Label className="text-sm font-semibold text-muted-foreground">Finish</Label>
                <p className="text-base">{item.finish}</p>
              </div>

              {item.model_number && (
                <div className="space-y-1">
                  <Label className="text-sm font-semibold text-muted-foreground">Model #</Label>
                  <p className="text-base">{item.model_number}</p>
                </div>
              )}

              {item.collection && (
                <div className="space-y-1">
                  <Label className="text-sm font-semibold text-muted-foreground">Collection</Label>
                  <p className="text-base">{item.collection}</p>
                </div>
              )}

              {item.description && (
                <div className="space-y-2 pt-2 border-t">
                  <Label className="text-sm font-semibold text-muted-foreground">Description</Label>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{item.description}</p>
                </div>
              )}

              <div className="space-y-2 pt-2 border-t">
                <Label className="text-sm font-semibold text-muted-foreground block">Product Link</Label>
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline break-all block"
                >
                  {item.link}
                </a>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

