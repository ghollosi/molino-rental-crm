'use client'

import { useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/trpc/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Plus, Unlink, Building } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

export default function OwnerPropertiesPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { id } = use(params)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('')

  const { data: owner, isLoading } = api.owner.getById.useQuery(id)
  const { data: availableProperties } = api.property.list.useQuery({ 
    limit: 100,
    withoutOwner: true // Only properties without assigned owner
  })
  
  const assignProperty = api.owner.assignProperty.useMutation({
    onSuccess: () => {
      toast.success('Ingatlan sikeresen hozzárendelve')
      setIsDialogOpen(false)
      setSelectedPropertyId('')
      // Refetch owner data
      router.refresh()
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const removeProperty = api.owner.removeProperty.useMutation({
    onSuccess: () => {
      toast.success('Ingatlan eltávolítva')
      router.refresh()
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const handleAssignProperty = () => {
    if (!selectedPropertyId) {
      toast.error('Válassz ki egy ingatlant')
      return
    }

    assignProperty.mutate({
      ownerId: id,
      propertyId: selectedPropertyId,
    })
  }

  const handleRemoveProperty = (propertyId: string) => {
    if (confirm('Biztosan el szeretnéd távolítani ezt az ingatlant a tulajdonostól?')) {
      removeProperty.mutate({
        ownerId: id,
        propertyId,
      })
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="text-center">Betöltés...</div>
      </div>
    )
  }

  if (!owner) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="text-center">Tulajdonos nem található</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/dashboard/owners/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Ingatlanok kezelése</h1>
      </div>

      <div className="mb-6">
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Tulajdonos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">{owner.user.name}</p>
            <p className="text-sm text-gray-500">{owner.user.email}</p>
            {owner.isCompany && owner.companyName && (
              <p className="text-sm text-gray-600">Cég: {owner.companyName}</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Tulajdonolt ingatlanok</h2>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Ingatlan hozzáadása
        </Button>
      </div>

      <div className="grid gap-4">
        {owner.properties?.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-gray-500">
              <Building className="mx-auto h-12 w-12 text-gray-300 mb-4" />
              <p>Még nincsenek hozzárendelt ingatlanok</p>
            </CardContent>
          </Card>
        ) : (
          owner.properties?.map((property) => (
            <Card key={property.id}>
              <CardContent className="py-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="font-medium">
                        {property.street}, {property.city}
                      </h3>
                      <Badge variant="secondary">{property.type}</Badge>
                      <Badge variant={property.status === 'AVAILABLE' ? 'default' : 'outline'}>
                        {property.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-500">
                      <p>{property.size}m² • {property.rooms} szoba</p>
                      {property.rentAmount && (
                        <p>Bérleti díj: {Number(property.rentAmount).toLocaleString()} Ft/hó</p>
                      )}
                    </div>
                    {property.description && (
                      <p className="text-sm text-gray-600">{property.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => router.push(`/dashboard/properties/${property.id}`)}
                      title="Részletek"
                    >
                      <Building className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleRemoveProperty(property.id)}
                      title="Eltávolítás"
                    >
                      <Unlink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ingatlan hozzárendelése</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Válassz ingatlant</label>
              <Select
                value={selectedPropertyId}
                onValueChange={setSelectedPropertyId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Válassz egy ingatlant" />
                </SelectTrigger>
                <SelectContent>
                  {availableProperties?.properties.map((property) => (
                    <SelectItem key={property.id} value={property.id}>
                      {property.street}, {property.city} ({property.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {availableProperties?.properties.length === 0 && (
              <p className="text-sm text-gray-500">
                Nincsenek elérhető ingatlanok. Minden ingatlannak már van tulajdonosa.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Mégse
            </Button>
            <Button 
              onClick={handleAssignProperty}
              disabled={!selectedPropertyId || assignProperty.isPending}
            >
              Hozzárendelés
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}