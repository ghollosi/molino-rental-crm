'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/trpc/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, AlertCircle, Clock, CheckCircle, ChevronLeft, ChevronRight, Eye, Edit, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { ExportToolbar } from '@/components/export-toolbar'

export default function IssuesPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<string>('all')
  const [priority, setPriority] = useState<string>('all')
  const [page, setPage] = useState(1)

  const { data, isLoading } = api.issue.list.useQuery({
    page,
    limit: 10,
    search: search || undefined,
    status: status !== 'all' ? status as 'OPEN' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CLOSED' : undefined,
    priority: priority !== 'all' ? priority as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' : undefined,
  })

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'OPEN':
        return <AlertCircle className="h-4 w-4" />
      case 'IN_PROGRESS':
      case 'ASSIGNED':
        return <Clock className="h-4 w-4" />
      case 'COMPLETED':
      case 'CLOSED':
        return <CheckCircle className="h-4 w-4" />
      default:
        return null
    }
  }

  const getPriorityLabel = (priority: string) => {
    const labels: Record<string, string> = {
      URGENT: 'Sürgős',
      HIGH: 'Magas',
      MEDIUM: 'Közepes',
      LOW: 'Alacsony',
    }
    return labels[priority] || priority
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      OPEN: 'Nyitott',
      ASSIGNED: 'Hozzárendelt',
      IN_PROGRESS: 'Folyamatban',
      COMPLETED: 'Befejezett',
      CLOSED: 'Lezárt',
    }
    return labels[status] || status
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Hibabejelentések</h1>
          <p className="text-gray-600">
            Kezelje a hibabejelentéseket és karbantartási kéréseket
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ExportToolbar entityType="issues" title="Hibabejelentések" />
          <Button asChild>
            <Link href="/dashboard/issues/new">
              <Plus className="mr-2 h-4 w-4" />
              Új hibabejelentés
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex items-center space-x-2 flex-1">
              <Search className="h-5 w-5 text-gray-400" />
              <Input
                placeholder="Keresés cím vagy leírás alapján..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                className="max-w-sm"
              />
            </div>
            <div className="flex gap-2">
              <Select value={status} onValueChange={(value) => {
                setStatus(value)
                setPage(1)
              }}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Minden státusz" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Minden státusz</SelectItem>
                  <SelectItem value="OPEN">Nyitott</SelectItem>
                  <SelectItem value="ASSIGNED">Hozzárendelt</SelectItem>
                  <SelectItem value="IN_PROGRESS">Folyamatban</SelectItem>
                  <SelectItem value="COMPLETED">Befejezett</SelectItem>
                  <SelectItem value="CLOSED">Lezárt</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priority} onValueChange={(value) => {
                setPriority(value)
                setPage(1)
              }}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Minden prioritás" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Minden prioritás</SelectItem>
                  <SelectItem value="URGENT">Sürgős</SelectItem>
                  <SelectItem value="HIGH">Magas</SelectItem>
                  <SelectItem value="MEDIUM">Közepes</SelectItem>
                  <SelectItem value="LOW">Alacsony</SelectItem>
                </SelectContent>
              </Select>
              {(search || status !== 'all' || priority !== 'all') && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearch('')
                    setStatus('all')
                    setPriority('all')
                    setPage(1)
                  }}
                >
                  Szűrők törlése
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">Betöltés...</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Státusz</TableHead>
                    <TableHead>Cím</TableHead>
                    <TableHead>Ingatlan</TableHead>
                    <TableHead>Bejelentő</TableHead>
                    <TableHead>Prioritás</TableHead>
                    <TableHead>Létrehozva</TableHead>
                    <TableHead className="text-right">Műveletek</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.issues.map((issue) => (
                    <TableRow key={issue.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(issue.status)}
                          <Badge variant={getStatusColor(issue.status) as any}>
                            {getStatusLabel(issue.status)}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {issue.title}
                      </TableCell>
                      <TableCell>
                        {issue.property ? (
                          <Link 
                            href={`/dashboard/properties/${issue.property.id}`}
                            className="text-blue-600 hover:underline"
                          >
                            {issue.property.street}, {issue.property.city}
                          </Link>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {issue.reportedBy.name}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getPriorityColor(issue.priority) as any}>
                          {getPriorityLabel(issue.priority)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(issue.createdAt).toLocaleDateString('hu-HU')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/dashboard/issues/${issue.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/dashboard/issues/${issue.id}/edit`}>
                              <Edit className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {data?.pagination && data.pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-gray-500">
                    Összesen: {data.pagination.total} hibabejelentés
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Előző
                    </Button>
                    <div className="text-sm">
                      {page} / {data.pagination.totalPages}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={page === data.pagination.totalPages}
                    >
                      Következő
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}