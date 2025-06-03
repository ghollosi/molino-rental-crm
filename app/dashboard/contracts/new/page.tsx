'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { api } from '@/lib/trpc/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Calendar, DollarSign, FileText, Building, User } from 'lucide-react'
import { toast } from 'sonner'

const contractFormSchema = z.object({
  propertyId: z.string().min(1, 'Kérem válasszon ingatlant'),
  tenantId: z.string().min(1, 'Kérem válasszon bérlőt'),
  startDate: z.string().min(1, 'Kérem adja meg a kezdés dátumát'),
  endDate: z.string().min(1, 'Kérem adja meg a befejezés dátumát'),
  rentAmount: z.string().min(1, 'Kérem adja meg a bérleti díjat'),
  deposit: z.string().optional(),
  paymentDay: z.string(),
  templateId: z.string().optional(),
  content: z.string().optional(),
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
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [useTemplate, setUseTemplate] = useState(true)
  
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ContractFormData>({
    resolver: zodResolver(contractFormSchema),
    defaultValues: {
      paymentDay: '1'
    }
  })

  // Fetch available properties
  const { data: propertiesData } = api.property.list.useQuery({
    page: 1,
    limit: 100,
    status: 'AVAILABLE'
  })

  // Fetch available tenants
  const { data: tenantsData } = api.tenant.list.useQuery({
    page: 1,
    limit: 100
  })

  // Fetch contract templates
  const { data: templatesData } = api.contractTemplate.listActive.useQuery()

  // Create contract mutation
  const createContract = api.contract.create.useMutation({
    onSuccess: (data) => {
      toast.success('Szerződés sikeresen létrehozva')
      router.push(`/dashboard/contracts/${data.id}`)
    },
    onError: (error) => {
      toast.error(error.message || 'Hiba történt a szerződés létrehozása során')
      setIsLoading(false)
    }
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
      paymentDay: parseInt(data.paymentDay),
      templateId: useTemplate ? data.templateId : undefined,
      content: !useTemplate ? data.content : undefined,
    })
  }

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push('/dashboard/contracts')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Vissza
          </Button>
          <h1 className="text-3xl font-bold">Új szerződés</h1>
          <p className="text-gray-500">Bérleti szerződés létrehozása</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Alapadatok</CardTitle>
              <CardDescription>
                Válassza ki az ingatlant és a bérlőt
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="propertyId">
                  <Building className="w-4 h-4 inline mr-2" />
                  Ingatlan *
                </Label>
                <Select
                  value={watch('propertyId') || ''}
                  onValueChange={(value) => setValue('propertyId', value)}
                >
                  <SelectTrigger id="propertyId">
                    <SelectValue placeholder="Válasszon ingatlant..." />
                  </SelectTrigger>
                  <SelectContent>
                    {propertiesData?.properties.map((property) => (
                      <SelectItem key={property.id} value={property.id}>
                        {property.street}, {property.city} - {property.type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.propertyId && (
                  <p className="text-sm text-red-500">{errors.propertyId.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="tenantId">
                  <User className="w-4 h-4 inline mr-2" />
                  Bérlő *
                </Label>
                <Select
                  value={watch('tenantId') || ''}
                  onValueChange={(value) => setValue('tenantId', value)}
                >
                  <SelectTrigger id="tenantId">
                    <SelectValue placeholder="Válasszon bérlőt..." />
                  </SelectTrigger>
                  <SelectContent>
                    {tenantsData?.tenants.map((tenant) => (
                      <SelectItem key={tenant.id} value={tenant.id}>
                        {tenant.user.firstName} {tenant.user.lastName} - {tenant.user.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.tenantId && (
                  <p className="text-sm text-red-500">{errors.tenantId.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">
                    <Calendar className="w-4 h-4 inline mr-2" />
                    Kezdés dátuma *
                  </Label>
                  <Input
                    type="date"
                    id="startDate"
                    {...register('startDate')}
                  />
                  {errors.startDate && (
                    <p className="text-sm text-red-500">{errors.startDate.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">
                    <Calendar className="w-4 h-4 inline mr-2" />
                    Befejezés dátuma *
                  </Label>
                  <Input
                    type="date"
                    id="endDate"
                    {...register('endDate')}
                  />
                  {errors.endDate && (
                    <p className="text-sm text-red-500">{errors.endDate.message}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pénzügyi feltételek</CardTitle>
              <CardDescription>
                Bérleti díj és egyéb pénzügyi információk
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rentAmount">
                    <DollarSign className="w-4 h-4 inline mr-2" />
                    Havi bérleti díj (Ft) *
                  </Label>
                  <Input
                    type="number"
                    id="rentAmount"
                    placeholder="pl. 150000"
                    {...register('rentAmount')}
                  />
                  {errors.rentAmount && (
                    <p className="text-sm text-red-500">{errors.rentAmount.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deposit">
                    <DollarSign className="w-4 h-4 inline mr-2" />
                    Kaució (Ft)
                  </Label>
                  <Input
                    type="number"
                    id="deposit"
                    placeholder="pl. 300000"
                    {...register('deposit')}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentDay">
                  Fizetési határnap (hónap napja) *
                </Label>
                <Select
                  value={watch('paymentDay') || '1'}
                  onValueChange={(value) => setValue('paymentDay', value)}
                >
                  <SelectTrigger id="paymentDay">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[...Array(31)].map((_, i) => (
                      <SelectItem key={i + 1} value={String(i + 1)}>
                        {i + 1}. nap
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Szerződés tartalma</CardTitle>
              <CardDescription>
                Válasszon sablont vagy írja meg egyedileg a szerződést
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                <Label>
                  <input
                    type="radio"
                    checked={useTemplate}
                    onChange={() => setUseTemplate(true)}
                    className="mr-2"
                  />
                  Sablon használata
                </Label>
                <Label>
                  <input
                    type="radio"
                    checked={!useTemplate}
                    onChange={() => setUseTemplate(false)}
                    className="mr-2"
                  />
                  Egyedi szerződés
                </Label>
              </div>

              {useTemplate ? (
                <div className="space-y-2">
                  <Label htmlFor="templateId">
                    <FileText className="w-4 h-4 inline mr-2" />
                    Szerződés sablon
                  </Label>
                  <Select
                    value={watch('templateId') || ''}
                    onValueChange={(value) => setValue('templateId', value)}
                  >
                    <SelectTrigger id="templateId">
                      <SelectValue placeholder="Válasszon sablont..." />
                    </SelectTrigger>
                    <SelectContent>
                      {templatesData?.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name} ({template.type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    A kiválasztott sablon automatikusan kitöltésre kerül a szerződés adataival
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="content">
                    Szerződés szövege
                  </Label>
                  <Textarea
                    id="content"
                    placeholder="Írja be a szerződés szövegét..."
                    className="min-h-[300px]"
                    {...register('content')}
                  />
                  <p className="text-sm text-muted-foreground">
                    Írja be vagy illessze be a teljes szerződés szövegét
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/dashboard/contracts')}
            >
              Mégse
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Mentés...' : 'Szerződés létrehozása'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}