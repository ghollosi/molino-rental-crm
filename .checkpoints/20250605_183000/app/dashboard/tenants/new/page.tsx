'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, useFieldArray } from 'react-hook-form'
import { api } from '@/lib/trpc/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ImageUpload } from '@/components/ui/image-upload'
import { ArrowLeft, AlertCircle, Plus, Trash2, Users, Upload } from 'lucide-react'
import Link from 'next/link'

interface TenantFormData {
  firstName: string
  lastName: string
  email: string
  password: string
  phone?: string
  address?: string
  emergencyName?: string
  emergencyPhone?: string
  documents?: string[]
  notes?: string
  // Bérlési adatok
  propertyId?: string
  startDate?: string
  endDate?: string
  coTenants: Array<{
    firstName: string
    lastName: string
    email: string
    phone?: string
    documents?: string[]
  }>
}

export default function NewTenantPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  const { register, handleSubmit, control, watch, setValue, formState: { errors, isSubmitting } } = useForm<TenantFormData>({
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      phone: '',
      address: '',
      emergencyName: '',
      emergencyPhone: '',
      documents: [],
      notes: '',
      propertyId: '',
      startDate: '',
      endDate: '',
      coTenants: []
    }
  })

  const { fields: coTenantFields, append: addCoTenant, remove: removeCoTenant } = useFieldArray({
    control,
    name: 'coTenants'
  })

  // Ingatlanok lekérdezése (csak elérhető ingatlanok)
  const { data: propertiesData } = api.property.list.useQuery({
    page: 1,
    limit: 100,
    status: 'AVAILABLE'
  })

  // Kapacitás ellenőrzés a kiválasztott ingatlanhoz
  const selectedPropertyId = watch('propertyId')
  const { data: capacityData } = api.tenant.checkPropertyCapacity.useQuery(
    { propertyId: selectedPropertyId },
    { enabled: !!selectedPropertyId }
  )

  const addCoTenantWithDefaults = () => {
    // Ellenőrizzük a kapacitást a társbérlő hozzáadása előtt
    if (capacityData && capacityData.hasCapacitySet) {
      const currentFormOccupants = 1 + coTenantFields.length // Főbérlő + jelenlegi társbérlők
      const newTotal = currentFormOccupants + 1 // + 1 új társbérlő
      const maxAllowed = capacityData.availableSpaces + currentFormOccupants
      
      if (newTotal > maxAllowed) {
        setError(`Nem adhat hozzá több társbérlőt! Az ingatlan kapacitása: ${capacityData.capacity} fő. Elérhető helyek: ${capacityData.availableSpaces} fő.`)
        return
      }
    }

    addCoTenant({ 
      firstName: '', 
      lastName: '', 
      email: '', 
      phone: '',
      documents: []
    })
  }

  // Kapacitás üzenet meghatározása
  const getCapacityMessage = () => {
    if (!selectedPropertyId) return null
    if (!capacityData) return null
    
    if (!capacityData.hasCapacitySet) {
      return {
        type: 'warning' as const,
        message: 'Az ingatlan férőhelye nincs megadva. Kérjük állítsa be az ingatlan adataiban!'
      }
    }

    const currentFormOccupants = 1 + coTenantFields.length // Főbérlő + társbérlők
    const remainingSpaces = capacityData.availableSpaces - currentFormOccupants + 1

    if (remainingSpaces > 0) {
      return {
        type: 'info' as const,
        message: `Ingatlan kapacitás: ${capacityData.capacity} fő | Jelenleg lakók: ${capacityData.currentOccupants} fő | Űrlapon most: ${currentFormOccupants} fő | Még felvehető: ${remainingSpaces} fő`
      }
    } else {
      return {
        type: 'error' as const,
        message: `Az ingatlan betelt! Kapacitás: ${capacityData.capacity} fő | Jelenleg lakók: ${capacityData.currentOccupants} fő | Nincs több hely`
      }
    }
  }

  const capacityMessage = getCapacityMessage()
  const canAddMoreCoTenants = () => {
    if (!capacityData?.hasCapacitySet) return true
    const currentFormOccupants = 1 + coTenantFields.length
    const maxAllowed = capacityData.availableSpaces + currentFormOccupants
    return currentFormOccupants < maxAllowed
  }

  const createTenant = api.tenant.create.useMutation({
    onSuccess: async (data) => {
      // Automatikus hozzáférési szabály létrehozása ha van ingatlan hozzárendelve
      if (data.currentPropertyId) {
        try {
          await api.accessAutomation.setupLongTermTenantAccess.mutate({
            propertyId: data.currentPropertyId,
            tenantId: data.id,
            tenantType: 'LONG_TERM',
            timeRestriction: 'NO_RESTRICTION', // Bérlők 24/7 hozzáférés
            allowedWeekdays: [1, 2, 3, 4, 5, 6, 7], // Minden nap
            renewalPeriodDays: 90, // Negyed éves megújítás
            autoGenerateCode: false, // Manuális kódkezelés hosszútávú bérlőknek
            codeGenerationRule: undefined,
            codeDeliveryDays: 3,
            notes: `Automatikusan létrehozott hozzáférési szabály - ${data.user?.firstName} ${data.user?.lastName}`
          })
          
          // Sikeres hozzáférés létrehozás jelzése
          alert('✅ Bérlő létrehozva és automatikus hozzáférési szabály beállítva!')
        } catch (accessError) {
          console.warn('Hozzáférési szabály létrehozás sikertelen:', accessError)
          alert('⚠️ Bérlő létrehozva, de hozzáférési szabály manuálisan szükséges!')
        }
      }
      
      router.push(`/dashboard/tenants/${data.id}`)
    },
    onError: (error) => {
      setError(error.message)
    },
  })

  const onSubmit = async (data: TenantFormData) => {
    setError(null)
    await createTenant.mutateAsync(data)
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-6">
        <Button variant="ghost" asChild>
          <Link href="/dashboard/tenants">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Vissza a bérlők listájához
          </Link>
        </Button>
      </div>

      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Új bérlő regisztrálása</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Főbérlő adatai */}
            <div className="space-y-6">
              <h3 className="text-lg font-medium">Főbérlő adatai</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">Vezetéknév *</Label>
                  <Input
                    id="firstName"
                    {...register('firstName', { required: 'A vezetéknév megadása kötelező' })}
                    placeholder="Nagy"
                  />
                  {errors.firstName && (
                    <p className="text-sm text-red-500 mt-1">{errors.firstName.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="lastName">Keresztnév *</Label>
                  <Input
                    id="lastName"
                    {...register('lastName', { required: 'A keresztnév megadása kötelező' })}
                    placeholder="János"
                  />
                  {errors.lastName && (
                    <p className="text-sm text-red-500 mt-1">{errors.lastName.message}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  {...register('email', { 
                    required: 'Az email megadása kötelező',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Érvénytelen email cím'
                    }
                  })}
                  placeholder="nagy.janos@example.com"
                />
                {errors.email && (
                  <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="password">Jelszó *</Label>
                <Input
                  id="password"
                  type="password"
                  {...register('password', { 
                    required: 'A jelszó megadása kötelező',
                    minLength: {
                      value: 6,
                      message: 'A jelszónak legalább 6 karakter hosszúnak kell lennie'
                    }
                  })}
                  placeholder="Legalább 6 karakter"
                />
                {errors.password && (
                  <p className="text-sm text-red-500 mt-1">{errors.password.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="phone">Telefon</Label>
                <Input
                  id="phone"
                  {...register('phone')}
                  placeholder="+36 20 123 4567"
                />
              </div>

              <div>
                <Label htmlFor="address">Cím</Label>
                <Input
                  id="address"
                  {...register('address')}
                  placeholder="1234 Budapest, Példa utca 12."
                />
              </div>


              <div>
                <Label>Dokumentumok (személyi, szerződések, stb.)</Label>
                <ImageUpload
                  value={watch('documents') || []}
                  onChange={(urls) => setValue('documents', urls)}
                  maxFiles={10}
                />
              </div>

              <div>
                <Label htmlFor="notes">Megjegyzések</Label>
                <Input
                  id="notes"
                  {...register('notes')}
                  placeholder="Belső megjegyzések a bérlőről..."
                />
              </div>

              {/* Bérlési adatok */}
              <div className="border-t pt-6">
                <h4 className="text-md font-medium mb-4">Bérlési adatok</h4>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="propertyId">Ingatlan kiválasztása</Label>
                    <Select
                      value={watch('propertyId')}
                      onValueChange={(value) => setValue('propertyId', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Válasszon ingatlant..." />
                      </SelectTrigger>
                      <SelectContent>
                        {propertiesData?.properties?.map((property) => (
                          <SelectItem key={property.id} value={property.id}>
                            {property.street}, {property.city} - {property.type}
                            {property.capacity && ` (${property.capacity} fő)`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Kapacitás információ */}
                  {capacityMessage && (
                    <Alert variant={capacityMessage.type === 'error' ? 'destructive' : 'default'} className="mt-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{capacityMessage.message}</AlertDescription>
                    </Alert>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="startDate">Bérlés kezdete</Label>
                      <Input
                        id="startDate"
                        type="date"
                        {...register('startDate')}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="endDate">Bérlés vége</Label>
                      <Input
                        id="endDate"
                        type="date"
                        {...register('endDate')}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="text-md font-medium mb-4">Vészhelyzeti kapcsolattartó</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="emergencyName">Kapcsolattartó neve</Label>
                    <Input
                      id="emergencyName"
                      {...register('emergencyName')}
                      placeholder="Kapcsolattartó teljes neve"
                    />
                  </div>

                  <div>
                    <Label htmlFor="emergencyPhone">Kapcsolattartó telefonszáma</Label>
                    <Input
                      id="emergencyPhone"
                      {...register('emergencyPhone')}
                      placeholder="+36 20 987 6543"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Társbérlők/albérlők */}
            <div className="border-t pt-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  <h3 className="text-lg font-medium">Társbérlők / Albérlők</h3>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={addCoTenantWithDefaults}
                  disabled={!canAddMoreCoTenants()}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Társbérlő hozzáadása
                  {!canAddMoreCoTenants() && ' (Betelt)'}
                </Button>
              </div>

              {coTenantFields.length === 0 && (
                <div className="text-center py-8 border-2 border-dashed rounded-lg">
                  <Users className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-600">
                    Még nem adott hozzá társbérlőket
                  </p>
                  <p className="text-xs text-gray-500">
                    {canAddMoreCoTenants() 
                      ? 'Kattintson a "Társbérlő hozzáadása" gombra albérlők felviteléhez'
                      : 'Az ingatlan férőhelye betelt - nem adhat hozzá több társbérlőt'
                    }
                  </p>
                </div>
              )}

              {coTenantFields.map((field, index) => (
                <Card key={field.id} className="mb-4 p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium">Társbérlő #{index + 1}</h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCoTenant(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Vezetéknév *</Label>
                      <Input
                        {...register(`coTenants.${index}.firstName`, { required: 'Kötelező mező' })}
                        placeholder="Vezetéknév"
                      />
                      {errors.coTenants?.[index]?.firstName && (
                        <p className="text-sm text-red-500 mt-1">
                          {errors.coTenants[index]?.firstName?.message}
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <Label>Keresztnév *</Label>
                      <Input
                        {...register(`coTenants.${index}.lastName`, { required: 'Kötelező mező' })}
                        placeholder="Keresztnév"
                      />
                      {errors.coTenants?.[index]?.lastName && (
                        <p className="text-sm text-red-500 mt-1">
                          {errors.coTenants[index]?.lastName?.message}
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <Label>Email *</Label>
                      <Input
                        type="email"
                        {...register(`coTenants.${index}.email`, { 
                          required: 'Kötelező mező',
                          pattern: {
                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                            message: 'Érvénytelen email cím'
                          }
                        })}
                        placeholder="email@example.com"
                      />
                      {errors.coTenants?.[index]?.email && (
                        <p className="text-sm text-red-500 mt-1">
                          {errors.coTenants[index]?.email?.message}
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <Label>Telefon</Label>
                      <Input
                        {...register(`coTenants.${index}.phone`)}
                        placeholder="+36 20 123 4567"
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <Label className="flex items-center gap-2">
                      <Upload className="w-4 h-4" />
                      Dokumentumok (személyi, stb.)
                    </Label>
                    <ImageUpload
                      value={watch(`coTenants.${index}.documents`) || []}
                      onChange={(urls) => setValue(`coTenants.${index}.documents`, urls)}
                      maxFiles={5}
                    />
                  </div>
                </Card>
              ))}
            </div>

            <div className="flex gap-4 pt-6 border-t">
              <Button
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Mentés...' : 'Bérlő létrehozása'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/dashboard/tenants')}
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