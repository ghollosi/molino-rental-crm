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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, AlertCircle } from 'lucide-react'
import Link from 'next/link'

interface IssueFormData {
  title: string
  description: string
  priority: string
  category: string
  propertyId: string
  tenantId?: string
  ownerId?: string
}

export default function NewIssuePage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [reporterType, setReporterType] = useState<'tenant' | 'owner'>('tenant')

  const { register, handleSubmit, formState: { errors, isSubmitting }, setValue, watch } = useForm<IssueFormData>({
    defaultValues: {
      priority: 'MEDIUM',
    }
  })

  // Ingatlanok lekérdezése
  const { data: properties } = api.property.list.useQuery({ 
    page: 1, 
    limit: 100
  })

  // Bérlők lekérdezése
  const { data: tenants } = api.tenant.list.useQuery({
    page: 1,
    limit: 100,
  })

  // Tulajdonosok lekérdezése
  const { data: owners } = api.owner.list.useQuery({
    page: 1,
    limit: 100,
  })

  const createIssue = api.issue.create.useMutation({
    onSuccess: () => {
      router.push('/dashboard/issues')
    },
    onError: (error) => {
      setError(error.message)
    },
  })

  const onSubmit = async (data: IssueFormData) => {
    setError(null)
    await createIssue.mutateAsync({
      title: data.title,
      description: data.description,
      priority: data.priority as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT',
      propertyId: data.propertyId,
      category: data.category as 'PLUMBING' | 'ELECTRICAL' | 'HVAC' | 'STRUCTURAL' | 'OTHER'
    })
  }

  const watchPropertyId = watch('propertyId')

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-6">
        <Button variant="ghost" asChild>
          <Link href="/dashboard/issues">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Vissza
          </Link>
        </Button>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Új hibabejelentés</CardTitle>
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
                <Label htmlFor="title">Cím *</Label>
                <Input
                  id="title"
                  {...register('title', { required: 'A cím megadása kötelező' })}
                  placeholder="Rövid leírás a hibáról"
                />
                {errors.title && (
                  <p className="text-sm text-red-500 mt-1">{errors.title.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="description">Részletes leírás *</Label>
                <textarea
                  id="description"
                  {...register('description', { required: 'A leírás megadása kötelező' })}
                  placeholder="Részletes leírás a hibáról..."
                  className="w-full min-h-[120px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.description && (
                  <p className="text-sm text-red-500 mt-1">{errors.description.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="priority">Prioritás *</Label>
                <Select
                  value={watch('priority')}
                  onValueChange={(value) => setValue('priority', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="URGENT">Sürgős</SelectItem>
                    <SelectItem value="HIGH">Magas</SelectItem>
                    <SelectItem value="MEDIUM">Közepes</SelectItem>
                    <SelectItem value="LOW">Alacsony</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="category">Kategória *</Label>
                <Select
                  value={watch('category')}
                  onValueChange={(value) => setValue('category', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Válasszon kategóriát" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PLUMBING">Vízvezeték</SelectItem>
                    <SelectItem value="ELECTRICAL">Elektromos</SelectItem>
                    <SelectItem value="HVAC">Fűtés/Hűtés</SelectItem>
                    <SelectItem value="STRUCTURAL">Szerkezeti</SelectItem>
                    <SelectItem value="OTHER">Egyéb</SelectItem>
                  </SelectContent>
                </Select>
                {errors.category && (
                  <p className="text-sm text-red-500 mt-1">{errors.category.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="propertyId">Ingatlan *</Label>
                <Select
                  value={watchPropertyId}
                  onValueChange={(value) => setValue('propertyId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Válasszon ingatlant" />
                  </SelectTrigger>
                  <SelectContent>
                    {properties?.properties.map((property) => (
                      <SelectItem key={property.id} value={property.id}>
                        {property.street}, {property.city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.propertyId && (
                  <p className="text-sm text-red-500 mt-1">{errors.propertyId.message}</p>
                )}
              </div>

              <div>
                <Label>Bejelentő típusa</Label>
                <Select
                  value={reporterType}
                  onValueChange={(value) => setReporterType(value as 'tenant' | 'owner')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tenant">Bérlő</SelectItem>
                    <SelectItem value="owner">Tulajdonos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {reporterType === 'tenant' ? (
                <div>
                  <Label htmlFor="tenantId">Bérlő</Label>
                  <Select
                    value={watch('tenantId') || ''}
                    onValueChange={(value) => setValue('tenantId', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Válasszon bérlőt (opcionális)" />
                    </SelectTrigger>
                    <SelectContent>
                      {tenants?.tenants.map((tenant) => (
                        <SelectItem key={tenant.id} value={tenant.id}>
                          {tenant.user.name} ({tenant.user.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div>
                  <Label htmlFor="ownerId">Tulajdonos</Label>
                  <Select
                    value={watch('ownerId') || ''}
                    onValueChange={(value) => setValue('ownerId', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Válasszon tulajdonost (opcionális)" />
                    </SelectTrigger>
                    <SelectContent>
                      {owners?.owners.map((owner) => (
                        <SelectItem key={owner.id} value={owner.id}>
                          {owner.user.name} ({owner.user.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Mentés...' : 'Hibabejelentés létrehozása'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/dashboard/issues')}
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