'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, TrendingDown, Calendar, DollarSign } from 'lucide-react'
import { api } from '@/lib/trpc/client'
import { useEffect, useState } from 'react'

export function FinancialForecastingWidget() {
  // Lekérjük a szükséges adatokat
  const { data: properties } = api.property.list.useQuery({ page: 1, limit: 100 })
  const { data: issues } = api.issue.list.useQuery({ page: 1, limit: 100, status: 'OPEN' })
  
  // Egyszerűsített előrejelzés számítás
  const calculateSimpleForecast = () => {
    if (!properties || !issues) return null
    
    const totalProperties = properties.properties.length
    const occupiedProperties = properties.properties.filter(p => p.currentTenant).length
    const occupancyRate = totalProperties > 0 ? occupiedProperties / totalProperties : 0
    
    // Becsült havi bevétel (1500 EUR átlag/ingatlan)
    const estimatedMonthlyRevenue = occupiedProperties * 1500
    const nextMonthRevenue = estimatedMonthlyRevenue * 1.02 // 2% növekedés
    
    // Becsült karbantartási költség
    const maintenanceCost = issues.issues.length * 200
    
    return {
      currentMonth: estimatedMonthlyRevenue,
      nextMonth: nextMonthRevenue,
      cashFlow: estimatedMonthlyRevenue - maintenanceCost,
      occupancyRate: Math.round(occupancyRate * 100)
    }
  }
  
  const forecast = calculateSimpleForecast()
  
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
          <p className="text-gray-500">Adatok betöltése...</p>
        </CardContent>
      </Card>
    )
  }
  
  const trend = forecast.nextMonth > forecast.currentMonth ? 'up' : 'down'
  
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
                }).format(forecast.currentMonth)}
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
                }).format(forecast.nextMonth)}
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
                }).format(forecast.cashFlow)}
              </span>
            </div>
          </div>
        </div>
        
        {/* Egyszerű információk */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm font-medium text-blue-800 mb-1">Kihasználtság:</p>
          <p className="text-sm text-blue-700">
            {forecast.occupancyRate}% ({properties?.properties.filter(p => p.currentTenant).length || 0} / {properties?.properties.length || 0} ingatlan)
          </p>
        </div>
      </CardContent>
    </Card>
  )
}