'use client'

import { useRouter } from 'next/navigation'
import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/src/components/ui/separator'
import { api } from '@/lib/trpc'
import { ArrowLeft, PenTool, Check, X } from 'lucide-react'
import { useToast } from '@/src/hooks/use-toast'
import SignatureCanvas from 'react-signature-canvas'

export default function ContractSignaturePage({ params }: { params: { id: string } }) {
  const { toast } = useToast()
    const router = useRouter()
  const contractId = params.id
  
  const landlordSigRef = useRef<SignatureCanvas>(null)
  const tenantSigRef = useRef<SignatureCanvas>(null)
  
  const [landlordSigned, setLandlordSigned] = useState(false)
  const [tenantSigned, setTenantSigned] = useState(false)

  const { data: contract, isLoading, refetch } = api.contract.getById.useQuery(contractId)

  const updateContract = api.contract.update.useMutation({
    onSuccess: () => {
      toast({ title: 'Siker', description: 'Aláírások sikeresen mentve!' })
      refetch()
    },
    onError: (error) => {
      toast({ title: 'Hiba', description: error.message, variant: 'destructive' })
    }
  })

  const clearLandlordSignature = () => {
    landlordSigRef.current?.clear()
    setLandlordSigned(false)
  }

  const clearTenantSignature = () => {
    tenantSigRef.current?.clear()
    setTenantSigned(false)
  }

  const handleLandlordSign = () => {
    if (landlordSigRef.current && !landlordSigRef.current.isEmpty()) {
      setLandlordSigned(true)
    }
  }

  const handleTenantSign = () => {
    if (tenantSigRef.current && !tenantSigRef.current.isEmpty()) {
      setTenantSigned(true)
    }
  }

  const saveSignatures = () => {
    const landlordSignature = landlordSigRef.current?.getCanvas().toDataURL()
    const tenantSignature = tenantSigRef.current?.getCanvas().toDataURL()

    if (!landlordSignature || !tenantSignature) {
      toast({ 
        title: 'Hiányzó aláírások', 
        description: 'Mindkét fél aláírása szükséges!',
        variant: 'destructive' 
      })
      return
    }

    const now = new Date()
    
    updateContract.mutate({
      id: contractId,
      landlordSignature,
      tenantSignature,
      landlordSignedAt: now,
      tenantSignedAt: now,
      status: 'ACTIVE',
    })
  }

  if (isLoading) {
    return <div className="p-6">Betöltés...</div>
  }

  if (!contract) {
    return <div className="p-6">Szerződés nem található.</div>
  }

  const hasExistingSignatures = contract.landlordSignature && contract.tenantSignature

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Vissza
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Szerződés aláírása</h1>
          <p className="text-muted-foreground">Digitális aláírások kezelése</p>
        </div>
      </div>

      {hasExistingSignatures && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-500" />
              Aláírások megtekintése
            </CardTitle>
            <CardDescription>
              A szerződés már aláírásra került mindkét fél által
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Bérbeadó aláírása</Label>
                {contract.landlordSignature && (
                  <div className="border rounded p-2 bg-muted">
                    <img 
                      src={contract.landlordSignature} 
                      alt="Bérbeadó aláírása"
                      className="max-w-full h-20 object-contain"
                    />
                  </div>
                )}
                {contract.landlordSignedAt && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Aláírva: {new Date(contract.landlordSignedAt).toLocaleString('hu-HU')}
                  </p>
                )}
              </div>

              <div>
                <Label>Bérlő aláírása</Label>
                {contract.tenantSignature && (
                  <div className="border rounded p-2 bg-muted">
                    <img 
                      src={contract.tenantSignature} 
                      alt="Bérlő aláírása"
                      className="max-w-full h-20 object-contain"
                    />
                  </div>
                )}
                {contract.tenantSignedAt && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Aláírva: {new Date(contract.tenantSignedAt).toLocaleString('hu-HU')}
                  </p>
                )}
              </div>
            </div>

            <Badge className="bg-green-500">
              Szerződés teljesen aláírva
            </Badge>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Szerződés információk</CardTitle>
          <CardDescription>
            Ellenőrizze a szerződés adatait aláírás előtt
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Ingatlan</Label>
              <p className="font-medium">{contract.property?.street}</p>
              <p className="text-sm text-muted-foreground">{contract.property?.city}, {contract.property?.postalCode}</p>
            </div>

            <div>
              <Label>Bérlő</Label>
              <p className="font-medium">{(contract.tenant as any)?.user?.name || 'N/A'}</p>
              <p className="text-sm text-muted-foreground">{(contract.tenant as any)?.user?.email || 'N/A'}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Bérleti díj</Label>
              <p className="font-medium">{Number(contract.rentAmount)?.toLocaleString('hu-HU')} Ft/hó</p>
            </div>

            <div>
              <Label>Kaució</Label>
              <p className="font-medium">{contract.deposit ? Number(contract.deposit).toLocaleString('hu-HU') : '0'} Ft</p>
            </div>

            <div>
              <Label>Időtartam</Label>
              <p className="font-medium">
                {contract.startDate && new Date(contract.startDate).toLocaleDateString('hu-HU')} - 
                {contract.endDate && new Date(contract.endDate).toLocaleDateString('hu-HU')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator className="my-6" />

      <div className="grid grid-cols-2 gap-6">
        {/* Landlord Signature */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PenTool className="w-5 h-5" />
              Bérbeadó aláírása
            </CardTitle>
            <CardDescription>
              Bérbeadó digitális aláírása
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border rounded-lg">
              <SignatureCanvas
                ref={landlordSigRef}
                canvasProps={{
                  width: 300,
                  height: 150,
                  className: 'signature-canvas w-full'
                }}
                backgroundColor="rgb(255, 255, 255)"
                onEnd={handleLandlordSign}
              />
            </div>
            
            <div className="flex gap-2">
              <Button onClick={clearLandlordSignature} variant="outline" size="sm">
                <X className="w-4 h-4 mr-2" />
                Törlés
              </Button>
              {landlordSigned && (
                <Badge className="bg-green-500">
                  <Check className="w-4 h-4 mr-1" />
                  Aláírva
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tenant Signature */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PenTool className="w-5 h-5" />
              Bérlő aláírása
            </CardTitle>
            <CardDescription>
              Bérlő digitális aláírása
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border rounded-lg">
              <SignatureCanvas
                ref={tenantSigRef}
                canvasProps={{
                  width: 300,
                  height: 150,
                  className: 'signature-canvas w-full'
                }}
                backgroundColor="rgb(255, 255, 255)"
                onEnd={handleTenantSign}
              />
            </div>
            
            <div className="flex gap-2">
              <Button onClick={clearTenantSignature} variant="outline" size="sm">
                <X className="w-4 h-4 mr-2" />
                Törlés
              </Button>
              {tenantSigned && (
                <Badge className="bg-green-500">
                  <Check className="w-4 h-4 mr-1" />
                  Aláírva
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end gap-2 mt-6">
        <Button onClick={() => router.back()} variant="outline">
          Mégse
        </Button>
        <Button 
          onClick={saveSignatures} 
          disabled={updateContract.isPending || (!landlordSigned && !tenantSigned)}
        >
          {updateContract.isPending ? 'Mentés...' : 'Aláírások mentése'}
        </Button>
      </div>
    </div>
  )
}