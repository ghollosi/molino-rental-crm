'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  Lock, 
  Unlock,
  Plus,
  Settings,
  Shield,
  Key,
  Smartphone,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Battery,
  Wifi,
  WifiOff,
  MapPin,
  User,
  Users,
  Wrench,
  Eye,
  Trash2,
  RefreshCw
} from 'lucide-react'
import { api } from '@/lib/trpc/client'
import { useToast } from '@/hooks/use-toast'

interface SmartLock {
  id: string
  lockName: string
  lockAlias?: string
  location?: string
  lockStatus: 'LOCKED' | 'UNLOCKED' | 'UNKNOWN' | 'MAINTENANCE' | 'LOW_BATTERY' | 'OFFLINE'
  batteryLevel?: number
  isOnline: boolean
  property: {
    id: string
    address?: string
    street: string
    city: string
  }
  accessCodes: Array<{
    id: string
    codeType: string
    endDate: Date
  }>
}

export default function SmartLocksPage() {
  const { toast } = useToast()
  const [selectedProperty, setSelectedProperty] = useState('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showCodeDialog, setShowCodeDialog] = useState(false)
  const [selectedLock, setSelectedLock] = useState<SmartLock | null>(null)

  // Get properties for selection
  const { data: properties } = api.property.list.useQuery({
    page: 1,
    limit: 100
  })

  // Get smart locks
  const { data: smartLocksData, refetch: refetchLocks } = api.smartLock.list.useQuery({
    propertyId: selectedProperty || undefined,
    page: 1,
    limit: 100
  })

  // Create smart lock mutation
  const createLockMutation = api.smartLock.create.useMutation({
    onSuccess: () => {
      toast({
        title: "Siker",
        description: "Smart zár sikeresen regisztrálva!",
      })
      setShowCreateDialog(false)
      refetchLocks()
    },
    onError: (error) => {
      toast({
        title: "Hiba",
        description: error.message,
        variant: "destructive"
      })
    }
  })

  // Remote access mutation
  const remoteAccessMutation = api.smartLock.remoteAccess.useMutation({
    onSuccess: (data) => {
      toast({
        title: "Siker",
        description: `Zár sikeresen ${data.action === 'unlock' ? 'nyitva' : 'zárva'}!`,
      })
      refetchLocks()
    },
    onError: (error) => {
      toast({
        title: "Hiba",
        description: error.message,
        variant: "destructive"
      })
    }
  })

  // Sync status mutation
  const syncStatusMutation = api.smartLock.syncStatus.useMutation({
    onSuccess: () => {
      toast({
        title: "Siker",
        description: "Zár állapot szinkronizálva!",
      })
      refetchLocks()
    },
    onError: (error) => {
      toast({
        title: "Hiba",
        description: error.message,
        variant: "destructive"
      })
    }
  })

  const getLockStatusColor = (status: string) => {
    switch (status) {
      case 'LOCKED': return 'text-green-600'
      case 'UNLOCKED': return 'text-blue-600'
      case 'LOW_BATTERY': return 'text-yellow-600'
      case 'OFFLINE': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getLockStatusBadge = (status: string) => {
    switch (status) {
      case 'LOCKED': return <Badge variant="default" className="bg-green-100 text-green-800">Zárva</Badge>
      case 'UNLOCKED': return <Badge variant="default" className="bg-blue-100 text-blue-800">Nyitva</Badge>
      case 'LOW_BATTERY': return <Badge variant="destructive">Alacsony töltöttség</Badge>
      case 'OFFLINE': return <Badge variant="destructive">Offline</Badge>
      default: return <Badge variant="outline">Ismeretlen</Badge>
    }
  }

  const handleRemoteAccess = (lockId: string, action: 'unlock' | 'lock') => {
    remoteAccessMutation.mutate({
      smartLockId: lockId,
      action,
      reason: `Remote ${action} via admin panel`
    })
  }

  const handleSyncStatus = (lockId: string) => {
    syncStatusMutation.mutate({ id: lockId })
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Lock className="h-8 w-8" />
          Smart Zárak Kezelése
        </h1>
        <p className="text-gray-600">
          TTLock intelligens zárak felügyelete és távoli vezérlése
        </p>
      </div>

      {/* Property Filter & Actions */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="min-w-64">
            <Label htmlFor="property-filter">Ingatlan szűrő</Label>
            <Select value={selectedProperty} onValueChange={setSelectedProperty}>
              <SelectTrigger>
                <SelectValue placeholder="Összes ingatlan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Összes ingatlan</SelectItem>
                {properties?.properties?.map((property) => (
                  <SelectItem key={property.id} value={property.id}>
                    {property.address || `${property.street}, ${property.city}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Új Smart Zár
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Smart Zár Regisztrálása</DialogTitle>
            </DialogHeader>
            <CreateLockForm 
              properties={properties?.properties || []}
              onSubmit={(data) => createLockMutation.mutate(data)}
              isLoading={createLockMutation.isLoading}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Smart Locks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {smartLocksData?.smartLocks?.map((lock) => (
          <Card key={lock.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{lock.lockName}</CardTitle>
                {getLockStatusBadge(lock.lockStatus)}
              </div>
              {lock.lockAlias && (
                <CardDescription>{lock.lockAlias}</CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Property Info */}
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="h-4 w-4" />
                <span>{lock.property.address || `${lock.property.street}, ${lock.property.city}`}</span>
              </div>

              {/* Location */}
              {lock.location && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="h-4 w-4" />
                  <span>{lock.location}</span>
                </div>
              )}

              {/* Status Indicators */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {lock.isOnline ? (
                    <Wifi className="h-4 w-4 text-green-600" />
                  ) : (
                    <WifiOff className="h-4 w-4 text-red-600" />
                  )}
                  <span className="text-sm">
                    {lock.isOnline ? 'Online' : 'Offline'}
                  </span>
                </div>

                {lock.batteryLevel && (
                  <div className="flex items-center gap-1">
                    <Battery className={`h-4 w-4 ${lock.batteryLevel < 20 ? 'text-red-600' : 'text-green-600'}`} />
                    <span className="text-sm">{lock.batteryLevel}%</span>
                  </div>
                )}
              </div>

              {/* Access Codes Count */}
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Key className="h-4 w-4" />
                <span>{lock.accessCodes.length} aktív kód</span>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <Button
                  size="sm"
                  variant={lock.lockStatus === 'LOCKED' ? 'default' : 'outline'}
                  onClick={() => handleRemoteAccess(lock.id, lock.lockStatus === 'LOCKED' ? 'unlock' : 'lock')}
                  disabled={!lock.isOnline || remoteAccessMutation.isLoading}
                >
                  {lock.lockStatus === 'LOCKED' ? (
                    <>
                      <Unlock className="h-4 w-4 mr-1" />
                      Nyitás
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4 mr-1" />
                      Zárás
                    </>
                  )}
                </Button>
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleSyncStatus(lock.id)}
                  disabled={syncStatusMutation.isLoading}
                >
                  <RefreshCw className={`h-4 w-4 mr-1 ${syncStatusMutation.isLoading ? 'animate-spin' : ''}`} />
                  Sync
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedLock(lock)
                    setShowCodeDialog(true)
                  }}
                >
                  <Key className="h-4 w-4 mr-1" />
                  Kódok
                </Button>
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    // TODO: Navigate to lock details/logs
                  }}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Naplók
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {smartLocksData?.smartLocks?.length === 0 && (
        <Card className="py-12">
          <CardContent className="text-center">
            <Lock className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-500 mb-2">
              Nincsenek smart zárak
            </h3>
            <p className="text-gray-400 mb-4">
              Regisztrálj TTLock smart zárakat az ingatlanaidhoz
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Első Smart Zár Hozzáadása
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Access Codes Dialog */}
      <Dialog open={showCodeDialog} onOpenChange={setShowCodeDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              Hozzáférési Kódok - {selectedLock?.lockName}
            </DialogTitle>
          </DialogHeader>
          {selectedLock && (
            <AccessCodesManager 
              lockId={selectedLock.id} 
              onClose={() => setShowCodeDialog(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Create Lock Form Component
function CreateLockForm({ 
  properties, 
  onSubmit, 
  isLoading 
}: { 
  properties: any[]
  onSubmit: (data: any) => void
  isLoading: boolean 
}) {
  const [formData, setFormData] = useState({
    propertyId: '',
    ttlockId: '',
    lockName: '',
    lockAlias: '',
    location: '',
    floor: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      ...formData,
      floor: formData.floor ? parseInt(formData.floor) : undefined
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="propertyId">Ingatlan *</Label>
        <Select value={formData.propertyId} onValueChange={(value) => setFormData(prev => ({ ...prev, propertyId: value }))}>
          <SelectTrigger>
            <SelectValue placeholder="Válassz ingatlant" />
          </SelectTrigger>
          <SelectContent>
            {properties.map((property) => (
              <SelectItem key={property.id} value={property.id}>
                {property.address || `${property.street}, ${property.city}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="ttlockId">TTLock Device ID *</Label>
        <Input
          id="ttlockId"
          value={formData.ttlockId}
          onChange={(e) => setFormData(prev => ({ ...prev, ttlockId: e.target.value }))}
          placeholder="123456789"
          required
        />
      </div>

      <div>
        <Label htmlFor="lockName">Zár neve *</Label>
        <Input
          id="lockName"
          value={formData.lockName}
          onChange={(e) => setFormData(prev => ({ ...prev, lockName: e.target.value }))}
          placeholder="Főbejárat"
          required
        />
      </div>

      <div>
        <Label htmlFor="lockAlias">Becenév</Label>
        <Input
          id="lockAlias"
          value={formData.lockAlias}
          onChange={(e) => setFormData(prev => ({ ...prev, lockAlias: e.target.value }))}
          placeholder="Bejárati ajtó"
        />
      </div>

      <div>
        <Label htmlFor="location">Helyszín</Label>
        <Input
          id="location"
          value={formData.location}
          onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
          placeholder="Főbejárat, 1. emelet"
        />
      </div>

      <div>
        <Label htmlFor="floor">Emelet</Label>
        <Input
          id="floor"
          type="number"
          value={formData.floor}
          onChange={(e) => setFormData(prev => ({ ...prev, floor: e.target.value }))}
          placeholder="1"
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Regisztrálás...' : 'Smart Zár Regisztrálása'}
        </Button>
      </div>
    </form>
  )
}

// Access Codes Manager Component
function AccessCodesManager({ lockId, onClose }: { lockId: string, onClose: () => void }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Hozzáférési kódok kezelése itt lesz implementálva...
      </p>
      <Button onClick={onClose}>Bezárás</Button>
    </div>
  )
}