"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AlertCircle, Lock, Unlock, Shield, Calendar, User, Clock, MapPin, Search, Download, Filter } from 'lucide-react'
import { api } from '@/lib/trpc/client'

export default function AccessLogsPage() {
  const [selectedProperty, setSelectedProperty] = useState<string>('')
  const [selectedSmartLock, setSelectedSmartLock] = useState<string>('')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [eventType, setEventType] = useState<string>('')
  const [accessorName, setAccessorName] = useState<string>('')
  const [page, setPage] = useState(1)
  const [limit] = useState(50)

  // Get properties for selection
  const { data: properties } = api.property.list.useQuery({
    page: 1,
    limit: 100
  })

  // Get smart locks for selected property
  const { data: smartLocks } = api.smartLock.list.useQuery({
    propertyId: selectedProperty || undefined,
    page: 1,
    limit: 100
  }, {
    enabled: !!selectedProperty
  })

  // Get access logs with filters
  const { data: accessLogs, isLoading, refetch } = api.smartLock.getAccessLogs.useQuery({
    propertyId: selectedProperty || undefined,
    smartLockId: selectedSmartLock && selectedSmartLock !== 'all' ? selectedSmartLock : undefined,
    startDate: startDate ? new Date(startDate) : undefined,
    endDate: endDate ? new Date(endDate) : undefined,
    eventType: eventType && eventType !== 'all' ? eventType : undefined,
    accessorName: accessorName || undefined,
    page,
    limit
  }, {
    enabled: !!selectedProperty
  })

  const handleSearch = () => {
    setPage(1)
    refetch()
  }

  const handleExport = () => {
    // TODO: Implement CSV export
    alert('Export funkció hamarosan elérhető!')
  }

  const getEventTypeIcon = (eventType: string) => {
    switch (eventType) {
      case 'UNLOCK':
        return <Unlock className="h-4 w-4 text-green-500" />
      case 'LOCK':
        return <Lock className="h-4 w-4 text-blue-500" />
      case 'UNLOCK_FAILED':
      case 'LOCK_FAILED':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Shield className="h-4 w-4 text-gray-500" />
    }
  }

  const getEventTypeBadge = (eventType: string, success: boolean) => {
    if (!success) {
      return <Badge variant="destructive">Sikertelen</Badge>
    }

    switch (eventType) {
      case 'UNLOCK':
        return <Badge variant="default" className="bg-green-500">Nyitás</Badge>
      case 'LOCK':
        return <Badge variant="default" className="bg-blue-500">Zárás</Badge>
      case 'CODE_ADDED':
        return <Badge variant="outline">Kód hozzáadás</Badge>
      case 'CODE_REMOVED':
        return <Badge variant="outline">Kód eltávolítás</Badge>
      case 'BATTERY_LOW':
        return <Badge variant="secondary" className="bg-yellow-500 text-white">Alacsony akkumulátor</Badge>
      case 'DEVICE_OFFLINE':
        return <Badge variant="destructive">Offline</Badge>
      case 'DEVICE_ONLINE':
        return <Badge variant="default" className="bg-green-500">Online</Badge>
      case 'TAMPER_ALERT':
        return <Badge variant="destructive">Biztonsági riasztás</Badge>
      default:
        return <Badge variant="outline">{eventType}</Badge>
    }
  }

  const getAccessMethodLabel = (method: string) => {
    const methods: Record<string, string> = {
      'PASSCODE': 'Kód',
      'MOBILE_APP': 'Mobil app',
      'KEYCARD': 'Kulcskártya',
      'FINGERPRINT': 'Ujjlenyomat',
      'BLUETOOTH': 'Bluetooth',
      'NFC': 'NFC',
      'REMOTE': 'Távoli',
      'MANUAL': 'Kézi (kulcs)',
      'EMERGENCY': 'Vészhelyzeti',
      'UNKNOWN': 'Ismeretlen'
    }
    return methods[method] || method
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Shield className="h-6 w-6 text-blue-600" />
        <h1 className="text-2xl font-bold">Zárhasználatok Naplója</h1>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Szűrők
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="property">Ingatlan</Label>
              <Select value={selectedProperty} onValueChange={setSelectedProperty}>
                <SelectTrigger>
                  <SelectValue placeholder="Válasszon ingatlant" />
                </SelectTrigger>
                <SelectContent>
                  {properties?.properties.map((property) => (
                    <SelectItem key={property.id} value={property.id}>
                      {property.address || `${property.street}, ${property.city}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="smartLock">Smart Zár</Label>
              <Select 
                value={selectedSmartLock} 
                onValueChange={setSelectedSmartLock}
                disabled={!selectedProperty}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Válasszon zárat" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Összes zár</SelectItem>
                  {smartLocks?.smartLocks.map((lock) => (
                    <SelectItem key={lock.id} value={lock.id}>
                      {lock.lockName} ({lock.location || 'Főbejárat'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="startDate">Kezdő dátum</Label>
              <Input
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="endDate">Befejező dátum</Label>
              <Input
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="eventType">Esemény típusa</Label>
              <Select value={eventType} onValueChange={setEventType}>
                <SelectTrigger>
                  <SelectValue placeholder="Összes esemény" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Összes esemény</SelectItem>
                  <SelectItem value="UNLOCK">Nyitás</SelectItem>
                  <SelectItem value="LOCK">Zárás</SelectItem>
                  <SelectItem value="UNLOCK_FAILED">Sikertelen nyitás</SelectItem>
                  <SelectItem value="LOCK_FAILED">Sikertelen zárás</SelectItem>
                  <SelectItem value="CODE_ADDED">Kód hozzáadás</SelectItem>
                  <SelectItem value="CODE_REMOVED">Kód eltávolítás</SelectItem>
                  <SelectItem value="BATTERY_LOW">Alacsony akkumulátor</SelectItem>
                  <SelectItem value="TAMPER_ALERT">Biztonsági riasztás</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="accessorName">Belépő neve</Label>
              <Input
                placeholder="Név keresése..."
                value={accessorName}
                onChange={(e) => setAccessorName(e.target.value)}
              />
            </div>

            <div className="flex items-end gap-2">
              <Button onClick={handleSearch} disabled={!selectedProperty || isLoading}>
                <Search className="h-4 w-4 mr-2" />
                Keresés
              </Button>
              <Button variant="outline" onClick={handleExport} disabled={!accessLogs?.logs.length}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Access Logs Table */}
      {selectedProperty && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Hozzáférési Napló ({accessLogs?.pagination.total || 0} esemény)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="text-gray-500">Betöltés...</div>
              </div>
            ) : accessLogs?.logs.length ? (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Időpont</TableHead>
                      <TableHead>Esemény</TableHead>
                      <TableHead>Belépő</TableHead>
                      <TableHead>Smart Zár</TableHead>
                      <TableHead>Módszer</TableHead>
                      <TableHead>Státusz</TableHead>
                      <TableHead>Részletek</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {accessLogs.logs.map((log) => (
                      <TableRow key={log.id} className={log.success ? '' : 'bg-red-50'}>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {new Date(log.eventTimestamp).toLocaleDateString('hu')}
                            </div>
                            <div className="text-sm text-gray-500">
                              {new Date(log.eventTimestamp).toLocaleTimeString('hu')}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getEventTypeIcon(log.eventType)}
                            {getEventTypeBadge(log.eventType, log.success)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {log.accessedBy || 'Ismeretlen'}
                            </div>
                            {log.accessedByType && (
                              <div className="text-sm text-gray-500">
                                {log.accessedByType}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{log.smartLock.lockName}</div>
                            <div className="text-sm text-gray-500">
                              {log.smartLock.location || 'Főbejárat'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {getAccessMethodLabel(log.accessMethod)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {log.flagged && (
                            <Badge variant="destructive" className="mb-1">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Gyanús
                            </Badge>
                          )}
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            {log.batteryLevel && (
                              <span>🔋 {log.batteryLevel}%</span>
                            )}
                            {log.signalStrength && (
                              <span>📶 {log.signalStrength}%</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {log.errorMessage && (
                              <div className="text-red-600">{log.errorMessage}</div>
                            )}
                            {log.notes && (
                              <div className="text-gray-600">{log.notes}</div>
                            )}
                            {log.accessCode && (
                              <div className="text-blue-600">
                                Kód: {log.accessCode.code ? '****' : 'N/A'}
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-gray-500">
                    {((page - 1) * limit) + 1}-{Math.min(page * limit, accessLogs.pagination.total)} / {accessLogs.pagination.total} esemény
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page <= 1}
                    >
                      Előző
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => p + 1)}
                      disabled={page >= accessLogs.pagination.totalPages}
                    >
                      Következő
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nincs hozzáférési napló a megadott szűrőkkel</p>
                <p className="text-sm">Válasszon ingatlant és módosítsa a szűrőket</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!selectedProperty && (
        <Card>
          <CardContent className="text-center py-12">
            <MapPin className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Válasszon ingatlant
            </h3>
            <p className="text-gray-500">
              A zárhasználatok megtekintéséhez először válasszon ki egy ingatlant.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}