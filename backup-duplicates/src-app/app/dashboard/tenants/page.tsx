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
import { Plus, Search, Phone, Mail, FileText, ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'

export default function TenantsPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = api.tenant.list.useQuery({
    page,
    limit: 10,
    search: search || undefined,
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Bérlők</h1>
        <Button asChild>
          <Link href="/dashboard/tenants/new">
            <Plus className="mr-2 h-4 w-4" />
            Új bérlő
          </Link>
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Bérlők keresése</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Keresés név, email vagy telefon alapján..."
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
          ) : data?.tenants && data.tenants.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Név</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Telefon</TableHead>
                      <TableHead>Aktív szerződések</TableHead>
                      <TableHead>Regisztráció</TableHead>
                      <TableHead className="text-right">Műveletek</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.tenants.map((tenant: any) => (
                      <TableRow key={tenant.id}>
                        <TableCell className="font-medium">
                          {tenant.user.name}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Mail className="mr-2 h-4 w-4 text-gray-400" />
                            {tenant.user.email}
                          </div>
                        </TableCell>
                        <TableCell>
                          {tenant.user.phone ? (
                            <div className="flex items-center">
                              <Phone className="mr-2 h-4 w-4 text-gray-400" />
                              {tenant.user.phone}
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <FileText className="mr-2 h-4 w-4 text-gray-400" />
                            {tenant._count?.contracts || 0}
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(tenant.user.createdAt).toLocaleDateString('hu-HU')}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/dashboard/tenants/${tenant.id}`)}
                          >
                            Részletek
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {(data?.pagination?.totalPages || 1) > 1 && (
                <div className="flex items-center justify-between p-4 border-t">
                  <div className="text-sm text-gray-500">
                    {data?.pagination?.total || 0} bérlőből {(page - 1) * 10 + 1}-
                    {Math.min(page * 10, data?.pagination?.total || 0)} megjelenítve
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
                      {page} / {data?.pagination?.totalPages || 1}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={page === (data?.pagination?.totalPages || 1)}
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