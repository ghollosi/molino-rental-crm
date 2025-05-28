'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { api } from '@/src/lib/trpc/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, AlertCircle } from 'lucide-react'
import Link from 'next/link'

interface OwnerFormData {
  name: string
  email: string
  password: string
  phone?: string
  address?: string
  isCompany: boolean
  companyName?: string
  taxNumber?: string
}

export default function NewOwnerPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isCompany, setIsCompany] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting }, setValue, watch } = useForm<OwnerFormData>({
    defaultValues: {
      isCompany: false,
    }
  })

  const createOwner = api.owner.create.useMutation({
    onSuccess: () => {
      router.push('/dashboard/owners')
    },
    onError: (error) => {
      setError(error.message)
    },
  })

  const onSubmit = async (data: OwnerFormData) => {
    setError(null)
    await createOwner.mutateAsync({
      userId: 'temp-user-id', // TODO: Create user first
      taxNumber: data.isCompany ? data.taxNumber : undefined,
    })
  }

  const watchIsCompany = watch('isCompany')

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-6">
        <Button variant="ghost" asChild>
          <Link href="/dashboard/owners">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Vissza
          </Link>
        </Button>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Új tulajdonos regisztrálása</CardTitle>
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
                <Label htmlFor="isCompany">Tulajdonos típusa</Label>
                <Select
                  value={watchIsCompany ? 'true' : 'false'}
                  onValueChange={(value) => {
                    const isComp = value === 'true'
                    setIsCompany(isComp)
                    setValue('isCompany', isComp)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="false">Magánszemély</SelectItem>
                    <SelectItem value="true">Cég</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="name">Név *</Label>
                <Input
                  id="name"
                  {...register('name', { required: 'A név megadása kötelező' })}
                  placeholder={isCompany ? 'Kapcsolattartó neve' : 'Teljes név'}
                />
                {errors.name && (
                  <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
                )}
              </div>

              {isCompany && (
                <>
                  <div>
                    <Label htmlFor="companyName">Cégnév *</Label>
                    <Input
                      id="companyName"
                      {...register('companyName', { 
                        required: isCompany ? 'A cégnév megadása kötelező' : false 
                      })}
                      placeholder="Cég hivatalos neve"
                      autoComplete="organization"
                    />
                    {errors.companyName && (
                      <p className="text-sm text-red-500 mt-1">{errors.companyName.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="taxNumber">Adószám</Label>
                    <Input
                      id="taxNumber"
                      {...register('taxNumber')}
                      placeholder="12345678-1-23"
                    />
                  </div>
                </>
              )}

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
                  placeholder="tulajdonos@example.com"
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
            </div>

            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Mentés...' : 'Tulajdonos létrehozása'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/dashboard/owners')}
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