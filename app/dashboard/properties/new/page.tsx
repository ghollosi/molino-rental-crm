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
import { NewOwnerModal } from '@/components/modals/new-owner-modal'
import { UserPlus } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'

const propertySchema = z.object({
  street: z.string().min(1, 'Kötelező megadni a címet'),
  city: z.string().min(1, 'Kötelező megadni a várost'),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  type: z.enum(['APARTMENT', 'HOUSE', 'OFFICE', 'COMMERCIAL']),
  size: z.union([z.string(), z.number()]).optional().transform(val => {
    if (val === undefined || val === null || val === '') return undefined
    if (typeof val === 'number') return val
    const parsed = parseFloat(val)
    return isNaN(parsed) ? undefined : parsed
  }),
  rooms: z.union([z.string(), z.number()]).optional().transform(val => {
    if (val === undefined || val === null || val === '') return undefined
    if (typeof val === 'number') return val
    const parsed = parseInt(val)
    return isNaN(parsed) ? undefined : parsed
  }),
  floor: z.union([z.string(), z.number()]).optional().transform(val => {
    if (val === undefined || val === null || val === '') return undefined
    if (typeof val === 'number') return val
    const parsed = parseInt(val)
    return isNaN(parsed) ? undefined : parsed
  }),
  rentAmount: z.union([z.string(), z.number()]).optional().transform(val => {
    if (val === undefined || val === null || val === '') return undefined
    if (typeof val === 'number') return val
    const parsed = parseFloat(val)
    return isNaN(parsed) ? undefined : parsed
  }),
  currency: z.string().default('HUF'),
  ownerId: z.string().min(1, 'Kötelező megadni a tulajdonost'),
  photos: z.array(z.string()).optional(),
  // Új mezők
  shortTermRental: z.boolean().default(false),
  longTermRental: z.boolean().default(true),
  licenseRequired: z.boolean().default(false),
})

type PropertyFormData = z.input<typeof propertySchema>
type PropertyParsedData = z.output<typeof propertySchema>

export default function NewPropertyPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [photos, setPhotos] = useState<string[]>([])
  const [showNewOwnerModal, setShowNewOwnerModal] = useState(false)

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
      type: 'APARTMENT',
      shortTermRental: false,
      longTermRental: true,
      licenseRequired: false,
    },
  })

  const { data: owners } = api.owner.list.useQuery({
    page: 1,
    limit: 100,
  })

  const createMutation = api.property.create.useMutation({
    onSuccess: (data) => {
      console.log('Property created successfully:', data)
      router.push('/dashboard/properties')
    },
    onError: (error) => {
      console.error('Property creation error:', error)
      setError(error.message || 'Hiba történt az ingatlan létrehozása során')
    },
  })

  const onSubmit = (data: PropertyFormData) => {
    setError('')
    console.log('=== PROPERTY FORM SUBMIT ===')
    console.log('Raw form data:', JSON.stringify(data, null, 2))
    console.log('Photos state:', photos)
    console.log('Type value:', data.type)
    console.log('Owner ID:', data.ownerId)
    
    // Check for missing required fields
    if (!data.street) {
      setError('Kötelező megadni az utcát')
      return
    }
    if (!data.city) {
      setError('Kötelező megadni a várost')
      return
    }
    if (!data.ownerId) {
      setError('Kötelező megadni a tulajdonost')
      return
    }
    if (!data.type) {
      setError('Kötelező megadni az ingatlan típusát')
      return
    }
    
    // Filter out blob URLs and replace with empty array for now
    const cleanPhotos = photos.filter(url => !url.startsWith('blob:'))
    
    // Ensure photos are included in the data
    const dataWithPhotos = {
      ...data,
      photos: cleanPhotos.length > 0 ? cleanPhotos : undefined
    }
    
    console.log('Data with photos:', JSON.stringify(dataWithPhotos, null, 2))
    
    try {
      // Validate the data
      const parsed: PropertyParsedData = propertySchema.parse(dataWithPhotos)
      console.log('Parsed successfully:', parsed)
      
      // Submit to server
      console.log('Calling createMutation with data:', parsed)
      createMutation.mutate(parsed)
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('=== VALIDATION ERROR ===')
        console.error('Error count:', error.errors.length)
        error.errors.forEach((err, index) => {
          console.error(`Error ${index + 1}:`, JSON.stringify({
            path: err.path,
            message: err.message,
            code: err.code,
            received: (err as any).received,
            expected: (err as any).expected
          }, null, 2))
        })
        
        const errorMessages = error.errors.map(e => {
          const field = e.path.join('.')
          return `${field}: ${e.message}`
        }).join(', ')
        
        setError(`Hibás mezők: ${errorMessages}`)
      } else {
        console.error('Unexpected error:', error)
        setError('Váratlan hiba történt')
      }
    }
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

      <form onSubmit={(e) => {
        console.log('Form submit event triggered')
        handleSubmit(onSubmit)(e)
      }} className="space-y-6">
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
                  defaultValue="APARTMENT"
                  value={watch('type')}
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
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setShowNewOwnerModal(true)}
                    title="Új tulajdonos létrehozása"
                  >
                    <UserPlus className="h-4 w-4" />
                  </Button>
                </div>
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
                autoComplete="address-line1"
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
                  autoComplete="address-level2"
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
                  autoComplete="postal-code"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Ország</Label>
                <Input
                  id="country"
                  placeholder="pl. Magyarország"
                  {...register('country')}
                  autoComplete="country-name"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bérlési típus</CardTitle>
            <CardDescription>
              Válassza ki, milyen típusú bérlésre alkalmas az ingatlan
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="shortTermRental"
                  checked={watch('shortTermRental')}
                  onCheckedChange={(checked) => setValue('shortTermRental', checked as boolean)}
                />
                <Label
                  htmlFor="shortTermRental"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Rövid távú bérlés
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="longTermRental"
                  checked={watch('longTermRental')}
                  onCheckedChange={(checked) => setValue('longTermRental', checked as boolean)}
                />
                <Label
                  htmlFor="longTermRental"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Hosszú távú bérlés
                </Label>
              </div>
              
              <div className="flex items-center space-x-2 mt-4">
                <Checkbox
                  id="licenseRequired"
                  checked={watch('licenseRequired')}
                  onCheckedChange={(checked) => setValue('licenseRequired', checked as boolean)}
                />
                <Label
                  htmlFor="licenseRequired"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Licensz szükséges (rövid távú bérléshez)
                </Label>
              </div>
              
              {watch('shortTermRental') && !watch('licenseRequired') && (
                <Alert className="mt-2">
                  <AlertDescription>
                    Figyelem! Rövid távú bérlés esetén ellenőrizze, hogy szükséges-e engedély az Ön területén.
                  </AlertDescription>
                </Alert>
              )}
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
                console.log('Photos changed:', newPhotos)
                setPhotos(newPhotos)
                setValue('photos', newPhotos, { shouldValidate: true })
              }}
              maxFiles={10}
              useCloudStorage={true}
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

      <NewOwnerModal
        open={showNewOwnerModal}
        onOpenChange={setShowNewOwnerModal}
        onOwnerCreated={(ownerId) => {
          setValue('ownerId', ownerId)
          // Refresh owner list
          api.useContext().owner.list.refetch()
        }}
      />
    </div>
  )
}