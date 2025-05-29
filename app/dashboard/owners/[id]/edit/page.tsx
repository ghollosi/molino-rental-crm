'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect, use } from 'react'
import { api } from '@/lib/trpc/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
// import { useToast } from '@/hooks/use-toast'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'

export default function EditOwnerPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter()
  // const { toast } = useToast()
  const { id } = use(params)

  const { data: owner, isLoading } = api.owner.getById.useQuery(id)
  const updateMutation = api.owner.update.useMutation({
    onSuccess: () => {
      alert('A tulajdonos adatai sikeresen frissítve!')
      router.push(`/dashboard/owners/${id}`)
    },
    onError: (error) => {
      alert(`Hiba történt: ${error.message}`)
    },
  })

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    taxNumber: '',
    companyName: '',
    isCompany: false,
  })

  // Frissítjük a form adatokat amikor betöltődik a tulajdonos
  useEffect(() => {
    if (owner) {
      setFormData({
        name: owner.user.name || '',
        email: owner.user.email || '',
        phone: owner.user.phone || '',
        taxNumber: owner.taxNumber || '',
        companyName: (owner as any).companyName || '',
        isCompany: (owner as any).isCompany || false,
      })
    }
  }, [owner])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    updateMutation.mutate({
      id,
      userId: owner!.userId,
      userData: {
        name: formData.name,
        email: formData.email,
        phone: formData.phone || undefined,
      },
      ownerData: {
        taxNumber: formData.taxNumber || undefined,
        companyName: formData.isCompany ? formData.companyName : undefined,
        isCompany: formData.isCompany,
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

  if (!owner) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="text-center">Tulajdonos nem található</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/dashboard/owners/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Tulajdonos szerkesztése</h1>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Tulajdonos adatai</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center space-x-2 mb-4">
              <Checkbox
                id="isCompany"
                checked={formData.isCompany}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isCompany: checked as boolean })
                }
              />
              <Label htmlFor="isCompany">Cég</Label>
            </div>

            {formData.isCompany && (
              <div>
                <Label htmlFor="companyName">Cégnév</Label>
                <Input
                  id="companyName"
                  value={formData.companyName}
                  onChange={(e) =>
                    setFormData({ ...formData, companyName: e.target.value })
                  }
                  required={formData.isCompany}
                />
              </div>
            )}

            <div>
              <Label htmlFor="name">
                {formData.isCompany ? 'Kapcsolattartó neve' : 'Név'} *
              </Label>
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

            <div>
              <Label htmlFor="taxNumber">Adószám</Label>
              <Input
                id="taxNumber"
                value={formData.taxNumber}
                onChange={(e) =>
                  setFormData({ ...formData, taxNumber: e.target.value })
                }
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
                onClick={() => router.push(`/dashboard/owners/${id}`)}
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