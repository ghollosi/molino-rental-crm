'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/trpc/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Search, FileText, Calendar, DollarSign, User, Building } from 'lucide-react'

const statusColors = {
  ACTIVE: 'bg-green-500',
  EXPIRED: 'bg-gray-500',
  TERMINATED: 'bg-red-500',
  PENDING: 'bg-yellow-500'
}

const statusLabels = {
  ACTIVE: 'Aktív',
  EXPIRED: 'Lejárt',
  TERMINATED: 'Megszünt',
  PENDING: 'Függőben'
}

export default function ContractsPage() {
  const router = useRouter()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')

  const { data, isLoading, error } = api.contract.list.useQuery({
    page,
    limit: 10,
    search: search || undefined,
    status: status !== 'all' ? status as 'ACTIVE' | 'EXPIRED' | 'TERMINATED' | 'PENDING' : undefined,
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Szerződések</h1>
          <p className="text-gray-500">Bérleti szerződések kezelése</p>
        </div>
        <Button onClick={() => router.push('/dashboard/contracts/new')}>
          <Plus className="w-4 h-4 mr-2" />
          Új szerződés
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Szerződések listája</CardTitle>
          <CardDescription>
            Keresse és kezelje a bérleti szerződéseket
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="mb-6">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Keress cím, bérlő vagy azonosító alapján..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Állapot" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Minden állapot</SelectItem>
                  <SelectItem value="ACTIVE">Aktív</SelectItem>
                  <SelectItem value="EXPIRED">Lejárt</SelectItem>
                  <SelectItem value="TERMINATED">Megszünt</SelectItem>
                  <SelectItem value="PENDING">Függőben</SelectItem>
                </SelectContent>
              </Select>
              <Button type="submit">Keresés</Button>
            </div>
          </form>

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error.message}</AlertDescription>
            </Alert>
          )}

          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          ) : data?.contracts.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Nincsenek szerződések.</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => router.push('/dashboard/contracts/new')}
              >
                Új szerződés létrehozása
              </Button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Azonosító</TableHead>
                      <TableHead>Ingatlan</TableHead>
                      <TableHead>Bérlő</TableHead>
                      <TableHead>Időtartam</TableHead>
                      <TableHead>Havi bér</TableHead>
                      <TableHead>Állapot</TableHead>
                      <TableHead>Műveletek</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.contracts.map((contract) => {
                      const isExpired = new Date(contract.endDate) < new Date()
                      const contractStatus = isExpired ? 'EXPIRED' : (contract.status || 'ACTIVE')
                      
                      return (
                        <TableRow key={contract.id}>
                          <TableCell className="font-medium">#{contract.id.slice(-6)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Building className="w-4 h-4 text-gray-400" />
                              <span>{contract.property.street}, {contract.property.city}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-gray-400" />
                              <span>{contract.tenant.user.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              <span className="text-sm">
                                {new Date(contract.startDate).toLocaleDateString('hu-HU')} - 
                                {new Date(contract.endDate).toLocaleDateString('hu-HU')}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <DollarSign className="w-4 h-4 text-gray-400" />
                              <span className="font-medium">
                                {contract.rentAmount.toLocaleString('hu-HU')} Ft
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={statusColors[contractStatus as keyof typeof statusColors]}>
                              {statusLabels[contractStatus as keyof typeof statusLabels]}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push(`/dashboard/contracts/${contract.id}`)}
                            >
                              Részletek
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>

              {data && data.pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-gray-500">
                    {(page - 1) * 10 + 1}-{Math.min(page * 10, data.pagination.total)} / {data.pagination.total} szerződés
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                    >
                      Előző
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={page === data.pagination.totalPages}
                    >
                      Következő
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