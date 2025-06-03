'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp, 
  TrendingDown,
  Activity,
  Target,
  Award,
  Bell,
  Zap
} from 'lucide-react'
import { api } from '@/lib/trpc/client'

interface SLADashboardProps {
  providerId?: string
  propertyId?: string
}

export function SLADashboard({ providerId, propertyId }: SLADashboardProps) {
  const [dateRange, setDateRange] = useState<string>('30') // 30 napok

  // SLA statisztikák lekérése
  const { data: slaStats, isLoading } = api.providerMatching.getSLAStats.useQuery({
    providerId,
    propertyId,
    dateFrom: new Date(Date.now() - parseInt(dateRange) * 24 * 60 * 60 * 1000),
    dateTo: new Date()
  })

  // Részletes SLA metrikák
  const { data: detailedMetrics } = api.providerMatching.getDetailedSLAMetrics.useQuery({
    dateFrom: new Date(Date.now() - parseInt(dateRange) * 24 * 60 * 60 * 1000),
    dateTo: new Date(),
    providerId,
    propertyId
  })

  // SLA riasztások
  const { data: slaAlerts } = api.providerMatching.getSLAAlerts.useQuery({
    propertyId
  })

  // Szolgáltató rangsor
  const { data: leaderboard } = api.providerMatching.getProviderLeaderboard.useQuery({
    dateFrom: new Date(Date.now() - parseInt(dateRange) * 24 * 60 * 60 * 1000),
    dateTo: new Date()
  })

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!slaStats) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-gray-500">Nincs elérhető SLA adat</p>
        </CardContent>
      </Card>
    )
  }

  // Grafikon adatok készítése
  const responseTimeData = [
    {
      name: 'Cél válaszidő',
      value: slaStats.avgResponseTime || 0,
      color: '#8884d8'
    }
  ]

  const breachData = [
    { name: 'Sikeres', value: slaStats.total - slaStats.responseBreaches - slaStats.resolutionBreaches, color: '#22c55e' },
    { name: 'Válaszidő túllépés', value: slaStats.responseBreaches, color: '#f59e0b' },
    { name: 'Megoldási idő túllépés', value: slaStats.resolutionBreaches, color: '#ef4444' }
  ]

  const getPerformanceColor = (rate: number) => {
    if (rate <= 10) return 'text-green-600'
    if (rate <= 25) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getPerformanceIcon = (rate: number) => {
    if (rate <= 10) return <TrendingUp className="h-4 w-4 text-green-600" />
    if (rate <= 25) return <Activity className="h-4 w-4 text-yellow-600" />
    return <TrendingDown className="h-4 w-4 text-red-600" />
  }

  return (
    <div className="space-y-6">
      {/* Fejléc és szűrők */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">SLA Teljesítmény Dashboard</h2>
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Elmúlt 7 nap</SelectItem>
            <SelectItem value="30">Elmúlt 30 nap</SelectItem>
            <SelectItem value="90">Elmúlt 90 nap</SelectItem>
            <SelectItem value="365">Elmúlt év</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Fő metrikák */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Összesen</p>
                <p className="text-2xl font-bold">{slaStats.total}</p>
                <p className="text-xs text-gray-500">hibabejelentés</p>
              </div>
              <Activity className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Válaszidő túllépés</p>
                <p className={`text-2xl font-bold ${getPerformanceColor(slaStats.responseBreachRate)}`}>
                  {slaStats.responseBreachRate.toFixed(1)}%
                </p>
                <p className="text-xs text-gray-500">{slaStats.responseBreaches} esetből</p>
              </div>
              {getPerformanceIcon(slaStats.responseBreachRate)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Megoldási idő túllépés</p>
                <p className={`text-2xl font-bold ${getPerformanceColor(slaStats.resolutionBreachRate)}`}>
                  {slaStats.resolutionBreachRate.toFixed(1)}%
                </p>
                <p className="text-xs text-gray-500">{slaStats.resolutionBreaches} esetből</p>
              </div>
              {getPerformanceIcon(slaStats.resolutionBreachRate)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Átlag válaszidő</p>
                <p className="text-2xl font-bold">{slaStats.avgResponseTime}h</p>
                <p className="text-xs text-gray-500">órában</p>
              </div>
              <Clock className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grafikonok */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SLA túllépések megoszlása */}
        <Card>
          <CardHeader>
            <CardTitle>SLA Teljesítmény Megoszlása</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={breachData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {breachData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Részletes SLA rekordok */}
        <Card>
          <CardHeader>
            <CardTitle>Legutóbbi SLA Események</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {slaStats.records.slice(0, 10).map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">
                        {record.issue.title.substring(0, 30)}...
                      </span>
                      <Badge variant={
                        record.issue.priority === 'URGENT' ? 'destructive' :
                        record.issue.priority === 'HIGH' ? 'secondary' : 'outline'
                      }>
                        {record.issue.priority}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                      <span>{record.provider?.businessName || 'Nem hozzárendelt'}</span>
                      <span>{new Date(record.issue.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {record.responseBreached && (
                      <Badge variant="destructive" className="text-xs">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Válasz túllépés
                      </Badge>
                    )}
                    {record.resolutionBreached && (
                      <Badge variant="destructive" className="text-xs">
                        <Clock className="h-3 w-3 mr-1" />
                        Megoldás túllépés
                      </Badge>
                    )}
                    {!record.responseBreached && !record.resolutionBreached && (
                      <Badge variant="secondary" className="text-xs">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        OK
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SLA Célok és Javaslatok */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5" />
              <span>SLA Célkitűzések</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                <div>
                  <span className="font-medium">URGENT prioritás</span>
                  <p className="text-sm text-gray-600">Válasz: 2h, Megoldás: 24h</p>
                </div>
                <Badge variant="destructive">Kritikus</Badge>
              </div>
              <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                <div>
                  <span className="font-medium">HIGH prioritás</span>
                  <p className="text-sm text-gray-600">Válasz: 8h, Megoldás: 72h</p>
                </div>
                <Badge variant="secondary">Magas</Badge>
              </div>
              <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                <div>
                  <span className="font-medium">MEDIUM prioritás</span>
                  <p className="text-sm text-gray-600">Válasz: 24h, Megoldás: 168h</p>
                </div>
                <Badge variant="outline">Közepes</Badge>
              </div>
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <div>
                  <span className="font-medium">LOW prioritás</span>
                  <p className="text-sm text-gray-600">Válasz: 72h, Megoldás: 336h</p>
                </div>
                <Badge variant="outline">Alacsony</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Javítási Javaslatok</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {slaStats.responseBreachRate > 20 && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-red-800">Válaszidő javítása szükséges</p>
                      <p className="text-sm text-red-600">
                        A válaszidő túllépések aránya magas ({slaStats.responseBreachRate.toFixed(1)}%). 
                        Fontolja meg további szolgáltatók bevonását.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {slaStats.resolutionBreachRate > 15 && (
                <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <Clock className="h-5 w-5 text-orange-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-orange-800">Megoldási idő optimalizálása</p>
                      <p className="text-sm text-orange-600">
                        A megoldási idő túllépések aránya magasabb az optimálisnál. 
                        Ellenőrizze a munkamenet hatékonyságát.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {slaStats.responseBreachRate <= 10 && slaStats.resolutionBreachRate <= 10 && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-green-800">Kiváló teljesítmény</p>
                      <p className="text-sm text-green-600">
                        Az SLA teljesítmény kiváló! Folytassa a jelenlegi gyakorlatokat.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SLA Riasztások */}
      {slaAlerts && (slaAlerts.critical.length > 0 || slaAlerts.warning.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bell className="h-5 w-5" />
              <span>Aktív SLA Riasztások</span>
              {(slaAlerts.critical.length + slaAlerts.warning.length) > 0 && (
                <Badge variant="destructive">
                  {slaAlerts.critical.length + slaAlerts.warning.length}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* Kritikus riasztások */}
              {slaAlerts.critical.map((alert, index) => (
                <div key={`critical-${index}`} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-red-800">{alert.title}</span>
                        <Badge variant="destructive">{alert.priority}</Badge>
                      </div>
                      <p className="text-sm text-red-600">{alert.property}</p>
                      <p className="text-sm text-red-700 mt-1">{alert.message}</p>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Figyelmeztetések */}
              {slaAlerts.warning.map((alert, index) => (
                <div key={`warning-${index}`} className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <Clock className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-yellow-800">{alert.title}</span>
                        <Badge variant="secondary">{alert.priority}</Badge>
                      </div>
                      <p className="text-sm text-yellow-600">{alert.property}</p>
                      <p className="text-sm text-yellow-700 mt-1">{alert.message}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Szolgáltató teljesítmény rangsor */}
      {leaderboard && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Award className="h-5 w-5" />
                <span>Top Teljesítmény</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {leaderboard.topPerformers.slice(0, 5).map((provider, index) => (
                  <div key={provider.providerId} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                        index === 0 ? 'bg-yellow-500' :
                        index === 1 ? 'bg-gray-400' :
                        index === 2 ? 'bg-orange-600' : 'bg-blue-500'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{provider.businessName}</p>
                        <p className="text-sm text-gray-600">{provider.issueCount} eset</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{provider.responseRate.toFixed(1)}%</p>
                      <p className="text-sm text-gray-600">válasz SLA</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Zap className="h-5 w-5" />
                <span>Fejlesztésre Szorul</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {leaderboard.improvementNeeded.length > 0 ? (
                <div className="space-y-3">
                  {leaderboard.improvementNeeded.map((provider) => (
                    <div key={provider.providerId} className="p-3 border border-orange-200 bg-orange-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{provider.businessName}</p>
                          <p className="text-sm text-gray-600">{provider.issueCount} eset</p>
                        </div>
                        <div className="text-right">
                          <p className="text-orange-600 font-medium">
                            {Math.min(provider.responseRate, provider.resolutionRate).toFixed(1)}%
                          </p>
                          <p className="text-sm text-gray-600">legalacsonyabb SLA</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">
                  Minden szolgáltató megfelelő teljesítményt nyújt
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Részletes metrikák */}
      {detailedMetrics && (
        <Card>
          <CardHeader>
            <CardTitle>Részletes Teljesítmény Metrikák</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Válaszidő Statisztikák</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Átlag:</span>
                    <span>{detailedMetrics.responseTime.average.toFixed(1)}h</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Medián:</span>
                    <span>{detailedMetrics.responseTime.median}h</span>
                  </div>
                  <div className="flex justify-between">
                    <span>95. percentilis:</span>
                    <span>{detailedMetrics.responseTime.percentile95}h</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Trend:</span>
                    <span className="flex items-center">
                      {detailedMetrics.responseTime.trend === 'up' && <TrendingUp className="h-3 w-3 text-red-500" />}
                      {detailedMetrics.responseTime.trend === 'down' && <TrendingDown className="h-3 w-3 text-green-500" />}
                      {detailedMetrics.responseTime.trend === 'stable' && <Activity className="h-3 w-3 text-gray-500" />}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Megoldási Idő Statisztikák</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Átlag:</span>
                    <span>{detailedMetrics.resolutionTime.average.toFixed(1)}h</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Medián:</span>
                    <span>{detailedMetrics.resolutionTime.median}h</span>
                  </div>
                  <div className="flex justify-between">
                    <span>95. percentilis:</span>
                    <span>{detailedMetrics.resolutionTime.percentile95}h</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Trend:</span>
                    <span className="flex items-center">
                      {detailedMetrics.resolutionTime.trend === 'up' && <TrendingUp className="h-3 w-3 text-red-500" />}
                      {detailedMetrics.resolutionTime.trend === 'down' && <TrendingDown className="h-3 w-3 text-green-500" />}
                      {detailedMetrics.resolutionTime.trend === 'stable' && <Activity className="h-3 w-3 text-gray-500" />}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Túllépési Arányok</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Válaszidő:</span>
                    <span className={detailedMetrics.breachRates.response > 15 ? 'text-red-600' : 'text-green-600'}>
                      {detailedMetrics.breachRates.response.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Megoldási idő:</span>
                    <span className={detailedMetrics.breachRates.resolution > 20 ? 'text-red-600' : 'text-green-600'}>
                      {detailedMetrics.breachRates.resolution.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Összesített:</span>
                    <span className={detailedMetrics.breachRates.overall > 18 ? 'text-red-600' : 'text-green-600'}>
                      {detailedMetrics.breachRates.overall.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Prioritás Teljesítmény</h4>
                <div className="space-y-1 text-sm">
                  {Object.entries(detailedMetrics.performanceByPriority).map(([priority, performance]) => (
                    <div key={priority} className="flex justify-between">
                      <span>{priority}:</span>
                      <span className={performance.responseRate < 80 ? 'text-red-600' : 'text-green-600'}>
                        {performance.responseRate.toFixed(0)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}