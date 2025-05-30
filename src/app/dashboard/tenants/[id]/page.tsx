'use client'

import { useState } from 'react'
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
  Calendar,
  AlertCircle,
  Trash2,
  Edit,
  User,
  FileText
} from 'lucide-react'
import Link from 'next/link'

export default function TenantDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const { data: tenant, isLoading } = api.tenant.getById.useQuery(params.id)

  const deleteTenant = api.tenant.delete.useMutation({
    onSuccess: () => {
      router.push('/dashboard/tenants')
    },
    onError: (error) => {
      setDeleteError(error.message)
    },
  })

  const handleDelete = async () => {
    if (confirm('Biztosan törölni szeretné ezt a bérlőt? Ez a művelet nem visszavonható.')) {
      await deleteTenant.mutateAsync(params.id)
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

  if (!tenant) {
    return (
      <div className="container mx-auto py-6 px-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            A bérlő nem található.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-6 flex items-center justify-between">
        <Button variant="ghost" asChild>
          <Link href="/dashboard/tenants">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Vissza
          </Link>
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/dashboard/tenants/${tenant.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Szerkesztés
            </Link>
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete}
            disabled={deleteTenant.isPending}
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
              <CardTitle>Bérlő adatok</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">{tenant.user.name}</h3>
                <Badge variant="secondary" className="mt-1">
                  Bérlő
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="flex items-center text-sm">
                  <Mail className="mr-2 h-4 w-4 text-gray-400" />
                  <a href={`mailto:${tenant.user.email}`} className="text-blue-600 hover:underline">
                    {tenant.user.email}
                  </a>
                </div>

                {tenant.user.phone && (
                  <div className="flex items-center text-sm">
                    <Phone className="mr-2 h-4 w-4 text-gray-400" />
                    <a href={`tel:${tenant.user.phone}`} className="text-blue-600 hover:underline">
                      {tenant.user.phone}
                    </a>
                  </div>
                )}

                {tenant.user.address && (
                  <div className="flex items-start text-sm">
                    <MapPin className="mr-2 h-4 w-4 text-gray-400 mt-0.5" />
                    <span>{tenant.user.address}</span>
                  </div>
                )}

                <div className="flex items-center text-sm">
                  <Calendar className="mr-2 h-4 w-4 text-gray-400" />
                  <span>Regisztráció: {new Date(tenant.user.createdAt).toLocaleDateString('hu-HU')}</span>
                </div>
              </div>

              {(tenant.emergencyContact || tenant.emergencyPhone) && (
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2 flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    Vészhelyzeti kapcsolat
                  </h4>
                  {tenant.emergencyContact && (
                    <p className="text-sm">{tenant.emergencyContact}</p>
                  )}
                  {tenant.emergencyPhone && (
                    <div className="flex items-center text-sm mt-1">
                      <Phone className="mr-2 h-4 w-4 text-gray-400" />
                      <a href={`tel:${tenant.emergencyPhone}`} className="text-blue-600 hover:underline">
                        {tenant.emergencyPhone}
                      </a>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Tabs defaultValue="contracts" className="space-y-4">
            <TabsList>
              <TabsTrigger value="contracts">
                Szerződések ({tenant._count?.contracts || 0})
              </TabsTrigger>
              <TabsTrigger value="issues">
                Hibabejelentések ({tenant._count?.issues || 0})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="contracts">
              <Card>
                <CardHeader>
                  <CardTitle>Bérleti szerződések</CardTitle>
                </CardHeader>
                <CardContent>
                  {tenant.contracts && tenant.contracts.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Ingatlan</TableHead>
                          <TableHead>Tulajdonos</TableHead>
                          <TableHead>Kezdete</TableHead>
                          <TableHead>Vége</TableHead>
                          <TableHead>Bérleti díj</TableHead>
                          <TableHead>Státusz</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tenant.contracts.map((contract) => (
                          <TableRow key={contract.id}>
                            <TableCell>
                              <Link 
                                href={`/dashboard/properties/${contract.property.id}`}
                                className="text-blue-600 hover:underline"
                              >
                                {contract.property.street}, {contract.property.city}
                              </Link>
                            </TableCell>
                            <TableCell>{contract.owner.user.name}</TableCell>
                            <TableCell>
                              {new Date(contract.startDate).toLocaleDateString('hu-HU')}
                            </TableCell>
                            <TableCell>
                              {new Date(contract.endDate).toLocaleDateString('hu-HU')}
                            </TableCell>
                            <TableCell>
                              {contract.rentAmount.toLocaleString('hu-HU')} Ft
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

            <TabsContent value="issues">
              <Card>
                <CardHeader>
                  <CardTitle>Bejelentett hibák</CardTitle>
                </CardHeader>
                <CardContent>
                  {tenant.issues && tenant.issues.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Cím</TableHead>
                          <TableHead>Ingatlan</TableHead>
                          <TableHead>Prioritás</TableHead>
                          <TableHead>Státusz</TableHead>
                          <TableHead>Bejelentve</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tenant.issues.map((issue) => (
                          <TableRow key={issue.id}>
                            <TableCell className="font-medium">
                              <Link 
                                href={`/dashboard/issues/${issue.id}`}
                                className="text-blue-600 hover:underline"
                              >
                                {issue.title}
                              </Link>
                            </TableCell>
                            <TableCell>
                              {issue.property.street}, {issue.property.city}
                            </TableCell>
                            <TableCell>
                              <Badge variant={
                                issue.priority === 'URGENT' || issue.priority === 'HIGH' 
                                  ? 'destructive' 
                                  : 'default'
                              }>
                                {issue.priority}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={
                                issue.status === 'COMPLETED' || issue.status === 'CLOSED'
                                  ? 'secondary'
                                  : 'default'
                              }>
                                {issue.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {new Date(issue.createdAt).toLocaleDateString('hu-HU')}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-center text-gray-500 py-8">
                      Nincs még hibabejelentés
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