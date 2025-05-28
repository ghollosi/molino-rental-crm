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
        <div className="space-y-3 md:space-y-4">
          {/* Első sor: Havi és Éves bevétel */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            <div className="p-3 md:p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center text-sm font-medium text-green-800 mb-1">
                <DollarSign className="mr-1 h-3 w-3" />
                Havi bevétel
              </div>
              <div className="text-lg md:text-xl font-bold text-green-900">
                {data.monthlyRevenue.toLocaleString('hu-HU')} Ft
              </div>
              <div className="text-xs text-green-600">
                {data.revenueChange >= 0 ? `+${data.revenueChange}%` : `${data.revenueChange}%`} előző hónaphoz képest
              </div>
            </div>

            <div className="p-3 md:p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center text-sm font-medium text-blue-800 mb-1">
                <DollarSign className="mr-1 h-3 w-3" />
                Éves bevétel
              </div>
              <div className="text-lg md:text-xl font-bold text-blue-900">
                {data.yearlyRevenue.toLocaleString('hu-HU')} Ft
              </div>
              <div className="text-xs text-blue-600">
                {new Date().getFullYear()}. év várható
              </div>
            </div>
          </div>

          {/* Második sor: Kintlévőségek és Kihasználtság */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            <div className="p-3 md:p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-center text-sm font-medium text-orange-800 mb-1">
                <AlertCircle className="mr-1 h-3 w-3" />
                Kintlévőségek
              </div>
              <div className="text-lg md:text-xl font-bold text-orange-900">
                {data.outstandingPayments.toLocaleString('hu-HU')} Ft
              </div>
              <div className="text-xs text-orange-600">
                {data.overdueCount} késedelmes fizetés
              </div>
            </div>

            <div className="p-3 md:p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="flex items-center text-sm font-medium text-purple-800 mb-1">
                <TrendingUp className="mr-1 h-3 w-3" />
                Kihasználtság
              </div>
              <div className="text-lg md:text-xl font-bold text-purple-900">
                {data.occupancyRate}%
              </div>
              <div className="text-xs text-purple-600">
                {data.rentedProperties}/{data.totalProperties} ingatlan bérelt
              </div>
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