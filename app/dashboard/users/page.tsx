'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/trpc/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal,
  Eye,
  Edit,
  UserPlus,
  UserMinus,
  Shield,
  Mail,
  Phone,
  Calendar,
  CheckCircle,
  XCircle,
  Trash2
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import Link from 'next/link'

const roleTranslations = {
  'ADMIN': 'Adminisztrátor',
  'EDITOR_ADMIN': 'Szerkesztő admin',
  'OFFICE_ADMIN': 'Irodai admin',
  'OWNER': 'Tulajdonos',
  'SERVICE_MANAGER': 'Szolgáltatás manager',
  'PROVIDER': 'Szolgáltató',
  'TENANT': 'Bérlő'
}

const roleBadgeColors: Record<string, string> = {
  'ADMIN': 'bg-red-100 text-red-800',
  'EDITOR_ADMIN': 'bg-orange-100 text-orange-800',
  'OFFICE_ADMIN': 'bg-yellow-100 text-yellow-800',
  'OWNER': 'bg-blue-100 text-blue-800',
  'SERVICE_MANAGER': 'bg-purple-100 text-purple-800',
  'PROVIDER': 'bg-green-100 text-green-800',
  'TENANT': 'bg-gray-100 text-gray-800'
}

export default function UsersPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [selectedRole, setSelectedRole] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const limit = 20

  const { data: usersData, isLoading, refetch } = api.user.list.useQuery({
    page,
    limit,
    search: search || undefined,
    role: selectedRole && selectedRole !== 'all' ? selectedRole as any : undefined,
  })

  const updateRole = api.user.updateRole.useMutation({
    onSuccess: () => {
      refetch()
    },
  })

  const toggleActive = api.user.toggleActive.useMutation({
    onSuccess: () => {
      refetch()
    },
  })

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await updateRole.mutateAsync({ userId, role: newRole as any })
    } catch (error) {
      console.error('Failed to update role:', error)
    }
  }

  const handleToggleActive = async (userId: string) => {
    try {
      await toggleActive.mutateAsync(userId)
    } catch (error) {
      console.error('Failed to toggle user status:', error)
    }
  }

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat('hu-HU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date))
  }

  return (
    <div className="container mx-auto py-6 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Felhasználó kezelés</h1>
          <p className="text-gray-600 mt-1">
            Felhasználók létrehozása, szerkesztése és jogosultságok kezelése
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Új felhasználó
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Új felhasználó létrehozása</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Alert>
                <AlertDescription>
                  Az új felhasználó létrehozás funkció fejlesztés alatt van.
                  Jelenleg csak a seed script segítségével lehet új felhasználókat létrehozni.
                </AlertDescription>
              </Alert>
              <Button 
                variant="outline" 
                onClick={() => setIsCreateDialogOpen(false)}
                className="w-full"
              >
                Bezárás
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search" className="sr-only">Keresés</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="search"
                  placeholder="Keresés név, email alapján..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <Label htmlFor="role-filter" className="sr-only">Szerepkör szűrő</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Minden szerepkör" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Minden szerepkör</SelectItem>
                  {Object.entries(roleTranslations).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" onClick={() => {
              setSearch('')
              setSelectedRole('all')
              setPage(1)
            }}>
              <Filter className="mr-2 h-4 w-4" />
              Szűrők törlése
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>Felhasználók</span>
            {usersData && (
              <Badge variant="secondary">
                {usersData.pagination.total} összesen
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="text-gray-500">Betöltés...</div>
            </div>
          ) : !usersData?.users.length ? (
            <div className="text-center py-8">
              <div className="text-gray-500 mb-2">Nincsenek felhasználók</div>
              <p className="text-sm text-gray-400">
                {search || selectedRole ? 'Próbáljon más keresési feltétellel.' : 'Hozzon létre az első felhasználót.'}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Név</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Szerepkör</TableHead>
                      <TableHead>Telefon</TableHead>
                      <TableHead>Státusz</TableHead>
                      <TableHead>Létrehozva</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usersData?.users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="font-medium">
                            {user.firstName} {user.lastName}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-gray-400" />
                            <span className="text-sm">{user.email}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={roleBadgeColors[user.role] || 'bg-gray-100 text-gray-800'}>
                            {roleTranslations[user.role as keyof typeof roleTranslations] || user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {user.phone ? (
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-gray-400" />
                              <span className="text-sm">{user.phone}</span>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {user.isActive ? (
                              <>
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                <span className="text-sm text-green-700">Aktív</span>
                              </>
                            ) : (
                              <>
                                <XCircle className="h-4 w-4 text-red-500" />
                                <span className="text-sm text-red-700">Inaktív</span>
                              </>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-600">
                              {formatDate(user.createdAt)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end space-x-2">
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/dashboard/users/${user.id}`}>
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/dashboard/users/${user.id}/edit`}>
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
              </div>

              {/* Pagination */}
              {usersData && usersData.pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span>
                      {((page - 1) * limit) + 1}-{Math.min(page * limit, usersData.pagination.total)} / {usersData.pagination.total}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                    >
                      Előző
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, usersData.pagination.totalPages) }, (_, i) => {
                        const pageNum = i + 1
                        return (
                          <Button
                            key={pageNum}
                            variant={page === pageNum ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setPage(pageNum)}
                          >
                            {pageNum}
                          </Button>
                        )
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={page === usersData.pagination.totalPages}
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