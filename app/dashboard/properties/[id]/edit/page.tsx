'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect, use } from 'react'
import { api } from '@/lib/trpc/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { ImageUpload } from '@/components/ui/image-upload'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'

const propertyTypes = [
  { value: 'APARTMENT', label: 'Lakás' },
  { value: 'HOUSE', label: 'Ház' },
  { value: 'OFFICE', label: 'Iroda' },
  { value: 'COMMERCIAL', label: 'Üzlethelyiség' },
]

const propertyStatuses = [
  { value: 'AVAILABLE', label: 'Elérhető' },
  { value: 'RENTED', label: 'Kiadva' },
  { value: 'MAINTENANCE', label: 'Karbantartás alatt' },
]

export default function EditPropertyPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter()
  const { id } = use(params)

  const { data: property, isLoading } = api.property.getById.useQuery(id)
  const updateMutation = api.property.update.useMutation({
    onSuccess: () => {
      alert('Az ingatlan adatai sikeresen frissítve!')
      router.push(`/dashboard/properties/${id}`)
    },
    onError: (error) => {
      alert(`Hiba történt: ${error.message}`)
    },
  })

  const [formData, setFormData] = useState({
    street: '',
    city: '',
    postalCode: '',
    country: 'Magyarország',
    type: 'APARTMENT' as const,
    size: '',
    rooms: '',
    floor: '',
    rentAmount: '',
    currency: 'HUF',
    status: 'AVAILABLE' as const,
    description: '',
    photos: [] as string[],
  })

  // Frissítjük a form adatokat amikor betöltődik az ingatlan
  useEffect(() => {
    if (property) {
      setFormData({
        street: property.street || '',
        city: property.city || '',
        postalCode: property.postalCode || '',
        country: property.country || 'Magyarország',
        type: property.type as any,
        size: property.size?.toString() || '',
        rooms: property.rooms?.toString() || '',
        floor: property.floor?.toString() || '',
        rentAmount: property.rentAmount?.toString() || '',
        currency: property.currency || 'HUF',
        status: property.status as any,
        description: (property as any).description || '',
        photos: property.photos || [],
      })
    }
  }, [property])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    updateMutation.mutate({
      id,
      street: formData.street,
      city: formData.city,
      postalCode: formData.postalCode || undefined,
      country: formData.country || undefined,
      type: formData.type,
      size: formData.size ? parseFloat(formData.size) : undefined,
      rooms: formData.rooms ? parseInt(formData.rooms) : undefined,
      floor: formData.floor ? parseInt(formData.floor) : undefined,
      rentAmount: formData.rentAmount ? parseFloat(formData.rentAmount) : undefined,
      currency: formData.currency,
      status: formData.status,
      description: formData.description || undefined,
      photos: formData.photos,
    })
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="text-center">Betöltés...</div>
      </div>
    )
  }

  if (!property) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="text-center">Ingatlan nem található</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/dashboard/properties/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Ingatlan szerkesztése</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Alapadatok</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="type">Típus *</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value as any })}
              >
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {propertyTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status">Státusz</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value as any })}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {propertyStatuses.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="size">Méret (m²)</Label>
                <Input
                  id="size"
                  type="number"
                  step="0.1"
                  value={formData.size}
                  onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="rooms">Szobák száma</Label>
                <Input
                  id="rooms"
                  type="number"
                  value={formData.rooms}
                  onChange={(e) => setFormData({ ...formData, rooms: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="floor">Emelet</Label>
                <Input
                  id="floor"
                  type="number"
                  value={formData.floor}
                  onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="rentAmount">Bérleti díj</Label>
                <Input
                  id="rentAmount"
                  type="number"
                  value={formData.rentAmount}
                  onChange={(e) => setFormData({ ...formData, rentAmount: e.target.value })}
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cím</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="street">Utca, házszám *</Label>
              <Input
                id="street"
                value={formData.street}
                onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="city">Város *</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="postalCode">Irányítószám</Label>
                <Input
                  id="postalCode"
                  value={formData.postalCode}
                  onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="country">Ország</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Leírás és képek</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="description">Leírás</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
              />
            </div>

            <div>
              <Label>Képek</Label>
              <ImageUpload
                value={formData.photos}
                onChange={(photos) => setFormData({ ...formData, photos })}
                maxFiles={10}
                useCloudStorage={true}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button type="submit" disabled={updateMutation.isPending}>
            <Save className="mr-2 h-4 w-4" />
            {updateMutation.isPending ? 'Mentés...' : 'Mentés'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/dashboard/properties/${id}`)}
          >
            Mégse
          </Button>
        </div>
      </form>
    </div>
  )
}