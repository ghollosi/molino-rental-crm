'use client'

import { useState } from 'react'
import { Card } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '~/components/ui/dialog'
import { Badge } from '~/components/ui/badge'
import { Loader2, Plus, Search, User, UserPlus, Shield, Edit, Power, Mail, Key } from 'lucide-react'
import { api } from '~/utils/api'
import { toast } from 'sonner'
import { useDebounce } from '~/hooks/use-debounce'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '~/components/ui/tabs'

const roleColors = {
  ADMIN: 'bg-red-500',
  EDITOR_ADMIN: 'bg-orange-500',
  OFFICE_ADMIN: 'bg-yellow-500',
  OWNER: 'bg-green-500',
  SERVICE_MANAGER: 'bg-blue-500',
  PROVIDER: 'bg-indigo-500',
  TENANT: 'bg-purple-500',
} as const

const roleLabels = {
  ADMIN: 'Administrator',
  EDITOR_ADMIN: 'Editor Admin',
  OFFICE_ADMIN: 'Office Admin',
  OWNER: 'Property Owner',
  SERVICE_MANAGER: 'Service Manager',
  PROVIDER: 'Service Provider',
  TENANT: 'Tenant',
} as const

export default function AdminUsersPage() {
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [createUserOpen, setCreateUserOpen] = useState(false)
  const [createAdminOpen, setCreateAdminOpen] = useState(false)
  
  const debouncedSearch = useDebounce(search, 300)

  const { data, isLoading } = api.user.list.useQuery({
    page,
    limit: 10,
    search: debouncedSearch,
    role: roleFilter === 'all' ? undefined : roleFilter as any,
  })

  const utils = api.useUtils()
  
  const toggleActiveMutation = api.user.toggleActive.useMutation({
    onSuccess: () => {
      toast.success('User status updated')
      utils.user.list.invalidate()
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const resetPasswordMutation = api.user.resetPassword.useMutation({
    onSuccess: () => {
      toast.success('Password reset successfully. The user will receive an email with their new password.')
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const handleToggleActive = async (userId: string) => {
    await toggleActiveMutation.mutateAsync(userId)
  }

  const handleResetPassword = async (userId: string) => {
    if (confirm('Are you sure you want to reset this user\'s password? They will receive an email with a new temporary password.')) {
      await resetPasswordMutation.mutateAsync({ userId })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">
            Manage all users in the system
          </p>
        </div>
        <div className="flex gap-2">
          <CreateUserDialog open={createUserOpen} onOpenChange={setCreateUserOpen} />
          <CreateAdminDialog open={createAdminOpen} onOpenChange={setCreateAdminOpen} />
        </div>
      </div>

      <Card className="p-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All roles</SelectItem>
              {Object.entries(roleLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge className={`${roleColors[user.role]} text-white`}>
                        {roleLabels[user.role]}
                      </Badge>
                    </TableCell>
                    <TableCell>{user.phone || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={user.isActive ? 'default' : 'secondary'}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleResetPassword(user.id)}
                          title="Reset Password"
                        >
                          <Key className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleActive(user.id)}
                          title={user.isActive ? 'Deactivate User' : 'Activate User'}
                        >
                          <Power className={`h-4 w-4 ${user.isActive ? 'text-destructive' : 'text-green-600'}`} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {data && data.pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {page} of {data.pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => p + 1)}
                  disabled={page === data.pagination.totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  )
}

function CreateUserDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'TENANT' as const,
    language: 'HU' as const,
  })

  const utils = api.useUtils()
  const createUserMutation = api.user.createUser.useMutation({
    onSuccess: () => {
      toast.success('User created successfully')
      utils.user.list.invalidate()
      onOpenChange(false)
      setFormData({
        name: '',
        email: '',
        phone: '',
        role: 'TENANT',
        language: 'HU',
      })
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await createUserMutation.mutateAsync(formData)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Create User
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>
              Create a new user account. They will receive an email with their login credentials.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone (optional)</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => setFormData(prev => ({ ...prev, role: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EDITOR_ADMIN">Editor Admin</SelectItem>
                  <SelectItem value="OFFICE_ADMIN">Office Admin</SelectItem>
                  <SelectItem value="OWNER">Property Owner</SelectItem>
                  <SelectItem value="SERVICE_MANAGER">Service Manager</SelectItem>
                  <SelectItem value="PROVIDER">Service Provider</SelectItem>
                  <SelectItem value="TENANT">Tenant</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="language">Language</Label>
              <Select
                value={formData.language}
                onValueChange={(value) => setFormData(prev => ({ ...prev, language: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HU">Magyar</SelectItem>
                  <SelectItem value="EN">English</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createUserMutation.isPending}>
              {createUserMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create User
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function CreateAdminDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    language: 'HU' as const,
  })

  const utils = api.useUtils()
  const createAdminMutation = api.user.createAdmin.useMutation({
    onSuccess: () => {
      toast.success('Admin created successfully')
      utils.user.list.invalidate()
      onOpenChange(false)
      setFormData({
        name: '',
        email: '',
        phone: '',
        language: 'HU',
      })
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await createAdminMutation.mutateAsync(formData)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="destructive">
          <Shield className="mr-2 h-4 w-4" />
          Create Admin
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Administrator</DialogTitle>
            <DialogDescription>
              Create a new administrator account with full system access. All admins will be notified.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="admin-name">Name</Label>
              <Input
                id="admin-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="admin-email">Email</Label>
              <Input
                id="admin-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="admin-phone">Phone (optional)</Label>
              <Input
                id="admin-phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="admin-language">Language</Label>
              <Select
                value={formData.language}
                onValueChange={(value) => setFormData(prev => ({ ...prev, language: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HU">Magyar</SelectItem>
                  <SelectItem value="EN">English</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="destructive" disabled={createAdminMutation.isPending}>
              {createAdminMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Admin
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}