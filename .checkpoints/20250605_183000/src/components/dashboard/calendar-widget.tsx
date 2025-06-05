/**
 * @file calendar-widget.tsx
 * @description Dashboard calendar widget showing rental schedules and issues
 * @created 2025-06-02
 */

'use client';

import { useState, useEffect } from 'react';
import { Calendar, CalendarEvent } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Filter } from 'lucide-react';
import { api } from '@/lib/trpc/client';
import { addDays, startOfMonth, endOfMonth } from 'date-fns';

interface CalendarWidgetProps {
  userRole?: string;
}

export function CalendarWidget({ userRole }: CalendarWidgetProps) {
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  // Mock data for now - replace with real tRPC calls
  const { data: properties } = api.property.list.useQuery({
    page: 1,
    limit: 100,
  });

  const { data: contracts } = api.contract.list.useQuery({
    page: 1,
    limit: 100,
  });

  const { data: issues } = api.issue.list.useQuery({
    page: 1,
    limit: 100,
  });

  useEffect(() => {
    generateCalendarEvents();
  }, [contracts, issues, selectedPropertyId]);

  const generateCalendarEvents = () => {
    const calendarEvents: CalendarEvent[] = [];

    // Add rental contracts as events
    if (contracts?.contracts) {
      contracts.contracts.forEach(contract => {
        if (selectedPropertyId === 'all' || contract.propertyId === selectedPropertyId) {
          // Add contract start event
          calendarEvents.push({
            id: `contract-start-${contract.id}`,
            title: `Bérlés kezdete - ${contract.property.street}`,
            date: new Date(contract.startDate),
            type: 'rental',
            propertyId: contract.propertyId,
            tenantId: contract.tenantId,
          });

          // Add contract end event
          calendarEvents.push({
            id: `contract-end-${contract.id}`,
            title: `Bérlés vége - ${contract.property.street}`,
            date: new Date(contract.endDate),
            type: 'rental',
            propertyId: contract.propertyId,
            tenantId: contract.tenantId,
          });

          // Add monthly rent due dates
          const startDate = new Date(contract.startDate);
          const endDate = new Date(contract.endDate);
          const currentDate = new Date(startDate);
          currentDate.setDate(contract.paymentDay || 1);

          while (currentDate <= endDate && currentDate <= addDays(new Date(), 365)) {
            calendarEvents.push({
              id: `rent-due-${contract.id}-${currentDate.getTime()}`,
              title: `Bérleti díj esedékes - ${contract.property.street}`,
              date: new Date(currentDate),
              type: 'other',
              propertyId: contract.propertyId,
              tenantId: contract.tenantId,
            });
            currentDate.setMonth(currentDate.getMonth() + 1);
          }
        }
      });
    }

    // Add issues as events
    if (issues?.issues) {
      issues.issues.forEach(issue => {
        if (selectedPropertyId === 'all' || issue.propertyId === selectedPropertyId) {
          calendarEvents.push({
            id: `issue-${issue.id}`,
            title: `Hiba: ${issue.title}`,
            date: new Date(issue.createdAt),
            type: 'issue',
            propertyId: issue.propertyId,
          });

          // Add scheduled date if exists
          if (issue.scheduledDate) {
            calendarEvents.push({
              id: `issue-scheduled-${issue.id}`,
              title: `Ütemezett javítás: ${issue.title}`,
              date: new Date(issue.scheduledDate),
              type: 'inspection',
              propertyId: issue.propertyId,
            });
          }
        }
      });
    }

    setEvents(calendarEvents);
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
  };

  const handleEventClick = (event: CalendarEvent) => {
    // Navigate to relevant page based on event type
    if (event.type === 'rental' && event.propertyId) {
      window.open(`/dashboard/properties/${event.propertyId}`, '_blank');
    } else if (event.type === 'issue' && event.propertyId) {
      window.open(`/dashboard/issues/${event.id.replace('issue-', '')}`, '_blank');
    }
  };

  const getEventsForSelectedDate = () => {
    if (!selectedDate) return [];
    return events.filter(event => 
      event.date.toDateString() === selectedDate.toDateString()
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Calendar */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Bérlési naptár
            </CardTitle>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <Select
                value={selectedPropertyId}
                onValueChange={setSelectedPropertyId}
              >
                <SelectTrigger className="w-[250px]">
                  <SelectValue placeholder="Ingatlan kiválasztása" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Összes ingatlan</SelectItem>
                  {properties?.properties.map(property => (
                    <SelectItem key={property.id} value={property.id}>
                      {property.street}, {property.city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <Calendar
              events={events}
              onDateClick={handleDateClick}
              onEventClick={handleEventClick}
              selectedDate={selectedDate}
            />
          </CardContent>
        </Card>
      </div>

      {/* Event Details */}
      <div>
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedDate ? `Események - ${selectedDate.toLocaleDateString('hu-HU')}` : 'Esemény részletek'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedDate ? (
              <div className="space-y-3">
                {getEventsForSelectedDate().length === 0 ? (
                  <p className="text-gray-500 text-sm">Nincs esemény ezen a napon.</p>
                ) : (
                  getEventsForSelectedDate().map(event => (
                    <div
                      key={event.id}
                      className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                      onClick={() => handleEventClick(event)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{event.title}</h4>
                          <p className="text-xs text-gray-500 mt-1">
                            {event.date.toLocaleTimeString('hu-HU', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </p>
                        </div>
                        <Badge 
                          variant={event.type === 'issue' ? 'destructive' : 'default'}
                          className="text-xs"
                        >
                          {event.type === 'rental' && 'Bérlés'}
                          {event.type === 'issue' && 'Hiba'}
                          {event.type === 'inspection' && 'Ellenőrzés'}
                          {event.type === 'other' && 'Egyéb'}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <CalendarDays className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-sm">Kattints egy napra az események megtekintéséhez</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Event Legend */}
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-sm">Jelmagyarázat</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
              <span className="text-sm">Bérlési események</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span className="text-sm">Hibabejelentések</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span className="text-sm">Ellenőrzések</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-500 rounded"></div>
              <span className="text-sm">Egyéb események</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}