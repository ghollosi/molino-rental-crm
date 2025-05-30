'use client'

import { useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/trpc/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { ArrowLeft, Plus, Calendar, Clock, Edit, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { format } from 'date-fns'

interface BookingFormData {
  propertyId: string
  checkInDate: string
  checkInTime: string
  checkOutDate: string
  checkOutTime: string
  babyBed: boolean
  childSeat: boolean
  foodPreparation: boolean
  specialRequests?: string
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'
}

export default function TenantBookingsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { id } = use(params)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingBooking, setEditingBooking] = useState<string | null>(null)
  const [formData, setFormData] = useState<BookingFormData>({
    propertyId: '',
    checkInDate: '',
    checkInTime: '14:00',
    checkOutDate: '',
    checkOutTime: '10:00',
    babyBed: false,
    childSeat: false,
    foodPreparation: false,
    specialRequests: '',
    status: 'PENDING',
  })

  const { data: tenant, isLoading } = api.tenant.getById.useQuery(id)
  const { data: bookings, refetch } = api.tenantBooking.listByTenant.useQuery(id)
  const { data: properties } = api.property.list.useQuery({ limit: 100, status: 'AVAILABLE' })
  
  const createBooking = api.tenantBooking.create.useMutation({
    onSuccess: () => {
      toast.success('Foglalás sikeresen létrehozva')
      setIsDialogOpen(false)
      resetForm()
      refetch()
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const updateBooking = api.tenantBooking.update.useMutation({
    onSuccess: () => {
      toast.success('Foglalás sikeresen frissítve')
      setIsDialogOpen(false)
      resetForm()
      refetch()
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const deleteBooking = api.tenantBooking.delete.useMutation({
    onSuccess: () => {
      toast.success('Foglalás sikeresen törölve')
      refetch()
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const resetForm = () => {
    setFormData({
      propertyId: '',
      checkInDate: '',
      checkInTime: '14:00',
      checkOutDate: '',
      checkOutTime: '10:00',
      guestCount: 1,
      babyBedRequired: false,
      childSeatRequired: false,
      foodPreparation: false,
      specialRequests: '',
      status: 'PENDING',
    })
    setEditingBooking(null)
  }

  const handleOpenDialog = (booking?: any) => {
    if (booking) {
      setEditingBooking(booking.id)
      setFormData({
        propertyId: booking.propertyId,
        checkInDate: format(new Date(booking.checkInDate), 'yyyy-MM-dd'),
        checkInTime: booking.checkInTime,
        checkOutDate: format(new Date(booking.checkOutDate), 'yyyy-MM-dd'),
        checkOutTime: booking.checkOutTime,
        babyBed: booking.babyBed,
        childSeat: booking.childSeat,
        foodPreparation: booking.foodPreparation,
        specialRequests: booking.specialRequests || '',
        status: booking.status,
      })
    } else {
      resetForm()
    }
    setIsDialogOpen(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const data = {
      ...formData,
      tenantId: id,
      checkInDate: new Date(`${formData.checkInDate}T${formData.checkInTime}`),
      checkOutDate: new Date(`${formData.checkOutDate}T${formData.checkOutTime}`),
    }

    if (editingBooking) {
      updateBooking.mutate({
        id: editingBooking,
        ...data,
      })
    } else {
      createBooking.mutate(data)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusMap = {
      PENDING: { label: 'Függőben', variant: 'secondary' as const },
      CONFIRMED: { label: 'Megerősítve', variant: 'default' as const },
      ACTIVE: { label: 'Aktív', variant: 'default' as const },
      COMPLETED: { label: 'Befejezett', variant: 'secondary' as const },
      CANCELLED: { label: 'Lemondva', variant: 'destructive' as const },
    }
    const config = statusMap[status as keyof typeof statusMap] || { label: status, variant: 'secondary' as const }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="text-center">Betöltés...</div>
      </div>
    )
  }

  if (!tenant) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="text-center">Bérlő nem található</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/dashboard/tenants/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Foglalások kezelése</h1>
      </div>

      <div className="mb-6">
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Bérlő</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">{tenant.user.name}</p>
            <p className="text-sm text-gray-500">{tenant.user.email}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Foglalások</h2>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Új foglalás
        </Button>
      </div>

      <div className="grid gap-4">
        {bookings?.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-gray-500">
              Még nincsenek foglalások
            </CardContent>
          </Card>
        ) : (
          bookings?.map((booking) => (
            <Card key={booking.id}>
              <CardContent className="py-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="font-medium">
                        Ingatlan #{booking.propertyId}
                      </h3>
                      {getStatusBadge(booking.status)}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(booking.checkInDate), 'yyyy.MM.dd')} - {format(new Date(booking.checkOutDate), 'yyyy.MM.dd')}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {booking.checkInTime} - {booking.checkOutTime}
                      </div>
                    </div>
                    {(booking.babyBed || booking.childSeat || booking.foodPreparation) && (
                      <div className="flex gap-2 flex-wrap">
                        {booking.babyBed && (
                          <Badge variant="outline">Babaágy</Badge>
                        )}
                        {booking.childSeat && (
                          <Badge variant="outline">Gyerekülés</Badge>
                        )}
                        {booking.foodPreparation && (
                          <Badge variant="outline">Étkezés előkészítés</Badge>
                        )}
                      </div>
                    )}
                    {booking.specialRequests && (
                      <p className="text-sm text-gray-600 italic">
                        "{booking.specialRequests}"
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleOpenDialog(booking)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        if (confirm('Biztosan törölni szeretné ezt a foglalást?')) {
                          deleteBooking.mutate(booking.id)
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingBooking ? 'Foglalás szerkesztése' : 'Új foglalás létrehozása'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              <div>
                <Label htmlFor="propertyId">Ingatlan *</Label>
                <Select
                  value={formData.propertyId}
                  onValueChange={(value) => setFormData({ ...formData, propertyId: value })}
                  required
                >
                  <SelectTrigger id="propertyId">
                    <SelectValue placeholder="Válasszon ingatlant" />
                  </SelectTrigger>
                  <SelectContent>
                    {properties?.properties.map((property) => (
                      <SelectItem key={property.id} value={property.id}>
                        {property.street}, {property.city} - {property.type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="checkInDate">Beköltözés dátuma *</Label>
                  <Input
                    id="checkInDate"
                    type="date"
                    value={formData.checkInDate}
                    onChange={(e) => setFormData({ ...formData, checkInDate: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="checkInTime">Beköltözés időpontja *</Label>
                  <Input
                    id="checkInTime"
                    type="time"
                    value={formData.checkInTime}
                    onChange={(e) => setFormData({ ...formData, checkInTime: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="checkOutDate">Kiköltözés dátuma *</Label>
                  <Input
                    id="checkOutDate"
                    type="date"
                    value={formData.checkOutDate}
                    onChange={(e) => setFormData({ ...formData, checkOutDate: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="checkOutTime">Kiköltözés időpontja *</Label>
                  <Input
                    id="checkOutTime"
                    type="time"
                    value={formData.checkOutTime}
                    onChange={(e) => setFormData({ ...formData, checkOutTime: e.target.value })}
                    required
                  />
                </div>
              </div>


              <div className="space-y-3">
                <Label>Speciális kérések</Label>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="babyBed"
                    checked={formData.babyBed}
                    onCheckedChange={(checked) => setFormData({ ...formData, babyBed: checked as boolean })}
                  />
                  <Label htmlFor="babyBed" className="font-normal">
                    Babaágy szükséges
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="childSeat"
                    checked={formData.childSeat}
                    onCheckedChange={(checked) => setFormData({ ...formData, childSeat: checked as boolean })}
                  />
                  <Label htmlFor="childSeat" className="font-normal">
                    Gyerekülés szükséges
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="foodPreparation"
                    checked={formData.foodPreparation}
                    onCheckedChange={(checked) => setFormData({ ...formData, foodPreparation: checked as boolean })}
                  />
                  <Label htmlFor="foodPreparation" className="font-normal">
                    Étel előkészítés kérése
                  </Label>
                </div>
              </div>

              <div>
                <Label htmlFor="specialRequests">Egyéb kérések</Label>
                <Textarea
                  id="specialRequests"
                  value={formData.specialRequests}
                  onChange={(e) => setFormData({ ...formData, specialRequests: e.target.value })}
                  placeholder="Írja le egyéb speciális kéréseit..."
                  rows={3}
                />
              </div>

              {editingBooking && (
                <div>
                  <Label htmlFor="status">Státusz</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value as BookingFormData['status'] })}
                  >
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PENDING">Függőben</SelectItem>
                      <SelectItem value="CONFIRMED">Megerősítve</SelectItem>
                      <SelectItem value="COMPLETED">Befejezett</SelectItem>
                      <SelectItem value="CANCELLED">Lemondva</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Mégse
              </Button>
              <Button type="submit" disabled={createBooking.isPending || updateBooking.isPending}>
                {editingBooking ? 'Mentés' : 'Létrehozás'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}