import React from "react";
import { EventItem } from "@/types";

export function MonthGrid({ 
  date, 
  events, 
  canSeeAll, 
  meId, 
  meRole, 
  typeColors, 
  designerColors,
  onEventClick,
  onDayClick
}: { 
  date: Date; 
  events: EventItem[]; 
  canSeeAll: boolean; 
  meId: string; 
  meRole: string; 
  typeColors: Record<string, string>; 
  designerColors: Record<string, string>;
  onEventClick?: (event: EventItem) => void;
  onDayClick?: (date: string) => void;
}) {
  const today = new Date();
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDay.getDay());
  
  const days = [];
  const currentDate = new Date(startDate);
  
  while (currentDate <= lastDay || days.length < 42) {
    days.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
    if (days.length >= 42) break;
  }

  const formatDate = (d: Date) => d.toISOString().split('T')[0];
  
  return (
    <div className="space-y-2">
      <div className="text-lg font-semibold">
        {date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
          <div key={day} className="p-2 text-xs font-medium text-muted-foreground text-center">
            {day.slice(0, 3)}
          </div>
        ))}
        {days.map((day) => {
          const dayEvents = events.filter(e => e.date === formatDate(day));
          const visibleEvents = canSeeAll ? dayEvents : dayEvents.filter(e => e.assignedTo.includes(meId));
          const isToday = formatDate(day) === formatDate(today);
          const isCurrentMonth = day.getMonth() === date.getMonth();
          
          return (
            <div 
              key={day.toISOString()} 
              className={`min-h-[80px] p-1 border rounded text-xs transition-colors ${
                onDayClick ? 'cursor-pointer hover:bg-muted/50' : 'cursor-default'
              } ${
                isToday ? 'bg-primary/10 border-primary/30' : 'border-border'
              } ${isCurrentMonth ? '' : 'text-muted-foreground/50 bg-muted/50'}`}
              onClick={(e) => {
                // Only trigger day click if not clicking on an event and onDayClick is provided
                if (onDayClick && !(e.target as HTMLElement).closest('.event-item')) {
                  onDayClick(formatDate(day));
                }
              }}
            >
              <div className={`font-medium ${isToday ? 'text-primary' : ''}`}>
                {day.getDate()}
              </div>
              <div className="space-y-1 mt-1">
                {visibleEvents.slice(0, 3).map(event => {
                  const eventColor = typeColors[event.appointmentTypeId] || '#666';
                  return (
                    <div 
                      key={event.id} 
                      className="event-item text-xs p-1 rounded truncate cursor-pointer hover:opacity-80 transition-opacity"
                      style={{ 
                        backgroundColor: eventColor + '20',
                        borderLeft: `3px solid ${eventColor}`
                      }}
                      title={`${event.time} - ${event.title || event.clientName || 'Event'}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick?.(event);
                      }}
                    >
                      {event.time} {event.title || event.clientName}
                    </div>
                  );
                })}
                {visibleEvents.length > 3 && (
                  <div className="text-xs text-muted-foreground">+{visibleEvents.length - 3} more</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}