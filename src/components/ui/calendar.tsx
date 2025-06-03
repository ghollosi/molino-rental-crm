/**
 * @file calendar.tsx
 * @description Simple calendar component using date-fns
 * @created 2025-06-02
 */

'use client';

import { useState } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { hu } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  type: 'rental' | 'issue' | 'inspection' | 'other';
  propertyId?: string;
  tenantId?: string;
}

interface CalendarProps {
  events?: CalendarEvent[];
  onDateClick?: (date: Date) => void;
  onEventClick?: (event: CalendarEvent) => void;
  selectedDate?: Date;
  className?: string;
}

export function Calendar({ 
  events = [], 
  onDateClick, 
  onEventClick, 
  selectedDate,
  className = "" 
}: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const onNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const onPrevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const getEventsForDate = (date: Date) => {
    return events.filter(event => isSameDay(event.date, date));
  };

  const getEventTypeColor = (type: CalendarEvent['type']) => {
    switch (type) {
      case 'rental':
        return 'bg-blue-500';
      case 'issue':
        return 'bg-red-500';
      case 'inspection':
        return 'bg-green-500';
      case 'other':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  const renderCells = () => {
    const dateFormat = "d";
    const rows = [];
    let days = [];
    let day = startDate;
    let formattedDate = "";

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, dateFormat);
        const cloneDay = day;
        const dayEvents = getEventsForDate(day);
        const isCurrentMonth = isSameMonth(day, monthStart);
        const isSelected = selectedDate && isSameDay(day, selectedDate);
        const isToday = isSameDay(day, new Date());

        days.push(
          <div
            className={`
              min-h-[80px] p-1 border border-gray-200 cursor-pointer
              ${!isCurrentMonth ? 'bg-gray-50 text-gray-400' : 'bg-white'}
              ${isSelected ? 'bg-blue-100' : ''}
              ${isToday ? 'bg-yellow-50' : ''}
              hover:bg-gray-50
            `}
            key={day.toISOString()}
            onClick={() => {
              console.log('Calendar day clicked:', cloneDay)
              onDateClick?.(cloneDay)
            }}
          >
            <div className="flex justify-between items-start">
              <span className={`text-sm font-medium ${isToday ? 'text-blue-600' : ''}`}>
                {formattedDate}
              </span>
            </div>
            
            {dayEvents.length > 0 && (
              <div className="mt-1 space-y-1">
                {dayEvents.slice(0, 2).map(event => (
                  <div
                    key={event.id}
                    className={`
                      text-xs px-1 py-0.5 rounded text-white truncate cursor-pointer
                      ${getEventTypeColor(event.type)}
                    `}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventClick?.(event);
                    }}
                    title={event.title}
                  >
                    {event.title}
                  </div>
                ))}
                {dayEvents.length > 2 && (
                  <div className="text-xs text-gray-500">
                    +{dayEvents.length - 2} more
                  </div>
                )}
              </div>
            )}
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div className="grid grid-cols-7" key={day.toISOString()}>
          {days}
        </div>
      );
      days = [];
    }
    return <div>{rows}</div>;
  };

  const renderHeader = () => {
    const dateFormat = "MMMM yyyy";
    
    return (
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={onPrevMonth}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <h2 className="text-lg font-semibold">
          {format(currentMonth, dateFormat, { locale: hu })}
        </h2>
        
        <Button
          variant="outline"
          size="sm"
          onClick={onNextMonth}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    );
  };

  const renderDaysOfWeek = () => {
    const dateFormat = "EEE";
    const days = [];
    let startDate = startOfWeek(currentMonth, { weekStartsOn: 1 });

    for (let i = 0; i < 7; i++) {
      days.push(
        <div className="p-2 text-center text-sm font-medium text-gray-700" key={i}>
          {format(addDays(startDate, i), dateFormat, { locale: hu })}
        </div>
      );
    }

    return <div className="grid grid-cols-7 border-b border-gray-200">{days}</div>;
  };

  return (
    <Card className={className}>
      <CardHeader>
        {renderHeader()}
      </CardHeader>
      <CardContent>
        {renderDaysOfWeek()}
        {renderCells()}
      </CardContent>
    </Card>
  );
}

// Event type badge component
export function EventTypeBadge({ type }: { type: CalendarEvent['type'] }) {
  const getEventTypeLabel = (type: CalendarEvent['type']) => {
    switch (type) {
      case 'rental':
        return 'Bérlés';
      case 'issue':
        return 'Hiba';
      case 'inspection':
        return 'Ellenőrzés';
      case 'other':
        return 'Egyéb';
      default:
        return 'Ismeretlen';
    }
  };

  return (
    <span className={`
      inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white
      ${getEventTypeColor(type)}
    `}>
      {getEventTypeLabel(type)}
    </span>
  );
}

function getEventTypeColor(type: CalendarEvent['type']) {
  switch (type) {
    case 'rental':
      return 'bg-blue-500';
    case 'issue':
      return 'bg-red-500';
    case 'inspection':
      return 'bg-green-500';
    case 'other':
      return 'bg-gray-500';
    default:
      return 'bg-gray-500';
  }
}

export type { CalendarEvent };