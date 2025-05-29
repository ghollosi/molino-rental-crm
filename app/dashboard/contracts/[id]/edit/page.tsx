'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { api } from '@/lib/trpc/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'

export default async function EditContractPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  return <EditContractContent id={id} />
}

function EditContractContent({ id }: { id: string }) {
  const router = useRouter()

  const { data: contract, isLoading } = api.contract.getById.useQuery(id)
  const updateMutation = api.contract.update.useMutation({
    onSuccess: () => {
      alert('A szerződés sikeresen frissítve!')
      router.push(`/dashboard/contracts/${id}`)
    },
    onError: (error) => {
      alert(`Hiba történt: ${error.message}`)
    },
  })

  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    rentAmount: '',
    deposit: '',
    paymentDay: '',
  })

  // Frissítjük a form adatokat amikor betöltődik a szerződés
  useEffect(() => {
    if (contract) {
      setFormData({
        startDate: contract.startDate.toISOString().split('T')[0],
        endDate: contract.endDate.toISOString().split('T')[0],
        rentAmount: contract.rentAmount?.toString() || '',
        deposit: contract.deposit?.toString() || '',
        paymentDay: contract.paymentDay?.toString() || '',
      })
    }
  }, [contract])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    updateMutation.mutate({
      id,
      startDate: new Date(formData.startDate),
      endDate: new Date(formData.endDate),
      rentAmount: formData.rentAmount ? parseFloat(formData.rentAmount) : undefined,
      deposit: formData.deposit ? parseFloat(formData.deposit) : undefined,
      paymentDay: formData.paymentDay ? parseInt(formData.paymentDay) : undefined,
    })
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="text-center">Betöltés...</div>
      </div>
    )
  }

  if (!contract) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="text-center">Szerződés nem található</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/dashboard/contracts/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Szerződés szerkesztése</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Szerződés adatai</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">Kezdő dátum *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData({ ...formData, startDate: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="endDate">Befejező dátum *</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) =>
                      setFormData({ ...formData, endDate: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="rentAmount">Bérleti díj (HUF) *</Label>
                <Input
                  id="rentAmount"
                  type="number"
                  step="0.01"
                  value={formData.rentAmount}
                  onChange={(e) =>
                    setFormData({ ...formData, rentAmount: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <Label htmlFor="deposit">Kaució (HUF)</Label>
                <Input
                  id="deposit"
                  type="number"
                  step="0.01"
                  value={formData.deposit}
                  onChange={(e) =>
                    setFormData({ ...formData, deposit: e.target.value })
                  }
                />
              </div>

              <div>
                <Label htmlFor="paymentDay">Fizetési nap (1-31)</Label>
                <Input
                  id="paymentDay"
                  type="number"
                  min="1"
                  max="31"
                  value={formData.paymentDay}
                  onChange={(e) =>
                    setFormData({ ...formData, paymentDay: e.target.value })
                  }
                />
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="submit" disabled={updateMutation.isPending}>
                  <Save className="mr-2 h-4 w-4" />
                  {updateMutation.isPending ? 'Mentés...' : 'Mentés'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(`/dashboard/contracts/${id}`)}
                >
                  Mégse
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Szerződés információk</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-gray-600">Ingatlan</Label>
              <p className="text-sm">
                {contract.property.street}, {contract.property.city}
              </p>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-600">Bérlő</Label>
              <p className="text-sm">
                {contract.tenant.user.name}
              </p>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-600">Szerződés azonosító</Label>
              <p className="text-sm font-mono">
                {contract.id}
              </p>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-600">Létrehozva</Label>
              <p className="text-sm">
                {contract.createdAt.toLocaleDateString('hu-HU')}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}