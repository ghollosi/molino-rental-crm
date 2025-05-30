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
import { ArrowLeft, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { ImageUpload } from '@/components/image-upload'

interface TenantFormData {
  name: string
  email: string
  phone?: string
  address?: string
  emergencyContact?: string
  emergencyPhone?: string
  documents?: string[]
}

export default function NewTenantPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [documents, setDocuments] = useState<string[]>([])

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<TenantFormData>()

  const createTenant = api.tenant.quickCreate.useMutation({
    onSuccess: () => {
      router.push('/dashboard/tenants')
    },
    onError: (error) => {
      setError(error.message)
    },
  })

  const onSubmit = async (data: TenantFormData) => {
    setError(null)
    await createTenant.mutateAsync({
      name: data.name,
      email: data.email,
      phone: data.phone,
      emergencyName: data.emergencyContact,
      emergencyPhone: data.emergencyPhone,
      documents: documents,
    })
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-6">
        <Button variant="ghost" asChild>
          <Link href="/dashboard/tenants">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Vissza
          </Link>
        </Button>
      </div>

      <Card className="max-w-2xl mx-auto">
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

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Név *</Label>
                <Input
                  id="name"
                  {...register('name', { required: 'A név megadása kötelező' })}
                  placeholder="Teljes név"
                  autoComplete="name"
                />
                {errors.name && (
                  <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
                )}
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
                  placeholder="berlo@example.com"
                  autoComplete="email"
                />
                {errors.email && (
                  <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
                )}
              </div>


              <div>
                <Label htmlFor="phone">Telefon</Label>
                <Input
                  id="phone"
                  {...register('phone')}
                  placeholder="+36 20 123 4567"
                  autoComplete="tel"
                />
              </div>

              <div>
                <Label htmlFor="address">Cím</Label>
                <Input
                  id="address"
                  {...register('address')}
                  placeholder="1234 Budapest, Példa utca 12."
                  autoComplete="street-address"
                />
              </div>

              <div className="border-t pt-4">
                <h3 className="text-lg font-medium mb-4">Vészhelyzeti kapcsolattartó</h3>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="emergencyContact">Kapcsolattartó neve</Label>
                    <Input
                      id="emergencyContact"
                      {...register('emergencyContact')}
                      placeholder="Kapcsolattartó teljes neve"
                      autoComplete="name"
                    />
                  </div>

                  <div>
                    <Label htmlFor="emergencyPhone">Kapcsolattartó telefonszáma</Label>
                    <Input
                      id="emergencyPhone"
                      {...register('emergencyPhone')}
                      placeholder="+36 20 987 6543"
                      autoComplete="tel"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="text-lg font-medium mb-4">Okmányok feltöltése</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Töltsön fel személyi igazolványt, lakcímkártyát vagy egyéb releváns dokumentumokat.
                </p>
                <ImageUpload
                  value={documents}
                  onChange={setDocuments}
                  maxFiles={5}
                />
              </div>
            </div>

            <div className="flex gap-4">
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