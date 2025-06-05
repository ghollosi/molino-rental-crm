'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/trpc/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { Plus, Search, Home, Calendar, MapPin, Building } from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { hu } from 'date-fns/locale'

interface TenantPropertiesTabProps {
  tenantId: string
  tenantName: string
}

const getRentalTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    SHORT_TERM: 'Rövid távú',
    LONG_TERM: 'Hosszú távú'
  }
  return labels[type] || type
}

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    DRAFT: 'Tervezet',
    ACTIVE: 'Aktív',
    EXPIRED: 'Lejárt', 
    TERMINATED: 'Felmondott',
    CANCELLED: 'Visszavont'
  }
  return labels[status] || status
}

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    DRAFT: 'bg-gray-500',
    ACTIVE: 'bg-green-500',
    EXPIRED: 'bg-red-500',
    TERMINATED: 'bg-orange-500', 
    CANCELLED: 'bg-gray-500'
  }
  return colors[status] || 'bg-gray-500'
}

const getPropertyTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    APARTMENT: 'Lakás',
    HOUSE: 'Ház',
    OFFICE: 'Iroda',
    COMMERCIAL: 'Üzlet',
  }
  return labels[type] || type
}

const getPropertyStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    AVAILABLE: 'Elérhető',
    RENTED: 'Bérelt',
    MAINTENANCE: 'Karbantartás',
  }
  return labels[status] || status
}

export function TenantPropertiesTab({ tenantId, tenantName }: TenantPropertiesTabProps) {
  const router = useRouter()
  const { toast } = useToast()
  
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')
  const [rentalTypeFilter, setRentalTypeFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')

  // Fetch existing contracts for this tenant
  const { 
    data: contracts, 
    isLoading: contractsLoading, 
    refetch: refetchContracts 
  } = api.contract.list.useQuery({ 
    tenantId,
    page: 1,
    limit: 100
  })

  // Fetch available properties for assignment  
  const { 
    data: propertiesData, 
    isLoading: propertiesLoading 
  } = api.property.list.useQuery({
    page: 1,
    limit: 100,
    search: searchTerm,
    status: statusFilter && statusFilter !== 'all' ? statusFilter : undefined,
    type: typeFilter && typeFilter !== 'all' ? typeFilter : undefined,
  }, {
    enabled: !!searchTerm || isAssignDialogOpen, // Only fetch when needed
  })

  // Create contract mutation
  const createContractMutation = api.contract.create.useMutation({
    onSuccess: () => {
      toast({
        title: 'Siker',
        description: 'Ingatlan sikeresen hozzárendelve a bérlőhöz',
      })
      setIsAssignDialogOpen(false)
      setSelectedPropertyId('')
      refetchContracts()
    },
    onError: (error) => {
      toast({
        title: 'Hiba', 
        description: error.message || 'Hiba történt a hozzárendelés során',
        variant: 'destructive',
      })
    },
  })

  // Update contract mutation
  const updateContractMutation = api.contract.update.useMutation({
    onSuccess: () => {
      toast({
        title: 'Siker',
        description: 'Szerződés sikeresen frissítve',
      })
      refetchContracts()
    },
    onError: (error) => {
      toast({
        title: 'Hiba',
        description: error.message || 'Hiba történt a frissítés során',
        variant: 'destructive',
      })
    },
  })

  const handleAssignProperty = async (formData: any) => {
    if (!selectedPropertyId) {
      toast({
        title: 'Hiba',
        description: 'Kérjük válasszon ingatlant',
        variant: 'destructive',
      })
      return
    }

    // Basic contract data - could be extended with a proper form
    const contractData = {
      propertyId: selectedPropertyId,
      tenantId,
      rentalType: rentalTypeFilter as 'SHORT_TERM' | 'LONG_TERM' || 'LONG_TERM',
      startDate: new Date(),
      endDate: new Date(Date.now() + (rentalTypeFilter === 'SHORT_TERM' ? 7 : 365) * 24 * 60 * 60 * 1000),
      rentAmount: 150000, // Default - should come from form
      paymentDay: 1,
    }

    await createContractMutation.mutateAsync(contractData)
  }

  const availableProperties = propertiesData?.properties?.filter(
    (property) => !contracts?.contracts?.some(c => c.property.id === property.id && c.status === 'ACTIVE')
  ) || []

  const selectedProperty = propertiesData?.properties?.find(p => p.id === selectedPropertyId)

  return (
    <div className="space-y-6">
      {/* Header with action buttons */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Ingatlanok</h2>
          <p className="text-muted-foreground">
            A bérlőhöz hozzárendelt ingatlanok és szerződések kezelése
          </p>
        </div>
        
        <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Ingatlan hozzárendelése
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Ingatlan hozzárendelése</DialogTitle>
              <DialogDescription>
                Válasszon ingatlant és hozzon létre új szerződést
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Rental type selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Bérleti típus</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Bérleti időtartam <span className="text-red-500">*</span></Label>
                    <Select value={rentalTypeFilter} onValueChange={(value) => {
                      setRentalTypeFilter(value)
                      setSelectedPropertyId('') // Reset selected property when type changes
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Válassz bérleti típust" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SHORT_TERM">Rövid távú (≤ 30 nap)</SelectItem>
                        <SelectItem value="LONG_TERM">Hosszú távú (&gt; 30 nap)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Property selection */}
              {rentalTypeFilter && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Ingatlan kiválasztása</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Keresés cím vagy város alapján</Label>
                      <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Cím vagy város..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-8"
                        />
                      </div>
                    </div>

                    {/* Additional filters */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Státusz</Label>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                          <SelectTrigger>
                            <SelectValue placeholder="Válassz státuszt" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Minden státusz</SelectItem>
                            <SelectItem value="AVAILABLE">Elérhető</SelectItem>
                            <SelectItem value="RENTED">Bérelt</SelectItem>
                            <SelectItem value="MAINTENANCE">Karbantartás</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Típus</Label>
                        <Select value={typeFilter} onValueChange={setTypeFilter}>
                          <SelectTrigger>
                            <SelectValue placeholder="Válassz típust" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Minden típus</SelectItem>
                            <SelectItem value="APARTMENT">Lakás</SelectItem>
                            <SelectItem value="HOUSE">Ház</SelectItem>
                            <SelectItem value="OFFICE">Iroda</SelectItem>
                            <SelectItem value="COMMERCIAL">Üzlet</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    {searchTerm && (
                      <div className="space-y-2">
                        <Label>Elérhető ingatlanok ({availableProperties.length} db)</Label>
                        <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
                          <SelectTrigger>
                            <SelectValue placeholder={
                              availableProperties.length === 0 
                                ? "Nincs elérhető ingatlan" 
                                : "Válasszon ingatlant"
                            } />
                          </SelectTrigger>
                          <SelectContent>
                            {availableProperties.map((property) => (
                              <SelectItem key={property.id} value={property.id}>
                                <div className="flex flex-col">
                                  <span className="font-medium">
                                    {property.street}
                                  </span>
                                  <span className="text-sm text-muted-foreground">
                                    {property.city} • {getPropertyTypeLabel(property.type)} • {getPropertyStatusLabel(property.status)}
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        
                        {availableProperties.length === 0 && searchTerm && (
                          <p className="text-sm text-muted-foreground">
                            Nincs elérhető ingatlan. 
                            <a href="/dashboard/properties/new" className="text-blue-600 hover:underline ml-1">
                              Hozz létre egyet
                            </a>
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Selected property info */}
              {selectedProperty && (
                <div className="p-4 border rounded-lg bg-accent/50">
                  <div className="flex items-start gap-3">
                    <Building className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="space-y-1">
                      <h4 className="font-medium">
                        {selectedProperty.street}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {selectedProperty.city}
                      </p>
                      <div className="flex items-center gap-2 text-xs">
                        <Badge variant="secondary">
                          {getPropertyTypeLabel(selectedProperty.type)}
                        </Badge>
                        <Badge variant="outline">
                          {getPropertyStatusLabel(selectedProperty.status)}
                        </Badge>
                        {selectedProperty.size && (
                          <span className="text-muted-foreground">
                            {selectedProperty.size} m²
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Action buttons */}
              {selectedPropertyId && (
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
                    Mégse
                  </Button>
                  <Button 
                    onClick={() => handleAssignProperty({})}
                    disabled={createContractMutation.isLoading}
                  >
                    {createContractMutation.isLoading ? 'Mentés...' : 'Szerződés létrehozása'}
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Current contracts */}
      <Card>
        <CardHeader>
          <CardTitle>Aktív szerződések</CardTitle>
          <CardDescription>
            A bérlőhöz kapcsolódó bérleti szerződések
          </CardDescription>
        </CardHeader>
        <CardContent>
          {contractsLoading ? (
            <p className="text-muted-foreground">Betöltés...</p>
          ) : contracts?.contracts && contracts.contracts.length > 0 ? (
            <div className="space-y-4">
              {contracts.contracts.map((contract) => (
                <div key={contract.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-start gap-3">
                    <Building className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="space-y-1">
                      <h4 className="font-medium">
                        {contract.property.street}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {contract.property.city}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(contract.startDate), 'yyyy.MM.dd', { locale: hu })} - 
                        {format(new Date(contract.endDate), 'yyyy.MM.dd', { locale: hu })}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {getRentalTypeLabel(contract.rentalType)}
                    </Badge>
                    <Badge className={cn("text-white", getStatusColor(contract.status))}>
                      {getStatusLabel(contract.status)}
                    </Badge>
                    <div className="text-right text-sm">
                      <p className="font-medium">
                        {Number(contract.rentAmount).toLocaleString()} Ft/hó
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Home className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Még nincsenek ingatlanok hozzárendelve ehhez a bérlőhöz.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick stats */}
      {contracts?.contracts && contracts.contracts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-2xl font-bold">{contracts.contracts.length}</p>
                  <p className="text-xs text-muted-foreground">Összes szerződés</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div>
                  <p className="text-2xl font-bold">
                    {contracts.contracts.filter(c => c.status === 'ACTIVE').length}
                  </p>
                  <p className="text-xs text-muted-foreground">Aktív</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div>
                  <p className="text-2xl font-bold">
                    {contracts.contracts.filter(c => c.rentalType === 'SHORT_TERM').length}
                  </p>
                  <p className="text-xs text-muted-foreground">Rövid távú</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div>
                  <p className="text-2xl font-bold">
                    {contracts.contracts.filter(c => c.rentalType === 'LONG_TERM').length}
                  </p>
                  <p className="text-xs text-muted-foreground">Hosszú távú</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}