'use client'

import { useState } from 'react'
import { api } from '@/lib/trpc/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { CheckCircle, XCircle, Loader2, Calendar, Home, Users, TrendingUp, Euro, RefreshCw, BarChart3, MapPin } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export default function BookingSettingsPage() {
  const [isTestingConnection, setIsTestingConnection] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'success' | 'error'>('unknown')
  const [isSyncing, setIsSyncing] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [syncForm, setSyncForm] = useState({
    propertyId: '',
    roomId: '',
    dateFrom: new Date().toISOString().split('T')[0],
    dateTo: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 90 days
    basePrice: '',
    blockedDates: [] as string[],
  })
  const [reportForm, setReportForm] = useState({
    dateFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    dateTo: new Date().toISOString().split('T')[0],
    includeRevenue: true,
  })

  // Get data for dropdowns
  const { data: properties } = api.property.list.useQuery({ page: 1, limit: 100 })

  // Test Booking.com connection
  const testConnection = async () => {
    setIsTestingConnection(true)
    try {
      const result = await api.booking.testConnection.query()
      setConnectionStatus('success')
      toast.success('Booking.com Partner API kapcsolat sikeres!', {
        description: `Property: ${result.property.name} (${result.property.roomCount} szoba)`,
      })
    } catch (error: any) {
      setConnectionStatus('error')
      toast.error('Booking.com Partner API kapcsolat sikertelen', {
        description: error.message,
      })
    } finally {
      setIsTestingConnection(false)
    }
  }

  // Sync availability
  const syncAvailability = async () => {
    if (!syncForm.propertyId || !syncForm.roomId || !syncForm.basePrice) {
      toast.error('Kérjük töltse ki az összes kötelező mezőt')
      return
    }

    setIsSyncing(true)
    try {
      const result = await api.booking.syncAvailability.mutate({
        propertyId: syncForm.propertyId,
        roomId: syncForm.roomId,
        dateFrom: syncForm.dateFrom,
        dateTo: syncForm.dateTo,
        basePrice: parseFloat(syncForm.basePrice),
        blockedDates: syncForm.blockedDates,
      })

      toast.success('Elérhetőség szinkronizálva!', {
        description: `${result.updatedDates} nap frissítve, ${result.blockedDates} nap blokkolva`,
      })

      // Reset form
      setSyncForm({
        propertyId: '',
        roomId: '',
        dateFrom: new Date().toISOString().split('T')[0],
        dateTo: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        basePrice: '',
        blockedDates: [],
      })
    } catch (error: any) {
      toast.error('Elérhetőség szinkronizálása sikertelen', {
        description: error.message,
      })
    } finally {
      setIsSyncing(false)
    }
  }

  // Import reservations
  const importReservations = async () => {
    setIsImporting(true)
    try {
      const result = await api.booking.importReservations.mutate({
        dateFrom: reportForm.dateFrom,
        dateTo: reportForm.dateTo,
      })

      toast.success('Foglalások importálva!', {
        description: `${result.successfulImports}/${result.totalReservations} foglalás sikeresen importálva`,
      })
    } catch (error: any) {
      toast.error('Foglalások importálása sikertelen', {
        description: error.message,
      })
    } finally {
      setIsImporting(false)
    }
  }

  // Fetch data when connected
  const { data: propertyInfo } = api.booking.getProperty.useQuery(undefined, {
    enabled: connectionStatus === 'success',
  })

  const { data: reservations } = api.booking.getReservations.useQuery({
    dateFrom: reportForm.dateFrom,
    dateTo: reportForm.dateTo,
  }, {
    enabled: connectionStatus === 'success',
  })

  const { data: occupancyReport } = api.booking.getOccupancyReport.useQuery({
    dateFrom: reportForm.dateFrom,
    dateTo: reportForm.dateTo,
    includeRevenue: reportForm.includeRevenue,
  }, {
    enabled: connectionStatus === 'success',
  })

  const { data: occupancyStats } = api.booking.getOccupancyStats.useQuery({
    dateFrom: reportForm.dateFrom,
    dateTo: reportForm.dateTo,
  }, {
    enabled: connectionStatus === 'success',
  })

  const ConnectionStatusIcon = () => {
    switch (connectionStatus) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return null
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Booking.com Partner Integráció</h1>
        <p className="text-muted-foreground">
          Rövid távú bérlés kezelés spanyol ingatlanokhoz
        </p>
      </div>

      {/* Connection Test */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="h-5 w-5" />
            Partner API Kapcsolat
          </CardTitle>
          <CardDescription>
            Ellenőrizze a Booking.com Partner API kapcsolatot
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Button 
              onClick={testConnection} 
              disabled={isTestingConnection}
              variant="outline"
            >
              {isTestingConnection ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              API Kapcsolat Tesztelése
            </Button>
            
            {connectionStatus !== 'unknown' && (
              <div className="flex items-center gap-2">
                <ConnectionStatusIcon />
                <Badge variant={connectionStatus === 'success' ? 'default' : 'destructive'}>
                  {connectionStatus === 'success' ? 'API Kapcsolódva' : 'API Kapcsolat sikertelen'}
                </Badge>
              </div>
            )}
          </div>
          
          <div className="text-sm text-muted-foreground">
            <p><strong>Environment:</strong> {process.env.NEXT_PUBLIC_BOOKING_ENV || 'Test'}</p>
            <p><strong>API Version:</strong> Partner API v2</p>
            <p><strong>Szolgáltatások:</strong> Foglalások, elérhetőség, árak szinkronizálása</p>
          </div>
        </CardContent>
      </Card>

      {/* Property Information */}
      {propertyInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Ingatlan Információk
            </CardTitle>
            <CardDescription>
              Booking.com ingatlan adatok
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Ingatlan név</Label>
                <div className="font-medium">{propertyInfo.name}</div>
              </div>
              <div>
                <Label>Hotel ID</Label>
                <div className="font-medium">{propertyInfo.hotelId}</div>
              </div>
              <div>
                <Label>Cím</Label>
                <div className="font-medium">
                  {propertyInfo.address.street}, {propertyInfo.address.city}
                  <br />
                  {propertyInfo.address.postalCode}, {propertyInfo.address.country}
                </div>
              </div>
              <div>
                <Label>Kapcsolat</Label>
                <div className="font-medium">
                  {propertyInfo.contactInfo.phone}
                  <br />
                  {propertyInfo.contactInfo.email}
                </div>
              </div>
              <div>
                <Label>Check-in / Check-out</Label>
                <div className="font-medium">
                  {propertyInfo.checkInTime} / {propertyInfo.checkOutTime}
                </div>
              </div>
              <div>
                <Label>Időzóna</Label>
                <div className="font-medium">{propertyInfo.timezone}</div>
              </div>
            </div>
            
            {propertyInfo.rooms.length > 0 && (
              <div className="mt-4">
                <Label>Szobák ({propertyInfo.rooms.length})</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                  {propertyInfo.rooms.map((room) => (
                    <div key={room.roomId} className="border rounded p-3">
                      <div className="font-medium">{room.roomName}</div>
                      <div className="text-sm text-muted-foreground">
                        ID: {room.roomId}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Max {room.maxOccupancy} fő, {room.bedConfiguration}
                      </div>
                      <div className="text-sm font-medium text-green-600">
                        {room.basePrice} {room.currency}/éjszaka
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Availability Sync */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Elérhetőség Szinkronizálása
          </CardTitle>
          <CardDescription>
            Szinkronizálja a helyi ingatlan elérhetőségét a Booking.com-mal
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Property Selection */}
            <div className="space-y-2">
              <Label htmlFor="property">Helyi ingatlan</Label>
              <Select 
                value={syncForm.propertyId} 
                onValueChange={(value) => setSyncForm(prev => ({ ...prev, propertyId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Válasszon ingatlant" />
                </SelectTrigger>
                <SelectContent>
                  {properties?.properties?.map((property) => (
                    <SelectItem key={property.id} value={property.id}>
                      {property.address} ({property.reference || property.id.slice(0, 8)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Room ID */}
            <div className="space-y-2">
              <Label htmlFor="roomId">Booking.com Room ID</Label>
              <Input
                id="roomId"
                placeholder="pl. 12345678"
                value={syncForm.roomId}
                onChange={(e) => setSyncForm(prev => ({ ...prev, roomId: e.target.value }))}
              />
            </div>

            {/* Date Range */}
            <div className="space-y-2">
              <Label htmlFor="dateFrom">Kezdő dátum</Label>
              <Input
                id="dateFrom"
                type="date"
                value={syncForm.dateFrom}
                onChange={(e) => setSyncForm(prev => ({ ...prev, dateFrom: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateTo">Befejező dátum</Label>
              <Input
                id="dateTo"
                type="date"
                value={syncForm.dateTo}
                onChange={(e) => setSyncForm(prev => ({ ...prev, dateTo: e.target.value }))}
              />
            </div>

            {/* Base Price */}
            <div className="space-y-2">
              <Label htmlFor="basePrice">Alapár (EUR/éjszaka)</Label>
              <div className="relative">
                <Euro className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="basePrice"
                  type="number"
                  placeholder="0.00"
                  className="pl-10"
                  value={syncForm.basePrice}
                  onChange={(e) => setSyncForm(prev => ({ ...prev, basePrice: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <Button 
            onClick={syncAvailability} 
            disabled={isSyncing}
            className="w-full"
          >
            {isSyncing ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Elérhetőség Szinkronizálása
          </Button>

          <div className="text-sm text-muted-foreground space-y-1">
            <p>🏖️ <strong>Dinamikus árazás:</strong> Hétvége +30%, főszezon +50%</p>
            <p>📅 <strong>Főszezon:</strong> Június-Szeptember (spanyol tengerpart)</p>
            <p>🚫 <strong>Blokkolás:</strong> Karbantartás vagy hosszú távú bérlés esetén</p>
          </div>
        </CardContent>
      </Card>

      {/* Occupancy Statistics */}
      {occupancyStats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Kihasználtsági Statisztikák
            </CardTitle>
            <CardDescription>
              Foglaltsági adatok a kiválasztott időszakra
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {occupancyStats.occupancyRate.toFixed(1)}%
                </div>
                <div className="text-sm text-muted-foreground">Kihasználtság</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {occupancyStats.bookedNights}
                </div>
                <div className="text-sm text-muted-foreground">Foglalt éjszakák</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {occupancyStats.availableNights}
                </div>
                <div className="text-sm text-muted-foreground">Szabad éjszakák</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {occupancyStats.averageRate.toFixed(0)}€
                </div>
                <div className="text-sm text-muted-foreground">Átlagár/éjszaka</div>
              </div>
            </div>
            
            <div className="mt-4 text-center">
              <div className="text-xl font-bold text-green-600">
                {occupancyStats.totalRevenue.toFixed(2)} {occupancyStats.currency}
              </div>
              <div className="text-sm text-muted-foreground">Összes bevétel</div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Import Reservations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Foglalások Importálása
          </CardTitle>
          <CardDescription>
            Importálja a Booking.com foglalásokat a helyi adatbázisba
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="reportDateFrom">Kezdő dátum</Label>
              <Input
                id="reportDateFrom"
                type="date"
                value={reportForm.dateFrom}
                onChange={(e) => setReportForm(prev => ({ ...prev, dateFrom: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reportDateTo">Befejező dátum</Label>
              <Input
                id="reportDateTo"
                type="date"
                value={reportForm.dateTo}
                onChange={(e) => setReportForm(prev => ({ ...prev, dateTo: e.target.value }))}
              />
            </div>
          </div>

          <Button 
            onClick={importReservations} 
            disabled={isImporting}
            variant="outline"
          >
            {isImporting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Calendar className="h-4 w-4 mr-2" />
            )}
            Foglalások Importálása
          </Button>
        </CardContent>
      </Card>

      {/* Recent Reservations */}
      {reservations && reservations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Legutóbbi Foglalások
            </CardTitle>
            <CardDescription>
              Booking.com foglalások a kiválasztott időszakból
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {reservations.slice(0, 10).map((reservation) => (
                <div key={reservation.reservationId} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-medium">{reservation.guestName}</div>
                      <div className="text-sm text-muted-foreground">
                        {reservation.guestCountry} • {reservation.guestEmail}
                      </div>
                    </div>
                    <Badge variant={reservation.status === 'confirmed' ? 'default' : 'secondary'}>
                      {reservation.status}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Check-in:</span>
                      <div>{new Date(reservation.checkIn).toLocaleDateString('hu-HU')}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Check-out:</span>
                      <div>{new Date(reservation.checkOut).toLocaleDateString('hu-HU')}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Vendégek:</span>
                      <div>{reservation.adults} felnőtt{reservation.children > 0 && `, ${reservation.children} gyerek`}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Összeg:</span>
                      <div className="font-medium text-green-600">
                        {reservation.totalPrice.toFixed(2)} {reservation.currency}
                      </div>
                    </div>
                  </div>

                  {reservation.specialRequests && (
                    <div className="mt-2 text-sm">
                      <span className="text-muted-foreground">Különleges kérések:</span>
                      <div className="italic">{reservation.specialRequests}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {reservations.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                Nincsenek foglalások a megadott időszakban
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>API Konfiguráció</CardTitle>
          <CardDescription>
            Booking.com Partner API beállítások
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <strong>API Endpoint:</strong><br />
              <code className="text-xs bg-muted px-2 py-1 rounded">
                {process.env.NEXT_PUBLIC_BOOKING_ENV === 'production' 
                  ? 'https://supply-api.booking.com'
                  : 'https://supply-api.test.booking.com'
                }
              </code>
            </div>
            <div>
              <strong>Hotel ID:</strong><br />
              <code className="text-xs bg-muted px-2 py-1 rounded">
                {process.env.NEXT_PUBLIC_BOOKING_HOTEL_ID || 'Nincs beállítva'}
              </code>
            </div>
            <div>
              <strong>Username:</strong><br />
              <code className="text-xs bg-muted px-2 py-1 rounded">
                {process.env.NEXT_PUBLIC_BOOKING_USERNAME ? '***' : 'Nincs beállítva'}
              </code>
            </div>
            <div>
              <strong>Environment:</strong><br />
              <code className="text-xs bg-muted px-2 py-1 rounded">
                {process.env.NEXT_PUBLIC_BOOKING_ENV || 'test'}
              </code>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}