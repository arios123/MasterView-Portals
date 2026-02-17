import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Trash2 } from 'lucide-react';
import { LookbookQuestion, LookbookAnswers, LookbookItem } from '@/types/lookbook';

interface LookbookSummaryProps {
  questions: LookbookQuestion[];
  answers: LookbookAnswers;
  likedItems: LookbookItem[];
  readOnly: boolean;
  hidePrices: boolean;
  onEditQuestions: () => void;
  onExport: (format: 'json' | 'csv') => void;
  onToggleLike: (item: LookbookItem) => void;
  onViewDetails: (item: LookbookItem) => void;
}

export function LookbookSummary({
  questions,
  answers,
  likedItems,
  readOnly,
  hidePrices,
  onEditQuestions,
  onExport,
  onToggleLike,
  onViewDetails,
}: LookbookSummaryProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Answered Questions */}
      <div className="rounded-2xl border p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Answered Questions</h2>
          {!readOnly && (
            <Button size="sm" variant="outline" onClick={onEditQuestions}>
              Edit
            </Button>
          )}
        </div>
        {questions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No questions defined for this client.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            {questions.map((question) => (
              <div key={question.id} className="border rounded-lg p-3 bg-muted/30">
                <div className="font-medium mb-1">{question.label}</div>
                <div className="text-muted-foreground min-h-[20px]">
                  {answers[question.id]?.trim() ? (
                    answers[question.id]
                  ) : (
                    <span className="italic">—</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Liked Options */}
      <div className="rounded-2xl border p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Liked Options</h2>
          {!readOnly && (
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => onExport('csv')}>
                <Download className="h-4 w-4 mr-2" /> CSV
              </Button>
              <Button size="sm" variant="outline" onClick={() => onExport('json')}>
                <Download className="h-4 w-4 mr-2" /> JSON
              </Button>
            </div>
          )}
        </div>

        {likedItems.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nothing liked yet. Go to Lookbook and tap <em>Like</em> on items.
          </p>
        ) : (
          <div className="space-y-4">
            {likedItems.map((item) => {
              const handleItemClick = () => {
                onViewDetails(item);
              };

              const handleRemoveClick = (e: React.MouseEvent) => {
                e.stopPropagation();
                onToggleLike(item);
              };

              return (
                <div
                  key={item.id ?? `${item.title}-${item.brand}-${item.category}`}
                  className="flex items-start gap-4 border rounded-xl p-3 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={handleItemClick}
                >
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-20 h-20 object-contain rounded bg-background"
                  />
                  <div className="flex-1">
                    <p className="text-base font-semibold mb-0.5">
                      {item.title ? `${item.brand} - ${item.title}` : item.brand}
                    </p>
                    <p className="text-sm font-medium text-primary hover:underline mb-1">
                      <a 
                        href={item.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {item.brand}
                      </a>
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm text-muted-foreground">{item.finish}</span>
                      {!hidePrices && <span className="text-sm font-semibold">{item.price}</span>}
                      <Badge variant="secondary" className="capitalize">
                        {item.category}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {!readOnly && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleRemoveClick}
                        aria-label="Remove from likes"
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

