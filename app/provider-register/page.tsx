'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { api } from '@/lib/trpc/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, AlertCircle, UserCheck } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface RegistrationFormData {
  name: string
  email: string
  phone?: string
  password: string
  confirmPassword: string
  hourlyRate?: number
  travelCostPerKm?: number
}

export default function ProviderRegisterPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  
  const [provider, setProvider] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors, isSubmitting }, watch } = useForm<RegistrationFormData>()

  const { data: inviteData, isLoading: inviteLoading } = api.provider.getByInviteToken.useQuery(
    token || '', 
    { 
      enabled: !!token,
      retry: false,
    }
  )

  const completeRegistration = api.provider.completeRegistration.useMutation({
    onSuccess: () => {
      toast.success('Regisztráció sikeresen befejezve!')
      router.push('/login?message=registration-complete')
    },
    onError: (error) => {
      setError(error.message)
      toast.error(error.message)
    },
  })

  useEffect(() => {
    if (!token) {
      setError('Hiányzó vagy érvénytelen meghívó token')
      setLoading(false)
      return
    }

    if (inviteData) {
      setProvider(inviteData)
      setLoading(false)
    }

    if (!inviteLoading && !inviteData) {
      setError('Érvénytelen vagy lejárt meghívó')
      setLoading(false)
    }
  }, [token, inviteData, inviteLoading])

  const onSubmit = async (data: RegistrationFormData) => {
    if (!token) return

    if (data.password !== data.confirmPassword) {
      setError('A jelszavak nem egyeznek')
      return
    }

    setError(null)

    await completeRegistration.mutateAsync({
      token,
      userData: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        password: data.password,
      },
      providerData: {
        hourlyRate: data.hourlyRate,
        travelCostPerKm: data.travelCostPerKm,
      },
    })
  }

  if (loading || inviteLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Meghívó ellenőrzése...</p>
        </div>
      </div>
    )
  }

  if (error || !provider) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md w-full mx-4">
          <CardHeader>
            <CardTitle className="flex items-center text-red-600">
              <AlertCircle className="mr-2 h-5 w-5" />
              Hiba
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>
                {error || 'Érvénytelen meghívó'}
              </AlertDescription>
            </Alert>
            <div className="mt-4">
              <Button asChild variant="outline" className="w-full">
                <Link href="/login">Vissza a bejelentkezéshez</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <UserCheck className="mx-auto h-12 w-12 text-blue-600" />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Szolgáltató regisztráció
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Fejezd be a regisztrációt a rendszerbe való belépéshez
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Meghívó adatok</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div><strong>Vállalkozás:</strong> {provider.businessName}</div>
              <div><strong>Kapcsolattartó:</strong> {provider.contactName}</div>
              <div><strong>Email:</strong> {provider.contactEmail}</div>
              <div><strong>Szakterületek:</strong> {provider.specialty.join(', ')}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Regisztráció befejezése</CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="name">Teljes név *</Label>
                <Input
                  id="name"
                  {...register('name', { required: 'A név megadása kötelező' })}
                  placeholder="Nagy János"
                  defaultValue={provider.contactName}
                />
                {errors.name && (
                  <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="email">Email cím *</Label>
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
                  placeholder="email@example.com"
                  defaultValue={provider.contactEmail}
                />
                {errors.email && (
                  <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="phone">Telefonszám</Label>
                <Input
                  id="phone"
                  {...register('phone')}
                  placeholder="+36 20 123 4567"
                  defaultValue={provider.contactPhone}
                />
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
                  placeholder="••••••••"
                />
                {errors.password && (
                  <p className="text-sm text-red-500 mt-1">{errors.password.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="confirmPassword">Jelszó megerősítése *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  {...register('confirmPassword', { 
                    required: 'A jelszó megerősítése kötelező',
                    validate: value => value === watch('password') || 'A jelszavak nem egyeznek'
                  })}
                  placeholder="••••••••"
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-red-500 mt-1">{errors.confirmPassword.message}</p>
                )}
              </div>

              <div className="border-t pt-4">
                <h3 className="font-medium mb-3">Árazás (opcionális)</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="hourlyRate">Óradíj (Ft)</Label>
                    <Input
                      id="hourlyRate"
                      type="number"
                      {...register('hourlyRate', { valueAsNumber: true })}
                      placeholder="5000"
                    />
                  </div>

                  <div>
                    <Label htmlFor="travelCostPerKm">Kiszállási díj/km (Ft)</Label>
                    <Input
                      id="travelCostPerKm"
                      type="number"
                      {...register('travelCostPerKm', { valueAsNumber: true })}
                      placeholder="100"
                    />
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full"
              >
                {isSubmitting ? 'Regisztráció...' : 'Regisztráció befejezése'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-gray-600">
          Már van fiókod?{' '}
          <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
            Bejelentkezés
          </Link>
        </p>
      </div>
    </div>
  )
}