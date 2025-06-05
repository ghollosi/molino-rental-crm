'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Trash2, Plus, Lock, Unlock, Wifi, WifiOff } from 'lucide-react'
import { api } from '@/lib/trpc'

interface SmartLock {
  id: string
  lockName: string
  platform: 'TTLOCK' | 'NUKI' | 'YALE' | 'AUGUST' | 'SCHLAGE'
  externalId: string
  lockModel?: string
  location?: string
  isOnline: boolean
  batteryLevel?: number
  lockStatus: 'LOCKED' | 'UNLOCKED' | 'UNKNOWN'
}

interface SmartLockManagerProps {
  propertyId?: string
  onChange?: (smartLocks: SmartLock[]) => void
  initialSmartLocks?: SmartLock[]
  readonly?: boolean
}

const platformLabels = {
  TTLOCK: 'TTLock',
  NUKI: 'Nuki',
  YALE: 'Yale Connect',
  AUGUST: 'August Home',
  SCHLAGE: 'Schlage Encode'
}

const platformModels = {
  TTLOCK: ['TTLock Pro G3', 'TTLock Wifi G2', 'TTLock Basic'],
  NUKI: ['Nuki Smart Lock 3.0 Pro', 'Nuki Smart Lock 3.0', 'Nuki Smart Lock 2.0'],
  YALE: ['Yale Conexis L1', 'Yale Linus', 'Yale Assure Lock SL'],
  AUGUST: ['August Wi-Fi Smart Lock', 'August Smart Lock Pro', 'August Smart Lock'],
  SCHLAGE: ['Schlage Encode Plus', 'Schlage Encode', 'Schlage Connect']
}

export function SmartLockManager({ 
  propertyId, 
  onChange, 
  initialSmartLocks = [], 
  readonly = false 
}: SmartLockManagerProps) {
  const [smartLocks, setSmartLocks] = useState<SmartLock[]>(initialSmartLocks)
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [newLock, setNewLock] = useState({
    lockName: '',
    platform: '' as const,
    externalId: '',
    lockModel: '',
    location: '',
  })

  // Load existing smart locks for property
  const { data: existingLocks, refetch } = api.smartLock.getByProperty.useQuery(
    propertyId!,
    { enabled: !!propertyId }
  )

  const createLockMutation = api.smartLock.create.useMutation({
    onSuccess: (newLock) => {
      const updatedLocks = [...smartLocks, newLock as SmartLock]
      setSmartLocks(updatedLocks)
      onChange?.(updatedLocks)
      setIsAddingNew(false)
      resetNewLock()
      refetch()
    }
  })

  const deleteLockMutation = api.smartLock.delete.useMutation({
    onSuccess: () => {
      refetch()
    }
  })

  useEffect(() => {
    if (existingLocks) {
      setSmartLocks(existingLocks as SmartLock[])
      onChange?.(existingLocks as SmartLock[])
    }
  }, [existingLocks, onChange])

  const resetNewLock = () => {
    setNewLock({
      lockName: '',
      platform: '' as const,
      externalId: '',
      lockModel: '',
      location: '',
    })
  }

  const handleAddLock = () => {
    if (!newLock.lockName || !newLock.platform || !newLock.externalId) {
      return
    }

    if (propertyId) {
      // If we have propertyId, create immediately
      createLockMutation.mutate({
        propertyId,
        lockName: newLock.lockName,
        platform: newLock.platform,
        externalId: newLock.externalId,
        lockModel: newLock.lockModel,
        location: newLock.location,
      })
    } else {
      // If no propertyId, just add to local state (for new property form)
      const tempLock: SmartLock = {
        id: `temp-${Date.now()}`,
        lockName: newLock.lockName,
        platform: newLock.platform,
        externalId: newLock.externalId,
        lockModel: newLock.lockModel,
        location: newLock.location,
        isOnline: false,
        lockStatus: 'UNKNOWN'
      }
      const updatedLocks = [...smartLocks, tempLock]
      setSmartLocks(updatedLocks)
      onChange?.(updatedLocks)
      setIsAddingNew(false)
      resetNewLock()
    }
  }

  const handleRemoveLock = (lockId: string) => {
    if (lockId.startsWith('temp-')) {
      // Remove from local state
      const updatedLocks = smartLocks.filter(lock => lock.id !== lockId)
      setSmartLocks(updatedLocks)
      onChange?.(updatedLocks)
    } else {
      // Delete from database
      deleteLockMutation.mutate(lockId)
      const updatedLocks = smartLocks.filter(lock => lock.id !== lockId)
      setSmartLocks(updatedLocks)
      onChange?.(updatedLocks)
    }
  }

  const getPlatformBadgeColor = (platform: string) => {
    const colors = {
      TTLOCK: 'bg-blue-100 text-blue-800',
      NUKI: 'bg-green-100 text-green-800',
      YALE: 'bg-purple-100 text-purple-800',
      AUGUST: 'bg-orange-100 text-orange-800',
      SCHLAGE: 'bg-gray-100 text-gray-800'
    }
    return colors[platform as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getStatusIcon = (lockStatus: string, isOnline: boolean) => {
    if (!isOnline) return <WifiOff className="h-4 w-4 text-gray-400" />
    
    switch (lockStatus) {
      case 'LOCKED':
        return <Lock className="h-4 w-4 text-green-600" />
      case 'UNLOCKED':
        return <Unlock className="h-4 w-4 text-orange-600" />
      default:
        return <Wifi className="h-4 w-4 text-blue-600" />
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Smart Zárak
          {!readonly && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAddingNew(true)}
              disabled={isAddingNew}
            >
              <Plus className="h-4 w-4 mr-2" />
              Zár hozzáadása
            </Button>
          )}
        </CardTitle>
        <CardDescription>
          Az ingatlanhoz rendelt okoszárak kezelése
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Existing locks */}
          {smartLocks.map((lock) => (
            <div
              key={lock.id}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(lock.lockStatus, lock.isOnline)}
                  <div>
                    <p className="font-medium">{lock.lockName}</p>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <Badge 
                        variant="secondary" 
                        className={getPlatformBadgeColor(lock.platform)}
                      >
                        {platformLabels[lock.platform]}
                      </Badge>
                      {lock.location && <span>• {lock.location}</span>}
                      {lock.lockModel && <span>• {lock.lockModel}</span>}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {lock.batteryLevel !== undefined && (
                  <div className="text-sm text-gray-500">
                    🔋 {lock.batteryLevel}%
                  </div>
                )}
                {!readonly && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveLock(lock.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}

          {/* Add new lock form */}
          {isAddingNew && (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="lockName">Zár neve*</Label>
                  <Input
                    id="lockName"
                    placeholder="pl. Főbejárat"
                    value={newLock.lockName}
                    onChange={(e) =>
                      setNewLock({ ...newLock, lockName: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="platform">Platform*</Label>
                  <Select
                    value={newLock.platform}
                    onValueChange={(value) =>
                      setNewLock({ ...newLock, platform: value as any, lockModel: '' })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Válasszon platformot" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(platformLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="externalId">Device ID*</Label>
                  <Input
                    id="externalId"
                    placeholder={
                      newLock.platform === 'TTLOCK' ? 'TTLock ID (számok)' :
                      newLock.platform === 'NUKI' ? 'Nuki ID (hex)' :
                      'Platform specifikus ID'
                    }
                    value={newLock.externalId}
                    onChange={(e) =>
                      setNewLock({ ...newLock, externalId: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Helyszín</Label>
                  <Input
                    id="location"
                    placeholder="pl. Főbejárat, Hátsó ajtó"
                    value={newLock.location}
                    onChange={(e) =>
                      setNewLock({ ...newLock, location: e.target.value })
                    }
                  />
                </div>

                {newLock.platform && (
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="lockModel">Zár modell</Label>
                    <Select
                      value={newLock.lockModel}
                      onValueChange={(value) =>
                        setNewLock({ ...newLock, lockModel: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Válasszon modellt (opcionális)" />
                      </SelectTrigger>
                      <SelectContent>
                        {platformModels[newLock.platform as keyof typeof platformModels]?.map((model) => (
                          <SelectItem key={model} value={model}>
                            {model}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAddingNew(false)
                    resetNewLock()
                  }}
                >
                  Mégse
                </Button>
                <Button
                  type="button"
                  onClick={handleAddLock}
                  disabled={!newLock.lockName || !newLock.platform || !newLock.externalId || createLockMutation.isPending}
                >
                  {createLockMutation.isPending ? 'Hozzáadás...' : 'Hozzáadás'}
                </Button>
              </div>
            </div>
          )}

          {smartLocks.length === 0 && !isAddingNew && (
            <div className="text-center py-8 text-gray-500">
              <Lock className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Még nincs okoszár hozzárendelve ehhez az ingatlanhoz</p>
              {!readonly && (
                <p className="text-sm">Kattintson a "Zár hozzáadása" gombra az első zár hozzáadásához</p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}