'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import { api } from '@/lib/trpc/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ArrowLeft, Mail, Phone, MapPin, Calendar, DollarSign, Star, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { ProviderPropertiesTab } from '@/components/property-provider/provider-properties-tab'

const ratingColors = {
  high: 'bg-green-500',
  medium: 'bg-yellow-500',
  low: 'bg-red-500'
}

const getRatingColor = (rating: number) => {
  if (rating >= 4) return ratingColors.high
  if (rating >= 2.5) return ratingColors.medium
  return ratingColors.low
}

const serviceLabels: Record<string, string> = {
  PLUMBING: 'Vízszerelés',
  ELECTRICAL: 'Villanyszerelés',
  HVAC: 'Fűtés/Hűtés',
  CARPENTRY: 'Asztalos',
  PAINTING: 'Festés',
  CLEANING: 'Takarítás',
  GENERAL: 'Általános'
}

export default function ProviderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const providerId = params.id as string
  const [activeTab, setActiveTab] = useState('overview')
  const [updateError] = useState('')
  const [updateSuccess] = useState('')

  const { data: provider, isLoading, error } = api.provider.getById.useQuery(providerId)
  const { data: issues } = api.issue.list.useQuery({ assignedToId: providerId })
  const { data: stats } = api.provider.getStats.useQuery({ id: providerId })

  // Removed unused updateRating mutation

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !provider) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertDescription>
            {error?.message || 'Szolgáltató nem található'}
          </AlertDescription>
        </Alert>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push('/dashboard/providers')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Vissza a listához
        </Button>
      </div>
    )
  }


  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push('/dashboard/providers')}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{provider.businessName}</h1>
            <p className="text-gray-500">{provider.user.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Badge className={getRatingColor(provider.rating || 0)}>
            {provider.user.isActive ? 'Aktív' : 'Inaktív'}
          </Badge>
          <Button onClick={() => router.push(`/dashboard/providers/${providerId}/edit`)}>
            Szerkesztés
          </Button>
        </div>
      </div>

      {updateError && (
        <Alert variant="destructive">
          <AlertDescription>{updateError}</AlertDescription>
        </Alert>
      )}

      {updateSuccess && (
        <Alert>
          <AlertDescription>{updateSuccess}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Szolgáltató információk</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <p className="text-sm text-gray-500">Kapcsolattartó</p>
                <p className="font-medium">{provider.user.name}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-500">Állapot</p>
                <Badge className={provider.user.isActive ? 'bg-green-500' : 'bg-gray-500'}>
                  {provider.user.isActive ? 'Aktív' : 'Inaktív'}
                </Badge>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <Phone className="w-4 h-4" /> Telefon
                </p>
                <p className="font-medium">{provider.user.phone || 'Nincs megadva'}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <Mail className="w-4 h-4" /> Email
                </p>
                <p className="font-medium">{provider.user.email}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <MapPin className="w-4 h-4" /> Cím
                </p>
                <p className="font-medium">Nincs megadva</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <Calendar className="w-4 h-4" /> Regisztráció dátuma
                </p>
                <p className="font-medium">
                  {new Date(provider.createdAt).toLocaleDateString('hu-HU')}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-500">Szolgáltatások</p>
              <div className="flex flex-wrap gap-2">
                {provider.specialty.map((service) => (
                  <Badge key={service} variant="secondary">
                    {serviceLabels[service] || service}
                  </Badge>
                ))}
              </div>
            </div>
            {provider.hourlyRate && (
              <div className="space-y-2">
                <p className="text-sm text-gray-500">Óradíj</p>
                <p className="font-medium">{provider.hourlyRate.toString()} {provider.currency}/óra</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Statisztikák</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-gray-500">Értékelés</p>
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500 fill-current" />
                <span className="text-2xl font-bold">{(provider.rating || 0).toFixed(1)}</span>
                <span className="text-sm text-gray-500">/ 5.0</span>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-500 flex items-center gap-1">
                <Clock className="w-4 h-4" /> Aktív hibajegyek
              </p>
              <p className="text-2xl font-bold">{stats?.activeIssues || 0}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-500 flex items-center gap-1">
                <CheckCircle className="w-4 h-4" /> Megoldott hibajegyek
              </p>
              <p className="text-2xl font-bold">{stats?.resolvedIssues || 0}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-500 flex items-center gap-1">
                <DollarSign className="w-4 h-4" /> Átlagos díj
              </p>
              <p className="text-2xl font-bold">
                {stats?.averageCost ? `${stats.averageCost.toLocaleString('hu-HU')} Ft` : 'N/A'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Áttekintés</TabsTrigger>
          <TabsTrigger value="properties">Ingatlanok</TabsTrigger>
          <TabsTrigger value="issues">Hibajegyek</TabsTrigger>
          <TabsTrigger value="history">Előzmények</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Teljesítmény áttekintés</CardTitle>
              <CardDescription>
                A szolgáltató teljesítményének összefoglalója
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-sm text-gray-500">Válaszidő</p>
                  <p className="text-2xl font-bold">{stats?.avgResponseTime || 'N/A'}</p>
                  <p className="text-xs text-gray-500">óra</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-sm text-gray-500">Megoldási idő</p>
                  <p className="text-2xl font-bold">{stats?.avgResolutionTime || 'N/A'}</p>
                  <p className="text-xs text-gray-500">nap</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-sm text-gray-500">Sikerességi ráta</p>
                  <p className="text-2xl font-bold">{stats?.successRate || 0}%</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-sm text-gray-500">Ügyfél elégedettség</p>
                  <p className="text-2xl font-bold">{stats?.satisfaction || 0}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="properties" className="space-y-4">
          <ProviderPropertiesTab 
            providerId={providerId} 
            providerName={provider.businessName}
          />
        </TabsContent>

        <TabsContent value="issues" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Aktív hibajegyek</CardTitle>
              <CardDescription>
                A szolgáltatóhoz rendelt aktív hibajegyek listája
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Azonosító</TableHead>
                    <TableHead>Ingatlan</TableHead>
                    <TableHead>Típus</TableHead>
                    <TableHead>Prioritás</TableHead>
                    <TableHead>Állapot</TableHead>
                    <TableHead>Létrehozva</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {issues?.issues.filter(issue => issue.status !== 'CLOSED').map((issue) => (
                    <TableRow 
                      key={issue.id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => router.push(`/dashboard/issues/${issue.id}`)}
                    >
                      <TableCell className="font-medium">#{issue.id}</TableCell>
                      <TableCell>{issue.property.street}, {issue.property.city}</TableCell>
                      <TableCell>{issue.category}</TableCell>
                      <TableCell>
                        <Badge variant={issue.priority === 'HIGH' ? 'destructive' : issue.priority === 'MEDIUM' ? 'default' : 'secondary'}>
                          {issue.priority === 'HIGH' ? 'Magas' : issue.priority === 'MEDIUM' ? 'Közepes' : 'Alacsony'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge>
                          {issue.status === 'OPEN' ? 'Nyitott' : issue.status === 'IN_PROGRESS' ? 'Folyamatban' : 'Megoldva'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(issue.createdAt).toLocaleDateString('hu-HU')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {(!issues || issues.issues.filter(issue => issue.status !== 'CLOSED').length === 0) && (
                <div className="text-center py-8 text-gray-500">
                  Nincsenek aktív hibajegyek
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Előzmények</CardTitle>
              <CardDescription>
                A szolgáltató által kezelt összes hibajegy
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Azonosító</TableHead>
                    <TableHead>Ingatlan</TableHead>
                    <TableHead>Típus</TableHead>
                    <TableHead>Állapot</TableHead>
                    <TableHead>Lezárva</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {issues?.issues.map((issue) => (
                    <TableRow 
                      key={issue.id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => router.push(`/dashboard/issues/${issue.id}`)}
                    >
                      <TableCell className="font-medium">#{issue.id}</TableCell>
                      <TableCell>{issue.property.street}, {issue.property.city}</TableCell>
                      <TableCell>{issue.category}</TableCell>
                      <TableCell>
                        {issue.status === 'CLOSED' ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : issue.status === 'IN_PROGRESS' ? (
                          <AlertCircle className="w-4 h-4 text-yellow-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500" />
                        )}
                      </TableCell>
                      <TableCell>
                        {issue.completedDate ? new Date(issue.completedDate).toLocaleDateString('hu-HU') : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {(!issues || issues.issues.length === 0) && (
                <div className="text-center py-8 text-gray-500">
                  Még nincsenek előzmények
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}