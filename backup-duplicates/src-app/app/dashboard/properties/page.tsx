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

export default function PropertiesPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = api.property.list.useQuery({
    page,
    limit: 10,
    search: search || undefined,
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ingatlanok</h1>
          <p className="text-gray-600">
            Kezelje az összes ingatlant egy helyen
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/properties/new">
            <Plus className="mr-2 h-4 w-4" />
            Új ingatlan
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Search className="h-5 w-5 text-gray-400" />
            <Input
              placeholder="Keresés cím vagy város alapján..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
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
                    <TableHead className="hidden sm:table-cell">Típus</TableHead>
                    <TableHead className="hidden md:table-cell">Tulajdonos</TableHead>
                    <TableHead className="hidden lg:table-cell">Bérlő</TableHead>
                    <TableHead className="hidden sm:table-cell">Bérleti díj</TableHead>
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
                      <TableCell className="hidden sm:table-cell">{getTypeLabel(property.type)}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        {property.owner?.user?.name || '-'}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {property.currentTenant?.user?.name || '-'}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {property.rentAmount
                          ? `${Number(property.rentAmount).toLocaleString()} ${
                              property.currency
                            }`
                          : '-'}
                      </TableCell>
                      <TableCell>{getStatusBadge(property.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                            <Link href={`/dashboard/properties/${property.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                            <Link href={`/dashboard/properties/${property.id}/edit`}>
                              <Edit className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
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