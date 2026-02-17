import React, { useMemo } from 'react';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { LookbookItem } from '@/types/lookbook';
import { LookbookItemCard } from './LookbookItemCard';
import { cn } from '@/lib/utils';

interface LookbookItemGridProps {
  subTab: string;
  onSubTabChange: (value: string) => void;
  subCategories: string[];
  searchTerm: string;
  onSearchChange: (value: string) => void;
  sortBy: string;
  onSortChange: (value: string) => void;
  hidePrices: boolean;
  onHidePricesChange: (value: boolean) => void;
  visibleItems: LookbookItem[];
  selectedItemIds: Set<string>;
  readOnly: boolean;
  onToggleLike: (item: LookbookItem) => void;
  onViewDetails: (item: LookbookItem) => void;
}

export function LookbookItemGrid({
  subTab,
  onSubTabChange,
  subCategories,
  searchTerm,
  onSearchChange,
  sortBy,
  onSortChange,
  hidePrices,
  onHidePricesChange,
  visibleItems,
  selectedItemIds,
  readOnly,
  onToggleLike,
  onViewDetails,
}: LookbookItemGridProps) {
  // Split categories into rows of 5
  const categoriesPerRow = 5;
  const categoryRows = useMemo(() => {
    const rows: string[][] = [];
    for (let i = 0; i < subCategories.length; i += categoriesPerRow) {
      rows.push(subCategories.slice(i, i + categoriesPerRow));
    }
    return rows;
  }, [subCategories]);

  // Calculate max columns needed for grid layout
  const maxCols = useMemo(() => {
    return Math.max(...categoryRows.map(row => row.length), categoriesPerRow);
  }, [categoryRows]);

  return (
    <Tabs value={subTab} onValueChange={onSubTabChange}>
      <div className="flex flex-col gap-3 mb-4">
        {/* Tab navigator and search/filter controls in same row */}
        <div className="flex flex-col sm:flex-row sm:items-start gap-3 w-full">
          {/* Custom multi-row tab navigator - takes remaining space */}
          <div className="flex-1 min-w-0">
            <div
              className="inline-flex h-auto items-stretch rounded-md bg-muted p-1 text-muted-foreground w-full"
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${maxCols}, minmax(0, 1fr))`,
                gridTemplateRows: `repeat(${categoryRows.length}, auto)`,
                gap: 0
              }}
            >
              {categoryRows.map((row, rowIndex) =>
                row.map((cat, colIndex) => {
                  const isActive = subTab === cat;
                  const isFirstInRow = colIndex === 0;
                  const isLastInRow = colIndex === row.length - 1;
                  const isFirstRow = rowIndex === 0;
                  const isLastRow = rowIndex === categoryRows.length - 1;
                  
                  return (
                    <button
                      key={cat}
                      onClick={() => onSubTabChange(cat)}
                      className={cn(
                        "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-2 py-1.5 text-xs sm:text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                        isActive 
                          ? "bg-background text-foreground shadow-sm" 
                          : "text-muted-foreground hover:text-foreground",
                        isFirstRow && isFirstInRow && "rounded-tl-md",
                        isFirstRow && isLastInRow && categoryRows.length === 1 && "rounded-tr-md",
                        isLastRow && isFirstInRow && "rounded-bl-md",
                        isLastRow && isLastInRow && "rounded-br-md"
                      )}
                      style={{ 
                        gridRow: rowIndex + 1,
                        gridColumn: colIndex + 1
                      }}
                    >
              {cat}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Search and filter controls - fixed width */}
          <div className="flex flex-shrink-0 flex-col sm:flex-row sm:items-center gap-2">
            <div className="flex gap-2 items-center">
          <Switch checked={hidePrices} onCheckedChange={onHidePricesChange} />
          <Input
            placeholder="Search by keyword..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full sm:w-64"
            disabled={readOnly}
          />
          <Select value={sortBy} onValueChange={onSortChange} disabled={readOnly}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="relevance">Relevance</SelectItem>
              <SelectItem value="price-asc">Price: Low to High</SelectItem>
              <SelectItem value="price-desc">Price: High to Low</SelectItem>
            </SelectContent>
          </Select>
            </div>
          </div>
        </div>
      </div>

      <TabsContent value={subTab}>
        {visibleItems.length === 0 ? (
          <div className="text-sm text-muted-foreground p-6 border rounded-xl">
            No items found for <strong>{subTab}</strong> matching "{searchTerm}".
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {visibleItems.map((item) => {
              const liked = item.id ? selectedItemIds.has(item.id) : false;
              return (
                <LookbookItemCard
                  key={item.id ?? `${item.title}-${item.brand}-${item.category}`}
                  item={item}
                  isLiked={liked}
                  hidePrices={hidePrices}
                  readOnly={readOnly}
                  onToggleLike={onToggleLike}
                  onViewDetails={onViewDetails}
                />
              );
            })}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}

