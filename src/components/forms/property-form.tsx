'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { api } from '@/lib/trpc'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, Loader2, Plus, Save, UserPlus } from 'lucide-react'
import { ImageUpload } from '@/components/ui/image-upload'
import { NewOwnerModal } from '@/components/modals/new-owner-modal'
import { SmartLockManager } from '@/components/property/smart-lock-manager'

const propertySchema = z.object({
  street: z.string().min(1, 'Kötelező megadni a címet'),
  city: z.string().min(1, 'Kötelező megadni a várost'),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  type: z.enum(['APARTMENT', 'HOUSE', 'OFFICE', 'COMMERCIAL']),
  size: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  rooms: z.string().optional().transform(val => val ? parseInt(val) : undefined),
  capacity: z.string().optional().transform(val => val ? parseInt(val) : undefined),
  floor: z.string().optional().transform(val => val ? parseInt(val) : undefined),
  rentAmount: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  currency: z.string().default('HUF'),
  status: z.enum(['AVAILABLE', 'RENTED', 'MAINTENANCE']).optional(),
  ownerId: z.string().min(1, 'Kötelező megadni a tulajdonost'),
  photos: z.array(z.string()).optional().default([]),
})

type PropertyFormData = z.input<typeof propertySchema>

interface PropertyFormProps {
  mode: 'create' | 'edit'
  propertyId?: string
  onSuccess?: (propertyId: string) => void
  onCancel?: () => void
}

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

export function PropertyForm({ mode, propertyId, onSuccess, onCancel }: PropertyFormProps) {
  const router = useRouter()
  const [error, setError] = useState('')
  const [photos, setPhotos] = useState<string[]>([])
  const [showNewOwnerModal, setShowNewOwnerModal] = useState(false)

  // Csak szerkesztési módban töltjük be a meglévő adatokat
  const { data: property, isLoading } = api.property.getById.useQuery(propertyId!, {
    enabled: mode === 'edit' && !!propertyId,
  })

  const { data: owners } = api.owner.list.useQuery({
    page: 1,
    limit: 100,
  })

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<PropertyFormData>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      currency: 'HUF',
      country: 'Magyarország',
      photos: [],
      type: 'APARTMENT',
      status: 'AVAILABLE',
    },
  })

  // Adatok betöltése szerkesztési módban
  useEffect(() => {
    if (mode === 'edit' && property) {
      const formData = {
        street: property.street || '',
        city: property.city || '',
        postalCode: property.postalCode || '',
        country: property.country || 'Magyarország',
        type: property.type,
        size: property.size?.toString() || '',
        rooms: property.rooms?.toString() || '',
        capacity: property.capacity?.toString() || '',
        floor: property.floor?.toString() || '',
        rentAmount: property.rentAmount?.toString() || '',
        currency: property.currency || 'HUF',
        status: property.status,
        ownerId: property.ownerId,
        photos: property.photos || [],
      }
      
      reset(formData)
      setPhotos(property.photos || [])
    }
  }, [property, mode, reset])

  const createMutation = api.property.create.useMutation({
    onSuccess: (data) => {
      if (onSuccess) {
        onSuccess(data.id)
      } else {
        router.push('/dashboard/properties')
      }
    },
    onError: (error) => {
      setError(error.message || 'Hiba történt az ingatlan létrehozása során')
    },
  })

  const updateMutation = api.property.update.useMutation({
    onSuccess: () => {
      if (onSuccess && propertyId) {
        onSuccess(propertyId)
      } else {
        router.push(`/dashboard/properties/${propertyId}`)
      }
    },
    onError: (error) => {
      setError(error.message || 'Hiba történt az ingatlan frissítése során')
    },
  })

  const onSubmit = (data: PropertyFormData) => {
    setError('')
    const parsed = propertySchema.parse({ ...data, photos })

    if (mode === 'create') {
      createMutation.mutate(parsed as any)
    } else if (mode === 'edit' && propertyId) {
      updateMutation.mutate({
        id: propertyId,
        ...parsed,
      } as any)
    }
  }

  // Betöltés állapot
  if (mode === 'edit' && isLoading) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="text-center">Betöltés...</div>
      </div>
    )
  }

  // Hibaállapot szerkesztéskor
  if (mode === 'edit' && !isLoading && !property) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="text-center">Ingatlan nem található</div>
      </div>
    )
  }

  const handleCancel = () => {
    if (onCancel) {
      onCancel()
    } else if (mode === 'edit' && propertyId) {
      router.push(`/dashboard/properties/${propertyId}`)
    } else {
      router.push('/dashboard/properties')
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={handleCancel}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Vissza
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {mode === 'create' ? 'Új ingatlan' : 'Ingatlan szerkesztése'}
            </h1>
            <p className="text-gray-600">
              {mode === 'create' 
                ? 'Adja meg az új ingatlan adatait' 
                : 'Módosítsa az ingatlan adatait'
              }
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Alapadatok</CardTitle>
            <CardDescription>
              Az ingatlan alapvető információi
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Típus*</Label>
                <Select
                  onValueChange={(value) => setValue('type', value as any)}
                  value={watch('type')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Válasszon típust" />
                  </SelectTrigger>
                  <SelectContent>
                    {propertyTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.type && (
                  <p className="text-sm text-red-500">{errors.type.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="ownerId">Tulajdonos*</Label>
                <div className="flex space-x-2">
                  <Select
                    onValueChange={(value) => setValue('ownerId', value)}
                    value={watch('ownerId')}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Válasszon tulajdonost" />
                    </SelectTrigger>
                    <SelectContent>
                      {owners?.owners.map((owner) => (
                        <SelectItem key={owner.id} value={owner.id}>
                          {owner.user.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {mode === 'create' && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setShowNewOwnerModal(true)}
                      title="Új tulajdonos létrehozása"
                    >
                      <UserPlus className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {errors.ownerId && (
                  <p className="text-sm text-red-500">{errors.ownerId.message}</p>
                )}
              </div>
            </div>

            {mode === 'edit' && (
              <div className="space-y-2">
                <Label htmlFor="status">Állapot</Label>
                <Select
                  onValueChange={(value) => setValue('status', value as any)}
                  value={watch('status')}
                >
                  <SelectTrigger>
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
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cím</CardTitle>
            <CardDescription>
              Az ingatlan pontos címe
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="street">Utca, házszám*</Label>
              <Input
                id="street"
                placeholder="pl. Kossuth Lajos utca 15"
                {...register('street')}
              />
              {errors.street && (
                <p className="text-sm text-red-500">{errors.street.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">Város*</Label>
                <Input
                  id="city"
                  placeholder="pl. Budapest"
                  {...register('city')}
                />
                {errors.city && (
                  <p className="text-sm text-red-500">{errors.city.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="postalCode">Irányítószám</Label>
                <Input
                  id="postalCode"
                  placeholder="pl. 1051"
                  {...register('postalCode')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Ország</Label>
                <Input
                  id="country"
                  placeholder="pl. Magyarország"
                  {...register('country')}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Részletek</CardTitle>
            <CardDescription>
              További információk az ingatlanról
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="size">Méret (m²)</Label>
                <Input
                  id="size"
                  type="number"
                  step="0.1"
                  placeholder="pl. 65"
                  {...register('size')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rooms">Szobák száma</Label>
                <Input
                  id="rooms"
                  type="number"
                  placeholder="pl. 3"
                  {...register('rooms')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="capacity">Férőhelyek száma</Label>
                <Input
                  id="capacity"
                  type="number"
                  placeholder="pl. 6"
                  {...register('capacity')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="floor">Emelet</Label>
                <Input
                  id="floor"
                  type="number"
                  placeholder="pl. 2"
                  {...register('floor')}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rentAmount">Bérleti díj</Label>
                <Input
                  id="rentAmount"
                  type="number"
                  placeholder="pl. 150000"
                  {...register('rentAmount')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Pénznem</Label>
                <Select
                  onValueChange={(value) => setValue('currency', value)}
                  value={watch('currency')}
                >
                  <SelectTrigger>
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
            <CardTitle>Képek</CardTitle>
            <CardDescription>
              Töltsön fel képeket az ingatlanról
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ImageUpload
              value={photos}
              onChange={(newPhotos) => {
                setPhotos(newPhotos)
                setValue('photos', newPhotos)
              }}
              maxFiles={10}
            />
          </CardContent>
        </Card>

        <SmartLockManager
          propertyId={mode === 'edit' ? propertyId : undefined}
          readonly={false}
          onChange={(locks) => {
            console.log('Smart locks updated:', locks)
            // Smart locks will be associated after property creation
          }}
        />

        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
          >
            Mégse
          </Button>
          <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
            {(createMutation.isPending || updateMutation.isPending) && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {mode === 'create' ? (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Létrehozás
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Mentés
              </>
            )}
          </Button>
        </div>
      </form>

      {mode === 'create' && (
        <NewOwnerModal
          open={showNewOwnerModal}
          onOpenChange={setShowNewOwnerModal}
          onOwnerCreated={(ownerId) => {
            setValue('ownerId', ownerId)
            // Refresh owner list
            api.useContext().owner.list.refetch()
          }}
        />
      )}
    </div>
  )
}