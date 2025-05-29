'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect, use } from 'react'
import { api } from '@/lib/trpc/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Save, X, Plus } from 'lucide-react'
import Link from 'next/link'

const specialtyOptions = [
  'Vízszerelés',
  'Villanyszerelés',
  'Fűtés-klíma',
  'Festés-máználás',
  'Kőműves munkák',
  'Asztalos munkák',
  'Zárjavítás',
  'Takarítás',
  'Kertészet',
  'Általános karbantartás',
]

export default function EditProviderPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter()
  const { id } = use(params)

  const { data: provider, isLoading } = api.provider.getById.useQuery(id)
  const updateMutation = api.provider.update.useMutation({
    onSuccess: () => {
      alert('A szolgáltató adatai sikeresen frissítve!')
      router.push(`/dashboard/providers/${id}`)
    },
    onError: (error) => {
      alert(`Hiba történt: ${error.message}`)
    },
  })

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    businessName: '',
    specialty: [] as string[],
    hourlyRate: '',
    currency: 'HUF',
  })

  const [newSpecialty, setNewSpecialty] = useState('')

  // Frissítjük a form adatokat amikor betöltődik a szolgáltató
  useEffect(() => {
    if (provider) {
      setFormData({
        name: provider.user.name || '',
        email: provider.user.email || '',
        phone: provider.user.phone || '',
        businessName: provider.businessName || '',
        specialty: provider.specialty || [],
        hourlyRate: provider.hourlyRate?.toString() || '',
        currency: provider.currency || 'HUF',
      })
    }
  }, [provider])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    updateMutation.mutate({
      id,
      userId: provider!.userId,
      userData: {
        name: formData.name,
        email: formData.email,
        phone: formData.phone || undefined,
      },
      providerData: {
        businessName: formData.businessName || undefined,
        specialty: formData.specialty,
        hourlyRate: formData.hourlyRate ? parseFloat(formData.hourlyRate) : undefined,
        currency: formData.currency,
      },
    })
  }

  const addSpecialty = (specialty: string) => {
    if (specialty && !formData.specialty.includes(specialty)) {
      setFormData({
        ...formData,
        specialty: [...formData.specialty, specialty],
      })
    }
  }

  const removeSpecialty = (specialty: string) => {
    setFormData({
      ...formData,
      specialty: formData.specialty.filter(s => s !== specialty),
    })
  }

  const addCustomSpecialty = () => {
    if (newSpecialty.trim() && !formData.specialty.includes(newSpecialty.trim())) {
      addSpecialty(newSpecialty.trim())
      setNewSpecialty('')
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="text-center">Betöltés...</div>
      </div>
    )
  }

  if (!provider) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="text-center">Szolgáltató nem található</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/dashboard/providers/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Szolgáltató szerkesztése</h1>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Szolgáltató adatai</CardTitle>
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

            <div>
              <Label htmlFor="businessName">Cégnév</Label>
              <Input
                id="businessName"
                value={formData.businessName}
                onChange={(e) =>
                  setFormData({ ...formData, businessName: e.target.value })
                }
              />
            </div>

            <div>
              <Label>Szakterületek</Label>
              <div className="space-y-3">
                {/* Jelenlegi szakterületek */}
                <div className="flex flex-wrap gap-2">
                  {formData.specialty.map((spec) => (
                    <Badge key={spec} variant="secondary" className="flex items-center gap-1">
                      {spec}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => removeSpecialty(spec)}
                      />
                    </Badge>
                  ))}
                </div>

                {/* Előre definiált szakterületek */}
                <div>
                  <Label className="text-sm">Szakterület hozzáadása:</Label>
                  <Select onValueChange={addSpecialty}>
                    <SelectTrigger>
                      <SelectValue placeholder="Válassz szakterületet..." />
                    </SelectTrigger>
                    <SelectContent>
                      {specialtyOptions
                        .filter(spec => !formData.specialty.includes(spec))
                        .map((spec) => (
                          <SelectItem key={spec} value={spec}>
                            {spec}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Egyedi szakterület */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Egyedi szakterület..."
                    value={newSpecialty}
                    onChange={(e) => setNewSpecialty(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomSpecialty())}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={addCustomSpecialty}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="hourlyRate">Óradíj</Label>
                <Input
                  id="hourlyRate"
                  type="number"
                  step="0.01"
                  value={formData.hourlyRate}
                  onChange={(e) =>
                    setFormData({ ...formData, hourlyRate: e.target.value })
                  }
                />
              </div>

              <div>
                <Label htmlFor="currency">Pénznem</Label>
                <Select
                  value={formData.currency}
                  onValueChange={(value) => setFormData({ ...formData, currency: value })}
                >
                  <SelectTrigger id="currency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HUF">HUF</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={updateMutation.isPending}>
                <Save className="mr-2 h-4 w-4" />
                {updateMutation.isPending ? 'Mentés...' : 'Mentés'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/dashboard/providers/${id}`)}
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