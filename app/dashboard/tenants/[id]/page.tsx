'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/trpc'
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
  Users,
  FileText,
  Image as ImageIcon,
  Download,
  Plus
} from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { hu } from 'date-fns/locale'

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

  const removeCoTenant = api.tenant.removeCoTenant.useMutation({
    onSuccess: () => {
      // Refresh tenant data
      window.location.reload()
    },
    onError: (error) => {
      alert(`Hiba: ${error.message}`)
    },
  })

  const handleDelete = async () => {
    if (confirm('Biztosan törölni szeretné ezt a bérlőt? Ez a művelet nem visszavonható.')) {
      await deleteTenant.mutateAsync(params.id)
    }
  }

  const handleRemoveCoTenant = async (coTenantId: string) => {
    if (confirm('Biztosan törölni szeretné ezt az albérlőt?')) {
      await removeCoTenant.mutateAsync(coTenantId)
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

      <div className="mb-6">
        <div className="flex items-center gap-4 mb-2">
          {tenant.profilePhoto && (
            <img
              src={tenant.profilePhoto}
              alt="Profilkép"
              className="w-16 h-16 rounded-full object-cover"
            />
          )}
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              {tenant.user.firstName} {tenant.user.lastName}
              {tenant.isPrimary && (
                <Badge variant="default">Főbérlő</Badge>
              )}
              {!tenant.isPrimary && (
                <Badge variant="secondary">Albérlő</Badge>
              )}
            </h1>
            <p className="text-muted-foreground">{tenant.user.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <Badge variant={tenant.isActive ? 'default' : 'secondary'}>
            {tenant.isActive ? 'Aktív' : 'Inaktív'}
          </Badge>
          <span className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            Regisztráció: {format(new Date(tenant.createdAt), 'yyyy. MMMM dd.', { locale: hu })}
          </span>
          {tenant.coTenants && tenant.coTenants.length > 0 && (
            <span className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              {tenant.coTenants.length} albérlő
            </span>
          )}
        </div>
      </div>

      <Tabs defaultValue="details" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="details">Részletek</TabsTrigger>
          <TabsTrigger value="cotenants">
            Albérlők ({tenant.coTenants?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="documents">Dokumentumok</TabsTrigger>
          <TabsTrigger value="contracts">Szerződések</TabsTrigger>
          <TabsTrigger value="issues">Hibabejelentések</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Alapadatok */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Személyes adatok
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Teljes név</p>
                  <p className="font-medium">{tenant.user.firstName} {tenant.user.lastName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    {tenant.user.email}
                  </p>
                </div>
                {tenant.user.phone && (
                  <div>
                    <p className="text-sm text-muted-foreground">Telefon</p>
                    <p className="font-medium flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      {tenant.user.phone}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Vészhelyzeti kapcsolat */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="w-5 h-5" />
                  Vészhelyzeti kapcsolat
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {tenant.emergencyName ? (
                  <>
                    <div>
                      <p className="text-sm text-muted-foreground">Név</p>
                      <p className="font-medium">{tenant.emergencyName}</p>
                    </div>
                    {tenant.emergencyPhone && (
                      <div>
                        <p className="text-sm text-muted-foreground">Telefonszám</p>
                        <p className="font-medium">{tenant.emergencyPhone}</p>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-muted-foreground">Nincs vészhelyzeti kapcsolat megadva</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Belső megjegyzések */}
          {tenant.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Belső megjegyzések
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{tenant.notes}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="cotenants" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Albérlők / Társbérlők</h3>
            <Button variant="outline" asChild>
              <Link href={`/dashboard/tenants/${tenant.id}/add-cotenant`}>
                <Plus className="w-4 h-4 mr-2" />
                Albérlő hozzáadása
              </Link>
            </Button>
          </div>

          {(!tenant.coTenants || tenant.coTenants.length === 0) ? (
            <Card>
              <CardContent className="py-8">
                <div className="text-center">
                  <Users className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-600">Nincsenek albérlők</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Adjon hozzá albérlőket vagy társbérlőket
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {tenant.coTenants.map((coTenant) => (
                <Card key={coTenant.id}>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {coTenant.user.firstName} {coTenant.user.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {coTenant.user.email}
                          </p>
                          {coTenant.user.phone && (
                            <p className="text-sm text-muted-foreground">
                              {coTenant.user.phone}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={coTenant.isActive ? 'default' : 'secondary'}>
                          {coTenant.isActive ? 'Aktív' : 'Inaktív'}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveCoTenant(coTenant.id)}
                          disabled={removeCoTenant.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Dokumentumok</h3>
          </div>

          {(!tenant.documents || tenant.documents.length === 0) ? (
            <Card>
              <CardContent className="py-8">
                <div className="text-center">
                  <FileText className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-600">Nincsenek dokumentumok</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Dokumentumok a szerkesztés menüben tölthetők fel
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {tenant.documents.map((docUrl, index) => (
                <Card key={index} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="aspect-square relative">
                      <img
                        src={docUrl}
                        alt={`Dokumentum ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-opacity flex items-center justify-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                          className="opacity-0 hover:opacity-100 transition-opacity text-white"
                        >
                          <a href={docUrl} target="_blank" rel="noopener noreferrer">
                            <Download className="w-4 h-4" />
                          </a>
                        </Button>
                      </div>
                    </div>
                    <div className="p-2">
                      <p className="text-xs text-muted-foreground">
                        Dokumentum {index + 1}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="contracts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Szerződések</CardTitle>
            </CardHeader>
            <CardContent>
              {tenant.contracts && tenant.contracts.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ingatlan</TableHead>
                      <TableHead>Kezdés</TableHead>
                      <TableHead>Vége</TableHead>
                      <TableHead>Bérleti díj</TableHead>
                      <TableHead>Státusz</TableHead>
                      <TableHead>Műveletek</TableHead>
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
                        <TableCell>
                          {format(new Date(contract.startDate), 'yyyy.MM.dd')}
                        </TableCell>
                        <TableCell>
                          {format(new Date(contract.endDate), 'yyyy.MM.dd')}
                        </TableCell>
                        <TableCell>
                          {Number(contract.rentAmount).toLocaleString()} EUR
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            new Date(contract.endDate) > new Date() ? 'default' : 'secondary'
                          }>
                            {new Date(contract.endDate) > new Date() ? 'Aktív' : 'Lejárt'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/dashboard/contracts/${contract.id}`}>
                              Részletek
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <FileText className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-600">Nincsenek szerződések</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="issues" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Hibabejelentések</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-600">Nincsenek hibabejelentések</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}