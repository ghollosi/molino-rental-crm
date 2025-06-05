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
import { Plus, Search, Filter, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PropertyProvidersTabProps {
  propertyId: string
  propertyName: string
}

const getSpecialtyLabel = (specialty: string) => {
  const labels: Record<string, string> = {
    PLUMBING: 'vízvezeték',
    ELECTRICAL: 'elektromos',
    HVAC: 'fűtés/klíma',
    STRUCTURAL: 'építkezés',
    OTHER: 'egyéb'
  }
  return labels[specialty] || specialty
}

export function PropertyProvidersTab({ propertyId, propertyName }: PropertyProvidersTabProps) {
  const router = useRouter()
  const { toast } = useToast()
  
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)
  const [selectedProviderId, setSelectedProviderId] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')
  const [specialtyFilter, setSpecialtyFilter] = useState<string>('')

  // Fetch existing assignments
  const { 
    data: assignments, 
    isLoading: assignmentsLoading, 
    refetch: refetchAssignments 
  } = api.provider.getPropertyProviders.useQuery({ propertyId })

  // Fetch available providers for assignment
  const { 
    data: providersData, 
    isLoading: providersLoading 
  } = api.provider.list.useQuery({
    page: 1,
    limit: 100,
    search: searchTerm,
    specialty: specialtyFilter && specialtyFilter !== 'all' ? specialtyFilter : undefined,
  }, {
    enabled: !!specialtyFilter && specialtyFilter !== 'all', // Only fetch when specialty is selected
  })

  // Create assignment mutation
  const assignProviderMutation = api.provider.assignToProperty.useMutation({
    onSuccess: () => {
      toast({
        title: 'Siker',
        description: 'Szolgáltató sikeresen hozzárendelve az ingatlanhoz',
      })
      setIsAssignDialogOpen(false)
      setSelectedProviderId('')
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
        description: 'Szolgáltató sikeresen eltávolítva az ingatlanról',
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

  const handleAssignProvider = async (formData: any) => {
    if (!selectedProviderId) {
      toast({
        title: 'Hiba',
        description: 'Kérjük válasszon szolgáltatót',
        variant: 'destructive',
      })
      return
    }

    const assignmentData = {
      providerId: selectedProviderId,
      propertyId,
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

    await assignProviderMutation.mutateAsync(assignmentData)
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
      providerId: assignment.provider.id,
      propertyId,
    })
  }

  const handleToggleActive = async (assignmentId: string, isActive: boolean) => {
    const assignment = assignments?.find(a => a.id === assignmentId)
    if (!assignment) return

    await updateAssignmentMutation.mutateAsync({
      propertyId,
      providerId: assignment.provider.id,
      isActive,
    })
  }

  const availableProviders = providersData?.providers?.filter(
    (provider) => !assignments?.some(a => a.provider.id === provider.id)
  ) || []

  const selectedProvider = providersData?.providers?.find(p => p.id === selectedProviderId)

  return (
    <div className="space-y-6">
      {/* Header with action buttons */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Szolgáltatók</h2>
          <p className="text-muted-foreground">
            Az ingatlanhoz hozzárendelt szolgáltatók kezelése
          </p>
        </div>
        
        <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Szolgáltató hozzárendelése
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Szolgáltató hozzárendelése</DialogTitle>
              <DialogDescription>
                Válasszon szolgáltatót és állítsa be a hozzárendelés részleteit
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Provider selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Szolgáltató kiválasztása</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Search and filters */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Szakterület <span className="text-red-500">*</span></Label>
                        <Select value={specialtyFilter} onValueChange={(value) => {
                          setSpecialtyFilter(value)
                          setSelectedProviderId('') // Reset selected provider when specialty changes
                        }}>
                          <SelectTrigger>
                            <SelectValue placeholder="Válassz szakterületet" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PLUMBING">Vízvezeték</SelectItem>
                            <SelectItem value="ELECTRICAL">Elektromos</SelectItem>
                            <SelectItem value="HVAC">Fűtés/Klíma</SelectItem>
                            <SelectItem value="STRUCTURAL">Építkezés</SelectItem>
                            <SelectItem value="OTHER">Egyéb</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Keresés a kiválasztott szakterületen</Label>
                        <div className="relative">
                          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Szolgáltató neve..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-8"
                            disabled={!specialtyFilter || specialtyFilter === 'all'}
                          />
                        </div>
                      </div>
                    </div>
                    
                    {/* Provider selection */}
                    {specialtyFilter && specialtyFilter !== 'all' && (
                      <div className="space-y-2">
                        <Label>Elérhető szolgáltatók ({availableProviders.length} db)</Label>
                        <Select value={selectedProviderId} onValueChange={setSelectedProviderId}>
                          <SelectTrigger>
                            <SelectValue placeholder={
                              availableProviders.length === 0 
                                ? "Nincs elérhető szolgáltató" 
                                : "Válasszon szolgáltatót"
                            } />
                          </SelectTrigger>
                          <SelectContent>
                            {availableProviders.map((provider) => (
                              <SelectItem key={provider.id} value={provider.id}>
                                <div className="flex flex-col">
                                  <span className="font-medium">{provider.businessName}</span>
                                  <span className="text-sm text-muted-foreground">
                                    {provider.user.firstName} {provider.user.lastName}
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        
                        {availableProviders.length === 0 && (
                          <p className="text-sm text-muted-foreground">
                            Nincs {getSpecialtyLabel(specialtyFilter)} szakértelmű szolgáltató. 
                            <a href="/dashboard/providers/new" className="text-blue-600 hover:underline ml-1">
                              Hozz létre egyet
                            </a>
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Selected provider info */}
                  {selectedProvider && (
                    <div className="p-4 border rounded-lg bg-accent/50">
                      <h4 className="font-medium">{selectedProvider.businessName}</h4>
                      <p className="text-sm text-muted-foreground">
                        {selectedProvider.user.firstName} {selectedProvider.user.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {selectedProvider.user.email} | {selectedProvider.user.phone}
                      </p>
                      {selectedProvider.specialty.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs text-muted-foreground">Szakterületek:</p>
                          <p className="text-sm">{selectedProvider.specialty.join(', ')}</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Assignment form */}
              {selectedProviderId && (
                <AssignmentForm
                  mode="property-to-provider"
                  propertyName={propertyName}
                  providerName={selectedProvider?.businessName}
                  onSubmit={handleAssignProvider}
                  loading={assignProviderMutation.isLoading}
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Current assignments */}
      <AssignmentList
        assignments={assignments || []}
        mode="property-view"
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
                <Users className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-2xl font-bold">{assignments.length}</p>
                  <p className="text-xs text-muted-foreground">Összes szolgáltató</p>
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