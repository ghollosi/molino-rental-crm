'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertCircle, Clock, Mail, Phone, ArrowRight, DollarSign } from 'lucide-react'
import { api } from '@/lib/trpc'
import { Skeleton } from '@/src/components/ui/skeleton'
import Link from 'next/link'

export function OutstandingPayments() {
  const { data, isLoading, error } = api.analytics.getOutstandingPayments.useQuery(undefined, {
    retry: 3,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  })

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Kintlévőségek követése</CardTitle>
          <CardDescription>Késedelmes fizetések és figyelmeztetések</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="space-y-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-8 w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle>Kintlévőségek követése</CardTitle>
          <CardDescription>Hiba történt az adatok betöltése során</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-red-600">
            <AlertCircle className="mx-auto h-12 w-12 mb-3" />
            <p>Hiba történt a kintlévőségek betöltése során</p>
            <p className="text-sm mt-1">{error.message}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Kintlévőségek követése</CardTitle>
          <CardDescription>Késedelmes fizetések és figyelmeztetések</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <DollarSign className="mx-auto h-12 w-12 mb-3 opacity-20" />
            <p>Jelenleg nincsenek kintlévőségek</p>
            <p className="text-sm mt-1">Minden fizetés időben megtörtént</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const getUrgencyBadge = (daysOverdue: number) => {
    if (daysOverdue >= 30) {
      return <Badge variant="destructive">Kritikus</Badge>
    } else if (daysOverdue >= 14) {
      return <Badge variant="destructive">Sürgős</Badge>
    } else if (daysOverdue >= 7) {
      return <Badge variant="secondary">Figyelmeztetés</Badge>
    } else if (daysOverdue > 0) {
      return <Badge variant="outline">Késés</Badge>
    }
    return <Badge variant="outline">Esedékes</Badge>
  }

  const getUrgencyColor = (daysOverdue: number) => {
    if (daysOverdue >= 30) return 'border-red-500 bg-red-50'
    if (daysOverdue >= 14) return 'border-orange-500 bg-orange-50'
    if (daysOverdue >= 7) return 'border-yellow-500 bg-yellow-50'
    if (daysOverdue > 0) return 'border-blue-500 bg-blue-50'
    return 'border-gray-200 bg-gray-50'
  }

  const totalOutstanding = Array.isArray(data) ? data.reduce((sum, payment) => sum + (payment?.amount ?? 0), 0) : 0

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Kintlévőségek követése</CardTitle>
          <CardDescription>
            Összesen: {totalOutstanding.toLocaleString('hu-HU')} Ft ({Array.isArray(data) ? data.length : 0} tétel)
          </CardDescription>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/payments">
            Összes <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {(Array.isArray(data) ? data : []).slice(0, 5).map((payment) => {
            if (!payment) return null;
            const daysOverdue = Math.max(0, Math.ceil(
              (new Date().getTime() - new Date(payment.dueDate).getTime()) / (1000 * 60 * 60 * 24)
            ))
            
            return (
              <div 
                key={payment.id} 
                className={`p-4 border rounded-lg transition-colors hover:bg-accent ${getUrgencyColor(daysOverdue)}`}
              >
                {/* Header row */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{payment.tenantName || 'Ismeretlen bérlő'}</span>
                    {getUrgencyBadge(daysOverdue)}
                  </div>
                  <div className="text-lg font-bold text-orange-600">
                    {(payment.amount ?? 0).toLocaleString('hu-HU')} Ft
                  </div>
                </div>
                
                {/* Property and timing info */}
                <div className="flex items-center justify-between mb-3 text-sm text-muted-foreground">
                  <span>{payment.propertyAddress || 'Ismeretlen cím'}</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {daysOverdue > 0 ? `${daysOverdue} napja lejárt` : 'Ma esedékes'}
                  </span>
                </div>

                {/* Action buttons */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-1 h-10 sm:h-8 text-sm" 
                    asChild
                  >
                    <Link href={`mailto:${payment.tenantEmail || ''}?subject=Fizetési emlékeztető`}>
                      <Mail className="h-4 w-4 mr-2" />
                      Email küldés
                    </Link>
                  </Button>
                  
                  {payment.tenantPhone && (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex-1 h-10 sm:h-8 text-sm" 
                      asChild
                    >
                      <Link href={`tel:${payment.tenantPhone}`}>
                        <Phone className="h-4 w-4 mr-2" />
                        Telefonhívás
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}