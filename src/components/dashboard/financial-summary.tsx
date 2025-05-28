'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react'
import { trpc } from '@/src/lib/trpc'
import { Skeleton } from '@/components/ui/skeleton'

interface FinancialSummaryProps {
  userRole: string
}

export function FinancialSummary({ userRole }: FinancialSummaryProps) {
  const { data, isLoading } = trpc.analytics.getFinancialSummary.useQuery()

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pénzügyi összesítő</CardTitle>
          <CardDescription>Bevételek és kintlévőségek</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pénzügyi összesítő</CardTitle>
        <CardDescription>Bevételek és kintlévőségek áttekintése</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {/* Első sor: Havi és Éves bevétel */}
          <div className="space-y-2">
            <div className="flex items-center text-sm text-muted-foreground">
              <DollarSign className="mr-1 h-3 w-3" />
              Havi bevétel
            </div>
            <div className="text-2xl font-bold">
              {data.monthlyRevenue.toLocaleString('hu-HU')} Ft
            </div>
            <div className="text-xs text-muted-foreground">
              {data.revenueChange >= 0 ? (
                <span className="text-green-600">+{data.revenueChange}% hónaphoz képest</span>
              ) : (
                <span className="text-red-600">{data.revenueChange}% hónaphoz képest</span>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center text-sm text-muted-foreground">
              <DollarSign className="mr-1 h-3 w-3" />
              Éves bevétel
            </div>
            <div className="text-2xl font-bold">
              {data.yearlyRevenue.toLocaleString('hu-HU')} Ft
            </div>
            <div className="text-xs text-muted-foreground">
              {new Date().getFullYear()}. év
            </div>
          </div>

          {/* Második sor: Kintlévőségek és Kihasználtság */}
          <div className="space-y-2">
            <div className="flex items-center text-sm text-muted-foreground">
              <AlertCircle className="mr-1 h-3 w-3" />
              Kintlévőségek
            </div>
            <div className="text-2xl font-bold text-orange-600">
              {data.outstandingPayments.toLocaleString('hu-HU')} Ft
            </div>
            <div className="text-xs text-muted-foreground">
              {data.overdueCount} késedelmes fizetés
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center text-sm text-muted-foreground">
              <TrendingUp className="mr-1 h-3 w-3" />
              Kihasználtság
            </div>
            <div className="text-2xl font-bold">
              {data.occupancyRate}%
            </div>
            <div className="text-xs text-muted-foreground">
              {data.rentedProperties}/{data.totalProperties} ingatlan
            </div>
          </div>
        </div>

        {/* Figyelmeztetés nagy kintlévőség esetén */}
        {data.outstandingPayments > data.monthlyRevenue * 0.2 && (
          <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="h-4 w-4 text-orange-600 mr-2" />
              <span className="text-sm text-orange-800">
                A kintlévőségek meghaladják a havi bevétel 20%-át. Javasolt a fizetési emlékeztetők küldése.
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}