'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, TrendingDown, Calendar, DollarSign } from 'lucide-react'
import { api } from '@/lib/trpc/client'
import { generateFinancialForecast } from '@/lib/financial-forecasting'
import { useEffect, useState } from 'react'

export function FinancialForecastingWidget() {
  const [forecast, setForecast] = useState<any>(null)
  
  // Lekérjük a szükséges adatokat
  const { data: revenue } = api.analytics.getRevenueByMonth.useQuery({ months: 6 })
  const { data: properties } = api.property.list.useQuery({ page: 1, limit: 100 })
  const { data: issues } = api.issue.list.useQuery({ page: 1, limit: 100, status: 'OPEN' })
  
  useEffect(() => {
    if (revenue && properties && issues) {
      // Átlagos havi bevétel számítása
      const monthlyRevenue = revenue.reduce((sum: number, month: any) => sum + month.total, 0) / revenue.length
      
      // Előrejelzés generálása
      const forecastData = generateFinancialForecast({
        historicalRevenue: revenue.map((m: any) => ({ month: m.month, amount: m.total })),
        occupancyRates: properties.properties.map((p: any) => ({
          propertyId: p.id,
          rate: p.currentTenant ? 1 : 0
        })),
        maintenanceCosts: issues.issues.map((i: any) => ({
          month: new Date(i.createdAt).toISOString().slice(0, 7),
          amount: 50000 // Becsült költség
        })),
        marketTrends: {
          rentalDemand: 1.05,
          priceGrowth: 1.03,
          seasonality: [0.9, 0.95, 1, 1.1, 1.15, 1.2, 1.2, 1.15, 1.1, 1, 0.95, 0.9]
        }
      })
      
      setForecast(forecastData)
    }
  }, [revenue, properties, issues])
  
  if (!forecast) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Pénzügyi előrejelzés
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">Előrejelzés generálása...</p>
        </CardContent>
      </Card>
    )
  }
  
  const currentMonthForecast = forecast.monthlyForecasts[0]
  const nextMonthForecast = forecast.monthlyForecasts[1]
  const trend = nextMonthForecast.revenue > currentMonthForecast.revenue ? 'up' : 'down'
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Pénzügyi előrejelzés
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Aktuális hónap */}
          <div>
            <p className="text-sm text-gray-600 mb-1">Várható bevétel (aktuális hó)</p>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-gray-400" />
              <span className="text-2xl font-bold">
                {new Intl.NumberFormat('hu-HU', {
                  style: 'currency',
                  currency: 'EUR',
                  maximumFractionDigits: 0
                }).format(currentMonthForecast.revenue)}
              </span>
            </div>
          </div>
          
          {/* Következő hónap */}
          <div>
            <p className="text-sm text-gray-600 mb-1">Várható bevétel (következő hó)</p>
            <div className="flex items-center gap-2">
              {trend === 'up' ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
              <span className="text-2xl font-bold">
                {new Intl.NumberFormat('hu-HU', {
                  style: 'currency',
                  currency: 'EUR',
                  maximumFractionDigits: 0
                }).format(nextMonthForecast.revenue)}
              </span>
            </div>
          </div>
          
          {/* Cash flow */}
          <div>
            <p className="text-sm text-gray-600 mb-1">Várható cash flow</p>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span className="text-2xl font-bold">
                {new Intl.NumberFormat('hu-HU', {
                  style: 'currency',
                  currency: 'EUR',
                  maximumFractionDigits: 0
                }).format(currentMonthForecast.cashFlow)}
              </span>
            </div>
          </div>
        </div>
        
        {/* Kockázatok */}
        {forecast.risks.length > 0 && (
          <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
            <p className="text-sm font-medium text-yellow-800 mb-1">Azonosított kockázatok:</p>
            <ul className="text-sm text-yellow-700 space-y-1">
              {forecast.risks.slice(0, 2).map((risk: any, index: number) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-yellow-500 mt-0.5">•</span>
                  <span>{risk.description}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Javaslatok */}
        {forecast.recommendations.length > 0 && (
          <div className="mt-4 p-3 bg-green-50 rounded-lg">
            <p className="text-sm font-medium text-green-800 mb-1">Javaslatok:</p>
            <ul className="text-sm text-green-700 space-y-1">
              {forecast.recommendations.slice(0, 2).map((rec: any, index: number) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}