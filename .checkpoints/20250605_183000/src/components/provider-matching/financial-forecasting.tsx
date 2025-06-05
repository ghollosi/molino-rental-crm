'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { api } from '@/lib/trpc/client'
import { 
  TrendingUp, 
  TrendingDown, 
  Calculator, 
  PieChart, 
  BarChart3, 
  DollarSign,
  Calendar,
  Target,
  AlertTriangle,
  CheckCircle2,
  Eye
} from 'lucide-react'
import { format } from 'date-fns'
import { hu } from 'date-fns/locale'

export function FinancialForecasting() {
  const [selectedPropertyId, setSelectedPropertyId] = useState('')
  const [forecastMonths, setForecastMonths] = useState(12)
  const [includeSeasonality, setIncludeSeasonality] = useState(true)
  const [includeGrowthTrend, setIncludeGrowthTrend] = useState(true)
  const [roiTimeframe, setRoiTimeframe] = useState(12)

  // API calls
  const { data: properties } = api.property.list.useQuery({
    page: 1,
    limit: 100
  })

  const { data: revenueForecast, refetch: refetchForecast } = api.financialForecasting.generateRevenueForecast.useQuery({
    propertyId: selectedPropertyId || undefined,
    months: forecastMonths,
    includeSeasonality,
    includeGrowthTrend
  }, {
    enabled: false // Manual trigger
  })

  const { data: roiData } = api.financialForecasting.calculateROI.useQuery({
    propertyId: selectedPropertyId,
    timeframeMonths: roiTimeframe
  }, {
    enabled: !!selectedPropertyId
  })

  const { data: portfolioData } = api.financialForecasting.analyzePortfolio.useQuery()

  const { data: financialSummary } = api.financialForecasting.getFinancialSummary.useQuery({
    propertyId: selectedPropertyId || undefined
  })

  const { data: monthlyTrend } = api.financialForecasting.getMonthlyTrend.useQuery({
    propertyId: selectedPropertyId || undefined,
    months: 12
  })

  const handleGenerateForecast = () => {
    refetchForecast()
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('hu-HU', {
      style: 'currency',
      currency: 'HUF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  return (
    <div className="space-y-6">
      {/* Bevétel előrejelzés konfiguráció */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Pénzügyi Előrejelzés Konfigurálás
          </CardTitle>
          <CardDescription>
            Állítsa be az előrejelzés paramétereit a pontosabb előrejelzéshez
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="property">Ingatlan (opcionális)</Label>
              <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
                <SelectTrigger>
                  <SelectValue placeholder="Összes ingatlan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Összes ingatlan</SelectItem>
                  {properties?.items.map((property) => (
                    <SelectItem key={property.id} value={property.id}>
                      {property.street}, {property.city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="months">Előrejelzés hossza (hónap)</Label>
              <Input
                id="months"
                type="number"
                min="1"
                max="60"
                value={forecastMonths}
                onChange={(e) => setForecastMonths(parseInt(e.target.value) || 12)}
              />
            </div>

            <div className="space-y-2">
              <Label>Beállítások</Label>
              <div className="flex flex-col space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="seasonality"
                    checked={includeSeasonality}
                    onChange={(e) => setIncludeSeasonality(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="seasonality" className="text-sm">Szezonális hatások</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="growth"
                    checked={includeGrowthTrend}
                    onChange={(e) => setIncludeGrowthTrend(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="growth" className="text-sm">Növekedési trend</Label>
                </div>
              </div>
            </div>

            <div className="flex items-end">
              <Button onClick={handleGenerateForecast} className="w-full">
                Előrejelzés generálása
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pénzügyi összesítő */}
      {financialSummary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(financialSummary.revenue.monthly)}
                  </div>
                  <div className="text-sm text-gray-600">Havi bevétel</div>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-red-600">
                    {formatCurrency(financialSummary.expenses.total)}
                  </div>
                  <div className="text-sm text-gray-600">Összes kiadás</div>
                </div>
                <TrendingDown className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {formatCurrency(financialSummary.netIncome)}
                  </div>
                  <div className="text-sm text-gray-600">Nettó jövedelem</div>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-purple-600">
                    {formatPercentage(financialSummary.occupancyRate)}
                  </div>
                  <div className="text-sm text-gray-600">Kihasználtság</div>
                </div>
                <Target className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ROI számítás */}
      {selectedPropertyId && roiData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              ROI Elemzés - Kiválasztott Ingatlan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-3xl font-bold text-green-600">
                  {formatPercentage(roiData.roi)}
                </div>
                <div className="text-sm text-gray-600">ROI ({roiTimeframe} hónap)</div>
              </div>
              
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-3xl font-bold text-blue-600">
                  {roiData.paybackPeriod.toFixed(1)}
                </div>
                <div className="text-sm text-gray-600">Megtérülési idő (hónap)</div>
              </div>
              
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-3xl font-bold text-purple-600">
                  {formatCurrency(roiData.totalReturn)}
                </div>
                <div className="text-sm text-gray-600">Összes hozam</div>
              </div>
            </div>

            <div className="mt-4">
              <Label>ROI időkeret (hónap)</Label>
              <Input
                type="number"
                min="1"
                max="60"
                value={roiTimeframe}
                onChange={(e) => setRoiTimeframe(parseInt(e.target.value) || 12)}
                className="w-32"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bevétel előrejelzés eredmények */}
      {revenueForecast && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Előrejelzési összesítő */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Előrejelzési Összesítő
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-lg font-semibold">
                    {formatCurrency(revenueForecast.summary.totalRevenue)}
                  </div>
                  <div className="text-sm text-gray-600">Összes bevétel</div>
                </div>
                <div>
                  <div className="text-lg font-semibold">
                    {formatCurrency(revenueForecast.summary.totalExpenses)}
                  </div>
                  <div className="text-sm text-gray-600">Összes kiadás</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-green-600">
                    {formatCurrency(revenueForecast.summary.totalNetIncome)}
                  </div>
                  <div className="text-sm text-gray-600">Nettó jövedelem</div>
                </div>
                <div>
                  <div className="text-lg font-semibold">
                    {formatPercentage(revenueForecast.summary.averageOccupancy * 100)}
                  </div>
                  <div className="text-sm text-gray-600">Átlag kihasználtság</div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Trendek:</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Bevétel növekedés:</span>
                    <Badge variant={revenueForecast.summary.trends.revenueGrowth > 0 ? 'default' : 'destructive'}>
                      {formatPercentage(revenueForecast.summary.trends.revenueGrowth)}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Kiadás változás:</span>
                    <Badge variant={revenueForecast.summary.trends.expenseGrowth < 0 ? 'default' : 'destructive'}>
                      {formatPercentage(revenueForecast.summary.trends.expenseGrowth)}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Nettó jövedelem trend:</span>
                    <Badge variant={revenueForecast.summary.trends.netIncomeGrowth > 0 ? 'default' : 'destructive'}>
                      {formatPercentage(revenueForecast.summary.trends.netIncomeGrowth)}
                    </Badge>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Eye className="h-4 w-4" />
                  <span className="font-medium">Átlagos bizalmi szint:</span>
                  <Badge variant={revenueForecast.summary.averageConfidence > 70 ? 'default' : 'secondary'}>
                    {formatPercentage(revenueForecast.summary.averageConfidence)}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Javaslatok */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Pénzügyi Javaslatok
              </CardTitle>
            </CardHeader>
            <CardContent>
              {revenueForecast.recommendations.length > 0 ? (
                <div className="space-y-3">
                  {revenueForecast.recommendations.map((recommendation, index) => (
                    <Alert key={index}>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription className="text-sm">
                        {recommendation}
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-green-500" />
                  <p className="text-gray-600">Minden pénzügyi mutató optimális!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Havi előrejelzés táblázat */}
      {revenueForecast && revenueForecast.forecasts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Havi Előrejelzés Részletei
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Hónap</TableHead>
                    <TableHead>Bevétel</TableHead>
                    <TableHead>Kiadások</TableHead>
                    <TableHead>Nettó</TableHead>
                    <TableHead>Kihasználtság</TableHead>
                    <TableHead>Bizalom</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {revenueForecast.forecasts.slice(0, 12).map((forecast) => (
                    <TableRow key={forecast.month}>
                      <TableCell className="font-medium">
                        {format(new Date(forecast.month + '-01'), 'yyyy. MMM', { locale: hu })}
                      </TableCell>
                      <TableCell className="text-green-600">
                        {formatCurrency(forecast.revenue.total)}
                      </TableCell>
                      <TableCell className="text-red-600">
                        {formatCurrency(forecast.expenses.total)}
                      </TableCell>
                      <TableCell className={`font-medium ${forecast.netIncome > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(forecast.netIncome)}
                      </TableCell>
                      <TableCell>
                        {formatPercentage(forecast.occupancyRate * 100)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={forecast.confidence > 70 ? 'default' : 'secondary'}>
                          {formatPercentage(forecast.confidence)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Portfólió teljesítmény */}
      {portfolioData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Portfólió Teljesítmény Áttekintés
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {formatCurrency(portfolioData.totalValue)}
                </div>
                <div className="text-sm text-gray-600">Portfólió érték</div>
              </div>
              
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(portfolioData.totalRevenue)}
                </div>
                <div className="text-sm text-gray-600">Összes bevétel</div>
              </div>
              
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {formatPercentage(portfolioData.averageROI)}
                </div>
                <div className="text-sm text-gray-600">Átlagos ROI</div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top teljesítmények */}
              {portfolioData.topPerformers.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3 text-green-600">🏆 Legjobb Teljesítmények</h4>
                  <div className="space-y-2">
                    {portfolioData.topPerformers.slice(0, 5).map((property) => (
                      <div key={property.id} className="flex items-center justify-between p-2 bg-green-50 rounded">
                        <span className="text-sm font-medium">{property.street}, {property.city}</span>
                        <Badge variant="default">{formatPercentage(property.roi)}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Gyenge teljesítmények */}
              {portfolioData.underperformers.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3 text-red-600">⚠️ Fejlesztendő Ingatlanok</h4>
                  <div className="space-y-2">
                    {portfolioData.underperformers.slice(0, 5).map((property) => (
                      <div key={property.id} className="flex items-center justify-between p-2 bg-red-50 rounded">
                        <span className="text-sm font-medium">{property.street}, {property.city}</span>
                        <Badge variant="destructive">{formatPercentage(property.roi)}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}