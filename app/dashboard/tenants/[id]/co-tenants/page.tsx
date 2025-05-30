'use client'

import { useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/trpc/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { ArrowLeft, Plus, Trash2, Edit, UserPlus } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface CoTenantFormData {
  name: string
  email: string
  phone?: string
  idNumber?: string
}

export default function CoTenantsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { id } = use(params)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCoTenant, setEditingCoTenant] = useState<string | null>(null)
  const [formData, setFormData] = useState<CoTenantFormData>({
    name: '',
    email: '',
    phone: '',
    idNumber: '',
  })

  const { data: tenant, isLoading } = api.tenant.getById.useQuery(id)
  const { data: coTenants, refetch } = api.coTenant.listByTenant.useQuery(id)
  
  const createCoTenant = api.coTenant.create.useMutation({
    onSuccess: () => {
      toast.success('Társbérlő sikeresen hozzáadva')
      setIsDialogOpen(false)
      resetForm()
      refetch()
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const updateCoTenant = api.coTenant.update.useMutation({
    onSuccess: () => {
      toast.success('Társbérlő sikeresen frissítve')
      setIsDialogOpen(false)
      resetForm()
      refetch()
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const deleteCoTenant = api.coTenant.delete.useMutation({
    onSuccess: () => {
      toast.success('Társbérlő sikeresen törölve')
      refetch()
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      idNumber: '',
    })
    setEditingCoTenant(null)
  }

  const handleOpenDialog = (coTenant?: any) => {
    if (coTenant) {
      setEditingCoTenant(coTenant.id)
      setFormData({
        name: coTenant.name,
        email: coTenant.email,
        phone: coTenant.phone || '',
        idNumber: coTenant.idNumber || '',
      })
    } else {
      resetForm()
    }
    setIsDialogOpen(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (editingCoTenant) {
      updateCoTenant.mutate({
        id: editingCoTenant,
        ...formData,
      })
    } else {
      createCoTenant.mutate({
        tenantId: id,
        ...formData,
      })
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="text-center">Betöltés...</div>
      </div>
    )
  }

  if (!tenant) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="text-center">Bérlő nem található</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/dashboard/tenants/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Társbérlők kezelése</h1>
      </div>

      <div className="mb-6">
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Főbérlő</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">{tenant.user.name}</p>
            <p className="text-sm text-gray-500">{tenant.user.email}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Társbérlők</h2>
        <Button onClick={() => handleOpenDialog()}>
          <UserPlus className="mr-2 h-4 w-4" />
          Társbérlő hozzáadása
        </Button>
      </div>

      <div className="grid gap-4">
        {coTenants?.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-gray-500">
              Még nincsenek társbérlők hozzáadva
            </CardContent>
          </Card>
        ) : (
          coTenants?.map((coTenant) => (
            <Card key={coTenant.id}>
              <CardContent className="flex items-center justify-between py-4">
                <div>
                  <p className="font-medium">{coTenant.name}</p>
                  <p className="text-sm text-gray-500">{coTenant.email}</p>
                  {coTenant.phone && (
                    <p className="text-sm text-gray-500">Tel: {coTenant.phone}</p>
                  )}
                  {coTenant.idNumber && (
                    <p className="text-sm text-gray-500">Személyi ig.: {coTenant.idNumber}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleOpenDialog(coTenant)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      if (confirm('Biztosan törölni szeretné ezt a társbérlőt?')) {
                        deleteCoTenant.mutate(coTenant.id)
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCoTenant ? 'Társbérlő szerkesztése' : 'Új társbérlő hozzáadása'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Név *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="phone">Telefon</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="idNumber">Személyi igazolvány szám</Label>
                <Input
                  id="idNumber"
                  value={formData.idNumber}
                  onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Mégse
              </Button>
              <Button type="submit" disabled={createCoTenant.isPending || updateCoTenant.isPending}>
                {editingCoTenant ? 'Mentés' : 'Hozzáadás'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}