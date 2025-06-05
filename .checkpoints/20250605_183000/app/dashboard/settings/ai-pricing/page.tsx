'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
// import { Progress } from '@/components/ui/progress' // Removed as not available
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Brain, 
  TrendingUp, 
  Calendar, 
  MapPin, 
  Euro, 
  Zap, 
  CheckCircle,
  AlertCircle,
  Loader2,
  Target,
  BarChart3,
  Cloud,
  Users
} from 'lucide-react'
import { api } from '@/lib/trpc/client'
import { useToast } from '@/hooks/use-toast'

interface PricingRecommendation {
  basePrice: number
  recommendedPrice: number
  minPrice: number
  maxPrice: number
  confidence: number
  factors: Array<{
    name: string
    impact: number
    weight: number
    description: string
  }>
  reasoning: string
}

export default function AIPricingPage() {
  const { toast } = useToast()
  const [selectedProperty, setSelectedProperty] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [basePrice, setBasePrice] = useState('')
  const [recommendation, setRecommendation] = useState<PricingRecommendation | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  // Get properties for selection
  const { data: properties } = api.property.list.useQuery({
    page: 1,
    limit: 100
  })

  // Get AI recommendation mutation (treating as mutation for manual trigger)
  const getRecommendationMutation = api.aiPricing.getRecommendation.useMutation({
    onSuccess: (data) => {
      console.log('AI pricing response:', data)
      setRecommendation(data)
      setIsAnalyzing(false)
      toast({
        title: "AI Elemzés Kész",
        description: "Árazási ajánlás sikeresen generálva!",
      })
    },
    onError: (error) => {
      setIsAnalyzing(false)
      console.error('AI pricing error:', error)
      toast({
        title: "Hiba",
        description: error.message || 'Ismeretlen hiba történt',
        variant: "destructive"
      })
    }
  })

  // Apply recommendation
  const applyRecommendationMutation = api.aiPricing.applyRecommendation.useMutation({
    onSuccess: () => {
      toast({
        title: "Siker",
        description: "AI árazás sikeresen alkalmazva!",
      })
    },
    onError: (error) => {
      toast({
        title: "Hiba",
        description: error.message,
        variant: "destructive"
      })
    }
  })

  const handleAnalyze = async () => {
    console.log('Debug values:', { selectedProperty, selectedDate, basePrice })
    
    if (!selectedProperty || !selectedDate || !basePrice) {
      toast({
        title: "Hiányzó adatok",
        description: `Hiányzó: ${!selectedProperty ? 'ingatlan ' : ''}${!selectedDate ? 'dátum ' : ''}${!basePrice ? 'alapár' : ''}`,
        variant: "destructive"
      })
      return
    }

    setIsAnalyzing(true)
    getRecommendationMutation.mutate({
      propertyId: selectedProperty,
      date: new Date(selectedDate),
      basePrice: parseFloat(basePrice)
    })
  }

  const handleApply = async () => {
    if (!recommendation) return

    applyRecommendationMutation.mutate({
      propertyId: selectedProperty,
      date: new Date(selectedDate),
      price: recommendation.recommendedPrice,
      source: 'ai'
    })
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600'
    if (confidence >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 80) return <Badge variant="default" className="bg-green-100 text-green-800">Magas</Badge>
    if (confidence >= 60) return <Badge variant="default" className="bg-yellow-100 text-yellow-800">Közepes</Badge>
    return <Badge variant="destructive">Alacsony</Badge>
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Brain className="h-8 w-8" />
          AI Intelligens Árazás
        </h1>
        <p className="text-gray-600">
          Mesterséges intelligencia alapú dinamikus árazási ajánlások
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Input Form */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Árazási Elemzés
              </CardTitle>
              <CardDescription>
                Válasszon ingatlant és dátumot az AI elemzéshez
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Property Selection */}
              <div className="space-y-2">
                <Label htmlFor="property">Ingatlan</Label>
                <Select value={selectedProperty} onValueChange={setSelectedProperty}>
                  <SelectTrigger>
                    <SelectValue placeholder="Válasszon ingatlant" />
                  </SelectTrigger>
                  <SelectContent>
                    {properties?.properties?.map((property) => (
                      <SelectItem key={property.id} value={property.id}>
                        {property.address || `${property.street}, ${property.city}`} (ID: {property.id.slice(0, 8)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date Selection */}
              <div className="space-y-2">
                <Label htmlFor="date">Dátum</Label>
                <Input
                  id="date"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              {/* Base Price */}
              <div className="space-y-2">
                <Label htmlFor="basePrice">Alapár (EUR/éjszaka)</Label>
                <div className="relative">
                  <Euro className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="basePrice"
                    type="number"
                    placeholder="100"
                    className="pl-10"
                    value={basePrice}
                    onChange={(e) => setBasePrice(e.target.value)}
                  />
                </div>
              </div>

              {/* Analyze Button */}
              <Button 
                onClick={handleAnalyze} 
                disabled={isAnalyzing}
                className="w-full"
              >
                {isAnalyzing ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Brain className="h-4 w-4 mr-2" />
                )}
                AI Elemzés Indítása
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Results */}
        <div className="lg:col-span-2">
          {!recommendation && !isAnalyzing && (
            <Card className="h-full flex items-center justify-center">
              <CardContent className="text-center py-12">
                <Brain className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-500 mb-2">
                  Nincs aktív elemzés
                </h3>
                <p className="text-gray-400">
                  Válasszon ingatlant és indítsa el az AI elemzést
                </p>
              </CardContent>
            </Card>
          )}

          {isAnalyzing && (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <Loader2 className="h-16 w-16 animate-spin text-blue-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">AI Elemzés Folyamatban</h3>
                  <p className="text-gray-600 mb-6">
                    Piaci adatok gyűjtése és árazási ajánlás generálása...
                  </p>
                  <div className="space-y-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full w-1/3"></div>
                    </div>
                    <p className="text-sm text-gray-500">Versenytárs elemzés...</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {recommendation && (
            <Tabs defaultValue="recommendation" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="recommendation">Ajánlás</TabsTrigger>
                <TabsTrigger value="factors">Tényezők</TabsTrigger>
                <TabsTrigger value="insights">Insights</TabsTrigger>
              </TabsList>

              <TabsContent value="recommendation">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        AI Árazási Ajánlás
                      </span>
                      {getConfidenceBadge(recommendation.confidence)}
                    </CardTitle>
                    <CardDescription>
                      Mesterséges intelligencia alapú ároptimalizálás
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Price Comparison */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">Jelenlegi ár</p>
                        <p className="text-2xl font-bold text-gray-800">
                          €{recommendation.basePrice}
                        </p>
                      </div>
                      <div className="text-center p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                        <p className="text-sm text-blue-600 mb-1">AI Ajánlás</p>
                        <p className="text-3xl font-bold text-blue-800">
                          €{recommendation.recommendedPrice}
                        </p>
                        <p className="text-sm text-blue-600">
                          {((recommendation.recommendedPrice - recommendation.basePrice) / recommendation.basePrice * 100).toFixed(1)}% változás
                        </p>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <p className="text-sm text-green-600 mb-1">Potenciális bevétel</p>
                        <p className="text-2xl font-bold text-green-800">
                          +€{(recommendation.recommendedPrice - recommendation.basePrice).toFixed(2)}
                        </p>
                      </div>
                    </div>

                    {/* Confidence Meter */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label>Megbízhatóság</Label>
                        <span className={`font-bold ${getConfidenceColor(recommendation.confidence)}`}>
                          {recommendation.confidence}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all" 
                          style={{ width: `${recommendation.confidence}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* AI Reasoning */}
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
                        <Brain className="h-4 w-4" />
                        AI Indoklás
                      </h4>
                      <p className="text-blue-700 text-sm">
                        {recommendation.reasoning}
                      </p>
                    </div>

                    {/* Apply Button */}
                    <Button 
                      onClick={handleApply}
                      disabled={applyRecommendationMutation.isLoading}
                      size="lg"
                      className="w-full"
                    >
                      {applyRecommendationMutation.isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Zap className="h-4 w-4 mr-2" />
                      )}
                      AI Árazás Alkalmazása
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="factors">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Árazási Tényezők
                    </CardTitle>
                    <CardDescription>
                      AI által figyelembe vett piaci tényezők
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {recommendation.factors.map((factor, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex-1">
                            <h4 className="font-medium">{factor.name}</h4>
                            <p className="text-sm text-gray-600">{factor.description}</p>
                          </div>
                          <div className="text-right">
                            <span className={`font-bold ${factor.impact > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {factor.impact > 0 ? '+' : ''}{factor.impact.toFixed(1)}%
                            </span>
                            <div className="text-xs text-gray-500">
                              Súly: {(factor.weight * 100).toFixed(0)}%
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="insights">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Users className="h-4 w-4" />
                        Piaci Kereslet
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm">Aktuális kereslet</span>
                          <Badge variant="outline">Magas</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Szezonális trend</span>
                          <span className="text-sm font-medium">+15%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Előző év</span>
                          <span className="text-sm font-medium">€95/éjszaka</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Cloud className="h-4 w-4" />
                        Külső Tényezők
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm">Időjárás</span>
                          <Badge variant="outline">Napsütéses</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Helyi események</span>
                          <span className="text-sm font-medium">2 esemény</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Versenytársak</span>
                          <span className="text-sm font-medium">€110 átlag</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </div>
  )
}