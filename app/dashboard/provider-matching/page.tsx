'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Users, 
  MapPin, 
  Star, 
  Clock, 
  Settings,
  BarChart3,
  Search,
  Plus,
  Zap
} from 'lucide-react'
import { api } from '@/lib/trpc/client'
import { toast } from 'sonner'
import { ProviderSuggestions } from '@/components/provider-matching/provider-suggestions'
import { SLADashboard } from '@/components/provider-matching/sla-dashboard'

export default function ProviderMatchingPage() {
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('')
  const [selectedCategory, setSelectedCategory] = useState<'PLUMBING' | 'ELECTRICAL' | 'HVAC' | 'STRUCTURAL' | 'OTHER'>('PLUMBING')
  const [selectedPriority, setSelectedPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM')
  const [newAssignment, setNewAssignment] = useState({
    propertyId: '',
    providerId: '',
    categories: [] as string[],
    isPrimary: false
  })

  // Ingatlanok lekérése
  const { data: properties } = api.property.list.useQuery({
    page: 1,
    limit: 100
  })

  // Szolgáltatók lekérése
  const { data: providers } = api.provider.list.useQuery({
    page: 1,
    limit: 100
  })

  // Ingatlan szolgáltatóinak lekérése
  const { data: propertyProviders, refetch: refetchPropertyProviders } = 
    api.providerMatching.getPropertyProviders.useQuery(
      { propertyId: selectedPropertyId },
      { enabled: !!selectedPropertyId }
    )

  // Új hozzárendelés létrehozása
  const createAssignmentMutation = api.providerMatching.createPropertyAssignment.useMutation({
    onSuccess: () => {
      toast.success('Szolgáltató hozzárendelés sikeresen létrehozva')
      refetchPropertyProviders()
      setNewAssignment({
        propertyId: '',
        providerId: '',
        categories: [],
        isPrimary: false
      })
    },
    onError: (error) => {
      toast.error('Hiba történt a hozzárendelés során')
      console.error('Assignment error:', error)
    }
  })

  const handleCreateAssignment = () => {
    if (!newAssignment.propertyId || !newAssignment.providerId || newAssignment.categories.length === 0) {
      toast.error('Kérjük töltse ki az összes kötelező mezőt')
      return
    }

    createAssignmentMutation.mutate({
      propertyId: newAssignment.propertyId,
      providerId: newAssignment.providerId,
      categories: newAssignment.categories as any[],
      isPrimary: newAssignment.isPrimary
    })
  }

  const handleCategoryToggle = (category: string) => {
    setNewAssignment(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }))
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Szolgáltató Párosítás & SLA Kezelés</h1>
        <p className="text-gray-600">
          Automatikus szolgáltató párosítás, SLA követés és teljesítmény analitika
        </p>
      </div>

      <Tabs defaultValue="matching" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="matching" className="flex items-center space-x-2">
            <Zap className="h-4 w-4" />
            <span>Automatikus Párosítás</span>
          </TabsTrigger>
          <TabsTrigger value="assignments" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Hozzárendelések</span>
          </TabsTrigger>
          <TabsTrigger value="sla" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>SLA Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span>Beállítások</span>
          </TabsTrigger>
        </TabsList>

        {/* Automatikus Párosítás */}
        <TabsContent value="matching" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Search className="h-5 w-5" />
                <span>Szolgáltató Keresés Kritériumai</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="property">Ingatlan</Label>
                  <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Válasszon ingatlant" />
                    </SelectTrigger>
                    <SelectContent>
                      {properties?.items.map((property) => (
                        <SelectItem key={property.id} value={property.id}>
                          {property.street}, {property.city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="category">Kategória</Label>
                  <Select value={selectedCategory} onValueChange={(value: any) => setSelectedCategory(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PLUMBING">Vízvezeték</SelectItem>
                      <SelectItem value="ELECTRICAL">Elektromos</SelectItem>
                      <SelectItem value="HVAC">Fűtés/Légkondicionáló</SelectItem>
                      <SelectItem value="STRUCTURAL">Szerkezeti</SelectItem>
                      <SelectItem value="OTHER">Egyéb</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="priority">Prioritás</Label>
                  <Select value={selectedPriority} onValueChange={(value: any) => setSelectedPriority(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Alacsony</SelectItem>
                      <SelectItem value="MEDIUM">Közepes</SelectItem>
                      <SelectItem value="HIGH">Magas</SelectItem>
                      <SelectItem value="URGENT">Sürgős</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {selectedPropertyId && (
            <ProviderSuggestions
              propertyId={selectedPropertyId}
              category={selectedCategory}
              priority={selectedPriority}
              onProviderSelected={(providerId) => {
                toast.success('Szolgáltató kiválasztva: ' + providerId)
              }}
            />
          )}
        </TabsContent>

        {/* Hozzárendelések kezelése */}
        <TabsContent value="assignments" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Új hozzárendelés */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Plus className="h-5 w-5" />
                  <span>Új Szolgáltató Hozzárendelés</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Ingatlan</Label>
                  <Select 
                    value={newAssignment.propertyId} 
                    onValueChange={(value) => setNewAssignment(prev => ({ ...prev, propertyId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Válasszon ingatlant" />
                    </SelectTrigger>
                    <SelectContent>
                      {properties?.items.map((property) => (
                        <SelectItem key={property.id} value={property.id}>
                          {property.street}, {property.city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Szolgáltató</Label>
                  <Select 
                    value={newAssignment.providerId} 
                    onValueChange={(value) => setNewAssignment(prev => ({ ...prev, providerId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Válasszon szolgáltatót" />
                    </SelectTrigger>
                    <SelectContent>
                      {providers?.items.map((provider) => (
                        <SelectItem key={provider.id} value={provider.id}>
                          {provider.businessName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Szakértelem kategóriák</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {['PLUMBING', 'ELECTRICAL', 'HVAC', 'STRUCTURAL', 'OTHER'].map((category) => (
                      <Button
                        key={category}
                        variant={newAssignment.categories.includes(category) ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleCategoryToggle(category)}
                      >
                        {category}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isPrimary"
                    checked={newAssignment.isPrimary}
                    onChange={(e) => setNewAssignment(prev => ({ ...prev, isPrimary: e.target.checked }))}
                  />
                  <Label htmlFor="isPrimary">Elsődleges szolgáltató</Label>
                </div>

                <Button 
                  onClick={handleCreateAssignment}
                  disabled={createAssignmentMutation.isPending}
                  className="w-full"
                >
                  {createAssignmentMutation.isPending ? 'Létrehozás...' : 'Hozzárendelés Létrehozása'}
                </Button>
              </CardContent>
            </Card>

            {/* Meglévő hozzárendelések */}
            <Card>
              <CardHeader>
                <CardTitle>Ingatlan Szolgáltatói</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedPropertyId ? (
                  <div>
                    <p className="text-sm text-gray-600 mb-4">
                      Válasszon ingatlant a bal oldali keresőben a szolgáltatók megtekintéséhez
                    </p>
                  </div>
                ) : propertyProviders && propertyProviders.length > 0 ? (
                  <div className="space-y-3">
                    {propertyProviders.map((assignment) => (
                      <div key={assignment.id} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">
                                {assignment.provider.businessName}
                              </span>
                              {assignment.isPrimary && (
                                <Badge variant="default">Elsődleges</Badge>
                              )}
                            </div>
                            <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                              <span>{assignment.provider.user.firstName} {assignment.provider.user.lastName}</span>
                              {assignment.rating && (
                                <div className="flex items-center space-x-1">
                                  <Star className="h-3 w-3 text-yellow-500 fill-current" />
                                  <span>{assignment.rating.toFixed(1)}</span>
                                </div>
                              )}
                            </div>
                            <div className="flex gap-1 mt-2">
                              {assignment.categories.map((category) => (
                                <Badge key={category} variant="outline" className="text-xs">
                                  {category}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    Nincsenek hozzárendelt szolgáltatók
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* SLA Dashboard */}
        <TabsContent value="sla">
          <SLADashboard />
        </TabsContent>

        {/* Beállítások */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Párosítási Algoritmus Beállítások</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Minimum pontszám automatikus hozzárendeléshez</Label>
                  <Input type="number" defaultValue="50" />
                </div>
                <div>
                  <Label>Maximális kiszállási távolság (km)</Label>
                  <Input type="number" defaultValue="50" />
                </div>
                <div>
                  <Label>Válaszidő súlyozás (%)</Label>
                  <Input type="number" defaultValue="20" />
                </div>
                <div>
                  <Label>Értékelés súlyozás (%)</Label>
                  <Input type="number" defaultValue="30" />
                </div>
              </div>
              <Button>Beállítások Mentése</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>SLA Határidők</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <h4 className="font-medium">Válaszidő határok (órákban)</h4>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Label className="w-20">URGENT:</Label>
                      <Input type="number" defaultValue="2" className="w-20" />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Label className="w-20">HIGH:</Label>
                      <Input type="number" defaultValue="8" className="w-20" />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Label className="w-20">MEDIUM:</Label>
                      <Input type="number" defaultValue="24" className="w-20" />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Label className="w-20">LOW:</Label>
                      <Input type="number" defaultValue="72" className="w-20" />
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="font-medium">Megoldási idő határok (órákban)</h4>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Label className="w-20">URGENT:</Label>
                      <Input type="number" defaultValue="24" className="w-20" />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Label className="w-20">HIGH:</Label>
                      <Input type="number" defaultValue="72" className="w-20" />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Label className="w-20">MEDIUM:</Label>
                      <Input type="number" defaultValue="168" className="w-20" />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Label className="w-20">LOW:</Label>
                      <Input type="number" defaultValue="336" className="w-20" />
                    </div>
                  </div>
                </div>
              </div>
              <Button className="mt-4">SLA Beállítások Mentése</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}