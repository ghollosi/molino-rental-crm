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
import { ArrowLeft, AlertCircle, Plus, X } from 'lucide-react'
import Link from 'next/link'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface ProviderFormData {
  userId: string
  businessName: string
  specialty: string[]
  hourlyRate?: number
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
  'Általános karbantartás'
]

export default function NewProviderPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([])
  const [customSpecialty, setCustomSpecialty] = useState('')
  const [selectedUserId, setSelectedUserId] = useState<string>('')

  const { register, handleSubmit, formState: { errors, isSubmitting }, setValue } = useForm<ProviderFormData>({
    defaultValues: {
      specialty: [],
      currency: 'EUR',
    }
  })

  // Fetch all users to find those without provider profile
  const { data: allUsersData } = api.user.list.useQuery({
    page: 1,
    limit: 100,
  })

  // Get existing providers to filter out users who already have provider profiles
  const { data: providersData } = api.provider.list.useQuery({
    page: 1,
    limit: 100,
  })

  // Filter available users: those with PROVIDER role or without provider profile
  const availableUsers = allUsersData?.users.filter(user => {
    const hasProviderProfile = providersData?.providers.some(p => p.userId === user.id)
    return !hasProviderProfile
  }) || []

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
    
    if (!selectedUserId) {
      setError('Kérem válasszon ki egy felhasználót')
      return
    }

    if (selectedSpecialties.length === 0) {
      setError('Legalább egy szakterület kiválasztása kötelező')
      return
    }

    await createProvider.mutateAsync({
      userId: selectedUserId,
      businessName: data.businessName,
      specialty: selectedSpecialties,
      hourlyRate: data.hourlyRate,
      currency: data.currency,
      availability: data.availability,
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

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Új szolgáltató regisztrálása</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="user">Felhasználó kiválasztása *</Label>
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Válasszon felhasználót..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name || 'Névtelen'} ({user.email})
                        {user.role && ` - ${user.role}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!selectedUserId && (
                  <p className="text-sm text-gray-500 mt-1">
                    Csak olyan felhasználók választhatók, akiknek még nincs szolgáltató profiljuk
                  </p>
                )}
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
                    placeholder="50"
                    className="flex-1"
                  />
                  <Select 
                    value={register('currency').name}
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

            <div className="flex gap-4">
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