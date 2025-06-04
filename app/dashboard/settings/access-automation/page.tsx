"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, Clock, Shield, Users, Calendar, CheckCircle } from 'lucide-react'
import { api } from '@/lib/trpc/client'

export default function AccessAutomationPage() {
  const [selectedProperty, setSelectedProperty] = useState<string>('')
  const [selectedRuleType, setSelectedRuleType] = useState<'PROVIDER' | 'TENANT'>('PROVIDER')
  const [timeRestriction, setTimeRestriction] = useState<string>('BUSINESS_HOURS')
  const [weekdays, setWeekdays] = useState<number[]>([1, 2, 3, 4, 5])
  const [customTimeStart, setCustomTimeStart] = useState<string>('09:00')
  const [customTimeEnd, setCustomTimeEnd] = useState<string>('17:00')

  // Get options from the access automation service
  const { data: timeOptions } = api.accessAutomation.getTimeRestrictionOptions.useQuery()
  const { data: weekdayOptions } = api.accessAutomation.getWeekdayOptions.useQuery()
  
  // Get properties for selection
  const { data: properties } = api.property.list.useQuery({
    page: 1,
    limit: 100
  })

  // Get access rules
  const { data: accessRules, refetch: refetchRules } = api.accessAutomation.getAccessRules.useQuery({
    propertyId: selectedProperty || undefined,
    page: 1,
    limit: 20
  })

  // Get expiring access
  const { data: expiringAccess } = api.accessAutomation.getExpiringAccess.useQuery({
    daysAhead: 7,
    propertyId: selectedProperty || undefined
  })

  // Get access violations
  const { data: violations } = api.accessAutomation.getAccessViolations.useQuery({
    propertyId: selectedProperty || undefined,
    page: 1,
    limit: 10
  })

  // Mutations
  const setupProviderAccess = api.accessAutomation.setupRegularProviderAccess.useMutation({
    onSuccess: () => {
      refetchRules()
      alert('Szolgáltató hozzáférés sikeresen beállítva!')
    }
  })

  const renewExpiring = api.accessAutomation.renewExpiringAccess.useMutation({
    onSuccess: (result) => {
      refetchRules()
      alert(`${result.renewed} hozzáférés megújítva!`)
    }
  })

  const handleSetupProviderAccess = () => {
    if (!selectedProperty) {
      alert('Kérjük válasszon ingatlant!')
      return
    }

    setupProviderAccess.mutate({
      propertyId: selectedProperty,
      providerId: 'demo-provider-id', // In real app, this would come from a provider selector
      providerType: 'REGULAR',
      timeRestriction: timeRestriction as any,
      customTimeStart: timeRestriction === 'CUSTOM' ? customTimeStart : undefined,
      customTimeEnd: timeRestriction === 'CUSTOM' ? customTimeEnd : undefined,
      allowedWeekdays: weekdays,
      renewalPeriodDays: 180, // 6 months for regular providers
      notes: 'Demo access rule setup'
    })
  }

  const toggleWeekday = (day: number) => {
    setWeekdays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day].sort()
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Shield className="h-6 w-6 text-blue-600" />
        <h1 className="text-2xl font-bold">Hozzáférés Automatizálás & Monitorozás</h1>
      </div>

      {/* Property Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Ingatlan Kiválasztás
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>
        </CardContent>
      </Card>

      {/* Access Rule Setup */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Új Hozzáférési Szabály Beállítása
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="ruleType">Szabály Típusa</Label>
              <Select value={selectedRuleType} onValueChange={(value: any) => setSelectedRuleType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PROVIDER">Szolgáltató</SelectItem>
                  <SelectItem value="TENANT">Bérlő</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="timeRestriction">Időkorlátozás</Label>
              <Select value={timeRestriction} onValueChange={setTimeRestriction}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timeOptions?.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {timeRestriction === 'CUSTOM' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="timeStart">Kezdési Idő</Label>
                <Input
                  type="time"
                  value={customTimeStart}
                  onChange={(e) => setCustomTimeStart(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="timeEnd">Befejezési Idő</Label>
                <Input
                  type="time"
                  value={customTimeEnd}
                  onChange={(e) => setCustomTimeEnd(e.target.value)}
                />
              </div>
            </div>
          )}

          <div>
            <Label>Engedélyezett Napok</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {weekdayOptions?.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`weekday-${option.value}`}
                    checked={weekdays.includes(option.value)}
                    onCheckedChange={() => toggleWeekday(option.value)}
                  />
                  <Label htmlFor={`weekday-${option.value}`} className="text-sm">
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <Button 
            onClick={handleSetupProviderAccess}
            disabled={!selectedProperty || setupProviderAccess.isLoading}
            className="w-full md:w-auto"
          >
            {setupProviderAccess.isLoading ? 'Beállítás...' : 'Hozzáférési Szabály Létrehozása'}
          </Button>
        </CardContent>
      </Card>

      {/* Current Access Rules */}
      {accessRules && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Aktív Hozzáférési Szabályok ({accessRules.rules.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {accessRules.rules.map((rule) => (
                <div key={rule.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={rule.renewalStatus === 'ACTIVE' ? 'default' : 'secondary'}>
                        {rule.ruleType}
                      </Badge>
                      <Badge variant="outline">
                        {rule.timeRestriction}
                      </Badge>
                    </div>
                    <Badge variant={rule.renewalStatus === 'ACTIVE' ? 'default' : 'destructive'}>
                      {rule.renewalStatus}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Ingatlan:</span> {rule.property.address}
                    </div>
                    <div>
                      <span className="font-medium">Megújítás:</span> {new Date(rule.nextRenewalDate).toLocaleDateString('hu')}
                    </div>
                    <div>
                      <span className="font-medium">Napok:</span> {rule.allowedWeekdays}
                    </div>
                  </div>
                  
                  <div className="mt-2">
                    <span className="font-medium">Aktív kódok:</span> {rule.accessCodes?.length || 0}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Expiring Access */}
      {expiringAccess && expiringAccess.count > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              Lejáró Hozzáférések ({expiringAccess.count})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {expiringAccess.expiring.map((rule) => (
                <div key={rule.id} className="border border-orange-200 rounded-lg p-4 bg-orange-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{rule.property.address}</div>
                      <div className="text-sm text-gray-600">
                        {rule.ruleType} - {rule.providerType || rule.tenantType}
                      </div>
                      <div className="text-sm text-orange-600">
                        Lejár: {new Date(rule.nextRenewalDate).toLocaleDateString('hu')}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              <Button 
                onClick={() => renewExpiring.mutate()}
                disabled={renewExpiring.isLoading}
                className="w-full md:w-auto"
              >
                {renewExpiring.isLoading ? 'Megújítás...' : 'Összes Lejáró Megújítása'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Access Violations */}
      {violations && violations.violations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Hozzáférési Szabálysértések ({violations.violations.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {violations.violations.map((violation) => (
                <div key={violation.id} className="border border-red-200 rounded-lg p-4 bg-red-50">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="destructive">{violation.violationType}</Badge>
                    <span className="text-sm text-gray-600">
                      {new Date(violation.accessTime).toLocaleString('hu')}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Belépő:</span> {violation.accessorName} ({violation.accessorType})
                    </div>
                    <div>
                      <span className="font-medium">Smart Lock:</span> {violation.smartLock.lockName}
                    </div>
                  </div>
                  
                  <div className="mt-2 text-sm">
                    <span className="font-medium">Ingatlan:</span> {violation.property.address}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Rendszer Állapot
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{accessRules?.rules.length || 0}</div>
              <div className="text-sm text-gray-600">Aktív Szabályok</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{expiringAccess?.count || 0}</div>
              <div className="text-sm text-gray-600">Lejáró Hozzáférések</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{violations?.violations.length || 0}</div>
              <div className="text-sm text-gray-600">Szabálysértések</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}