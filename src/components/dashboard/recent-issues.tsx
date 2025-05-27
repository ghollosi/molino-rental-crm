'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CalendarDays, MapPin } from 'lucide-react'
import { UserRole } from '@prisma/client'
import Link from 'next/link'

interface RecentIssuesProps {
  userRole: UserRole
}

export function RecentIssues({ userRole }: RecentIssuesProps) {
  // TODO: Replace with real data from tRPC
  const issues = [
    {
      id: '1',
      title: 'Csőtörés a konyhában',
      priority: 'HIGH' as const,
      status: 'OPEN' as const,
      property: 'Nagy utca 15, Budapest',
      createdAt: '2025-05-25',
    },
    {
      id: '2',
      title: 'Elektromos hiba a nappaliban',
      priority: 'MEDIUM' as const,
      status: 'ASSIGNED' as const,
      property: 'Kis utca 8, Budapest',
      createdAt: '2025-05-24',
    },
    {
      id: '3',
      title: 'Fűtés nem működik',
      priority: 'URGENT' as const,
      status: 'IN_PROGRESS' as const,
      property: 'Szabadság tér 3, Budapest',
      createdAt: '2025-05-23',
    },
  ]

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
          {issues.map((issue) => (
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
                  {issue.property}
                </div>
                <div className="flex items-center text-xs text-gray-400">
                  <CalendarDays className="h-3 w-3 mr-1" />
                  {issue.createdAt}
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
          ))}
        </div>
      </CardContent>
    </Card>
  )
}