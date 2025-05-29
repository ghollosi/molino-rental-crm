'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Users, 
  Plus, 
  Search, 
  MoreHorizontal, 
  Mail, 
  Key, 
  Trash2,
  Edit3,
  Shield,
  CheckCircle,
  AlertCircle,
  User
} from 'lucide-react'
import { useToast } from '@/src/hooks/use-toast'
import { api } from '@/lib/trpc/client'

interface User {
  id: string
  name: string
  email: string
  role: string
  language: string
  phone?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const roleLabels = {
  ADMIN: 'Fő Admin',
  EDITOR_ADMIN: 'Szerkesztő Admin', 
  OFFICE_ADMIN: 'Irodai Admin',
  OWNER: 'Tulajdonos',
  TENANT: 'Bérlő',
  PROVIDER: 'Szolgáltató',
}

const roleBadgeVariants = {
  ADMIN: 'destructive',
  EDITOR_ADMIN: 'destructive', 
  OFFICE_ADMIN: 'secondary',
  OWNER: 'default',
  TENANT: 'outline',
  PROVIDER: 'secondary',
} as const

export function UserManagementSection() {
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRole, setSelectedRole] = useState<string>('ALL')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isCreateAdminDialogOpen, setIsCreateAdminDialogOpen] = useState(false)
  const [page, setPage] = useState(1)

  // Fetch users
  const { data: usersData, isLoading, refetch } = api.user.list.useQuery({
    page,
    limit: 10,
    search: searchTerm || undefined,
    role: selectedRole && selectedRole !== 'ALL' ? selectedRole : undefined,
  })

  // Create user mutation
  const createUserMutation = api.user.create.useMutation({
    onSuccess: () => {
      toast({
        title: "Siker",
        description: "Felhasználó sikeresen létrehozva és email elküldve!",
      })
      setIsCreateDialogOpen(false)
      refetch()
    },
    onError: (error) => {
      toast({
        title: "Hiba",
        description: error.message,
        variant: "destructive"
      })
    }
  })

  // Create admin mutation
  const createAdminMutation = api.user.createAdmin.useMutation({
    onSuccess: () => {
      toast({
        title: "Siker", 
        description: "Admin felhasználó sikeresen létrehozva!",
      })
      setIsCreateAdminDialogOpen(false)
      refetch()
    },
    onError: (error) => {
      toast({
        title: "Hiba",
        description: error.message,
        variant: "destructive"
      })
    }
  })

  // Reset password mutation
  const resetPasswordMutation = api.user.resetPassword.useMutation({
    onSuccess: () => {
      toast({
        title: "Siker",
        description: "Jelszó visszaállítva és email elküldve!",
      })
    },
    onError: (error) => {
      toast({
        title: "Hiba", 
        description: error.message,
        variant: "destructive"
      })
    }
  })

  // Delete user mutation
  const deleteUserMutation = api.user.delete.useMutation({
    onSuccess: () => {
      toast({
        title: "Siker",
        description: "Felhasználó sikeresen törölve!",
      })
      refetch()
    },
    onError: (error) => {
      toast({
        title: "Hiba",
        description: error.message, 
        variant: "destructive"
      })
    }
  })

  const handleCreateUser = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    
    createUserMutation.mutate({
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      role: formData.get('role') as any,
      phone: formData.get('phone') as string || undefined,
      language: 'HU',
    })
  }

  const handleCreateAdmin = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    
    createAdminMutation.mutate({
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      role: formData.get('role') as any,
      phone: formData.get('phone') as string || undefined,
      language: 'HU',
    })
  }

  return (
    <div className="space-y-6">
      {/* Header & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <div className="text-sm font-medium">Összes felhasználó</div>
                <div className="text-2xl font-bold">{usersData?.pagination.total || 0}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-red-600" />
              <div>
                <div className="text-sm font-medium">Admin felhasználók</div>
                <div className="text-2xl font-bold">
                  {usersData?.users.filter(u => ['ADMIN', 'EDITOR_ADMIN', 'OFFICE_ADMIN'].includes(u.role)).length || 0}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <div className="text-sm font-medium">Aktív felhasználók</div>
                <div className="text-2xl font-bold">
                  {usersData?.users.filter(u => u.isActive).length || 0}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
            <Input
              placeholder="Keresés név vagy email alapján..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-full sm:w-64"
            />
          </div>
          
          <Select value={selectedRole} onValueChange={setSelectedRole}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Szerepkör szűrő" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Minden szerepkör</SelectItem>
              <SelectItem value="ADMIN">Fő Admin</SelectItem>
              <SelectItem value="EDITOR_ADMIN">Szerkesztő Admin</SelectItem>
              <SelectItem value="OFFICE_ADMIN">Irodai Admin</SelectItem>
              <SelectItem value="OWNER">Tulajdonos</SelectItem>
              <SelectItem value="TENANT">Bérlő</SelectItem>
              <SelectItem value="PROVIDER">Szolgáltató</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Új felhasználó
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Új felhasználó létrehozása</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <Label htmlFor="name">Teljes név</Label>
                  <Input id="name" name="name" required />
                </div>
                <div>
                  <Label htmlFor="email">Email cím</Label>
                  <Input id="email" name="email" type="email" required />
                </div>
                <div>
                  <Label htmlFor="phone">Telefonszám</Label>
                  <Input id="phone" name="phone" />
                </div>
                <div>
                  <Label htmlFor="role">Szerepkör</Label>
                  <select 
                    name="role" 
                    required 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">Szerepkör kiválasztása</option>
                    <option value="OFFICE_ADMIN">Irodai Admin</option>
                    <option value="OWNER">Tulajdonos</option>
                    <option value="TENANT">Bérlő</option>
                    <option value="PROVIDER">Szolgáltató</option>
                  </select>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button type="submit" disabled={createUserMutation.isPending}>
                    {createUserMutation.isPending ? 'Létrehozás...' : 'Létrehozás'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Mégse
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={isCreateAdminDialogOpen} onOpenChange={setIsCreateAdminDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Shield className="h-4 w-4 mr-2" />
                Új admin
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Új admin felhasználó létrehozása</DialogTitle>
              </DialogHeader>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Új admin létrehozása után minden meglévő admin értesítést kap email-ben.
                </AlertDescription>
              </Alert>
              <form onSubmit={handleCreateAdmin} className="space-y-4">
                <div>
                  <Label htmlFor="admin-name">Teljes név</Label>
                  <Input id="admin-name" name="name" required />
                </div>
                <div>
                  <Label htmlFor="admin-email">Email cím</Label>
                  <Input id="admin-email" name="email" type="email" required />
                </div>
                <div>
                  <Label htmlFor="admin-phone">Telefonszám</Label>
                  <Input id="admin-phone" name="phone" />
                </div>
                <div>
                  <Label htmlFor="admin-role">Admin típus</Label>
                  <select 
                    name="role" 
                    defaultValue="EDITOR_ADMIN"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="ADMIN">Fő Admin</option>
                    <option value="EDITOR_ADMIN">Szerkesztő Admin</option>
                    <option value="OFFICE_ADMIN">Irodai Admin</option>
                  </select>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button type="submit" disabled={createAdminMutation.isPending}>
                    {createAdminMutation.isPending ? 'Létrehozás...' : 'Admin létrehozása'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setIsCreateAdminDialogOpen(false)}>
                    Mégse
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Users Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Felhasználó</TableHead>
              <TableHead>Szerepkör</TableHead>
              <TableHead>Státusz</TableHead>
              <TableHead>Létrehozva</TableHead>
              <TableHead className="w-12">Műveletek</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  Betöltés...
                </TableCell>
              </TableRow>
            ) : usersData?.users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <div className="text-gray-500">Nincs felhasználó</div>
                </TableCell>
              </TableRow>
            ) : (
              usersData?.users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{user.name}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                      {user.phone && (
                        <div className="text-xs text-gray-400">{user.phone}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={roleBadgeVariants[user.role as keyof typeof roleBadgeVariants] || 'default'}
                    >
                      {roleLabels[user.role as keyof typeof roleLabels] || user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.isActive ? 'default' : 'secondary'}>
                      {user.isActive ? 'Aktív' : 'Inaktív'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {new Date(user.createdAt).toLocaleDateString('hu-HU')}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => resetPasswordMutation.mutate({ userId: user.id })}
                        disabled={resetPasswordMutation.isPending}
                        title="Jelszó visszaállítása"
                      >
                        <Key className="h-3 w-3" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => {
                          if (confirm('Biztosan törölni szeretné ezt a felhasználót?')) {
                            deleteUserMutation.mutate(user.id)
                          }
                        }}
                        disabled={deleteUserMutation.isPending}
                        title="Felhasználó törlése"
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {usersData && usersData.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            {usersData.pagination.total} felhasználó, {usersData.pagination.page}. oldal / {usersData.pagination.totalPages}
          </div>
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
              disabled={page === usersData.pagination.totalPages}
            >
              Következő
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}