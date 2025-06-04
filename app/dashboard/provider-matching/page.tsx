'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
  Zap,
  Calculator,
  TrendingUp
} from 'lucide-react'
import { api } from '@/lib/trpc/client'
import { toast } from 'sonner'

export default function ProviderMatchingPage() {
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('')
  const [selectedCategory, setSelectedCategory] = useState<'PLUMBING' | 'ELECTRICAL' | 'HVAC' | 'STRUCTURAL' | 'OTHER'>('PLUMBING')
  const [selectedPriority, setSelectedPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM')

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

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Szolgáltató Párosítás & SLA Kezelés</h1>
        <p className="text-gray-600">
          Automatikus szolgáltató párosítás, SLA követés és teljesítmény analitika
        </p>
      </div>

      <Tabs defaultValue="matching" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="matching" className="flex items-center space-x-1">
            <Zap className="h-4 w-4" />
            <span>Párosítás</span>
          </TabsTrigger>
          <TabsTrigger value="assignments" className="flex items-center space-x-1">
            <Users className="h-4 w-4" />
            <span>Hozzárendelések</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center space-x-1">
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
                      {properties?.items?.map((property) => (
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

          <Card>
            <CardContent className="p-8 text-center">
              <div className="mb-4">
                <Calculator className="h-16 w-16 mx-auto text-blue-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Szolgáltató Párosítás Rendszer</h3>
              <p className="text-gray-600 mb-4">
                Válasszon ingatlant és kategóriát a legjobb szolgáltatók megtalálásához
              </p>
              {selectedPropertyId && (
                <Badge variant="outline" className="mb-4">
                  Ingatlan kiválasztva: {properties?.items?.find(p => p.id === selectedPropertyId)?.street}
                </Badge>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Hozzárendelések kezelése */}
        <TabsContent value="assignments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Szolgáltató Hozzárendelések</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Users className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Hozzárendelések kezelése</h3>
                <p className="text-gray-600">
                  Itt kezelheti a szolgáltató-ingatlan hozzárendeléseket
                </p>
              </div>
            </CardContent>
          </Card>
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
              </div>
              <Button>Beállítások Mentése</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}