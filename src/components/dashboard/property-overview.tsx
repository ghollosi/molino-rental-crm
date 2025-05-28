'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MapPin, Users, AlertCircle } from 'lucide-react'
import { UserRole } from '@prisma/client'
import Link from 'next/link'
import { trpc } from '@/src/lib/trpc'
import { ClientCurrency } from '@/lib/format-date'

interface PropertyOverviewProps {
  userRole: UserRole
}

export function PropertyOverview({ userRole }: PropertyOverviewProps) {
  const { data } = trpc.property.list.useQuery({
    page: 1,
    limit: 5,
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return 'secondary'
      case 'RENTED':
        return 'default'
      case 'MAINTENANCE':
        return 'destructive'
      default:
        return 'default'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return 'Elérhető'
      case 'RENTED':
        return 'Bérelt'
      case 'MAINTENANCE':
        return 'Karbantartás'
      default:
        return status
    }
  }

  const getTypeText = (type: string) => {
    switch (type) {
      case 'APARTMENT':
        return 'Lakás'
      case 'HOUSE':
        return 'Ház'
      case 'OFFICE':
        return 'Iroda'
      case 'COMMERCIAL':
        return 'Üzlet'
      default:
        return type
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="text-lg md:text-xl">Ingatlan áttekintés</span>
          <Button variant="outline" size="sm" asChild>
            <Link href="/properties">
              <span className="hidden sm:inline">Összes megtekintése</span>
              <span className="sm:hidden">Összes</span>
            </Link>
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 md:space-y-4">
          {data?.properties?.map((property) => (
            <div
              key={property.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between p-3 md:p-4 border rounded-lg hover:bg-gray-50 transition-colors space-y-2 sm:space-y-0"
            >
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2 mb-2">
                  <h4 className="font-medium text-sm md:text-base text-gray-900 truncate">
                    {property.street}, {property.city}
                  </h4>
                  <Badge variant="outline" className="text-xs w-fit">
                    {getTypeText(property.type)}
                  </Badge>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-1 sm:space-y-0 text-xs md:text-sm text-gray-500">
                  {property.currentTenant && (
                    <div className="flex items-center">
                      <Users className="h-3 w-3 md:h-4 md:w-4 mr-1 flex-shrink-0" />
                      <span className="truncate">{property.currentTenant.user.name}</span>
                    </div>
                  )}
                  {property._count?.issues > 0 && (
                    <div className="flex items-center text-red-600">
                      <AlertCircle className="h-3 w-3 md:h-4 md:w-4 mr-1 flex-shrink-0" />
                      <span>{property._count.issues} hiba</span>
                    </div>
                  )}
                  {property.rentAmount && (
                    <div className="font-medium text-gray-900 text-xs md:text-sm">
                      <ClientCurrency amount={Number(property.rentAmount)} currency={property.currency} />
                      <span>/hó</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-end sm:justify-start">
                <Badge variant={getStatusColor(property.status)} className="text-xs">
                  {getStatusText(property.status)}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}