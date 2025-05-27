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
          <span>Legutóbbi hibabejelentések</span>
          <Button variant="outline" size="sm" asChild>
            <Link href="/issues">
              Összes megtekintése
            </Link>
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {issues?.items && issues.items.length > 0 ? (
            issues.items.map((issue) => (
              <div
                key={issue.id}
                className="flex items-start justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 mb-1">
                    {issue.title}
                  </h4>
                  <div className="flex items-center text-sm text-gray-500 mb-2">
                    <MapPin className="h-4 w-4 mr-1" />
                    {issue.property?.street}, {issue.property?.city}
                  </div>
                  <div className="flex items-center text-xs text-gray-400">
                    <CalendarDays className="h-3 w-3 mr-1" />
                    <ClientDate date={issue.createdAt} />
                  </div>
                </div>
                <div className="flex flex-col items-end space-y-2">
                  <Badge variant={getPriorityColor(issue.priority)}>
                    {issue.priority}
                  </Badge>
                  <Badge variant={getStatusColor(issue.status)}>
                    {issue.status}
                  </Badge>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 py-8">
              Nincs hibabejelentés
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}