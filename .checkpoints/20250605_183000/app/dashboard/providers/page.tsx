'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/trpc/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, Phone, Mail, Wrench, Star, ChevronLeft, ChevronRight, Eye, Edit, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { ExportToolbar } from '@/components/export-toolbar'

export default function ProvidersPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading, refetch } = api.provider.list.useQuery({
    page,
    limit: 10,
    search: search || undefined,
  })

  const deleteProvider = api.provider.delete.useMutation({
    onSuccess: () => {
      refetch()
    },
    onError: (error) => {
      alert(`Hiba történt a törlés során: ${error.message}`)
    }
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
  }

  const handleDelete = async (id: string, businessName: string) => {
    if (confirm(`Biztosan törölni szeretné a következő szolgáltatót: ${businessName}?`)) {
      await deleteProvider.mutateAsync(id)
    }
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Szolgáltatók</h1>
        <div className="flex items-center gap-2">
          <ExportToolbar entityType="providers" title="Szolgáltatók" />
          <Button asChild>
            <Link href="/dashboard/providers/new">
              <Plus className="mr-2 h-4 w-4" />
              Új szolgáltató
            </Link>
          </Button>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Szolgáltatók keresése</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Keresés név, email vagy szolgáltatás alapján..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button type="submit">Keresés</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center">Betöltés...</div>
          ) : data?.providers && data.providers.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cégnév</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Szolgáltatások</TableHead>
                    <TableHead>Óradíj</TableHead>
                    <TableHead>Értékelés</TableHead>
                    <TableHead>Státusz</TableHead>
                    <TableHead className="text-right">Műveletek</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.providers.map((provider) => (
                    <TableRow key={provider.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          <Wrench className="mr-2 h-4 w-4 text-gray-400" />
                          {provider.businessName}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Mail className="mr-2 h-4 w-4 text-gray-400" />
                          {provider.email || provider.user.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {provider.specialty.map((service, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {service}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        {provider.hourlyRate ? (
                          <div className="font-medium">
                            {provider.hourlyRate} {provider.currency}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {provider.rating ? (
                          <div className="flex items-center">
                            <Star className="h-4 w-4 text-yellow-400 mr-1" />
                            <span>{provider.rating.toFixed(1)}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={provider.user.isActive ? 'default' : 'secondary'}>
                          {provider.user.isActive ? 'Aktív' : 'Inaktív'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/dashboard/providers/${provider.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/dashboard/providers/${provider.id}/edit`}>
                              <Edit className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDelete(provider.id, provider.businessName)}
                            disabled={deleteProvider.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {data.pagination.totalPages > 1 && (
                <div className="flex items-center justify-between p-4 border-t">
                  <div className="text-sm text-gray-500">
                    {data.pagination.total} szolgáltatóból {(page - 1) * 10 + 1}-
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