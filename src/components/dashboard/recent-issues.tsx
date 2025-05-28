'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CalendarDays, MapPin } from 'lucide-react'
import { UserRole } from '@prisma/client'
import Link from 'next/link'
import { api } from '@/lib/trpc/client'
import { ClientDate } from '@/lib/format-date'

interface RecentIssuesProps {
  userRole: UserRole
}

export function RecentIssues({ userRole }: RecentIssuesProps) {
  const { data: issues, isLoading } = api.issue.list.useQuery({
    page: 1,
    limit: 3,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  })

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Legutóbbi hibabejelentések</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'destructive'
      case 'HIGH':
        return 'destructive'
      case 'MEDIUM':
        return 'default'
      case 'LOW':
        return 'secondary'
      default:
        return 'default'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'destructive'
      case 'ASSIGNED':
        return 'default'
      case 'IN_PROGRESS':
        return 'default'
      case 'COMPLETED':
        return 'secondary'
      case 'CLOSED':
        return 'secondary'
      default:
        return 'default'
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="text-lg md:text-xl">Legutóbbi hibabejelentések</span>
          <Button variant="outline" size="sm" asChild>
            <Link href="/issues">
              <span className="hidden sm:inline">Összes megtekintése</span>
              <span className="sm:hidden">Összes</span>
            </Link>
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 md:space-y-4">
          {issues?.issues && issues.issues.length > 0 ? (
            issues.issues.map((issue) => (
              <div
                key={issue.id}
                className="flex items-start justify-between p-3 md:p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm md:text-base text-gray-900 mb-1 truncate">
                    {issue.title}
                  </h4>
                  <div className="flex items-center text-xs md:text-sm text-gray-500 mb-2">
                    <MapPin className="h-3 w-3 md:h-4 md:w-4 mr-1 flex-shrink-0" />
                    <span className="truncate">
                      {issue.property?.street}, {issue.property?.city}
                    </span>
                  </div>
                  <div className="flex items-center text-xs text-gray-400">
                    <CalendarDays className="h-3 w-3 mr-1 flex-shrink-0" />
                    <ClientDate date={issue.createdAt} />
                  </div>
                </div>
                <div className="flex flex-col md:flex-row items-end md:items-center space-y-1 md:space-y-0 md:space-x-2 ml-2">
                  <Badge variant={getPriorityColor(issue.priority)} className="text-xs">
                    {issue.priority}
                  </Badge>
                  <Badge variant={getStatusColor(issue.status)} className="text-xs">
                    {issue.status}
                  </Badge>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 py-6 md:py-8 text-sm md:text-base">
              Nincs hibabejelentés
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}