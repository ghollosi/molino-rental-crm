'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { api } from '@/lib/trpc/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Calendar, DollarSign, FileText, Building, User } from 'lucide-react'

const contractFormSchema = z.object({
  propertyId: z.string().min(1, 'Kérem válasszon ingatlant'),
  tenantId: z.string().min(1, 'Kérem válasszon bérlőt'),
  startDate: z.string().min(1, 'Kérem adja meg a kezdés dátumát'),
  endDate: z.string().min(1, 'Kérem adja meg a befejezés dátumát'),
  rentAmount: z.string().min(1, 'Kérem adja meg a bérleti díjat'),
  deposit: z.string().optional(),
  paymentDay: z.string()
}).refine(data => {
  const start = new Date(data.startDate)
  const end = new Date(data.endDate)
  return end > start
}, {
  message: 'A befejezés dátuma későbbi kell legyen a kezdés dátumánál',
  path: ['endDate']
})

type ContractFormData = z.infer<typeof contractFormSchema>

export default function NewContractPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ContractFormData>({
    resolver: zodResolver(contractFormSchema),
    defaultValues: {
      paymentDay: '1'
    }
  })

  const { data: properties } = api.property.list.useQuery({ 
    page: 1, 
    limit: 100,
    status: 'AVAILABLE'
  })
  
  const { data: tenants } = api.tenant.list.useQuery({ 
    page: 1, 
    limit: 100 
  })

  const createContract = api.contract.create.useMutation({
    onSuccess: (data) => {
      router.push(`/dashboard/contracts/${data.id}`)
    },
    onError: (error) => {
      console.error('Contract creation error:', error.message)
      setIsLoading(false)
    },
  })

  const onSubmit = async (data: ContractFormData) => {
    setIsLoading(true)

    createContract.mutate({
      propertyId: data.propertyId,
      tenantId: data.tenantId,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      rentAmount: parseFloat(data.rentAmount),
      deposit: data.deposit ? parseFloat(data.deposit) : undefined,
      paymentDay: parseInt(data.paymentDay)
    })
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.push('/dashboard/contracts')}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Új szerződés létrehozása</h1>
          <p className="text-gray-500">Bérleti szerződés létrehozása új bérlő számára</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Szerződés adatok
          </CardTitle>
          <CardDescription>
            Adja meg a bérleti szerződés részleteit
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {Object.keys(errors).length > 0 && (
              <Alert variant="destructive">
                <AlertDescription>
                  {Object.values(errors).map((error, idx) => (
                    <div key={idx}>{error.message}</div>
                  ))}
                </AlertDescription>
              </Alert>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="property" className="flex items-center gap-2">
                  <Building className="w-4 h-4" />
                  Ingatlan *
                </Label>
                <Select onValueChange={(value) => setValue('propertyId', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Válasszon ingatlant" />
                  </SelectTrigger>
                  <SelectContent>
                    {properties?.properties.map((property) => (
                      <SelectItem key={property.id} value={property.id}>
                        {property.street}, {property.city} ({property.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.propertyId && (
                  <p className="text-sm text-red-500">{errors.propertyId.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="tenant" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Bérlő *
                </Label>
                <Select onValueChange={(value) => setValue('tenantId', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Válasszon bérlőt" />
                  </SelectTrigger>
                  <SelectContent>
                    {tenants?.tenants.map((tenant) => (
                      <SelectItem key={tenant.id} value={tenant.id}>
                        {tenant.user.name} ({tenant.user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.tenantId && (
                  <p className="text-sm text-red-500">{errors.tenantId.message}</p>
                )}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="startDate" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Kezdés dátuma *
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  {...register('startDate')}
                />
                {errors.startDate && (
                  <p className="text-sm text-red-500">{errors.startDate.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Befejezés dátuma *
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  {...register('endDate')}
                />
                {errors.endDate && (
                  <p className="text-sm text-red-500">{errors.endDate.message}</p>
                )}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="rentAmount" className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Havi bérleti díj (Ft) *
                </Label>
                <Input
                  id="rentAmount"
                  type="number"
                  placeholder="pl. 150000"
                  {...register('rentAmount')}
                  min="0"
                  step="1000"
                />
                {errors.rentAmount && (
                  <p className="text-sm text-red-500">{errors.rentAmount.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="deposit" className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Kaució (Ft)
                </Label>
                <Input
                  id="deposit"
                  type="number"
                  placeholder="pl. 300000"
                  {...register('deposit')}
                  min="0"
                  step="1000"
                />
                {errors.deposit && (
                  <p className="text-sm text-red-500">{errors.deposit.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentDay">Havi fizetési nap</Label>
              <Select onValueChange={(value) => setValue('paymentDay', value)} defaultValue="1">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                    <SelectItem key={day} value={day.toString()}>
                      {day}. nap
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.paymentDay && (
                <p className="text-sm text-red-500">{errors.paymentDay.message}</p>
              )}
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/dashboard/contracts')}
                disabled={isLoading}
              >
                Mégse
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Létrehozás...' : 'Szerződés létrehozása'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}