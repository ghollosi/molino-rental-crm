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
import { ArrowLeft, AlertCircle, Plus, Trash2, Calculator } from 'lucide-react'
import Link from 'next/link'
// Dynamic pricing átmozgatva a backend-re
import { format } from 'date-fns'

interface OfferFormData {
  propertyId: string
  issueId?: string
  laborCost?: number
  materialCost?: number
  totalAmount: number
  validUntil: string
  notes?: string
  items: {
    description: string
    quantity: number
    unitPrice: number
    total: number
  }[]
}

export default function NewOfferPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [items, setItems] = useState([
    { description: '', quantity: 1, unitPrice: 0, total: 0 }
  ])

  const { register, handleSubmit, formState: { errors, isSubmitting }, setValue, watch } = useForm<OfferFormData>({
    defaultValues: {
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 nap múlva
      items: items,
      laborCost: 0,
      materialCost: 0,
      totalAmount: 0,
    }
  })

  // Ingatlanok lekérdezése
  const { data: properties } = api.property.list.useQuery({
    page: 1,
    limit: 100,
  })

  // Hibabejelentések lekérdezése (csak nyitottak)
  const { data: issues } = api.issue.list.useQuery({ 
    page: 1, 
    limit: 100,
    status: 'OPEN'
  })

  const createOffer = api.offer.create.useMutation({
    onSuccess: () => {
      router.push('/dashboard/offers')
    },
    onError: (error) => {
      setError(error.message)
    },
  })

  const addItem = () => {
    setItems([...items, { description: '', quantity: 1, unitPrice: 0, total: 0 }])
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, field: keyof typeof items[0], value: string | number) => {
    const newItems = [...items]
    
    if (field === 'description') {
      newItems[index].description = value as string
    } else if (field === 'quantity' || field === 'unitPrice' || field === 'total') {
      newItems[index][field] = value as number
    }
    
    // Számoljuk ki az összeget
    if (field === 'quantity' || field === 'unitPrice') {
      newItems[index].total = newItems[index].quantity * newItems[index].unitPrice
    }
    
    setItems(newItems)
    
    // Számoljuk ki a teljes összeget
    const totalAmount = newItems.reduce((sum, item) => sum + item.total, 0)
    setValue('totalAmount', totalAmount)
    setValue('items', newItems)
  }

  const onSubmit = async (data: OfferFormData) => {
    setError(null)
    
    const validItems = items.filter(item => 
      item.description && item.quantity > 0 && item.unitPrice > 0
    )
    
    if (validItems.length === 0) {
      setError('Legalább egy tétel megadása kötelező')
      return
    }

    const itemsTotal = validItems.reduce((sum, item) => sum + item.total, 0)
    const totalAmount = itemsTotal + (data.laborCost || 0) + (data.materialCost || 0)

    await createOffer.mutateAsync({
      propertyId: data.propertyId,
      issueId: data.issueId || undefined,
      items: validItems,
      laborCost: data.laborCost || undefined,
      materialCost: data.materialCost || undefined,
      totalAmount: totalAmount,
      validUntil: new Date(data.validUntil),
      notes: data.notes || undefined,
    })
  }

  const watchIssueId = watch('issueId')
  const watchPropertyId = watch('propertyId')
  const watchLaborCost = watch('laborCost') || 0
  const watchMaterialCost = watch('materialCost') || 0
  const watchItems = watch('items') || []
  const itemsTotal = watchItems.reduce((sum, item) => sum + (item.total || 0), 0)
  const calculatedTotal = itemsTotal + watchLaborCost + watchMaterialCost

  // Dynamic pricing kiszámítása (egyszerűsített verzió)
  const calculateDynamicPricing = () => {
    const selectedIssue = issues?.issues.find(i => i.id === watchIssueId)
    if (!selectedIssue) {
      alert('Kérjük, válasszon hibabejelentést a dinamikus árazáshoz!')
      return
    }

    const basePrice = Number(watchLaborCost) + Number(watchMaterialCost) + itemsTotal
    let multiplier = 1.0
    let modifiers: string[] = []

    // Prioritás alapú szorzó
    switch (selectedIssue.priority) {
      case 'URGENT':
        multiplier += 0.5 // +50%
        modifiers.push('Sürgős prioritás: +50%')
        break
      case 'HIGH':
        multiplier += 0.25 // +25%
        modifiers.push('Magas prioritás: +25%')
        break
      case 'MEDIUM':
        multiplier += 0.1 // +10%
        modifiers.push('Közepes prioritás: +10%')
        break
      case 'LOW':
        multiplier += 0.0 // +0%
        modifiers.push('Alacsony prioritás: +0%')
        break
    }

    // Szezonális szorzó (egyszerű)
    const month = new Date().getMonth()
    if (month >= 11 || month <= 1) { // December-február
      multiplier += 0.15 // +15% télen
      modifiers.push('Téli szezon: +15%')
    }

    const finalPrice = basePrice * multiplier

    setValue('totalAmount', Math.round(finalPrice))
    
    // Visszajelzés a felhasználónak
    const modifierText = modifiers.join('\n')
    alert(`Dinamikus árazás alkalmazva:\n\n${modifierText}\n\nAlap ár: ${basePrice.toFixed(0)} HUF\nSzorzó: ${multiplier.toFixed(2)}x\nVégső ár: ${Math.round(finalPrice).toFixed(0)} HUF`)
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-6">
        <Button variant="ghost" asChild>
          <Link href="/dashboard/offers">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Vissza
          </Link>
        </Button>
      </div>

      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Új ajánlat készítése</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="propertyId">Ingatlan *</Label>
                <Select
                  value={watchPropertyId || ''}
                  onValueChange={(value) => setValue('propertyId', value)}
                  {...register('propertyId', { required: 'Az ingatlan kiválasztása kötelező' })}
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
                <Label htmlFor="validUntil">Érvényesség *</Label>
                <Input
                  id="validUntil"
                  type="date"
                  {...register('validUntil', { required: 'Az érvényesség megadása kötelező' })}
                />
                {errors.validUntil && (
                  <p className="text-sm text-red-500 mt-1">{errors.validUntil.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="issueId">Kapcsolódó hibabejelentés</Label>
                <div className="flex gap-2">
                  <Select
                    value={watchIssueId || undefined}
                    onValueChange={(value) => setValue('issueId', value || undefined)}
                    className="flex-1"
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Válasszon hibabejelentést (opcionális)" />
                    </SelectTrigger>
                    <SelectContent>
                      {issues?.issues.map((issue) => (
                        <SelectItem key={issue.id} value={issue.id}>
                          {issue.title} - {issue.property?.street}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {watchIssueId && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={calculateDynamicPricing}
                      className="flex items-center gap-2"
                    >
                      <Calculator className="h-4 w-4" />
                      Dinamikus ár
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="laborCost">Munkadíj</Label>
                <Input
                  id="laborCost"
                  type="number"
                  {...register('laborCost', { 
                    valueAsNumber: true,
                    min: { value: 0, message: 'A munkadíj nem lehet negatív' }
                  })}
                  placeholder="0"
                />
                {errors.laborCost && (
                  <p className="text-sm text-red-500 mt-1">{errors.laborCost.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="materialCost">Anyagköltség</Label>
                <Input
                  id="materialCost"
                  type="number"
                  {...register('materialCost', { 
                    valueAsNumber: true,
                    min: { value: 0, message: 'Az anyagköltség nem lehet negatív' }
                  })}
                  placeholder="0"
                />
                {errors.materialCost && (
                  <p className="text-sm text-red-500 mt-1">{errors.materialCost.message}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Megjegyzések</Label>
              <textarea
                id="notes"
                {...register('notes')}
                placeholder="További megjegyzések az ajánlathoz..."
                className="w-full min-h-[100px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-4">
                <Label>Tételek *</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addItem}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Tétel hozzáadása
                </Button>
              </div>

              <div className="space-y-3">
                {items.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 items-start">
                    <div className="col-span-5">
                      <Input
                        placeholder="Megnevezés"
                        value={item.description}
                        onChange={(e) => updateItem(index, 'description', e.target.value)}
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        placeholder="Mennyiség"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        placeholder="Egységár"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(index, 'unitPrice', parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        placeholder="Összeg"
                        value={item.total}
                        disabled
                      />
                    </div>
                    <div className="col-span-1">
                      {items.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 space-y-2">
                <div className="text-right">
                  <p className="text-sm text-gray-600">
                    Tételek összesen: {new Intl.NumberFormat('hu-HU', {
                      style: 'currency',
                      currency: 'HUF',
                      maximumFractionDigits: 0,
                    }).format(itemsTotal)}
                  </p>
                  {watchLaborCost > 0 && (
                    <p className="text-sm text-gray-600">
                      Munkadíj: {new Intl.NumberFormat('hu-HU', {
                        style: 'currency',
                        currency: 'HUF',
                        maximumFractionDigits: 0,
                      }).format(watchLaborCost)}
                    </p>
                  )}
                  {watchMaterialCost > 0 && (
                    <p className="text-sm text-gray-600">
                      Anyagköltség: {new Intl.NumberFormat('hu-HU', {
                        style: 'currency',
                        currency: 'HUF',
                        maximumFractionDigits: 0,
                      }).format(watchMaterialCost)}
                    </p>
                  )}
                  <p className="text-lg font-semibold mt-2 pt-2 border-t">
                    Összesen: {new Intl.NumberFormat('hu-HU', {
                      style: 'currency',
                      currency: 'HUF',
                      maximumFractionDigits: 0,
                    }).format(calculatedTotal)}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Mentés...' : 'Ajánlat létrehozása'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/dashboard/offers')}
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