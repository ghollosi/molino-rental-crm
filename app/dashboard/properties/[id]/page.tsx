'use client'

import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ArrowLeft,
  Building,
  MapPin,
  User,
  Calendar,
  Edit,
  Trash2,
  AlertCircle,
  FileText,
  Home,
} from 'lucide-react'
import { api } from '@/lib/trpc'

export default function PropertyDetailPage() {
  const params = useParams()
  const router = useRouter()
  const propertyId = params.id as string

  const { data: property, isLoading } = api.property.getById.useQuery(propertyId)

  const deleteMutation = api.property.delete.useMutation({
    onSuccess: () => {
      router.push('/dashboard/properties')
    },
  })

  const handleDelete = () => {
    if (confirm('Biztosan törli ezt az ingatlant?')) {
      deleteMutation.mutate(propertyId)
    }
  }

  if (isLoading) {
    return <div className="text-center py-8">Betöltés...</div>
  }

  if (!property) {
    return <div className="text-center py-8">Ingatlan nem található</div>
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      AVAILABLE: 'secondary',
      RENTED: 'default',
      MAINTENANCE: 'destructive',
    }
    const labels: Record<string, string> = {
      AVAILABLE: 'Elérhető',
      RENTED: 'Bérelt',
      MAINTENANCE: 'Karbantartás',
    }
    return (
      <Badge variant={variants[status] || 'default'}>
        {labels[status] || status}
      </Badge>
    )
  }

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      APARTMENT: 'Lakás',
      HOUSE: 'Ház',
      OFFICE: 'Iroda',
      COMMERCIAL: 'Üzlet',
    }
    return labels[type] || type
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/properties">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Vissza
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {property.street}
            </h1>
            <p className="text-gray-600">
              {property.city}
              {property.postalCode && `, ${property.postalCode}`}
              {property.country && `, ${property.country}`}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" asChild>
            <Link href={`/dashboard/properties/${propertyId}/edit`}>
              <Edit className="h-4 w-4 mr-2" />
              Szerkesztés
            </Link>
          </Button>
          <Button
            variant="outline"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Törlés
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Alapadatok</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Típus</p>
                  <p className="font-medium">{getTypeLabel(property.type)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Státusz</p>
                  <div className="mt-1">{getStatusBadge(property.status)}</div>
                </div>
                {property.size && (
                  <div>
                    <p className="text-sm text-gray-500">Méret</p>
                    <p className="font-medium">{property.size} m²</p>
                  </div>
                )}
                {property.rooms && (
                  <div>
                    <p className="text-sm text-gray-500">Szobák száma</p>
                    <p className="font-medium">{property.rooms}</p>
                  </div>
                )}
                {property.floor !== null && property.floor !== undefined && (
                  <div>
                    <p className="text-sm text-gray-500">Emelet</p>
                    <p className="font-medium">{property.floor}</p>
                  </div>
                )}
                {property.rentAmount && (
                  <div>
                    <p className="text-sm text-gray-500">Bérleti díj</p>
                    <p className="font-medium">
                      {Number(property.rentAmount).toLocaleString()} {property.currency}/hó
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {property.photos && property.photos.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Képek</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {property.photos.map((photo, index) => (
                    <img
                      key={index}
                      src={photo}
                      alt={`${property.street} - ${index + 1}`}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Tabs defaultValue="issues" className="w-full">
            <TabsList>
              <TabsTrigger value="issues">
                <AlertCircle className="h-4 w-4 mr-2" />
                Hibabejelentések ({property.issues.length})
              </TabsTrigger>
              <TabsTrigger value="contracts">
                <FileText className="h-4 w-4 mr-2" />
                Szerződések ({property.contracts.length})
              </TabsTrigger>
              <TabsTrigger value="offers">
                <FileText className="h-4 w-4 mr-2" />
                Ajánlatok ({property.offers.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="issues" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Legutóbbi hibabejelentések</CardTitle>
                  <CardDescription>
                    Az ingatlanhoz kapcsolódó hibák és karbantartási feladatok
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {property.issues.length === 0 ? (
                    <p className="text-gray-500">Nincs hibabejelentés</p>
                  ) : (
                    <div className="space-y-4">
                      {property.issues.map((issue) => (
                        <div
                          key={issue.id}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div>
                            <h4 className="font-medium">{issue.title}</h4>
                            <p className="text-sm text-gray-500">
                              {new Date(issue.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge>{issue.status}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="contracts" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Bérleti szerződések</CardTitle>
                  <CardDescription>
                    Az ingatlanhoz kapcsolódó szerződések története
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {property.contracts.length === 0 ? (
                    <p className="text-gray-500">Nincs szerződés</p>
                  ) : (
                    <div className="space-y-4">
                      {property.contracts.map((contract) => (
                        <div
                          key={contract.id}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div>
                            <h4 className="font-medium">
                              {contract.tenant.user.name}
                            </h4>
                            <p className="text-sm text-gray-500">
                              {new Date(contract.startDate).toLocaleDateString()} -{' '}
                              {new Date(contract.endDate).toLocaleDateString()}
                            </p>
                          </div>
                          <p className="font-medium">
                            {Number(contract.rentAmount).toLocaleString()} Ft/hó
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="offers" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Ajánlatok</CardTitle>
                  <CardDescription>
                    Az ingatlanhoz kapcsolódó árajánlatok
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {property.offers.length === 0 ? (
                    <p className="text-gray-500">Nincs ajánlat</p>
                  ) : (
                    <div className="space-y-4">
                      {property.offers.map((offer) => (
                        <div
                          key={offer.id}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div>
                            <h4 className="font-medium">{offer.offerNumber}</h4>
                            <p className="text-sm text-gray-500">
                              {new Date(offer.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">
                              {Number(offer.totalAmount).toLocaleString()} {offer.currency}
                            </p>
                            <Badge>{offer.status}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tulajdonos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start space-x-4">
                <div className="p-2 bg-gray-100 rounded-full">
                  <User className="h-6 w-6 text-gray-600" />
                </div>
                <div>
                  <p className="font-medium">{property.owner.user.name}</p>
                  <p className="text-sm text-gray-500">{property.owner.user.email}</p>
                  {property.owner.user.phone && (
                    <p className="text-sm text-gray-500">{property.owner.user.phone}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {property.currentTenant && (
            <Card>
              <CardHeader>
                <CardTitle>Jelenlegi bérlő</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start space-x-4">
                  <div className="p-2 bg-gray-100 rounded-full">
                    <Home className="h-6 w-6 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium">{property.currentTenant.user.name}</p>
                    <p className="text-sm text-gray-500">
                      {property.currentTenant.user.email}
                    </p>
                    {property.currentTenant.user.phone && (
                      <p className="text-sm text-gray-500">
                        {property.currentTenant.user.phone}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Egyéb információk</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Létrehozva</p>
                <p className="font-medium">
                  {new Date(property.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Utoljára módosítva</p>
                <p className="font-medium">
                  {new Date(property.updatedAt).toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}