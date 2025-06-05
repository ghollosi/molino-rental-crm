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
import { Checkbox } from '@/components/ui/checkbox'
import { ArrowLeft, AlertCircle, Save, Plus } from 'lucide-react'
import { ImageUpload } from '@/components/ui/image-upload'
import Link from 'next/link'

interface OwnerFormData {
  name: string
  email: string
  password?: string
  phone?: string
  address?: string
  isCompany: boolean
  companyName?: string
  taxNumber?: string
  profilePhoto?: string
  hasSeparateBilling: boolean
  billingStreet?: string
  billingCity?: string
  billingPostalCode?: string
  billingCountry?: string
}

interface OwnerFormProps {
  mode: 'create' | 'edit'
  ownerId?: string
  onSuccess?: (ownerId: string) => void
  onCancel?: () => void
}

export function OwnerForm({ mode, ownerId, onSuccess, onCancel }: OwnerFormProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isCompany, setIsCompany] = useState(false)
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null)
  const [hasSeparateBilling, setHasSeparateBilling] = useState(false)

  // Csak szerkesztési módban töltjük be a meglévő adatokat
  const { data: owner, isLoading } = api.owner.getById.useQuery(ownerId!, {
    enabled: mode === 'edit' && !!ownerId,
  })

  const { register, handleSubmit, formState: { errors, isSubmitting }, setValue, watch, reset } = useForm<OwnerFormData>({
    defaultValues: {
      isCompany: false,
      hasSeparateBilling: false,
      name: '',
      email: '',
      phone: '',
      address: '',
      companyName: '',
      taxNumber: '',
      billingStreet: '',
      billingCity: '',
      billingPostalCode: '',
      billingCountry: 'Magyarország',
    }
  })

  // Adatok betöltése szerkesztési módban
  useEffect(() => {
    if (mode === 'edit' && owner) {
      const formData = {
        name: owner.user.name || '',
        email: owner.user.email || '',
        phone: owner.user.phone || '',
        address: owner.address || '',
        isCompany: owner.isCompany || false,
        companyName: owner.companyName || '',
        taxNumber: owner.taxNumber || '',
        hasSeparateBilling: !!(owner.billingStreet || owner.billingCity || owner.billingPostalCode || owner.billingCountry),
        billingStreet: owner.billingStreet || '',
        billingCity: owner.billingCity || '',
        billingPostalCode: owner.billingPostalCode || '',
        billingCountry: owner.billingCountry || 'Magyarország',
      }
      
      reset(formData)
      setIsCompany(formData.isCompany)
      setHasSeparateBilling(formData.hasSeparateBilling)
      setProfilePhoto(owner.profilePhoto || null)
    }
  }, [owner, mode, reset])

  const createOwner = api.owner.createWithUser.useMutation({
    onSuccess: (data) => {
      if (onSuccess) {
        onSuccess(data.id)
      } else {
        router.push('/dashboard/owners')
      }
    },
    onError: (error) => {
      setError(error.message)
    },
  })

  const updateOwner = api.owner.update.useMutation({
    onSuccess: () => {
      if (onSuccess && ownerId) {
        onSuccess(ownerId)
      } else {
        router.push(`/dashboard/owners/${ownerId}`)
      }
    },
    onError: (error) => {
      setError(error.message)
    },
  })

  const onSubmit = async (data: OwnerFormData) => {
    setError(null)

    if (mode === 'create') {
      await createOwner.mutateAsync({
        name: data.name,
        email: data.email,
        password: data.password!,
        phone: data.phone,
        address: data.address,
        isCompany: data.isCompany,
        companyName: data.isCompany ? data.companyName : undefined,
        taxNumber: data.isCompany ? data.taxNumber : undefined,
        profilePhoto: profilePhoto || undefined,
        billingStreet: data.hasSeparateBilling ? data.billingStreet : undefined,
        billingCity: data.hasSeparateBilling ? data.billingCity : undefined,
        billingPostalCode: data.hasSeparateBilling ? data.billingPostalCode : undefined,
        billingCountry: data.hasSeparateBilling ? data.billingCountry : undefined,
      })
    } else if (mode === 'edit' && ownerId && owner) {
      await updateOwner.mutateAsync({
        id: ownerId,
        userId: owner.userId,
        userData: {
          name: data.name,
          email: data.email,
          phone: data.phone || undefined,
        },
        ownerData: {
          address: data.address || undefined,
          taxNumber: data.taxNumber || undefined,
          companyName: data.isCompany ? data.companyName : undefined,
          isCompany: data.isCompany,
          profilePhoto: profilePhoto || undefined,
          billingStreet: data.hasSeparateBilling ? data.billingStreet : undefined,
          billingCity: data.hasSeparateBilling ? data.billingCity : undefined,
          billingPostalCode: data.hasSeparateBilling ? data.billingPostalCode : undefined,
          billingCountry: data.hasSeparateBilling ? data.billingCountry : undefined,
        },
      })
    }
  }

  const watchIsCompany = watch('isCompany')
  const watchHasSeparateBilling = watch('hasSeparateBilling')

  // Betöltés állapot
  if (mode === 'edit' && isLoading) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="text-center">Betöltés...</div>
      </div>
    )
  }

  // Hibaállapot szerkesztéskor
  if (mode === 'edit' && !isLoading && !owner) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="text-center">Tulajdonos nem található</div>
      </div>
    )
  }

  const handleCancel = () => {
    if (onCancel) {
      onCancel()
    } else if (mode === 'edit' && ownerId) {
      router.push(`/dashboard/owners/${ownerId}`)
    } else {
      router.push('/dashboard/owners')
    }
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-6">
        <Button variant="ghost" onClick={handleCancel}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Vissza
        </Button>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>
            {mode === 'create' ? 'Új tulajdonos regisztrálása' : 'Tulajdonos szerkesztése'}
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

              {mode === 'create' && (
                <div>
                  <Label htmlFor="password">Jelszó *</Label>
                  <Input
                    id="password"
                    type="password"
                    {...register('password', { 
                      required: mode === 'create' ? 'A jelszó megadása kötelező' : false,
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
              )}

              <div>
                <Label htmlFor="profilePhoto">Profilkép</Label>
                <div className="mt-2">
                  <ImageUpload
                    value={profilePhoto ? [profilePhoto] : []}
                    onChange={(urls) => setProfilePhoto(urls[0] || null)}
                    maxFiles={1}
                  />
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Opcionális: Tölts fel egy profilképet a tulajdonoshoz
                </p>
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

              {/* Számlázási adatok szakasz */}
              <div className="space-y-4 border-t pt-6">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="hasSeparateBilling"
                    checked={watchHasSeparateBilling}
                    onCheckedChange={(checked) => {
                      setHasSeparateBilling(checked as boolean)
                      setValue('hasSeparateBilling', checked as boolean)
                    }}
                  />
                  <Label htmlFor="hasSeparateBilling" className="text-sm font-medium">
                    Számlázási adatok
                  </Label>
                </div>
                <p className="text-sm text-gray-500">
                  Ha be van jelölve, külön számlázási címet adhat meg. Ellenkező esetben a tulajdonos nevére lesznek kiállítva a számlák.
                </p>

                {watchHasSeparateBilling && (
                  <div className="space-y-4 ml-6 p-4 border rounded-lg bg-gray-50">
                    <h4 className="font-medium text-sm">Számlázási cím</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="billingStreet">Utca, házszám</Label>
                        <Input
                          id="billingStreet"
                          {...register('billingStreet')}
                          placeholder="Számlázási utca, házszám"
                        />
                      </div>

                      <div>
                        <Label htmlFor="billingCity">Város</Label>
                        <Input
                          id="billingCity"
                          {...register('billingCity')}
                          placeholder="Számlázási város"
                        />
                      </div>

                      <div>
                        <Label htmlFor="billingPostalCode">Irányítószám</Label>
                        <Input
                          id="billingPostalCode"
                          {...register('billingPostalCode')}
                          placeholder="1234"
                        />
                      </div>

                      <div>
                        <Label htmlFor="billingCountry">Ország</Label>
                        <Input
                          id="billingCountry"
                          {...register('billingCountry')}
                          placeholder="Magyarország"
                          defaultValue="Magyarország"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={isSubmitting || createOwner.isPending || updateOwner.isPending}
              >
                {mode === 'create' ? (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    {isSubmitting ? 'Létrehozás...' : 'Tulajdonos létrehozása'}
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {isSubmitting ? 'Mentés...' : 'Mentés'}
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
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