import React from 'react';
import { Button } from '@/components/ui/button';
import { CardTitle } from '@/components/ui/card';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarHeaderProps {
  onPreviousMonth: () => void;
  onToday: () => void;
  onNextMonth: () => void;
}

export function CalendarHeader({ onPreviousMonth, onToday, onNextMonth }: CalendarHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <CardTitle className="text-base flex items-center gap-2">
        <CalendarDays className="w-4 h-4" />
        Calendar
      </CardTitle>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onPreviousMonth}
          className="rounded-xl h-8 w-8 p-0"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={onToday} className="rounded-xl h-8 px-3">
          Today
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onNextMonth}
          className="rounded-xl h-8 w-8 p-0"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

