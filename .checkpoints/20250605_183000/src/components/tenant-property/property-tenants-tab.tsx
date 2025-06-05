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
import { Plus, Search, User, Calendar, Home, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { hu } from 'date-fns/locale'

interface PropertyTenantsTabProps {
  propertyId: string
  propertyName: string
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

export function PropertyTenantsTab({ propertyId, propertyName }: PropertyTenantsTabProps) {
  const router = useRouter()
  const { toast } = useToast()
  
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)
  const [selectedTenantId, setSelectedTenantId] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')
  const [rentalTypeFilter, setRentalTypeFilter] = useState<string>('')

  // Fetch existing contracts for this property
  const { 
    data: contracts, 
    isLoading: contractsLoading, 
    refetch: refetchContracts 
  } = api.contract.getByProperty.useQuery({ propertyId })

  // Fetch available tenants for assignment  
  const { 
    data: tenantsData, 
    isLoading: tenantsLoading 
  } = api.tenant.list.useQuery({
    page: 1,
    limit: 100,
    search: searchTerm,
  }, {
    enabled: !!searchTerm || isAssignDialogOpen, // Only fetch when needed
  })

  // Create contract mutation
  const createContractMutation = api.contract.create.useMutation({
    onSuccess: () => {
      toast({
        title: 'Siker',
        description: 'Bérlő sikeresen hozzárendelve az ingatlanhoz',
      })
      setIsAssignDialogOpen(false)
      setSelectedTenantId('')
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

  const handleAssignTenant = async (formData: any) => {
    if (!selectedTenantId) {
      toast({
        title: 'Hiba',
        description: 'Kérjük válasszon bérlőt',
        variant: 'destructive',
      })
      return
    }

    // Basic contract data - could be extended with a proper form
    const contractData = {
      propertyId,
      tenantId: selectedTenantId,
      rentalType: rentalTypeFilter as 'SHORT_TERM' | 'LONG_TERM' || 'LONG_TERM',
      startDate: new Date(),
      endDate: new Date(Date.now() + (rentalTypeFilter === 'SHORT_TERM' ? 7 : 365) * 24 * 60 * 60 * 1000),
      rentAmount: 150000, // Default - should come from form
      paymentDay: 1,
    }

    await createContractMutation.mutateAsync(contractData)
  }

  const availableTenants = tenantsData?.tenants?.filter(
    (tenant) => !contracts?.some(c => c.tenant.id === tenant.id && c.status === 'ACTIVE')
  ) || []

  const selectedTenant = tenantsData?.tenants?.find(t => t.id === selectedTenantId)

  return (
    <div className="space-y-6">
      {/* Header with action buttons */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Bérlők</h2>
          <p className="text-muted-foreground">
            Az ingatlanhoz hozzárendelt bérlők és szerződések kezelése
          </p>
        </div>
        
        <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Bérlő hozzárendelése
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Bérlő hozzárendelése</DialogTitle>
              <DialogDescription>
                Válasszon bérlőt és hozzon létre új szerződést
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
                      setSelectedTenantId('') // Reset selected tenant when type changes
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

              {/* Tenant selection */}
              {rentalTypeFilter && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Bérlő kiválasztása</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Keresés bérlő neve vagy email alapján</Label>
                      <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Bérlő neve vagy email..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-8"
                        />
                      </div>
                    </div>
                    
                    {searchTerm && (
                      <div className="space-y-2">
                        <Label>Elérhető bérlők ({availableTenants.length} db)</Label>
                        <Select value={selectedTenantId} onValueChange={setSelectedTenantId}>
                          <SelectTrigger>
                            <SelectValue placeholder={
                              availableTenants.length === 0 
                                ? "Nincs elérhető bérlő" 
                                : "Válasszon bérlőt"
                            } />
                          </SelectTrigger>
                          <SelectContent>
                            {availableTenants.map((tenant) => (
                              <SelectItem key={tenant.id} value={tenant.id}>
                                <div className="flex flex-col">
                                  <span className="font-medium">
                                    {tenant.user.firstName} {tenant.user.lastName}
                                  </span>
                                  <span className="text-sm text-muted-foreground">
                                    {tenant.user.email}
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        
                        {availableTenants.length === 0 && searchTerm && (
                          <p className="text-sm text-muted-foreground">
                            Nincs elérhető bérlő. 
                            <a href="/dashboard/tenants/new" className="text-blue-600 hover:underline ml-1">
                              Hozz létre egyet
                            </a>
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Selected tenant info */}
              {selectedTenant && (
                <div className="p-4 border rounded-lg bg-accent/50">
                  <div className="flex items-start gap-3">
                    <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="space-y-1">
                      <h4 className="font-medium">
                        {selectedTenant.user.firstName} {selectedTenant.user.lastName}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {selectedTenant.user.email}
                      </p>
                      {selectedTenant.user.phone && (
                        <p className="text-sm text-muted-foreground">
                          {selectedTenant.user.phone}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Action buttons */}
              {selectedTenantId && (
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
                    Mégse
                  </Button>
                  <Button 
                    onClick={() => handleAssignTenant({})}
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
            Az ingatlanhoz kapcsolódó bérleti szerződések
          </CardDescription>
        </CardHeader>
        <CardContent>
          {contractsLoading ? (
            <p className="text-muted-foreground">Betöltés...</p>
          ) : contracts && contracts.length > 0 ? (
            <div className="space-y-4">
              {contracts.map((contract) => (
                <div key={contract.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-start gap-3">
                    <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="space-y-1">
                      <h4 className="font-medium">
                        {contract.tenant.user.firstName} {contract.tenant.user.lastName}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {contract.tenant.user.email}
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
              <p>Még nincsenek bérlők hozzárendelve ehhez az ingatlanhoz.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick stats */}
      {contracts && contracts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-2xl font-bold">{contracts.length}</p>
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
                    {contracts.filter(c => c.status === 'ACTIVE').length}
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
                    {contracts.filter(c => c.rentalType === 'SHORT_TERM').length}
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
                    {contracts.filter(c => c.rentalType === 'LONG_TERM').length}
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