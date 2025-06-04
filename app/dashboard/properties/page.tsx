'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Plus, Search, Building, MapPin, Edit, Trash2, Eye } from 'lucide-react'
import { api } from '@/lib/trpc'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ExportToolbar } from '@/components/export-toolbar'

export default function PropertiesPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const { data, isLoading, refetch } = api.property.list.useQuery({
    page,
    limit: 10,
    search: search || undefined,
    type: typeFilter !== 'all' ? typeFilter as any : undefined,
    status: statusFilter !== 'all' ? statusFilter as any : undefined,
  })

  const deleteProperty = api.property.delete.useMutation({
    onSuccess: () => {
      refetch()
    },
    onError: (error) => {
      alert(`Hiba történt a törlés során: ${error.message}`)
    },
  })

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      AVAILABLE: 'secondary',
      RENTED: 'default',
      MAINTENANCE: 'destructive',
    }
    const labels: Record<string, string> = {
      AVAILABLE: 'Elérhető',
      RENTED: 'Bérelt',
      MAINTENANCE: 'Karbantartás',
    }
    return (
      <Badge variant={variants[status] || 'default'}>
        {labels[status] || status}
      </Badge>
    )
  }

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      APARTMENT: 'Lakás',
      HOUSE: 'Ház',
      OFFICE: 'Iroda',
      COMMERCIAL: 'Üzlet',
    }
    return labels[type] || type
  }

  const handleDelete = async (propertyId: string, propertyAddress: string) => {
    if (confirm(`Biztosan törölni szeretné ezt az ingatlant: ${propertyAddress}? Ez a művelet nem visszavonható.`)) {
      await deleteProperty.mutateAsync(propertyId)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ingatlanok</h1>
          <p className="text-gray-600">
            Kezelje az összes ingatlant egy helyen
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ExportToolbar entityType="properties" title="Ingatlanok" />
          <Button asChild>
            <Link href="/dashboard/properties/new">
              <Plus className="mr-2 h-4 w-4" />
              Új ingatlan
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
                placeholder="Keresés cím vagy város alapján..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                className="max-w-sm"
              />
            </div>
            <div className="flex gap-2">
              <Select value={typeFilter} onValueChange={(value) => {
                setTypeFilter(value)
                setPage(1)
              }}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Minden típus" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Minden típus</SelectItem>
                  <SelectItem value="APARTMENT">Lakás</SelectItem>
                  <SelectItem value="HOUSE">Ház</SelectItem>
                  <SelectItem value="OFFICE">Iroda</SelectItem>
                  <SelectItem value="COMMERCIAL">Üzlet</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={(value) => {
                setStatusFilter(value)
                setPage(1)
              }}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Minden státusz" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Minden státusz</SelectItem>
                  <SelectItem value="AVAILABLE">Elérhető</SelectItem>
                  <SelectItem value="RENTED">Bérelt</SelectItem>
                  <SelectItem value="MAINTENANCE">Karbantartás</SelectItem>
                </SelectContent>
              </Select>
              {(search || typeFilter !== 'all' || statusFilter !== 'all') && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearch('')
                    setTypeFilter('all')
                    setStatusFilter('all')
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
                    <TableHead>Cím</TableHead>
                    <TableHead>Típus</TableHead>
                    <TableHead>Tulajdonos</TableHead>
                    <TableHead>Bérlő</TableHead>
                    <TableHead>Bérleti díj</TableHead>
                    <TableHead>Státusz</TableHead>
                    <TableHead className="text-right">Műveletek</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.properties.map((property) => (
                    <TableRow key={property.id}>
                      <TableCell>
                        <div className="flex items-start space-x-2">
                          <Building className="h-4 w-4 text-gray-400 mt-0.5" />
                          <div>
                            <div className="font-medium">{property.street}</div>
                            <div className="text-sm text-gray-500">
                              {property.city}
                              {property.postalCode && `, ${property.postalCode}`}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getTypeLabel(property.type)}</TableCell>
                      <TableCell>
                        {property.owner?.user?.name || '-'}
                      </TableCell>
                      <TableCell>
                        {property.currentTenant?.user?.name || '-'}
                      </TableCell>
                      <TableCell>
                        {property.rentAmount
                          ? `${Number(property.rentAmount).toLocaleString()} ${
                              property.currency
                            }`
                          : '-'}
                      </TableCell>
                      <TableCell>{getStatusBadge(property.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/dashboard/properties/${property.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/dashboard/properties/${property.id}/edit`}>
                              <Edit className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDelete(property.id, `${property.street}, ${property.city}`)}
                            disabled={deleteProperty.isPending}
                          >
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
                    Összesen: {data.pagination.total} ingatlan
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                    >
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