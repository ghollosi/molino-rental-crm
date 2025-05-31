'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { api } from '@/lib/trpc/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react'
import Link from 'next/link'

interface OfferItem {
  description: string
  quantity: number
  unitPrice: number
  total: number
}

export default function EditOfferPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const { data: offer, isLoading } = api.offer.getById.useQuery(id)
  const updateMutation = api.offer.update.useMutation({
    onSuccess: () => {
      alert('Az ajánlat sikeresen frissítve!')
      router.push(`/dashboard/offers/${id}`)
    },
    onError: (error) => {
      alert(`Hiba történt: ${error.message}`)
    },
  })

  const [formData, setFormData] = useState({
    items: [] as OfferItem[],
    laborCost: '',
    materialCost: '',
    totalAmount: '',
    validUntil: '',
    notes: '',
  })

  // Frissítjük a form adatokat amikor betöltődik az ajánlat
  useEffect(() => {
    if (offer) {
      setFormData({
        items: offer.items || [],
        laborCost: offer.laborCost?.toString() || '',
        materialCost: offer.materialCost?.toString() || '',
        totalAmount: offer.totalAmount?.toString() || '',
        validUntil: offer.validUntil ? offer.validUntil.toISOString().split('T')[0] : '',
        notes: offer.notes || '',
      })
    }
  }, [offer])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    updateMutation.mutate({
      id,
      items: formData.items,
      laborCost: formData.laborCost ? parseFloat(formData.laborCost) : undefined,
      materialCost: formData.materialCost ? parseFloat(formData.materialCost) : undefined,
      totalAmount: formData.totalAmount ? parseFloat(formData.totalAmount) : undefined,
      validUntil: formData.validUntil ? new Date(formData.validUntil) : undefined,
      notes: formData.notes || undefined,
    })
  }

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { description: '', quantity: 1, unitPrice: 0, total: 0 }],
    })
  }

  const removeItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    })
  }

  const updateItem = (index: number, field: keyof OfferItem, value: string | number) => {
    const newItems = [...formData.items]
    newItems[index] = { ...newItems[index], [field]: value }
    
    // Auto-calculate total when quantity or unitPrice changes
    if (field === 'quantity' || field === 'unitPrice') {
      newItems[index].total = newItems[index].quantity * newItems[index].unitPrice
    }
    
    setFormData({ ...formData, items: newItems })
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="text-center">Betöltés...</div>
      </div>
    )
  }

  if (!offer) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="text-center">Ajánlat nem található</div>
      </div>
    )
  }

  if (offer.status !== 'DRAFT') {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Szerkesztés nem lehetséges</h1>
          <p>Csak piszkozat állapotú ajánlatok szerkeszthetők.</p>
          <Button asChild className="mt-4">
            <Link href={`/dashboard/offers/${id}`}>Vissza az ajánlathoz</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/dashboard/offers/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Ajánlat szerkesztése</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Ajánlat tételei
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="mr-2 h-4 w-4" />
                Tétel hozzáadása
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {formData.items.map((item, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-6 gap-4 p-4 border rounded-lg">
                  <div className="md:col-span-2">
                    <Label htmlFor={`item-desc-${index}`}>Leírás</Label>
                    <Input
                      id={`item-desc-${index}`}
                      value={item.description}
                      onChange={(e) => updateItem(index, 'description', e.target.value)}
                      placeholder="Munkálat/anyag leírása"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor={`item-qty-${index}`}>Mennyiség</Label>
                    <Input
                      id={`item-qty-${index}`}
                      type="number"
                      step="0.01"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor={`item-price-${index}`}>Egységár</Label>
                    <Input
                      id={`item-price-${index}`}
                      type="number"
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  
                  <div>
                    <Label>Összesen</Label>
                    <Input value={item.total.toFixed(2)} readOnly className="bg-gray-50" />
                  </div>
                  
                  <div className="flex items-end">
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      onClick={() => removeItem(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              
              {formData.items.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  Nincs tétel hozzáadva. Kattints a "Tétel hozzáadása" gombra.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Költségek és részletek</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="laborCost">Munkadíj</Label>
                <Input
                  id="laborCost"
                  type="number"
                  step="0.01"
                  value={formData.laborCost}
                  onChange={(e) => setFormData({ ...formData, laborCost: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="materialCost">Anyagköltség</Label>
                <Input
                  id="materialCost"
                  type="number"
                  step="0.01"
                  value={formData.materialCost}
                  onChange={(e) => setFormData({ ...formData, materialCost: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="totalAmount">Végösszeg</Label>
                <Input
                  id="totalAmount"
                  type="number"
                  step="0.01"
                  value={formData.totalAmount}
                  onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="validUntil">Érvényesség</Label>
              <Input
                id="validUntil"
                type="date"
                value={formData.validUntil}
                onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="notes">Megjegyzések</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={4}
                placeholder="További információk, feltételek..."
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button type="submit" disabled={updateMutation.isPending}>
            <Save className="mr-2 h-4 w-4" />
            {updateMutation.isPending ? 'Mentés...' : 'Mentés'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/dashboard/offers/${id}`)}
          >
            Mégse
          </Button>
        </div>
      </form>
    </div>
  )
}