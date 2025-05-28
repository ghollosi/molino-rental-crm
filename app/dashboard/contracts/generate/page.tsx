'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/src/components/ui/separator'
import { trpc } from '@/src/lib/trpc'
import { ArrowLeft, FileText, Eye, Download } from 'lucide-react'
import { useToast } from '@/src/hooks/use-toast'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'

export default function GenerateContractPage() {
  const { toast } = useToast()
  const router = useRouter()
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [selectedProperty, setSelectedProperty] = useState('')
  const [selectedTenant, setSelectedTenant] = useState('')
  const [previewContent, setPreviewContent] = useState('')
  const [showPreview, setShowPreview] = useState(false)

  const [contractData, setContractData] = useState({
    rentAmount: '',
    deposit: '',
    startDate: '',
    endDate: '',
    customTerms: '',
  })

  const { data: templates } = trpc.contracts.getTemplates.useQuery()
  const { data: properties } = trpc.property.list.useQuery({ page: 1, limit: 100 })
  const { data: tenants } = trpc.tenant.list.useQuery({ page: 1, limit: 100 })
  
  const generatePreview = trpc.contracts.generateFromTemplate.useMutation({
    onSuccess: (data) => {
      setPreviewContent(data.renderedContent)
      setShowPreview(true)
    },
    onError: (error) => {
      toast({ title: 'Hiba', description: error.message, variant: 'destructive' })
    }
  })

  const createContract = trpc.contracts.create.useMutation({
    onSuccess: (contract) => {
      toast({ title: 'Siker', description: 'Szerződés sikeresen létrehozva!' })
      router.push(`/dashboard/contracts/${contract.id}`)
    },
    onError: (error) => {
      toast({ title: 'Hiba', description: error.message, variant: 'destructive' })
    }
  })

  const handlePreview = () => {
    if (!selectedTemplate || !selectedProperty || !selectedTenant) {
      toast({ 
        title: 'Hiányzó adatok', 
        description: 'Kérjük válassza ki a sablont, ingatlant és bérlőt!',
        variant: 'destructive' 
      })
      return
    }

    generatePreview.mutate({
      templateId: selectedTemplate,
      propertyId: selectedProperty,
      tenantId: selectedTenant,
      contractTerms: {
        rentAmount: parseFloat(contractData.rentAmount) || 0,
        deposit: parseFloat(contractData.deposit) || 0,
        startDate: new Date(contractData.startDate),
        endDate: new Date(contractData.endDate),
        customTerms: contractData.customTerms,
      }
    })
  }

  const handleCreateContract = () => {
    if (!selectedProperty || !selectedTenant || !contractData.rentAmount || !contractData.deposit || !contractData.startDate || !contractData.endDate) {
      toast({ 
        title: 'Hiányzó adatok', 
        description: 'Kérjük töltse ki az összes kötelező mezőt!',
        variant: 'destructive' 
      })
      return
    }

    createContract.mutate({
      propertyId: selectedProperty,
      tenantId: selectedTenant,
      templateId: selectedTemplate || undefined,
      rentAmount: parseFloat(contractData.rentAmount),
      deposit: parseFloat(contractData.deposit),
      startDate: new Date(contractData.startDate),
      endDate: new Date(contractData.endDate),
      customTerms: contractData.customTerms || undefined,
    })
  }

  const downloadPDF = () => {
    if (!previewContent) return
    
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Szerződés</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 40px; }
              @media print { body { margin: 20px; } }
            </style>
          </head>
          <body>
            ${previewContent}
            <script>
              window.onload = () => {
                window.print();
                window.close();
              }
            </script>
          </body>
        </html>
      `)
      printWindow.document.close()
    }
  }

  const selectedPropertyData = properties?.properties.find((p: any) => p.id === selectedProperty)
  const selectedTenantData = tenants?.tenants.find((t: any) => t.id === selectedTenant)
  const selectedTemplateData = templates?.find((t: any) => t.id === selectedTemplate)

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Vissza
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Szerződés generálása sablonból</h1>
          <p className="text-muted-foreground">Készítsen szerződést előre elkészített sablon alapján</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Template Selection */}
        <Card>
          <CardHeader>
            <CardTitle>1. Sablon kiválasztása</CardTitle>
            <CardDescription>
              Válasszon egy előre elkészített sablont a szerződés generálásához
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
              <SelectTrigger>
                <SelectValue placeholder="Válasszon sablont" />
              </SelectTrigger>
              <SelectContent>
                {templates?.filter(t => t.isActive).map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      {template.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedTemplateData && (
              <div className="mt-2 p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">{selectedTemplateData.name}</p>
                {selectedTemplateData.description && (
                  <p className="text-sm text-muted-foreground">{selectedTemplateData.description}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Property and Tenant Selection */}
        <Card>
          <CardHeader>
            <CardTitle>2. Ingatlan és bérlő kiválasztása</CardTitle>
            <CardDescription>
              Válassza ki a bérbe adandó ingatlant és a bérlőt
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="property">Ingatlan</Label>
                <Select value={selectedProperty} onValueChange={setSelectedProperty}>
                  <SelectTrigger>
                    <SelectValue placeholder="Válasszon ingatlant" />
                  </SelectTrigger>
                  <SelectContent>
                    {properties?.properties.map((property) => (
                      <SelectItem key={property.id} value={property.id}>
                        {property.street}, {property.city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="tenant">Bérlő</Label>
                <Select value={selectedTenant} onValueChange={setSelectedTenant}>
                  <SelectTrigger>
                    <SelectValue placeholder="Válasszon bérlőt" />
                  </SelectTrigger>
                  <SelectContent>
                    {tenants?.tenants.map((tenant) => (
                      <SelectItem key={tenant.id} value={tenant.id}>
                        {tenant.user.name} - {tenant.user.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {(selectedPropertyData || selectedTenantData) && (
              <div className="grid grid-cols-2 gap-4 mt-4">
                {selectedPropertyData && (
                  <div className="p-3 bg-muted rounded-lg">
                    <h4 className="font-medium">Kiválasztott ingatlan:</h4>
                    <p className="text-sm">{selectedPropertyData.street}</p>
                    <p className="text-sm text-muted-foreground">{selectedPropertyData.city}, {selectedPropertyData.postalCode}</p>
                    <p className="text-sm text-muted-foreground">Típus: {selectedPropertyData.type}</p>
                  </div>
                )}

                {selectedTenantData && (
                  <div className="p-3 bg-muted rounded-lg">
                    <h4 className="font-medium">Kiválasztott bérlő:</h4>
                    <p className="text-sm">{selectedTenantData.user.name}</p>
                    <p className="text-sm text-muted-foreground">{selectedTenantData.user.email}</p>
                    {selectedTenantData.user.phone && (
                      <p className="text-sm text-muted-foreground">{selectedTenantData.user.phone}</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contract Terms */}
        <Card>
          <CardHeader>
            <CardTitle>3. Szerződés feltételei</CardTitle>
            <CardDescription>
              Adja meg a szerződés pénzügyi és időbeli feltételeit
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="rentAmount">Bérleti díj (Ft/hó)</Label>
                <Input
                  id="rentAmount"
                  type="number"
                  value={contractData.rentAmount}
                  onChange={(e) => setContractData({ ...contractData, rentAmount: e.target.value })}
                  placeholder="150000"
                />
              </div>

              <div>
                <Label htmlFor="deposit">Kaució (Ft)</Label>
                <Input
                  id="deposit"
                  type="number"
                  value={contractData.deposit}
                  onChange={(e) => setContractData({ ...contractData, deposit: e.target.value })}
                  placeholder="300000"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Szerződés kezdete</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={contractData.startDate}
                  onChange={(e) => setContractData({ ...contractData, startDate: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="endDate">Szerződés vége</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={contractData.endDate}
                  onChange={(e) => setContractData({ ...contractData, endDate: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="customTerms">Egyedi feltételek</Label>
              <Textarea
                id="customTerms"
                value={contractData.customTerms}
                onChange={(e) => setContractData({ ...contractData, customTerms: e.target.value })}
                rows={4}
                placeholder="Adjon meg bármilyen egyedi feltételt vagy megjegyzést..."
              />
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* Actions */}
        <div className="flex justify-between">
          <Button
            onClick={handlePreview}
            disabled={generatePreview.isPending || !selectedTemplate}
            variant="outline"
          >
            <Eye className="w-4 h-4 mr-2" />
            {generatePreview.isPending ? 'Generálás...' : 'Előnézet'}
          </Button>

          <div className="flex gap-2">
            <Button onClick={() => router.back()} variant="outline">
              Vissza
            </Button>
          </div>
        </div>
      </div>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Szerződés előnézet</DialogTitle>
            <DialogDescription>
              A generált szerződés megjelenítése
            </DialogDescription>
          </DialogHeader>
          
          <div 
            className="border rounded p-4 bg-white"
            dangerouslySetInnerHTML={{ __html: previewContent }}
          />
          
          <div className="flex justify-between gap-2">
            <Button onClick={() => setShowPreview(false)} variant="outline">
              Bezárás
            </Button>
            
            <div className="flex gap-2">
              <Button onClick={downloadPDF} variant="outline">
                <Download className="w-4 h-4 mr-2" />
                PDF letöltés
              </Button>
              <Button onClick={handleCreateContract} disabled={createContract.isPending}>
                {createContract.isPending ? 'Létrehozás...' : 'Szerződés mentése'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}