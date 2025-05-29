'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import { api } from '@/lib/trpc/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, Calendar, DollarSign, Building, User, Phone, Mail, FileText, AlertTriangle } from 'lucide-react'

const statusColors = {
  ACTIVE: 'bg-green-500',
  EXPIRED: 'bg-gray-500',
  TERMINATED: 'bg-red-500',
  PENDING: 'bg-yellow-500'
}

const statusLabels = {
  ACTIVE: 'Aktív',
  EXPIRED: 'Lejárt',
  TERMINATED: 'Megszünt',
  PENDING: 'Függőben'
}

export default function ContractDetailPage() {
  const params = useParams()
  const router = useRouter()
  const contractId = params.id as string
  const [activeTab, setActiveTab] = useState('overview')
  const [terminateError, setTerminateError] = useState('')
  const [terminateSuccess, setTerminateSuccess] = useState('')
  const [showTerminateConfirm, setShowTerminateConfirm] = useState(false)

  const { data: contract, isLoading, error, refetch } = api.contract.getById.useQuery(contractId)

  const terminateContract = api.contract.terminate.useMutation({
    onSuccess: () => {
      setTerminateSuccess('Szerződés sikeresen megszüntetve')
      setTerminateError('')
      setShowTerminateConfirm(false)
      refetch()
      setTimeout(() => setTerminateSuccess(''), 3000)
    },
    onError: (error) => {
      setTerminateError(error.message)
      setTerminateSuccess('')
    },
  })

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

  if (error || !contract) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertDescription>
            {error?.message || 'Szerződés nem található'}
          </AlertDescription>
        </Alert>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push('/dashboard/contracts')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Vissza a listához
        </Button>
      </div>
    )
  }

  const handleTerminate = () => {
    terminateContract.mutate({
      id: contractId,
      terminationDate: new Date(),
      reason: 'Manual termination'
    })
  }

  const isActive = contract.status === 'ACTIVE'
  const daysToExpiry = Math.ceil((new Date(contract.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push('/dashboard/contracts')}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Szerződés #{contract.id.slice(-6)}</h1>
            <p className="text-gray-500">{contract.property.street}, {contract.property.city}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Badge className={statusColors[contract.status as keyof typeof statusColors]}>
            {statusLabels[contract.status as keyof typeof statusLabels]}
          </Badge>
          {isActive && (
            <Button
              variant="destructive"
              onClick={() => setShowTerminateConfirm(true)}
            >
              Szerződés megszüntetése
            </Button>
          )}
          <Button onClick={() => router.push(`/dashboard/contracts/${contractId}/edit`)}>
            Szerkesztés
          </Button>
        </div>
      </div>

      {terminateError && (
        <Alert variant="destructive">
          <AlertDescription>{terminateError}</AlertDescription>
        </Alert>
      )}

      {terminateSuccess && (
        <Alert>
          <AlertDescription>{terminateSuccess}</AlertDescription>
        </Alert>
      )}

      {showTerminateConfirm && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <div className="ml-2">
            <p className="font-medium">Biztos, hogy megszünteti a szerződést?</p>
            <p className="text-sm mt-1">Ez a művelet nem vonható vissza. A szerződés azonnal lejár és az ingatlan elérhetővé válik.</p>
            <div className="flex gap-2 mt-3">
              <Button size="sm" variant="destructive" onClick={handleTerminate}>
                Igen, megszüntetem
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowTerminateConfirm(false)}>
                Mégse
              </Button>
            </div>
          </div>
        </Alert>
      )}

      {daysToExpiry <= 30 && daysToExpiry > 0 && contract.status === 'ACTIVE' && (
        <Alert>
          <Calendar className="h-4 w-4" />
          <AlertDescription>
            Ez a szerződés {daysToExpiry} nap múlva jár le ({new Date(contract.endDate).toLocaleDateString('hu-HU')}).
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Szerződés részletei</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <Building className="w-4 h-4" /> Ingatlan
                </p>
                <div>
                  <p className="font-medium">{contract.property.street}</p>
                  <p className="text-sm text-gray-500">{contract.property.city}</p>
                  <p className="text-sm text-gray-500">{contract.property.type}</p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <User className="w-4 h-4" /> Bérlő
                </p>
                <div>
                  <p className="font-medium">{contract.tenant.user.name}</p>
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <Mail className="w-3 h-3" /> {contract.tenant.user.email}
                  </p>
                  {contract.tenant.user.phone && (
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <Phone className="w-3 h-3" /> {contract.tenant.user.phone}
                    </p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <Calendar className="w-4 h-4" /> Szerződés időtartama
                </p>
                <div>
                  <p className="font-medium">
                    {new Date(contract.startDate).toLocaleDateString('hu-HU')} - 
                    {new Date(contract.endDate).toLocaleDateString('hu-HU')}
                  </p>
                  <p className="text-sm text-gray-500">
                    {Math.ceil((new Date(contract.endDate).getTime() - new Date(contract.startDate).getTime()) / (1000 * 60 * 60 * 24))} nap
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <DollarSign className="w-4 h-4" /> Pénzügyi információk
                </p>
                <div>
                  <p className="font-medium">{contract.rentAmount.toLocaleString('hu-HU')} Ft/hó</p>
                  {contract.deposit && (
                    <p className="text-sm text-gray-500">
                      Kaució: {contract.deposit.toLocaleString('hu-HU')} Ft
                    </p>
                  )}
                  <p className="text-sm text-gray-500">
                    Fizetési nap: minden hónap {contract.paymentDay}.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tulajdonos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="font-medium">{contract.property.owner.user.name}</p>
              <p className="text-sm text-gray-500 flex items-center gap-1">
                <Mail className="w-3 h-3" /> {contract.property.owner.user.email}
              </p>
              {contract.property.owner.user.phone && (
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <Phone className="w-3 h-3" /> {contract.property.owner.user.phone}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Összefoglaló</TabsTrigger>
          <TabsTrigger value="payments">Fizetések</TabsTrigger>
          <TabsTrigger value="history">Előzmények</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Szerződés összefoglaló</CardTitle>
              <CardDescription>
                A bérleti szerződés főbb adatai és állapota
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-sm text-gray-500">Hátralévő napok</p>
                  <p className="text-2xl font-bold">
                    {contract.status === 'ACTIVE' ? Math.max(0, daysToExpiry) : 0}
                  </p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-sm text-gray-500">Havi bevétel</p>
                  <p className="text-2xl font-bold">
                    {contract.rentAmount.toLocaleString('hu-HU')} Ft
                  </p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-sm text-gray-500">Összes bevétel</p>
                  <p className="text-2xl font-bold">
                    {(contract.rentAmount * Math.ceil((new Date(contract.endDate).getTime() - new Date(contract.startDate).getTime()) / (1000 * 60 * 60 * 24 * 30))).toLocaleString('hu-HU')} Ft
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Fizetési előzmények</CardTitle>
              <CardDescription>
                A bérleti díjak fizetésének nyomon követése
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>A fizetési előzmények funkció fejlesztés alatt áll</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Szerződés előzmények</CardTitle>
              <CardDescription>
                A szerződés módosításainak és eseményeinek története
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-3 border rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium">Szerződés létrehozva</p>
                    <p className="text-sm text-gray-500">
                      {new Date(contract.createdAt).toLocaleDateString('hu-HU')}
                    </p>
                  </div>
                </div>
                {contract.status === 'EXPIRED' && (
                  <div className="flex items-start gap-3 p-3 border rounded-lg">
                    <div className="w-2 h-2 bg-gray-500 rounded-full mt-2"></div>
                    <div>
                      <p className="font-medium">Szerződés lejárt</p>
                      <p className="text-sm text-gray-500">
                        {new Date(contract.endDate).toLocaleDateString('hu-HU')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}