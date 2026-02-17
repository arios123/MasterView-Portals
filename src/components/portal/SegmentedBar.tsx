import React from "react";

interface SegmentedBarProps {
  count?: number;
  activeIndex?: number;
  percentage?: number;
  segmentPercentages?: number[];
  segmentLabels?: string[];
}

export function SegmentedBar({ 
  count, 
  activeIndex, 
  percentage,
  segmentPercentages,
  segmentLabels 
}: SegmentedBarProps) {
  // Percentage-based mode (for progress config)
  if (percentage !== undefined || segmentPercentages) {
    const displayPercentage = percentage !== undefined ? percentage : 
      (segmentPercentages ? segmentPercentages.reduce((sum, p) => sum + p, 0) : 0);
    
    return (
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden relative">
          <div 
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${Math.min(100, Math.max(0, displayPercentage))}%` }}
          />
        </div>
        <div className="text-xs text-muted-foreground w-8 text-right">
          {Math.round(Math.min(100, Math.max(0, displayPercentage)))}%
        </div>
      </div>
    );
  }

  // Index-based mode (for phases - original behavior)
  if (count !== undefined && activeIndex !== undefined) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex-1 flex gap-2 items-center">
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className={`h-2 rounded-full flex-1 ${i <= activeIndex ? "bg-primary" : "bg-muted"}`} />
          ))}
        </div>
        <div className="text-xs text-muted-foreground w-8 text-right">
          {count > 0 ? Math.round((activeIndex / (count - 1)) * 100) : 0}%
        </div>
      </div>
    );
  }

  return null;
}

export function LabelsRow({ labels }: { labels: readonly string[] }) {
  if (!labels || labels.length === 0) return null;
  
  return (
    <div className="mt-1 grid" style={{ gridTemplateColumns: `repeat(${labels.length},1fr)` }}>
      {labels.map((t, i) => (
        <div key={i} className="text-xs text-muted-foreground text-center">{t}</div>
      ))}
    </div>
  );
}