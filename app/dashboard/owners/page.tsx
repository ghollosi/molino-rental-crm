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
import { Plus, Search, Phone, Mail, Building, ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'

export default function OwnersPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [ownerType, setOwnerType] = useState<string>('all')
  const [page, setPage] = useState(1)

  const { data, isLoading } = api.owner.list.useQuery({
    page,
    limit: 10,
    search: search || undefined,
    isCompany: ownerType === 'all' ? undefined : ownerType === 'company',
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Tulajdonosok</h1>
        <Button asChild>
          <Link href="/dashboard/owners/new">
            <Plus className="mr-2 h-4 w-4" />
            Új tulajdonos
          </Link>
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Tulajdonosok keresése</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex gap-4">
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
            </div>
            
            <div className="flex gap-4 items-center">
              <div className="flex-1">
                <Select 
                  value={ownerType} 
                  onValueChange={(value) => {
                    setOwnerType(value)
                    setPage(1)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tulajdonos típusa" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Összes</SelectItem>
                    <SelectItem value="individual">Magánszemély</SelectItem>
                    <SelectItem value="company">Cég</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {(search || ownerType !== 'all') && (
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearch('')
                    setOwnerType('all')
                    setPage(1)
                  }}
                >
                  Szűrők törlése
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center">Betöltés...</div>
          ) : data?.owners && data.owners.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Név</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Telefon</TableHead>
                    <TableHead>Ingatlanok</TableHead>
                    <TableHead>Típus</TableHead>
                    <TableHead className="text-right">Műveletek</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.owners.map((owner) => (
                    <TableRow key={owner.id}>
                      <TableCell className="font-medium">
                        {owner.user.name}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Mail className="mr-2 h-4 w-4 text-gray-400" />
                          {owner.user.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        {owner.user.phone ? (
                          <div className="flex items-center">
                            <Phone className="mr-2 h-4 w-4 text-gray-400" />
                            {owner.user.phone}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Building className="mr-2 h-4 w-4 text-gray-400" />
                          {owner._count?.properties || 0}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={owner.isCompany ? 'default' : 'secondary'}>
                          {owner.isCompany ? 'Cég' : 'Magánszemély'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/dashboard/owners/${owner.id}`)}
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
                    {data.pagination.total} tulajdonosból {(page - 1) * 10 + 1}-
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