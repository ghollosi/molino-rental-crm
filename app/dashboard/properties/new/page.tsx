'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, Loader2, Plus } from 'lucide-react'
import { api } from '@/lib/trpc'
import { ImageUpload } from '@/components/ui/image-upload'

const propertySchema = z.object({
  street: z.string().min(1, 'Kötelező megadni a címet'),
  city: z.string().min(1, 'Kötelező megadni a várost'),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  type: z.enum(['APARTMENT', 'HOUSE', 'OFFICE', 'COMMERCIAL']),
  size: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  rooms: z.string().optional().transform(val => val ? parseInt(val) : undefined),
  floor: z.string().optional().transform(val => val ? parseInt(val) : undefined),
  rentAmount: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  currency: z.string().default('HUF'),
  ownerId: z.string().min(1, 'Kötelező megadni a tulajdonost'),
  photos: z.array(z.string()).optional().default([]),
})

type PropertyFormData = z.input<typeof propertySchema>

export default function NewPropertyPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [photos, setPhotos] = useState<string[]>([])

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<PropertyFormData>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      currency: 'HUF',
      country: 'Magyarország',
      photos: [],
    },
  })

  const { data: owners } = api.owner.list.useQuery({
    page: 1,
    limit: 100,
  })

  const createMutation = api.property.create.useMutation({
    onSuccess: () => {
      router.push('/dashboard/properties')
    },
    onError: (error) => {
      setError(error.message || 'Hiba történt az ingatlan létrehozása során')
    },
  })

  const onSubmit = (data: PropertyFormData) => {
    setError('')
    const parsed = propertySchema.parse(data)
    createMutation.mutate(parsed as any)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/properties">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Vissza
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Új ingatlan</h1>
            <p className="text-gray-600">
              Adja meg az új ingatlan adatait
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
                  defaultValue={watch('type')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Válasszon típust" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="APARTMENT">Lakás</SelectItem>
                    <SelectItem value="HOUSE">Ház</SelectItem>
                    <SelectItem value="OFFICE">Iroda</SelectItem>
                    <SelectItem value="COMMERCIAL">Üzlet</SelectItem>
                  </SelectContent>
                </Select>
                {errors.type && (
                  <p className="text-sm text-red-500">{errors.type.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="ownerId">Tulajdonos*</Label>
                <Select
                  onValueChange={(value) => setValue('ownerId', value)}
                  defaultValue={watch('ownerId')}
                >
                  <SelectTrigger>
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
                {errors.ownerId && (
                  <p className="text-sm text-red-500">{errors.ownerId.message}</p>
                )}
              </div>
            </div>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  defaultValue={watch('currency')}
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

        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/dashboard/properties')}
          >
            Mégse
          </Button>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Létrehozás
          </Button>
        </div>
      </form>
    </div>
  )
}