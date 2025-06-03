'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { api } from '@/lib/trpc/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, AlertCircle, Plus, X, Upload, Building2, User, MapPin, CreditCard, Globe } from 'lucide-react'
import Link from 'next/link'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { FileUpload } from '@/components/ui/file-upload'

interface ProviderFormData {
  // Basic company info
  businessName: string
  representativeName?: string
  salutation?: string
  
  // Contact details
  email?: string
  website?: string
  
  // Business details
  taxNumber?: string
  bankAccount?: string
  
  // Address
  street?: string
  city?: string
  postalCode?: string
  country?: string
  
  // Photos
  companyLogo?: string
  profilePhoto?: string
  
  // Service details
  specialty: string[]
  hourlyRate?: number
  travelFee?: number
  currency: string
  availability?: Record<string, unknown>
}

const availableSpecialties = [
  'Villanyszerelés',
  'Vízvezeték szerelés',
  'Gázszerelés',
  'Festés-mázolás',
  'Burkolás',
  'Asztalos munkák',
  'Lakatos munkák',
  'Kőműves munkák',
  'Tetőfedés',
  'Kertészet',
  'Takarítás',
  'Költöztetés',
  'Klíma szerelés',
  'Redőny javítás',
  'Általános karbantartás',
  'Medence karbantartás',
  'Riasztó rendszer',
  'Kamerák telepítése',
  'Ablak tisztítás'
]

const salutations = [
  { value: 'Mr.', label: 'Úr' },
  { value: 'Ms.', label: 'Asszony' },
  { value: 'Dr.', label: 'Dr.' },
  { value: 'Ing.', label: 'Mérnök' },
]

export default function NewProviderPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([])
  const [customSpecialty, setCustomSpecialty] = useState('')
  const [companyLogo, setCompanyLogo] = useState<string | undefined>()
  const [profilePhoto, setProfilePhoto] = useState<string | undefined>()

  const { register, handleSubmit, formState: { errors, isSubmitting }, setValue, watch } = useForm<ProviderFormData>({
    defaultValues: {
      specialty: [],
      currency: 'EUR',
      country: 'Magyarország',
    }
  })

  const createProvider = api.provider.create.useMutation({
    onSuccess: () => {
      router.push('/dashboard/providers')
    },
    onError: (error) => {
      setError(error.message)
    },
  })

  const toggleSpecialty = (specialty: string) => {
    if (selectedSpecialties.includes(specialty)) {
      setSelectedSpecialties(selectedSpecialties.filter(s => s !== specialty))
    } else {
      setSelectedSpecialties([...selectedSpecialties, specialty])
    }
  }

  const addCustomSpecialty = () => {
    if (customSpecialty && !selectedSpecialties.includes(customSpecialty)) {
      setSelectedSpecialties([...selectedSpecialties, customSpecialty])
      setCustomSpecialty('')
    }
  }

  const removeSpecialty = (specialty: string) => {
    setSelectedSpecialties(selectedSpecialties.filter(s => s !== specialty))
  }

  const onSubmit = async (data: ProviderFormData) => {
    setError(null)

    if (selectedSpecialties.length === 0) {
      setError('Legalább egy szakterület kiválasztása kötelező')
      return
    }

    await createProvider.mutateAsync({
      ...data,
      specialty: selectedSpecialties,
      companyLogo,
      profilePhoto,
    })
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-6">
        <Button variant="ghost" asChild>
          <Link href="/dashboard/providers">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Vissza
          </Link>
        </Button>
      </div>

      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Új szolgáltató regisztrálása
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Basic Company Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="h-4 w-4" />
                <h3 className="text-lg font-semibold">Alapadatok</h3>
              </div>

              <div>
                <Label htmlFor="businessName">Cégnév / Vállalkozás neve *</Label>
                <Input
                  id="businessName"
                  {...register('businessName', { required: 'A cégnév megadása kötelező' })}
                  placeholder="Pl. Kovács János EV"
                />
                {errors.businessName && (
                  <p className="text-sm text-red-500 mt-1">{errors.businessName.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="salutation">Megszólítás</Label>
                  <Select onValueChange={(value) => setValue('salutation', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Válasszon..." />
                    </SelectTrigger>
                    <SelectContent>
                      {salutations.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="representativeName">Képviselő neve</Label>
                  <Input
                    id="representativeName"
                    {...register('representativeName')}
                    placeholder="Pl. Kovács János"
                  />
                </div>
              </div>
            </div>

            {/* Contact Details */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Globe className="h-4 w-4" />
                <h3 className="text-lg font-semibold">Kapcsolattartás</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email cím</Label>
                  <Input
                    id="email"
                    type="email"
                    {...register('email')}
                    placeholder="info@cegnev.hu"
                  />
                  {errors.email && (
                    <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="website">Weboldal</Label>
                  <Input
                    id="website"
                    {...register('website')}
                    placeholder="https://www.cegnev.hu"
                  />
                  {errors.website && (
                    <p className="text-sm text-red-500 mt-1">{errors.website.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Business Details */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <CreditCard className="h-4 w-4" />
                <h3 className="text-lg font-semibold">Üzleti adatok</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="taxNumber">Adószám</Label>
                  <Input
                    id="taxNumber"
                    {...register('taxNumber')}
                    placeholder="12345678-1-23"
                  />
                </div>

                <div>
                  <Label htmlFor="bankAccount">Bankszámlaszám</Label>
                  <Input
                    id="bankAccount"
                    {...register('bankAccount')}
                    placeholder="12345678-12345678-12345678"
                  />
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="h-4 w-4" />
                <h3 className="text-lg font-semibold">Cím</h3>
              </div>

              <div>
                <Label htmlFor="street">Utca, házszám</Label>
                <Input
                  id="street"
                  {...register('street')}
                  placeholder="Fő utca 123."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="city">Város</Label>
                  <Input
                    id="city"
                    {...register('city')}
                    placeholder="Budapest"
                  />
                </div>

                <div>
                  <Label htmlFor="postalCode">Irányítószám</Label>
                  <Input
                    id="postalCode"
                    {...register('postalCode')}
                    placeholder="1234"
                  />
                </div>

                <div>
                  <Label htmlFor="country">Ország</Label>
                  <Input
                    id="country"
                    {...register('country')}
                    placeholder="Magyarország"
                  />
                </div>
              </div>
            </div>

            {/* Service Details */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <User className="h-4 w-4" />
                <h3 className="text-lg font-semibold">Szolgáltatási adatok</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="hourlyRate">Óradíj</Label>
                  <div className="flex gap-2">
                    <Input
                      id="hourlyRate"
                      type="number"
                      {...register('hourlyRate', { 
                        valueAsNumber: true,
                        min: { value: 0, message: 'Az óradíj nem lehet negatív' }
                      })}
                      placeholder="5000"
                      className="flex-1"
                    />
                    <Select 
                      value={watch('currency')}
                      onValueChange={(value) => setValue('currency', value)}
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue placeholder="EUR" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="HUF">HUF</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {errors.hourlyRate && (
                    <p className="text-sm text-red-500 mt-1">{errors.hourlyRate.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="travelFee">Kiszállási díj (km-enként)</Label>
                  <div className="flex gap-2">
                    <Input
                      id="travelFee"
                      type="number"
                      {...register('travelFee', { 
                        valueAsNumber: true,
                        min: { value: 0, message: 'A kiszállási díj nem lehet negatív' }
                      })}
                      placeholder="50"
                      className="flex-1"
                    />
                    <div className="flex items-center px-3 bg-gray-50 border rounded-md">
                      <span className="text-sm text-gray-600">{watch('currency')}/km</span>
                    </div>
                  </div>
                  {errors.travelFee && (
                    <p className="text-sm text-red-500 mt-1">{errors.travelFee.message}</p>
                  )}
                </div>
              </div>

              <div>
                <Label>Szakterületek *</Label>
                <div className="mt-2 space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {availableSpecialties.map((specialty) => (
                      <Badge
                        key={specialty}
                        variant={selectedSpecialties.includes(specialty) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => toggleSpecialty(specialty)}
                      >
                        {specialty}
                      </Badge>
                    ))}
                  </div>
                  
                  <div className="flex gap-2 mt-4">
                    <Input
                      placeholder="Egyéb szakterület..."
                      value={customSpecialty}
                      onChange={(e) => setCustomSpecialty(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addCustomSpecialty()
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addCustomSpecialty}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  {selectedSpecialties.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-600 mb-2">Kiválasztott szakterületek:</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedSpecialties.map((specialty) => (
                          <Badge key={specialty} variant="secondary">
                            {specialty}
                            <X
                              className="ml-1 h-3 w-3 cursor-pointer"
                              onClick={() => removeSpecialty(specialty)}
                            />
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Photo Upload Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Upload className="h-4 w-4" />
                <h3 className="text-lg font-semibold">Képek feltöltése</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FileUpload
                  label="Cég logó"
                  value={companyLogo}
                  onChange={setCompanyLogo}
                  accept="image/*"
                  maxSize={5}
                  description="Maximális méret: 5MB. Támogatott formátumok: JPG, PNG, GIF, WebP"
                />

                <FileUpload
                  label="Képviselő fénykép"
                  value={profilePhoto}
                  onChange={setProfilePhoto}
                  accept="image/*"
                  maxSize={5}
                  description="Maximális méret: 5MB. Támogatott formátumok: JPG, PNG, GIF, WebP"
                />
              </div>
            </div>

            <div className="flex gap-4 pt-6">
              <Button
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Mentés...' : 'Szolgáltató létrehozása'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/dashboard/providers')}
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