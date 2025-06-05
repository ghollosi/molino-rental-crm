"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { Users, Plus, Trash2, Shield, CheckCircle, AlertCircle } from 'lucide-react'
import { api } from '@/lib/trpc/client'

interface ProviderAssignmentProps {
  propertyId: string
}

export function ProviderAssignment({ propertyId }: ProviderAssignmentProps) {
  const [selectedProviderId, setSelectedProviderId] = useState<string>('')
  const [isPrimary, setIsPrimary] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Get all providers
  const { data: providers } = api.provider.list.useQuery({
    page: 1,
    limit: 100
  })

  // Get property providers
  const { data: propertyProviders, refetch: refetchProviders } = api.provider.getPropertyProviders.useQuery({
    propertyId
  })

  // Assign provider mutation
  const assignProvider = api.provider.assignToProperty.useMutation({
    onSuccess: () => {
      refetchProviders()
      setSelectedProviderId('')
      setIsPrimary(false)
      setError(null)
      alert('✅ Szolgáltató sikeresen hozzárendelve és automatikus hozzáférési szabály létrehozva!')
    },
    onError: (error) => {
      setError(error.message)
    }
  })

  // Remove provider mutation
  const removeProvider = api.provider.removeFromProperty.useMutation({
    onSuccess: () => {
      refetchProviders()
      alert('✅ Szolgáltató eltávolítva az ingatlanról!')
    },
    onError: (error) => {
      setError(error.message)
    }
  })

  const handleAssignProvider = () => {
    if (!selectedProviderId) {
      setError('Kérjük válasszon szolgáltatót!')
      return
    }

    assignProvider.mutate({
      providerId: selectedProviderId,
      propertyId,
      isPrimary,
      categories: [] // TODO: Add category selection
    })
  }

  const handleRemoveProvider = (providerId: string) => {
    if (confirm('Biztosan eltávolítja ezt a szolgáltatót az ingatlanról?')) {
      removeProvider.mutate({
        providerId,
        propertyId
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Add Provider Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Szolgáltató Hozzárendelése
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Szolgáltató</label>
              <Select value={selectedProviderId} onValueChange={setSelectedProviderId}>
                <SelectTrigger>
                  <SelectValue placeholder="Válasszon szolgáltatót" />
                </SelectTrigger>
                <SelectContent>
                  {providers?.providers.map((provider) => (
                    <SelectItem key={provider.id} value={provider.id}>
                      {provider.businessName} - {provider.user.firstName} {provider.user.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2 mt-6">
              <Checkbox
                id="isPrimary"
                checked={isPrimary}
                onCheckedChange={(checked) => setIsPrimary(checked as boolean)}
              />
              <label htmlFor="isPrimary" className="text-sm font-medium">
                Elsődleges szolgáltató
              </label>
            </div>

            <div className="flex items-end">
              <Button 
                onClick={handleAssignProvider}
                disabled={!selectedProviderId || assignProvider.isPending}
                className="w-full"
              >
                {assignProvider.isPending ? 'Hozzárendelés...' : 'Hozzárendelés'}
              </Button>
            </div>
          </div>

          <div className="text-sm text-gray-600">
            <Shield className="h-4 w-4 inline mr-1" />
            A hozzárendelés automatikusan létrehoz egy hozzáférési szabályt az okoszárakhoz.
          </div>
        </CardContent>
      </Card>

      {/* Assigned Providers List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Hozzárendelt Szolgáltatók ({propertyProviders?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {propertyProviders && propertyProviders.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Szolgáltató</TableHead>
                  <TableHead>Kapcsolattartó</TableHead>
                  <TableHead>Típus</TableHead>
                  <TableHead>Státusz</TableHead>
                  <TableHead>Értékelés</TableHead>
                  <TableHead>Műveletek</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {propertyProviders.map((assignment) => (
                  <TableRow key={assignment.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{assignment.provider.businessName}</div>
                        <div className="text-sm text-gray-500">
                          {assignment.provider.specialty.join(', ')}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div>{assignment.provider.user.firstName} {assignment.provider.user.lastName}</div>
                        <div className="text-sm text-gray-500">{assignment.provider.user.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {assignment.isPrimary && (
                          <Badge variant="default">Elsődleges</Badge>
                        )}
                        <Badge variant="outline">
                          {assignment.categories.length > 0 ? 'Specializált' : 'Általános'}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      {assignment.isActive ? (
                        <Badge variant="default" className="bg-green-500">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Aktív
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          Inaktív
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <span className="text-yellow-500">★</span>
                        <span>{assignment.rating?.toFixed(1) || 'N/A'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveProvider(assignment.provider.id)}
                        disabled={removeProvider.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Még nincs hozzárendelt szolgáltató</p>
              <p className="text-sm">Adjon hozzá szolgáltatókat az ingatlan karbantartásához</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}