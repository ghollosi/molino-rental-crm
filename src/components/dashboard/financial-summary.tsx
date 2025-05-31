'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DollarSign, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react'
import { UserRole } from '@prisma/client'
import { api } from '@/lib/trpc'
import { Skeleton } from '@/src/components/ui/skeleton'

interface FinancialSummaryProps {
  userRole: UserRole
}

export function FinancialSummary({ userRole }: FinancialSummaryProps) {
  const { data, isLoading, error } = api.analytics.getFinancialSummary.useQuery()

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pénzügyi összesítő</CardTitle>
          <CardDescription>Bevételek és kiadások áttekintése</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-32" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pénzügyi összesítő</CardTitle>
          <CardDescription>Hiba történt az adatok betöltése során</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-red-600">
            <AlertCircle className="mx-auto h-12 w-12 mb-3" />
            <p>Hiba történt a pénzügyi adatok betöltése során</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const monthlyRevenue = data.monthlyRevenue || 0
  const yearlyRevenue = data.yearlyRevenue || 0
  const outstandingAmount = data.outstandingAmount || 0
  const occupancyRate = data.occupancyRate || 0

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Pénzügyi összesítő</CardTitle>
          <CardDescription>Bevételek és kihasználtság áttekintése</CardDescription>
        </div>
        <DollarSign className="h-8 w-8 text-green-600" />
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-6">
          {/* Havi bevétel */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-muted-foreground">Havi bevétel</p>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-green-600">
              {monthlyRevenue.toLocaleString('hu-HU')} Ft
            </p>
          </div>

          {/* Éves bevétel */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-muted-foreground">Éves bevétel</p>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-blue-600">
              {yearlyRevenue.toLocaleString('hu-HU')} Ft
            </p>
          </div>

          {/* Kintlévőségek */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-muted-foreground">Kintlévőségek</p>
              {outstandingAmount > 0 ? (
                <TrendingDown className="h-4 w-4 text-orange-600" />
              ) : (
                <TrendingUp className="h-4 w-4 text-green-600" />
              )}
            </div>
            <p className={`text-2xl font-bold ${outstandingAmount > 0 ? 'text-orange-600' : 'text-green-600'}`}>
              {outstandingAmount.toLocaleString('hu-HU')} Ft
            </p>
          </div>

          {/* Kihasználtság */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-muted-foreground">Kihasználtság</p>
              {occupancyRate >= 80 ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : occupancyRate >= 60 ? (
                <TrendingUp className="h-4 w-4 text-orange-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
            </div>
            <div className="flex items-center gap-2">
              <p className={`text-2xl font-bold ${
                occupancyRate >= 80 ? 'text-green-600' : 
                occupancyRate >= 60 ? 'text-orange-600' : 'text-red-600'
              }`}>
                {occupancyRate.toFixed(1)}%
              </p>
              <Badge variant={occupancyRate >= 80 ? 'default' : occupancyRate >= 60 ? 'secondary' : 'destructive'}>
                {occupancyRate >= 80 ? 'Kiváló' : occupancyRate >= 60 ? 'Jó' : 'Alacsony'}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}