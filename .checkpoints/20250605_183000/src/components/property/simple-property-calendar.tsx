'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CalendarDays, Home, AlertTriangle, Wrench, ChevronLeft, ChevronRight } from 'lucide-react'
import { api } from '@/lib/trpc/client'
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay } from 'date-fns'
import { hu } from 'date-fns/locale'

interface SimpleCalendarEvent {
  id: string
  title: string
  date: Date
  type: 'rental' | 'issue' | 'other'
  priority?: string
  status?: string
  propertyId?: string
  tenantId?: string
}

interface SimplePropertyCalendarProps {
  propertyId: string
}

export function SimplePropertyCalendar({ propertyId }: SimplePropertyCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [events, setEvents] = useState<SimpleCalendarEvent[]>([])

  // API lekérdezések
  const { data: contracts } = api.contract.list.useQuery({
    page: 1,
    limit: 100,
  })

  const { data: issues } = api.issue.list.useQuery({
    page: 1,
    limit: 100,
    propertyId: propertyId,
  })

  useEffect(() => {
    generateCalendarEvents()
  }, [contracts, issues, propertyId])

  const generateCalendarEvents = () => {
    const calendarEvents: SimpleCalendarEvent[] = []

    // Bérleti szerződések
    if (contracts?.contracts) {
      contracts.contracts
        .filter(contract => contract.propertyId === propertyId)
        .forEach(contract => {
          calendarEvents.push({
            id: `contract-start-${contract.id}`,
            title: `Bérlés kezdete`,
            date: new Date(contract.startDate),
            type: 'rental',
            propertyId: contract.propertyId,
          })

          calendarEvents.push({
            id: `contract-end-${contract.id}`,
            title: `Bérlés vége`,
            date: new Date(contract.endDate),
            type: 'rental',
            propertyId: contract.propertyId,
          })
        })
    }

    // Hibabejelentések
    if (issues?.issues) {
      issues.issues.forEach(issue => {
        calendarEvents.push({
          id: `issue-${issue.id}`,
          title: issue.title,
          date: new Date(issue.createdAt),
          type: 'issue',
          priority: issue.priority,
          status: issue.status,
          propertyId: issue.propertyId,
        })
      })
    }

    console.log('Simple calendar events:', calendarEvents)
    setEvents(calendarEvents)
  }

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(monthStart)
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 })
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 })

  const getEventsForDate = (date: Date) => {
    return events.filter(event => isSameDay(event.date, date))
  }

  const getSelectedDateEvents = () => {
    if (!selectedDate) return []
    return events.filter(event => isSameDay(event.date, selectedDate))
  }

  const getEventColor = (event: SimpleCalendarEvent) => {
    switch (event.type) {
      case 'rental':
        return 'bg-green-500'
      case 'issue':
        switch (event.priority) {
          case 'URGENT': return 'bg-red-500'
          case 'HIGH': return 'bg-orange-500'
          case 'MEDIUM': return 'bg-yellow-500'
          case 'LOW': return 'bg-blue-500'
          default: return 'bg-gray-500'
        }
      case 'other':
        return 'bg-purple-500'
      default:
        return 'bg-gray-500'
    }
  }

  const renderCalendarDays = () => {
    const dateFormat = "d"
    const rows = []
    let days = []
    let day = startDate

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const cloneDay = new Date(day)
        const dayEvents = getEventsForDate(day)
        const isCurrentMonth = isSameMonth(day, monthStart)
        const isSelected = selectedDate && isSameDay(day, selectedDate)
        const isToday = isSameDay(day, new Date())

        days.push(
          <div
            key={day.toISOString()}
            className={`
              min-h-[80px] p-1 border border-gray-200 cursor-pointer
              ${!isCurrentMonth ? 'bg-gray-50 text-gray-400' : 'bg-white'}
              ${isSelected ? 'bg-blue-100 border-blue-300' : ''}
              ${isToday ? 'bg-yellow-50' : ''}
              hover:bg-gray-50
            `}
            onClick={() => {
              console.log('Simple calendar clicked:', cloneDay)
              setSelectedDate(cloneDay)
            }}
          >
            <div className="flex justify-between items-start">
              <span className={`text-sm font-medium ${isToday ? 'text-blue-600' : ''}`}>
                {format(day, dateFormat)}
              </span>
            </div>
            
            {dayEvents.length > 0 && (
              <div className="mt-1 space-y-1">
                {dayEvents.slice(0, 2).map(event => (
                  <div
                    key={event.id}
                    className={`text-xs px-1 py-0.5 rounded text-white truncate ${getEventColor(event)}`}
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
        )
        day = addDays(day, 1)
      }
      rows.push(
        <div key={day.toISOString()} className="grid grid-cols-7">
          {days}
        </div>
      )
      days = []
    }
    return rows
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
            {/* Naptár header */}
            <div className="flex items-center justify-between mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <h3 className="text-lg font-medium">
                {format(currentMonth, 'MMMM yyyy', { locale: hu })}
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            {/* Hét napjai */}
            <div className="grid grid-cols-7 mb-2">
              {['H', 'K', 'Sze', 'Cs', 'P', 'Szo', 'V'].map((day, index) => (
                <div key={`${day}-${index}`} className="p-2 text-center text-sm font-medium text-gray-600">
                  {day}
                </div>
              ))}
            </div>

            {/* Naptár napok */}
            <div className="space-y-0">
              {renderCalendarDays()}
            </div>
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
                      className="p-3 rounded-lg border bg-white"
                    >
                      <div className="flex items-start gap-2">
                        {event.type === 'rental' ? (
                          <Home className="w-4 h-4 text-green-600" />
                        ) : event.type === 'issue' ? (
                          <AlertTriangle className="w-4 h-4 text-red-600" />
                        ) : (
                          <Wrench className="w-4 h-4 text-purple-600" />
                        )}
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{event.title}</h4>
                          {event.status && (
                            <div className="mt-1">
                              {getStatusBadge(event.status)}
                            </div>
                          )}
                          {event.priority && event.type === 'issue' && (
                            <p className="text-xs mt-1 text-gray-500">
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

        {/* Statisztikák */}
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
          </CardContent>
        </Card>
      </div>
    </div>
  )
}