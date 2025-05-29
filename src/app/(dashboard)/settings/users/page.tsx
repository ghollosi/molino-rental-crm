'use client'

import { useState } from 'react'
import { Plus, Search, MoreHorizontal, Mail, Trash2, UserPlus, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { trpc } from '@/lib/trpc'
import { CreateUserForm } from '@/components/forms/create-user-form'
import { CreateAdminForm } from '@/components/forms/create-admin-form'

export default function UsersPage() {
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('')
  const [page, setPage] = useState(1)
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false)
  const [isCreateAdminOpen, setIsCreateAdminOpen] = useState(false)
  const { toast } = useToast()

  const { data: usersData, isLoading, refetch } = trpc.user.list.useQuery({
    page,
    limit: 10,
    search: search || undefined,
    role: roleFilter || undefined,
  })

  const resetPasswordMutation = trpc.user.resetPassword.useMutation({
    onSuccess: () => {
      toast({
        title: 'Jelszó visszaállítva',
        description: 'Az új jelszót elküldtük email-ben.',
      })
    },
    onError: (error) => {
      toast({
        title: 'Hiba',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  const deleteUserMutation = trpc.user.delete.useMutation({
    onSuccess: () => {
      toast({
        title: 'Felhasználó törölve',
        description: 'A felhasználó sikeresen törölve.',
      })
      refetch()
    },
    onError: (error) => {
      toast({
        title: 'Hiba',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  const handleResetPassword = (userId: string) => {
    resetPasswordMutation.mutate({ userId })
  }

  const handleDeleteUser = (userId: string) => {
    if (confirm('Biztosan törölni szeretné ezt a felhasználót?')) {
      deleteUserMutation.mutate(userId)
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'EDITOR_ADMIN':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
      case 'OFFICE_ADMIN':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'OWNER':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'TENANT':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'PROVIDER':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const getRoleLabel = (role: string) => {
    const labels = {
      ADMIN: 'Rendszergazda',
      EDITOR_ADMIN: 'Szerkesztő Admin',
      OFFICE_ADMIN: 'Irodai Admin',
      OWNER: 'Tulajdonos',
      TENANT: 'Bérlő',
      PROVIDER: 'Szolgáltató',
    }
    return labels[role as keyof typeof labels] || role
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Felhasználók kezelése</h1>
          <p className="text-muted-foreground">
            Felhasználók létrehozása, szerkesztése és kezelése
          </p>
        </div>
        
        <div className="flex gap-2">
          <Dialog open={isCreateUserOpen} onOpenChange={setIsCreateUserOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Új felhasználó
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Új felhasználó létrehozása</DialogTitle>
                <DialogDescription>
                  Hozzon létre egy új felhasználót a rendszerben. A felhasználó email-ben kapja meg a belépési adatokat.
                </DialogDescription>
              </DialogHeader>
              <CreateUserForm 
                onSuccess={() => {
                  setIsCreateUserOpen(false)
                  refetch()
                }} 
              />
            </DialogContent>
          </Dialog>

          <Dialog open={isCreateAdminOpen} onOpenChange={setIsCreateAdminOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Shield className="h-4 w-4 mr-2" />
                Új admin
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Új rendszergazda létrehozása</DialogTitle>
                <DialogDescription>
                  Hozzon létre egy új rendszergazdát. Minden meglévő admin értesítést kap az új admin létrehozásáról.
                </DialogDescription>
              </DialogHeader>
              <CreateAdminForm 
                onSuccess={() => {
                  setIsCreateAdminOpen(false)
                  refetch()
                }} 
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Felhasználók</CardTitle>
          <CardDescription>
            {usersData?.pagination.total || 0} felhasználó a rendszerben
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Keresés név vagy email alapján..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Szerepkör szűrő" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Minden szerepkör</SelectItem>
                <SelectItem value="ADMIN">Rendszergazda</SelectItem>
                <SelectItem value="EDITOR_ADMIN">Szerkesztő Admin</SelectItem>
                <SelectItem value="OFFICE_ADMIN">Irodai Admin</SelectItem>
                <SelectItem value="OWNER">Tulajdonos</SelectItem>
                <SelectItem value="TENANT">Bérlő</SelectItem>
                <SelectItem value="PROVIDER">Szolgáltató</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="text-center py-8">Betöltés...</div>
          ) : (
            <div className="space-y-4">
              {usersData?.users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 dark:text-blue-300 font-medium">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-medium">{user.name}</h3>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      {user.phone && (
                        <p className="text-sm text-muted-foreground">{user.phone}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <Badge className={getRoleBadgeColor(user.role)}>
                      {getRoleLabel(user.role)}
                    </Badge>
                    
                    <Badge variant={user.isActive ? 'default' : 'secondary'}>
                      {user.isActive ? 'Aktív' : 'Inaktív'}
                    </Badge>

                    <div className="text-sm text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString('hu-HU')}
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleResetPassword(user.id)}>
                          <Mail className="h-4 w-4 mr-2" />
                          Jelszó visszaállítás
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Törlés
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}

              {usersData?.users.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Nincs felhasználó a keresési feltételeknek megfelelően.
                </div>
              )}
            </div>
          )}

          {usersData && usersData.pagination.totalPages > 1 && (
            <div className="flex justify-center mt-6">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Előző
                </Button>
                <span className="flex items-center px-3 text-sm">
                  {page} / {usersData.pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => p + 1)}
                  disabled={page === usersData.pagination.totalPages}
                >
                  Következő
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}