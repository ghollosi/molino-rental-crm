'use client'

import { useState, useEffect } from 'react'
import { Calendar, CalendarEvent } from '@/components/ui/calendar'

interface ExtendedCalendarEvent extends CalendarEvent {
  priority?: string
  status?: string
}
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CalendarDays, Home, AlertTriangle, Wrench } from 'lucide-react'
import { api } from '@/lib/trpc/client'
import { addDays, startOfMonth, endOfMonth, isSameDay } from 'date-fns'
import { format } from 'date-fns'
import { hu } from 'date-fns/locale'

interface PropertyCalendarProps {
  propertyId: string
}

export function PropertyCalendar({ propertyId }: PropertyCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>()
  const [events, setEvents] = useState<ExtendedCalendarEvent[]>([])

  // Lekérdezzük az ingatlanhoz kapcsolódó adatokat
  const { data: contracts } = api.contract.list.useQuery({
    page: 1,
    limit: 100,
  })

  const { data: issues } = api.issue.list.useQuery({
    page: 1,
    limit: 100,
    propertyId: propertyId,
  })

  const { data: property } = api.property.getById.useQuery(propertyId)

  useEffect(() => {
    generateCalendarEvents()
  }, [contracts, issues, propertyId])

  const generateCalendarEvents = () => {
    const calendarEvents: ExtendedCalendarEvent[] = []

    // Bérleti szerződések eseményei
    if (contracts?.contracts) {
      contracts.contracts
        .filter(contract => contract.propertyId === propertyId)
        .forEach(contract => {
          // Bérlés kezdete
          calendarEvents.push({
            id: `contract-start-${contract.id}`,
            title: `Bérlés kezdete`,
            date: new Date(contract.startDate),
            type: 'rental',
            propertyId: contract.propertyId,
            tenantId: contract.tenantId,
          })

          // Bérlés vége
          calendarEvents.push({
            id: `contract-end-${contract.id}`,
            title: `Bérlés vége`,
            date: new Date(contract.endDate),
            type: 'rental',
            propertyId: contract.propertyId,
            tenantId: contract.tenantId,
          })

          // Havi bérleti díj esedékesség
          const startDate = new Date(contract.startDate)
          const endDate = new Date(contract.endDate)
          const currentDate = new Date(startDate)
          currentDate.setDate(contract.paymentDay || 1)

          while (currentDate <= endDate && currentDate <= addDays(new Date(), 365)) {
            calendarEvents.push({
              id: `rent-due-${contract.id}-${currentDate.getTime()}`,
              title: `Bérleti díj esedékes`,
              date: new Date(currentDate),
              type: 'other',
              propertyId: contract.propertyId,
              tenantId: contract.tenantId,
            })
            currentDate.setMonth(currentDate.getMonth() + 1)
          }
        })
    }

    // Hibabejelentések eseményei
    if (issues?.issues) {
      issues.issues.forEach(issue => {
        calendarEvents.push({
          id: `issue-${issue.id}`,
          title: issue.title,
          date: new Date(issue.createdAt),
          type: 'issue',
          propertyId: issue.propertyId,
          priority: issue.priority,
          status: issue.status,
        })
      })
    }

    console.log('Generated events:', calendarEvents)
    setEvents(calendarEvents)
  }

  const getSelectedDateEvents = () => {
    if (!selectedDate) return []
    return events.filter(event => isSameDay(event.date, selectedDate))
  }

  const getEventIcon = (event: ExtendedCalendarEvent) => {
    switch (event.type) {
      case 'rental':
        return <Home className="w-4 h-4" />
      case 'issue':
        return <AlertTriangle className="w-4 h-4" />
      case 'other':
        return <Wrench className="w-4 h-4" />
      default:
        return <CalendarDays className="w-4 h-4" />
    }
  }

  const getEventColor = (event: ExtendedCalendarEvent) => {
    switch (event.type) {
      case 'rental':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'issue':
        const priority = event.priority
        switch (priority) {
          case 'URGENT':
            return 'bg-red-100 text-red-800 border-red-200'
          case 'HIGH':
            return 'bg-orange-100 text-orange-800 border-orange-200'
          case 'MEDIUM':
            return 'bg-yellow-100 text-yellow-800 border-yellow-200'
          case 'LOW':
            return 'bg-blue-100 text-blue-800 border-blue-200'
          default:
            return 'bg-gray-100 text-gray-800 border-gray-200'
        }
      case 'other':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
        return <Badge variant="destructive">Nyitott</Badge>
      case 'IN_PROGRESS':
        return <Badge variant="default">Folyamatban</Badge>
      case 'RESOLVED':
        return <Badge variant="secondary">Megoldva</Badge>
      case 'CLOSED':
        return <Badge variant="outline">Lezárva</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Naptár */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5" />
              Ingatlan naptár
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              selectedDate={selectedDate}
              onDateClick={(date) => {
                console.log('Date clicked:', date)
                setSelectedDate(date)
              }}
              events={events}
              className="w-full"
            />
          </CardContent>
        </Card>
      </div>

      {/* Esemény részletek */}
      <div>
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedDate 
                ? `Események - ${format(selectedDate, 'yyyy. MM. dd.', { locale: hu })}`
                : 'Válasszon dátumot'
              }
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedDate ? (
              <div className="space-y-3">
                {getSelectedDateEvents().length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Nincs esemény ezen a napon.
                  </p>
                ) : (
                  getSelectedDateEvents().map(event => (
                    <div
                      key={event.id}
                      className={`p-3 rounded-lg border ${getEventColor(event)}`}
                    >
                      <div className="flex items-start gap-2">
                        {getEventIcon(event)}
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{event.title}</h4>
                          {event.status && (
                            <div className="mt-1">
                              {getStatusBadge(event.status)}
                            </div>
                          )}
                          {event.priority && event.type === 'issue' && (
                            <p className="text-xs mt-1 opacity-75">
                              Prioritás: {event.priority}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Kattintson egy dátumra az események megtekintéséhez.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Gyors statisztikák */}
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-sm">Összesítés</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <Home className="w-4 h-4 text-green-600" />
                Bérlési események
              </span>
              <span className="font-medium">
                {events.filter(e => e.type === 'rental').length}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                Hibabejelentések
              </span>
              <span className="font-medium">
                {events.filter(e => e.type === 'issue').length}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-purple-600" />
                Egyéb események
              </span>
              <span className="font-medium">
                {events.filter(e => e.type === 'other').length}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}