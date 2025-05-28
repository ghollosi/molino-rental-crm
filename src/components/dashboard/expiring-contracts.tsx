'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, Clock, FileText, ArrowRight } from 'lucide-react'
import { trpc } from '@/src/lib/trpc'
import { Skeleton } from '@/components/ui/skeleton'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { hu } from 'date-fns/locale'

export function ExpiringContracts() {
  const { data, isLoading } = trpc.contracts.getExpiringContracts.useQuery({
    days: 60 // Következő 60 napban lejáró szerződések
  })

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Lejáró szerződések</CardTitle>
          <CardDescription>Hamarosan megújítandó szerződések</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="space-y-1">
                  <Skeleton className="h-4 w-40" />
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

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Lejáró szerződések</CardTitle>
          <CardDescription>Hamarosan megújítandó szerződések</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="mx-auto h-12 w-12 mb-3 opacity-20" />
            <p>Nincs lejáró szerződés a következő 60 napban</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const getUrgencyBadge = (daysUntilExpiry: number) => {
    if (daysUntilExpiry <= 7) {
      return <Badge variant="destructive">Sürgős</Badge>
    } else if (daysUntilExpiry <= 30) {
      return <Badge variant="secondary">Hamarosan</Badge>
    }
    return <Badge variant="secondary">{daysUntilExpiry} nap</Badge>
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Lejáró szerződések</CardTitle>
          <CardDescription>Hamarosan megújítandó szerződések</CardDescription>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/contracts">
            Összes <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.slice(0, 5).map((contract) => {
            const daysUntilExpiry = Math.ceil(
              (new Date(contract.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
            )
            
            return (
              <div key={contract.id} className="p-4 border rounded-lg hover:bg-accent transition-colors">
                {/* Header row */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <Link 
                      href={`/dashboard/contracts/${contract.id}`}
                      className="font-medium hover:underline"
                    >
                      {contract.property.street}, {contract.property.city}
                    </Link>
                  </div>
                  {getUrgencyBadge(daysUntilExpiry)}
                </div>
                
                {/* Contract details */}
                <div className="flex items-center justify-between mb-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {contract.tenant?.user?.name || 'Nincs bérlő'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(contract.endDate).toLocaleDateString('hu-HU')}
                  </span>
                </div>

                {/* Action button */}
                <Button size="sm" variant="outline" className="w-full" asChild>
                  <Link href={`/dashboard/contracts/${contract.id}`}>
                    Szerződés megtekintése
                  </Link>
                </Button>
              </div>
            )
          })}
        </div>
        
        {data.length > 5 && (
          <div className="mt-4 text-center">
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/contracts?filter=expiring">
                További {data.length - 5} lejáró szerződés megtekintése
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}