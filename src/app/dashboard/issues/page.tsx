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
import { Plus, Search, AlertCircle, Clock, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'

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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
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

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Hibabejelentések</h1>
        <Button asChild>
          <Link href="/dashboard/issues/new">
            <Plus className="mr-2 h-4 w-4" />
            Új hibabejelentés
          </Link>
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Keresés és szűrés</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Keresés cím vagy leírás alapján..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Státusz" />
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
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Prioritás" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Minden prioritás</SelectItem>
                <SelectItem value="URGENT">Sürgős</SelectItem>
                <SelectItem value="HIGH">Magas</SelectItem>
                <SelectItem value="MEDIUM">Közepes</SelectItem>
                <SelectItem value="LOW">Alacsony</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit">Keresés</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center">Betöltés...</div>
          ) : data?.issues && data.issues.length > 0 ? (
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
                  {data.issues.map((issue) => (
                    <TableRow key={issue.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(issue.status)}
                          <Badge variant={getStatusColor(issue.status)}>
                            {issue.status}
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
                        <Badge variant={getPriorityColor(issue.priority)}>
                          {issue.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(issue.createdAt).toLocaleDateString('hu-HU')}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/dashboard/issues/${issue.id}`)}
                        >
                          Részletek
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {data.pagination.totalPages > 1 && (
                <div className="flex items-center justify-between p-4 border-t">
                  <div className="text-sm text-gray-500">
                    {data.pagination.total} hibabejelentésből {(page - 1) * 10 + 1}-
                    {Math.min(page * 10, data.pagination.total)} megjelenítve
                  </div>
                  <div className="flex items-center gap-2">
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
          ) : (
            <div className="p-8 text-center text-gray-500">
              Nincs találat
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}