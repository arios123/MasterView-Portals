import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import { LookbookItem } from '@/types/lookbook';

interface LookbookItemCardProps {
  item: LookbookItem;
  isLiked: boolean;
  hidePrices: boolean;
  readOnly: boolean;
  onToggleLike: (item: LookbookItem) => void;
  onViewDetails: (item: LookbookItem) => void;
}

export function LookbookItemCard({
  item,
  isLiked,
  hidePrices,
  readOnly,
  onToggleLike,
  onViewDetails,
}: LookbookItemCardProps) {
  const handleCardClick = () => {
    onViewDetails(item);
  };

  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleLike(item);
  };

  return (
    <motion.div
      key={item.id ?? `${item.title}-${item.brand}-${item.category}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card 
        className="relative group overflow-hidden rounded-2xl cursor-pointer hover:shadow-lg transition-shadow"
        onClick={handleCardClick}
      >
        <img
          src={item.image}
          alt={item.title}
          className="w-full h-48 object-contain p-4 bg-background"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src =
              "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 200'%3E%3Crect width='100%25' height='100%25' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%239ca3af' font-size='14'%3EImage unavailable%3C/text%3E%3C/svg%3E";
          }}
        />
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h3 className="text-base font-semibold flex-1">
              {item.title ? `${item.brand} - ${item.title}` : item.brand}
            </h3>
            <Badge variant="secondary" className="capitalize flex-shrink-0">
              {item.category}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{item.finish}</p>
          {!hidePrices && <p className="text-sm font-semibold">{item.price}</p>}
          <p className="text-sm mt-2 text-muted-foreground line-clamp-3">{item.description}</p>
        </CardContent>
        <div className="absolute top-2 right-2 flex gap-1">
          {!readOnly && (
            <button
              aria-label={isLiked ? 'Unlike' : 'Like'}
              onClick={handleLikeClick}
              className="rounded-full p-1 bg-background/80 hover:bg-background shadow-sm"
            >
              <Heart
                className={`w-5 h-5 transition-colors ${
                  isLiked ? 'fill-red-500 text-red-500' : 'text-muted-foreground'
                }`}
              />
            </button>
          )}
          {readOnly && isLiked && (
            <div className="rounded-full p-1 bg-background/80 shadow-sm">
              <Heart className="w-5 h-5 fill-red-500 text-red-500" />
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}

