'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MapPin, Users, AlertCircle } from 'lucide-react'
import { UserRole } from '@prisma/client'
import Link from 'next/link'
import { api } from '@/lib/trpc'
import { ClientCurrency } from '@/lib/format-date'

interface PropertyOverviewProps {
  userRole: UserRole
}

export function PropertyOverview({ userRole }: PropertyOverviewProps) {
  const { data } = api.property.list.useQuery({
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
          <span>Ingatlan áttekintés</span>
          <Button variant="outline" size="sm" asChild>
            <Link href="/properties">
              Összes megtekintése
            </Link>
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data?.properties?.map((property) => (
            <div
              key={property.id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <h4 className="font-medium text-gray-900">
                    {property.street}, {property.city}
                  </h4>
                  <Badge variant="outline">
                    {getTypeText(property.type)}
                  </Badge>
                </div>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  {property.currentTenant && (
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      {property.currentTenant.user.name}
                    </div>
                  )}
                  {property._count?.issues > 0 && (
                    <div className="flex items-center text-red-600">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {property._count.issues} hiba
                    </div>
                  )}
                  {property.rentAmount && (
                    <div className="font-medium text-gray-900">
                      <ClientCurrency amount={Number(property.rentAmount)} currency={property.currency} />
                      <span>/hó</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant={getStatusColor(property.status)}>
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