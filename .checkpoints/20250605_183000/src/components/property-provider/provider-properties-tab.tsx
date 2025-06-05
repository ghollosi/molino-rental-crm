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
import { useToast } from '@/components/ui/use-toast'
import { AssignmentForm } from './assignment-form'
import { AssignmentList } from './assignment-list'
import { Plus, Search, Filter, Building, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProviderPropertiesTabProps {
  providerId: string
  providerName: string
}

export function ProviderPropertiesTab({ providerId, providerName }: ProviderPropertiesTabProps) {
  const router = useRouter()
  const { toast } = useToast()
  
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [typeFilter, setTypeFilter] = useState<string>('')

  // Fetch provider assignments
  const { 
    data: assignments, 
    isLoading: assignmentsLoading, 
    refetch: refetchAssignments 
  } = api.provider.getProviderProperties.useQuery({ providerId })

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
  })

  // Create assignment mutation
  const assignPropertyMutation = api.provider.assignToProperty.useMutation({
    onSuccess: () => {
      toast({
        title: 'Siker',
        description: 'Ingatlan sikeresen hozzárendelve a szolgáltatóhoz',
      })
      setIsAssignDialogOpen(false)
      setSelectedPropertyId('')
      refetchAssignments()
    },
    onError: (error) => {
      toast({
        title: 'Hiba',
        description: error.message || 'Hiba történt a hozzárendelés során',
        variant: 'destructive',
      })
    },
  })

  // Update assignment mutation
  const updateAssignmentMutation = api.provider.updateAssignment.useMutation({
    onSuccess: () => {
      toast({
        title: 'Siker',
        description: 'Hozzárendelés sikeresen frissítve',
      })
      refetchAssignments()
    },
    onError: (error) => {
      toast({
        title: 'Hiba',
        description: error.message || 'Hiba történt a frissítés során',
        variant: 'destructive',
      })
    },
  })

  // Remove assignment mutation
  const removeAssignmentMutation = api.provider.removeFromProperty.useMutation({
    onSuccess: () => {
      toast({
        title: 'Siker',
        description: 'Ingatlan sikeresen eltávolítva a szolgáltatótól',
      })
      refetchAssignments()
    },
    onError: (error) => {
      toast({
        title: 'Hiba',
        description: error.message || 'Hiba történt az eltávolítás során',
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

    const assignmentData = {
      providerId,
      propertyId: selectedPropertyId,
      categories: formData.categories,
      isPrimary: formData.isPrimary,
      assignmentType: formData.assignmentType,
      priority: formData.priority,
      description: formData.description,
      notes: formData.notes,
      startDate: formData.startDate,
      endDate: formData.endDate,
      isRecurring: formData.isRecurring,
      recurringPattern: formData.isRecurring ? {
        type: formData.recurringType,
        days: formData.recurringDays,
        time: formData.recurringTime,
        interval: formData.recurringInterval,
      } : undefined,
      recurringStartDate: formData.recurringStartDate,
      recurringEndDate: formData.recurringEndDate,
    }

    await assignPropertyMutation.mutateAsync(assignmentData)
  }

  const handleEditAssignment = (assignment: any) => {
    // Implement edit functionality
    console.log('Edit assignment:', assignment)
    // You can open a modal with pre-filled form data
  }

  const handleDeleteAssignment = async (assignmentId: string) => {
    const assignment = assignments?.find(a => a.id === assignmentId)
    if (!assignment) return

    await removeAssignmentMutation.mutateAsync({
      providerId,
      propertyId: assignment.property.id,
    })
  }

  const handleToggleActive = async (assignmentId: string, isActive: boolean) => {
    const assignment = assignments?.find(a => a.id === assignmentId)
    if (!assignment) return

    await updateAssignmentMutation.mutateAsync({
      propertyId: assignment.property.id,
      providerId,
      isActive,
    })
  }

  const availableProperties = propertiesData?.properties?.filter(
    (property) => !assignments?.some(a => a.property.id === property.id)
  ) || []

  const selectedProperty = propertiesData?.properties?.find(p => p.id === selectedPropertyId)

  return (
    <div className="space-y-6">
      {/* Header with action buttons */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Ingatlanok</h2>
          <p className="text-muted-foreground">
            A szolgáltatóhoz hozzárendelt ingatlanok kezelése
          </p>
        </div>
        
        <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Ingatlan hozzárendelése
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Ingatlan hozzárendelése</DialogTitle>
              <DialogDescription>
                Válasszon ingatlant és állítsa be a hozzárendelés részleteit
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Property selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Ingatlan kiválasztása</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Search and filters */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label>Keresés</Label>
                      <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Ingatlan címe..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-8"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Típus</Label>
                      <Select value={typeFilter} onValueChange={setTypeFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="Minden típus" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Minden típus</SelectItem>
                          <SelectItem value="APARTMENT">Lakás</SelectItem>
                          <SelectItem value="HOUSE">Ház</SelectItem>
                          <SelectItem value="OFFICE">Iroda</SelectItem>
                          <SelectItem value="COMMERCIAL">Kereskedelmi</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Státusz</Label>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="Minden státusz" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Minden státusz</SelectItem>
                          <SelectItem value="AVAILABLE">Elérhető</SelectItem>
                          <SelectItem value="RENTED">Bérbe adva</SelectItem>
                          <SelectItem value="MAINTENANCE">Karbantartás</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Kiválasztott ingatlan</Label>
                      <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Válasszon ingatlant" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableProperties.map((property) => (
                            <SelectItem key={property.id} value={property.id}>
                              {property.street}, {property.city}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Selected property info */}
                  {selectedProperty && (
                    <div className="p-4 border rounded-lg bg-accent/50">
                      <div className="flex items-start gap-3">
                        <Building className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div className="space-y-1">
                          <h4 className="font-medium">{selectedProperty.street}</h4>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {selectedProperty.city}
                            {selectedProperty.postalCode && `, ${selectedProperty.postalCode}`}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>Típus: {selectedProperty.type}</span>
                            <span>Státusz: {selectedProperty.status}</span>
                            {selectedProperty.size && <span>Terület: {selectedProperty.size} m²</span>}
                            {selectedProperty.rooms && <span>Szobák: {selectedProperty.rooms}</span>}
                          </div>
                          {selectedProperty.owner && (
                            <p className="text-xs text-muted-foreground">
                              Tulajdonos: {selectedProperty.owner.user.firstName} {selectedProperty.owner.user.lastName}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Assignment form */}
              {selectedPropertyId && (
                <AssignmentForm
                  mode="provider-to-property"
                  propertyName={selectedProperty ? `${selectedProperty.street}, ${selectedProperty.city}` : ''}
                  providerName={providerName}
                  onSubmit={handleAssignProperty}
                  loading={assignPropertyMutation.isLoading}
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Current assignments */}
      <AssignmentList
        assignments={assignments || []}
        mode="provider-view"
        loading={assignmentsLoading}
        onEdit={handleEditAssignment}
        onDelete={handleDeleteAssignment}
        onToggleActive={handleToggleActive}
      />

      {/* Quick stats */}
      {assignments && assignments.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-2xl font-bold">{assignments.length}</p>
                  <p className="text-xs text-muted-foreground">Összes ingatlan</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div>
                  <p className="text-2xl font-bold">
                    {assignments.filter(a => a.isPrimary).length}
                  </p>
                  <p className="text-xs text-muted-foreground">Elsődleges</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div>
                  <p className="text-2xl font-bold">
                    {assignments.filter(a => a.assignmentType === 'RECURRING').length}
                  </p>
                  <p className="text-xs text-muted-foreground">Rendszeres</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div>
                  <p className="text-2xl font-bold">
                    {assignments.filter(a => a.isActive).length}
                  </p>
                  <p className="text-xs text-muted-foreground">Aktív</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}