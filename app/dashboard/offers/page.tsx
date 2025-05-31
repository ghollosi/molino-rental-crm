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
import { Plus, Search, FileText, Send, CheckCircle, XCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { ClientDate } from '@/lib/format-date'
import { ExportToolbar } from '@/components/export-toolbar'

export default function OffersPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<string>('all')
  const [page, setPage] = useState(1)

  const { data, isLoading } = api.offer.list.useQuery({
    page,
    limit: 10,
    search: search || undefined,
    status: status !== 'all' ? status as 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' : undefined,
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'secondary'
      case 'SENT':
        return 'default'
      case 'ACCEPTED':
        return 'secondary'
      case 'REJECTED':
        return 'destructive'
      default:
        return 'default'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return <FileText className="h-4 w-4" />
      case 'SENT':
        return <Send className="h-4 w-4" />
      case 'ACCEPTED':
        return <CheckCircle className="h-4 w-4" />
      case 'REJECTED':
        return <XCircle className="h-4 w-4" />
      default:
        return null
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('hu-HU', {
      style: 'currency',
      currency: 'HUF',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Ajánlatok</h1>
        <div className="flex items-center gap-2">
          <ExportToolbar entityType="offers" title="Ajánlatok" />
          <Button asChild>
            <Link href="/dashboard/offers/new">
              <Plus className="mr-2 h-4 w-4" />
              Új ajánlat
            </Link>
          </Button>
        </div>
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
                <SelectItem value="DRAFT">Piszkozat</SelectItem>
                <SelectItem value="SENT">Elküldve</SelectItem>
                <SelectItem value="ACCEPTED">Elfogadva</SelectItem>
                <SelectItem value="REJECTED">Elutasítva</SelectItem>
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
          ) : data?.offers && data.offers.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Státusz</TableHead>
                    <TableHead>Ingatlan</TableHead>
                    <TableHead>Hibabejelentés</TableHead>
                    <TableHead>Készítette</TableHead>
                    <TableHead>Összeg</TableHead>
                    <TableHead>Érvényesség</TableHead>
                    <TableHead>Létrehozva</TableHead>
                    <TableHead className="text-right">Műveletek</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.offers.map((offer) => (
                    <TableRow key={offer.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(offer.status)}
                          <Badge variant={getStatusColor(offer.status)}>
                            {offer.status}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {offer.property.street}, {offer.property.city}
                      </TableCell>
                      <TableCell>
                        {offer.issue ? (
                          <Link 
                            href={`/dashboard/issues/${offer.issue.id}`}
                            className="text-blue-600 hover:underline"
                          >
                            {offer.issue.title}
                          </Link>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {offer.createdBy.name}
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(Number(offer.totalAmount))}
                      </TableCell>
                      <TableCell>
                        <ClientDate date={offer.validUntil} />
                      </TableCell>
                      <TableCell>
                        <ClientDate date={offer.createdAt} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/dashboard/offers/${offer.id}`)}
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
                    {data.pagination.total} ajánlatból {(page - 1) * 10 + 1}-
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