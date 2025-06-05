'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { api } from '@/lib/trpc/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { 
  ArrowLeft, 
  Save, 
  AlertCircle, 
  User,
  Shield,
  CheckCircle,
  XCircle
} from 'lucide-react'
import Link from 'next/link'

const roleTranslations = {
  'ADMIN': 'Adminisztrátor',
  'EDITOR_ADMIN': 'Szerkesztő admin', 
  'OFFICE_ADMIN': 'Irodai admin',
  'OWNER': 'Tulajdonos',
  'SERVICE_MANAGER': 'Szolgáltatás manager',
  'PROVIDER': 'Szolgáltató',
  'TENANT': 'Bérlő'
}

interface UserEditFormData {
  firstName: string
  lastName: string
  email: string
  phone: string
  language: 'HU' | 'EN'
  role: string
  isActive: boolean
}

interface UserEditPageProps {
  params: {
    id: string
  }
}

export default function UserEditPage({ params }: UserEditPageProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const { data: user, isLoading, error: fetchError } = api.user.getById.useQuery(params.id)

  const { register, handleSubmit, formState: { errors, isSubmitting }, setValue, watch, reset } = useForm<UserEditFormData>()

  const updateUser = api.user.update.useMutation({
    onSuccess: (updatedUser) => {
      setSuccess('Felhasználó sikeresen frissítve!')
      setError(null)
      // Update form with the latest data
      reset({
        firstName: updatedUser.firstName || '',
        lastName: updatedUser.lastName || '',
        email: updatedUser.email,
        phone: updatedUser.phone || '',
        language: updatedUser.language,
        role: updatedUser.role,
        isActive: true // Note: isActive is not returned by update, using default
      })
    },
    onError: (error) => {
      setError(error.message)
      setSuccess(null)
    },
  })

  const updateRole = api.user.updateRole.useMutation({
    onSuccess: () => {
      setSuccess('Szerepkör sikeresen frissítve!')
      setError(null)
    },
    onError: (error) => {
      setError(error.message)
      setSuccess(null)
    },
  })

  const toggleActive = api.user.toggleActive.useMutation({
    onSuccess: () => {
      setSuccess('Felhasználó státusz frissítve!')
      setError(null)
    },
    onError: (error) => {
      setError(error.message)
      setSuccess(null)
    },
  })

  // Initialize form when user data is loaded
  useEffect(() => {
    if (user) {
      reset({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email,
        phone: user.phone || '',
        language: user.language,
        role: user.role,
        isActive: user.isActive
      })
    }
  }, [user, reset])

  const onSubmit = async (data: UserEditFormData) => {
    setError(null)
    setSuccess(null)

    try {
      // Update basic user info
      await updateUser.mutateAsync({
        id: params.id,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        language: data.language,
      })

      // Update role if changed
      if (data.role !== user?.role) {
        await updateRole.mutateAsync({
          userId: params.id,
          role: data.role as any,
        })
      }

      // Update active status if changed
      if (data.isActive !== user?.isActive) {
        await toggleActive.mutateAsync(params.id)
      }
    } catch (error) {
      console.error('Failed to update user:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="flex justify-center items-center py-12">
          <div className="text-gray-500">Betöltés...</div>
        </div>
      </div>
    )
  }

  if (fetchError || !user) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="mb-6">
          <Button variant="ghost" asChild>
            <Link href="/dashboard/users">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Vissza a felhasználókhoz
            </Link>
          </Button>
        </div>
        <Alert variant="destructive">
          <AlertDescription>
            {fetchError?.message || 'Felhasználó nem található.'}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-2xl">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" asChild>
          <Link href={`/dashboard/users/${params.id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Vissza a felhasználóhoz
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full">
              <User className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-2xl">Felhasználó szerkesztése</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge className="bg-blue-100 text-blue-800">
                  {user.email}
                </Badge>
                {user.isActive ? (
                  <div className="flex items-center gap-1">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-green-700">Aktív</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <XCircle className="h-4 w-4 text-red-500" />
                    <span className="text-sm text-red-700">Inaktív</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Success/Error Messages */}
          {success && (
            <Alert className="mb-6 border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700">{success}</AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Alapadatok</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">Keresztnév *</Label>
                  <Input
                    id="firstName"
                    {...register('firstName', { required: 'A keresztnév megadása kötelező' })}
                    placeholder="Keresztnév"
                  />
                  {errors.firstName && (
                    <p className="text-sm text-red-500 mt-1">{errors.firstName.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="lastName">Vezetéknév *</Label>
                  <Input
                    id="lastName"
                    {...register('lastName', { required: 'A vezetéknév megadása kötelező' })}
                    placeholder="Vezetéknév"
                  />
                  {errors.lastName && (
                    <p className="text-sm text-red-500 mt-1">{errors.lastName.message}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email cím *</Label>
                <Input
                  id="email"
                  type="email"
                  {...register('email', { 
                    required: 'Az email cím megadása kötelező',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Érvénytelen email formátum'
                    }
                  })}
                  placeholder="pelda@email.com"
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
                />
              </div>

              <div>
                <Label htmlFor="language">Nyelv</Label>
                <Select
                  value={watch('language')}
                  onValueChange={(value) => setValue('language', value as 'HU' | 'EN')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HU">Magyar</SelectItem>
                    <SelectItem value="EN">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Role and Status */}
            <div className="space-y-4 border-t pt-6">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Jogosultságok és státusz
              </h3>

              <div>
                <Label htmlFor="role">Szerepkör</Label>
                <Select
                  value={watch('role')}
                  onValueChange={(value) => setValue('role', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(roleTranslations).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-500 mt-1">
                  A szerepkör meghatározza, hogy milyen funkciókhoz fér hozzá a felhasználó.
                </p>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label htmlFor="isActive" className="text-base font-medium">
                    Aktív felhasználó
                  </Label>
                  <p className="text-sm text-gray-500">
                    Inaktív felhasználók nem tudnak bejelentkezni
                  </p>
                </div>
                <Switch
                  id="isActive"
                  checked={watch('isActive')}
                  onCheckedChange={(checked) => setValue('isActive', checked)}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-6 border-t">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1"
              >
                <Save className="mr-2 h-4 w-4" />
                {isSubmitting ? 'Mentés...' : 'Változtatások mentése'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/dashboard/users/${params.id}`)}
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