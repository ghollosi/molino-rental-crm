'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { api } from '@/lib/trpc/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
// import { useToast } from '@/hooks/use-toast'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'

export default function EditOwnerPage() {
  const params = useParams()
  const router = useRouter()
  // const { toast } = useToast()
  const id = params.id as string

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
    hasSeparateBilling: false,
    billingStreet: '',
    billingCity: '',
    billingPostalCode: '',
    billingCountry: '',
  })

  // Frissítjük a form adatokat amikor betöltődik a tulajdonos
  useEffect(() => {
    if (owner) {
      setFormData({
        name: owner.user.name || '',
        email: owner.user.email || '',
        phone: owner.user.phone || '',
        taxNumber: owner.taxNumber || '',
        companyName: owner.companyName || '',
        isCompany: owner.isCompany || false,
        hasSeparateBilling: !!(owner.billingStreet || owner.billingCity || owner.billingPostalCode || owner.billingCountry),
        billingStreet: owner.billingStreet || '',
        billingCity: owner.billingCity || '',
        billingPostalCode: owner.billingPostalCode || '',
        billingCountry: owner.billingCountry || '',
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
        billingStreet: formData.hasSeparateBilling ? formData.billingStreet : undefined,
        billingCity: formData.hasSeparateBilling ? formData.billingCity : undefined,
        billingPostalCode: formData.hasSeparateBilling ? formData.billingPostalCode : undefined,
        billingCountry: formData.hasSeparateBilling ? formData.billingCountry : undefined,
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

            {/* Számlázási adatok szakasz */}
            <div className="space-y-4 border-t pt-6">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasSeparateBilling"
                  checked={formData.hasSeparateBilling}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, hasSeparateBilling: checked as boolean })
                  }
                />
                <Label htmlFor="hasSeparateBilling" className="text-sm font-medium">
                  Számlázási adatok
                </Label>
              </div>
              <p className="text-sm text-gray-500">
                Ha be van jelölve, külön számlázási címet adhat meg. Ellenkező esetben a tulajdonos nevére lesznek kiállítva a számlák.
              </p>

              {formData.hasSeparateBilling && (
                <div className="space-y-4 ml-6 p-4 border rounded-lg bg-gray-50">
                  <h4 className="font-medium text-sm">Számlázási cím</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="billingStreet">Utca, házszám</Label>
                      <Input
                        id="billingStreet"
                        value={formData.billingStreet}
                        onChange={(e) =>
                          setFormData({ ...formData, billingStreet: e.target.value })
                        }
                        placeholder="Számlázási utca, házszám"
                      />
                    </div>

                    <div>
                      <Label htmlFor="billingCity">Város</Label>
                      <Input
                        id="billingCity"
                        value={formData.billingCity}
                        onChange={(e) =>
                          setFormData({ ...formData, billingCity: e.target.value })
                        }
                        placeholder="Számlázási város"
                      />
                    </div>

                    <div>
                      <Label htmlFor="billingPostalCode">Irányítószám</Label>
                      <Input
                        id="billingPostalCode"
                        value={formData.billingPostalCode}
                        onChange={(e) =>
                          setFormData({ ...formData, billingPostalCode: e.target.value })
                        }
                        placeholder="1234"
                      />
                    </div>

                    <div>
                      <Label htmlFor="billingCountry">Ország</Label>
                      <Input
                        id="billingCountry"
                        value={formData.billingCountry}
                        onChange={(e) =>
                          setFormData({ ...formData, billingCountry: e.target.value })
                        }
                        placeholder="Magyarország"
                      />
                    </div>
                  </div>
                </div>
              )}
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