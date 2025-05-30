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
import { ArrowLeft, AlertCircle, Plus, X, Building2, MapPin, DollarSign } from 'lucide-react'
import Link from 'next/link'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface ProviderFormData {
  businessName: string
  contactName: string
  contactEmail: string
  contactPhone: string
  specialty: string[]
  hourlyRate?: number
  travelCostPerKm?: number
  currency: string
  companyDetails?: string
  referenceSource?: string
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
  'Medence karbantartás'
]

export default function NewProviderPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([])
  const [customSpecialty, setCustomSpecialty] = useState('')

  const { register, handleSubmit, formState: { errors, isSubmitting }, setValue } = useForm<ProviderFormData>({
    defaultValues: {
      specialty: [],
      currency: 'EUR',
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
      businessName: data.businessName,
      contactName: data.contactName,
      contactEmail: data.contactEmail,
      contactPhone: data.contactPhone,
      specialty: selectedSpecialties,
      hourlyRate: data.hourlyRate,
      travelCostPerKm: data.travelCostPerKm,
      currency: data.currency,
      companyDetails: data.companyDetails,
      referenceSource: data.referenceSource,
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

      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-6 w-6" />
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

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Alapadatok */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Alapadatok</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="businessName">Cégnév / Vállalkozás neve *</Label>
                  <Input
                    id="businessName"
                    {...register('businessName', { required: 'A cégnév megadása kötelező' })}
                    placeholder="Pl. Kovács János EV"
                    autoComplete="organization"
                  />
                  {errors.businessName && (
                    <p className="text-sm text-red-500 mt-1">{errors.businessName.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="contactName">Kapcsolattartó neve *</Label>
                  <Input
                    id="contactName"
                    {...register('contactName', { required: 'A kapcsolattartó neve kötelező' })}
                    placeholder="Pl. Kovács János"
                  />
                  {errors.contactName && (
                    <p className="text-sm text-red-500 mt-1">{errors.contactName.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contactEmail">Email cím *</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    {...register('contactEmail', { 
                      required: 'Az email cím megadása kötelező',
                      pattern: {
                        value: /^\S+@\S+$/i,
                        message: 'Érvényes email címet adjon meg'
                      }
                    })}
                    placeholder="szolgaltato@email.com"
                  />
                  {errors.contactEmail && (
                    <p className="text-sm text-red-500 mt-1">{errors.contactEmail.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="contactPhone">Telefonszám *</Label>
                  <Input
                    id="contactPhone"
                    {...register('contactPhone', { required: 'A telefonszám megadása kötelező' })}
                    placeholder="+36 30 123 4567"
                  />
                  {errors.contactPhone && (
                    <p className="text-sm text-red-500 mt-1">{errors.contactPhone.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Díjazás */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Díjazás
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="hourlyRate">Óradíj</Label>
                  <Input
                    id="hourlyRate"
                    type="number"
                    {...register('hourlyRate', { 
                      valueAsNumber: true,
                      min: { value: 0, message: 'Az óradíj nem lehet negatív' }
                    })}
                    placeholder="50"
                  />
                  {errors.hourlyRate && (
                    <p className="text-sm text-red-500 mt-1">{errors.hourlyRate.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="travelCostPerKm">Kiszállási díj / km</Label>
                  <Input
                    id="travelCostPerKm"
                    type="number"
                    {...register('travelCostPerKm', { 
                      valueAsNumber: true,
                      min: { value: 0, message: 'A kiszállási díj nem lehet negatív' }
                    })}
                    placeholder="5"
                  />
                  {errors.travelCostPerKm && (
                    <p className="text-sm text-red-500 mt-1">{errors.travelCostPerKm.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="currency">Pénznem</Label>
                  <Select 
                    defaultValue="EUR"
                    onValueChange={(value) => setValue('currency', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="HUF">HUF</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Szakterületek */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Szakterületek *</h3>
              <div className="space-y-2">
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

            {/* További adatok */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                További információk
              </h3>
              
              <div>
                <Label htmlFor="companyDetails">Pontos cégadatok</Label>
                <Input
                  id="companyDetails"
                  {...register('companyDetails')}
                  placeholder="Adószám, cégjegyzékszám, székhely..."
                />
              </div>

              <div>
                <Label htmlFor="referenceSource">Hol találtuk / Referencia</Label>
                <Input
                  id="referenceSource"
                  {...register('referenceSource')}
                  placeholder="Pl. Google keresés, ajánlás XY-tól, Facebook csoport..."
                />
              </div>
            </div>

            <div className="flex gap-4 pt-4">
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

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              💡 <strong>Megjegyzés:</strong> A szolgáltató létrehozása után meghívó linket generálhat, 
              amellyel a szolgáltató regisztrálhat a rendszerbe és kitöltheti a hiányzó adatokat.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}