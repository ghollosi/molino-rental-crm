'use client'

import { useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/trpc/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  MapPin, 
  Building,
  Calendar,
  AlertCircle,
  Trash2,
  Edit
} from 'lucide-react'
import Link from 'next/link'

export default function OwnerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const { id } = use(params)

  // Skip API call for non-ID routes
  const isValidId = id && !['new', 'create-test', 'new-quick'].includes(id) && 
                    id.length > 10 // Prisma IDs are longer than 10 chars

  const { data: owner, isLoading } = api.owner.getById.useQuery(id, {
    enabled: !!isValidId
  })

  // Redirect invalid routes
  if (!isValidId) {
    return (
      <div className="container mx-auto py-6 px-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Érvénytelen tulajdonos azonosító. <Link href="/dashboard/owners" className="underline">Vissza a listához</Link>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // const deleteOwner = api.owner.delete.useMutation({
  //   onSuccess: () => {
  //     router.push('/dashboard/owners')
  //   },
  //   onError: (error: any) => {
  //     setDeleteError(error.message)
  //   },
  // })

  const handleDelete = async () => {
    if (confirm('Biztosan törölni szeretné ezt a tulajdonost? Ez a művelet nem visszavonható.')) {
      // await deleteOwner.mutateAsync(params.id)
      console.log('Delete functionality not implemented yet')
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="animate-pulse">
          <div className="h-8 w-32 bg-gray-200 rounded mb-6"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!owner) {
    return (
      <div className="container mx-auto py-6 px-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            A tulajdonos nem található.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-6 flex items-center justify-between">
        <Button variant="ghost" asChild>
          <Link href="/dashboard/owners">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Vissza
          </Link>
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/dashboard/owners/${owner.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Szerkesztés
            </Link>
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete}
            disabled={false}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Törlés
          </Button>
        </div>
      </div>

      {deleteError && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{deleteError}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Tulajdonos adatok</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">{owner.user.name}</h3>
                <Badge variant={(owner as any).isCompany ? 'default' : 'secondary'} className="mt-1">
                  {(owner as any).isCompany ? 'Cég' : 'Magánszemély'}
                </Badge>
              </div>

              {(owner as any).companyName && (
                <div>
                  <p className="text-sm text-gray-500">Cégnév</p>
                  <p className="font-medium">{(owner as any).companyName}</p>
                </div>
              )}

              {owner.taxNumber && (
                <div>
                  <p className="text-sm text-gray-500">Adószám</p>
                  <p className="font-medium">{owner.taxNumber}</p>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center text-sm">
                  <Mail className="mr-2 h-4 w-4 text-gray-400" />
                  <a href={`mailto:${owner.user.email}`} className="text-blue-600 hover:underline">
                    {owner.user.email}
                  </a>
                </div>

                {owner.user.phone && (
                  <div className="flex items-center text-sm">
                    <Phone className="mr-2 h-4 w-4 text-gray-400" />
                    <a href={`tel:${owner.user.phone}`} className="text-blue-600 hover:underline">
                      {owner.user.phone}
                    </a>
                  </div>
                )}

                {(owner.user as any).address && (
                  <div className="flex items-start text-sm">
                    <MapPin className="mr-2 h-4 w-4 text-gray-400 mt-0.5" />
                    <span>{(owner.user as any).address}</span>
                  </div>
                )}

                <div className="flex items-center text-sm">
                  <Calendar className="mr-2 h-4 w-4 text-gray-400" />
                  <span>Regisztráció: {new Date(owner.user.createdAt).toLocaleDateString('hu-HU')}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Tabs defaultValue="properties" className="space-y-4">
            <TabsList>
              <TabsTrigger value="properties">
                Ingatlanok ({(owner as any)._count?.properties || 0})
              </TabsTrigger>
              <TabsTrigger value="contracts">
                Szerződések ({(owner as any)._count?.contracts || 0})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="properties">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Tulajdonában lévő ingatlanok</CardTitle>
                    <Button size="sm" asChild>
                      <Link href={`/dashboard/properties/new?ownerId=${owner.id}`}>
                        Új ingatlan
                      </Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {owner.properties && owner.properties.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Cím</TableHead>
                          <TableHead>Típus</TableHead>
                          <TableHead>Alapterület</TableHead>
                          <TableHead>Bérleti díj</TableHead>
                          <TableHead>Státusz</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {owner.properties.map((property) => (
                          <TableRow key={property.id}>
                            <TableCell>
                              <Link 
                                href={`/dashboard/properties/${property.id}`}
                                className="text-blue-600 hover:underline"
                              >
                                {property.street}, {property.city}
                              </Link>
                            </TableCell>
                            <TableCell>{property.type}</TableCell>
                            <TableCell>{property.size} m²</TableCell>
                            <TableCell>
                              {property.rentAmount ? `${Number(property.rentAmount).toLocaleString('hu-HU')} Ft` : '-'}
                            </TableCell>
                            <TableCell>
                              <Badge variant={(property as any).isActive ? 'default' : 'secondary'}>
                                {(property as any).isActive ? 'Aktív' : 'Inaktív'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-center text-gray-500 py-8">
                      Nincs még ingatlan hozzárendelve
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="contracts">
              <Card>
                <CardHeader>
                  <CardTitle>Szerződések</CardTitle>
                </CardHeader>
                <CardContent>
                  {(owner as any).contracts && (owner as any).contracts.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Ingatlan</TableHead>
                          <TableHead>Bérlő</TableHead>
                          <TableHead>Kezdete</TableHead>
                          <TableHead>Vége</TableHead>
                          <TableHead>Státusz</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(owner as any).contracts.map((contract: any) => (
                          <TableRow key={contract.id}>
                            <TableCell>
                              {contract.property.street}, {contract.property.city}
                            </TableCell>
                            <TableCell>{contract.tenant.user.name}</TableCell>
                            <TableCell>
                              {new Date(contract.startDate).toLocaleDateString('hu-HU')}
                            </TableCell>
                            <TableCell>
                              {new Date(contract.endDate).toLocaleDateString('hu-HU')}
                            </TableCell>
                            <TableCell>
                              <Badge variant={contract.isActive ? 'default' : 'secondary'}>
                                {contract.isActive ? 'Aktív' : 'Lejárt'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-center text-gray-500 py-8">
                      Nincs még szerződés
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}