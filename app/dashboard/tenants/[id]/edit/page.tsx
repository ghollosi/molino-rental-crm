'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect, use } from 'react'
import { api } from '@/lib/trpc/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'
import { ImageUpload } from '@/components/image-upload'

export default function EditTenantPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter()
  const { id } = use(params)

  const { data: tenant, isLoading } = api.tenant.getById.useQuery(id)
  const updateMutation = api.tenant.update.useMutation({
    onSuccess: () => {
      alert('A bérlő adatai sikeresen frissítve!')
      router.push(`/dashboard/tenants/${id}`)
    },
    onError: (error) => {
      alert(`Hiba történt: ${error.message}`)
    },
  })

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    emergencyName: '',
    emergencyPhone: '',
    isActive: true,
  })
  const [documents, setDocuments] = useState<string[]>([])

  // Frissítjük a form adatokat amikor betöltődik a bérlő
  useEffect(() => {
    if (tenant) {
      setFormData({
        name: tenant.user.name || '',
        email: tenant.user.email || '',
        phone: tenant.user.phone || '',
        emergencyName: tenant.emergencyName || '',
        emergencyPhone: tenant.emergencyPhone || '',
        isActive: tenant.isActive,
      })
      setDocuments(tenant.documents || [])
    }
  }, [tenant])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    updateMutation.mutate({
      id,
      userId: tenant!.userId,
      userData: {
        name: formData.name,
        email: formData.email,
        phone: formData.phone || undefined,
      },
      tenantData: {
        emergencyName: formData.emergencyName || undefined,
        emergencyPhone: formData.emergencyPhone || undefined,
        isActive: formData.isActive,
        documents: documents,
      },
    })
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
        <h1 className="text-3xl font-bold">Bérlő szerkesztése</h1>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Bérlő adatai</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Név *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>

            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
              />
            </div>

            <div>
              <Label htmlFor="phone">Telefon</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
              />
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">Vészhelyzeti kapcsolat</h3>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="emergencyName">Vészhelyzeti kapcsolat neve</Label>
                  <Input
                    id="emergencyName"
                    value={formData.emergencyName}
                    onChange={(e) =>
                      setFormData({ ...formData, emergencyName: e.target.value })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="emergencyPhone">Vészhelyzeti telefonszám</Label>
                  <Input
                    id="emergencyPhone"
                    type="tel"
                    value={formData.emergencyPhone}
                    onChange={(e) =>
                      setFormData({ ...formData, emergencyPhone: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-4">
              <Checkbox
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isActive: checked as boolean })
                }
              />
              <Label htmlFor="isActive">Aktív bérlő</Label>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">Okmányok</h3>
              <p className="text-sm text-gray-500 mb-4">
                Személyi igazolvány, lakcímkártya vagy egyéb releváns dokumentumok.
              </p>
              <ImageUpload
                value={documents}
                onChange={setDocuments}
                maxFiles={5}
              />
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={updateMutation.isPending}>
                <Save className="mr-2 h-4 w-4" />
                {updateMutation.isPending ? 'Mentés...' : 'Mentés'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/dashboard/tenants/${id}`)}
              >
                Mégse
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}