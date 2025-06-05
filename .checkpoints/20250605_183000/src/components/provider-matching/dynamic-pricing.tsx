'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { api } from '@/lib/trpc/client'
import { Calculator, Euro, TrendingUp, Clock, AlertTriangle, CheckCircle2, Info } from 'lucide-react'
import { format } from 'date-fns'
import { hu } from 'date-fns/locale'

interface Material {
  name: string
  cost: number
  quantity: number
}

export function DynamicPricing() {
  const [category, setCategory] = useState<string>('')
  const [priority, setPriority] = useState<string>('')
  const [propertyId, setPropertyId] = useState('')
  const [providerId, setProviderId] = useState('')
  const [estimatedHours, setEstimatedHours] = useState('')
  const [description, setDescription] = useState('')
  const [isEmergency, setIsEmergency] = useState(false)
  const [materials, setMaterials] = useState<Material[]>([])
  const [newMaterial, setNewMaterial] = useState<Material>({ name: '', cost: 0, quantity: 1 })
  const [scheduledDate, setScheduledDate] = useState('')

  // API calls
  const calculatePrice = api.providerMatching.calculatePrice.useMutation()
  const savePriceQuote = api.providerMatching.savePriceQuote.useMutation()
  const { data: properties } = api.property.list.useQuery({
    page: 1,
    limit: 100
  })
  const { data: providers } = api.provider.list.useQuery({
    page: 1,
    limit: 100
  })

  const handleCalculatePrice = async () => {
    if (!category || !priority || !propertyId) {
      alert('Kérjük töltse ki a kötelező mezőket!')
      return
    }

    try {
      await calculatePrice.mutateAsync({
        category: category as any,
        priority: priority as any,
        propertyId,
        providerId: providerId || undefined,
        estimatedHours: estimatedHours ? parseFloat(estimatedHours) : undefined,
        materials: materials.length > 0 ? materials : undefined,
        description: description || undefined,
        scheduledDate: scheduledDate ? new Date(scheduledDate) : undefined,
        isEmergency
      })
    } catch (error) {
      console.error('Pricing calculation failed:', error)
    }
  }

  const handleSaveQuote = async () => {
    if (!calculatePrice.data) {
      alert('Először számítsa ki az árat!')
      return
    }

    try {
      await savePriceQuote.mutateAsync({
        category: category as any,
        priority: priority as any,
        propertyId,
        providerId: providerId || undefined,
        estimatedHours: estimatedHours ? parseFloat(estimatedHours) : undefined,
        materials: materials.length > 0 ? materials : undefined,
        description: description || undefined,
        scheduledDate: scheduledDate ? new Date(scheduledDate) : undefined,
        isEmergency
      })
      alert('Árajánlat sikeresen mentve!')
    } catch (error) {
      console.error('Quote save failed:', error)
    }
  }

  const addMaterial = () => {
    if (newMaterial.name && newMaterial.cost > 0) {
      setMaterials([...materials, newMaterial])
      setNewMaterial({ name: '', cost: 0, quantity: 1 })
    }
  }

  const removeMaterial = (index: number) => {
    setMaterials(materials.filter((_, i) => i !== index))
  }

  const result = calculatePrice.data

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Dinamikus Árazás
          </CardTitle>
          <CardDescription>
            Intelligens árazási motor több tényező figyelembevételével
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Alapadatok */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">Kategória *</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Válasszon kategóriát" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PLUMBING">Vízvezeték</SelectItem>
                  <SelectItem value="ELECTRICAL">Villanyszerelés</SelectItem>
                  <SelectItem value="HVAC">Fűtés/Légkondicionáló</SelectItem>
                  <SelectItem value="STRUCTURAL">Építési munkák</SelectItem>
                  <SelectItem value="OTHER">Egyéb</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="priority">Prioritás *</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue placeholder="Válasszon prioritást" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Alacsony</SelectItem>
                  <SelectItem value="MEDIUM">Közepes</SelectItem>
                  <SelectItem value="HIGH">Magas</SelectItem>
                  <SelectItem value="URGENT">Sürgős</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="property">Ingatlan *</Label>
              <Select value={propertyId} onValueChange={setPropertyId}>
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
              <Label htmlFor="provider">Szolgáltató (opcionális)</Label>
              <Select value={providerId} onValueChange={setProviderId}>
                <SelectTrigger>
                  <SelectValue placeholder="Válasszon szolgáltatót" />
                </SelectTrigger>
                <SelectContent>
                  {providers?.items?.map((provider) => (
                    <SelectItem key={provider.id} value={provider.id}>
                      {provider.businessName || provider.representativeName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="hours">Becsült óraszám</Label>
              <Input
                id="hours"
                type="number"
                min="0.5"
                step="0.5"
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(e.target.value)}
                placeholder="pl. 3.5"
              />
            </div>

            <div>
              <Label htmlFor="date">Ütemezett dátum</Label>
              <Input
                id="date"
                type="datetime-local"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
              />
            </div>
          </div>

          {/* Leírás */}
          <div>
            <Label htmlFor="description">Részletes leírás</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Írja le részletesen a feladatot..."
              rows={3}
            />
          </div>

          {/* Vészhelyzet jelölő */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="emergency"
              checked={isEmergency}
              onChange={(e) => setIsEmergency(e.target.checked)}
              className="rounded border-gray-300"
            />
            <Label htmlFor="emergency" className="text-sm font-medium">
              Vészhelyzet (azonnali beavatkozás szükséges)
            </Label>
          </div>

          {/* Anyagok */}
          <div>
            <Label>Anyagok</Label>
            <div className="space-y-2">
              {materials.map((material, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                  <span className="flex-1">{material.name}</span>
                  <span>{material.quantity} db</span>
                  <span className="font-medium">{material.cost * material.quantity} €</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeMaterial(index)}
                  >
                    Törlés
                  </Button>
                </div>
              ))}
              
              <div className="flex gap-2">
                <Input
                  placeholder="Anyag neve"
                  value={newMaterial.name}
                  onChange={(e) => setNewMaterial({...newMaterial, name: e.target.value})}
                />
                <Input
                  type="number"
                  placeholder="Ár (€)"
                  value={newMaterial.cost}
                  onChange={(e) => setNewMaterial({...newMaterial, cost: parseFloat(e.target.value) || 0})}
                  className="w-24"
                />
                <Input
                  type="number"
                  placeholder="db"
                  value={newMaterial.quantity}
                  onChange={(e) => setNewMaterial({...newMaterial, quantity: parseInt(e.target.value) || 1})}
                  className="w-20"
                />
                <Button type="button" onClick={addMaterial} variant="outline">
                  Hozzáadás
                </Button>
              </div>
            </div>
          </div>

          {/* Gombok */}
          <div className="flex gap-2">
            <Button 
              onClick={handleCalculatePrice} 
              disabled={calculatePrice.isLoading}
              className="flex items-center gap-2"
            >
              <Calculator className="h-4 w-4" />
              {calculatePrice.isLoading ? 'Számítás...' : 'Ár számítása'}
            </Button>
            
            {result && (
              <Button 
                onClick={handleSaveQuote} 
                disabled={savePriceQuote.isLoading}
                variant="outline"
                className="flex items-center gap-2"
              >
                <CheckCircle2 className="h-4 w-4" />
                {savePriceQuote.isLoading ? 'Mentés...' : 'Árajánlat mentése'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Eredmény megjelenítése */}
      {result && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Ár lebontás */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Euro className="h-5 w-5" />
                Ár lebontás
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Alapdíj ({result.breakdown.baseCost}€/óra):</span>
                  <span className="font-medium">{result.breakdown.laborCost.toFixed(2)} €</span>
                </div>
                
                {result.breakdown.materialsCost > 0 && (
                  <div className="flex justify-between">
                    <span>Anyagköltség:</span>
                    <span className="font-medium">{result.breakdown.materialsCost.toFixed(2)} €</span>
                  </div>
                )}

                {/* Módosítások */}
                {Object.entries(result.breakdown.adjustments).map(([key, value]) => {
                  if (Math.abs(value) < 0.01) return null
                  const isPositive = value > 0
                  const labels: Record<string, string> = {
                    urgency: 'Sürgősségi pótlék',
                    complexity: 'Bonyolultsági pótlék',
                    seasonal: 'Szezonális pótlék',
                    demand: 'Kereslet-kínálat',
                    distance: 'Távolsági pótlék',
                    providerBonus: 'Szolgáltató prémium',
                    loyalty: 'Hűségkedvezmény',
                    bulk: 'Mennyiségi kedvezmény',
                    timeOfDay: 'Időpont pótlék'
                  }
                  
                  return (
                    <div key={key} className="flex justify-between">
                      <span>{labels[key] || key}:</span>
                      <span className={`font-medium ${isPositive ? 'text-red-600' : 'text-green-600'}`}>
                        {isPositive ? '+' : ''}{value.toFixed(2)} €
                      </span>
                    </div>
                  )
                })}

                <hr />
                <div className="flex justify-between">
                  <span>Részösszeg:</span>
                  <span className="font-medium">{result.breakdown.subtotal.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between">
                  <span>ÁFA (27%):</span>
                  <span className="font-medium">{result.breakdown.tax.toFixed(2)} €</span>
                </div>
                <hr />
                <div className="flex justify-between text-lg font-bold">
                  <span>Végösszeg:</span>
                  <span>{result.breakdown.total.toFixed(2)} €</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Információk és javaslatok */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                Információk
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Bizalmi szint */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span>Bizalmi szint:</span>
                  <Badge variant={result.confidence >= 80 ? 'default' : result.confidence >= 60 ? 'secondary' : 'destructive'}>
                    {result.confidence}%
                  </Badge>
                </div>
              </div>

              {/* Érvényesség */}
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>Érvényes: {format(new Date(result.validUntil), 'yyyy. MM. dd.', { locale: hu })}-ig</span>
              </div>

              {/* Alternatív árak */}
              {result.alternatives && (
                <div>
                  <h4 className="font-medium mb-2">Alternatív árak:</h4>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div className="text-center p-2 bg-green-50 rounded">
                      <div className="font-medium">Gazdaságos</div>
                      <div>{result.alternatives.economy} €</div>
                    </div>
                    <div className="text-center p-2 bg-blue-50 rounded">
                      <div className="font-medium">Standard</div>
                      <div>{result.alternatives.standard} €</div>
                    </div>
                    <div className="text-center p-2 bg-purple-50 rounded">
                      <div className="font-medium">Prémium</div>
                      <div>{result.alternatives.premium} €</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Javaslatok */}
              {result.recommendations.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Javaslatok:</h4>
                  <div className="space-y-2">
                    {result.recommendations.map((recommendation, index) => (
                      <Alert key={index}>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription className="text-sm">
                          {recommendation}
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}