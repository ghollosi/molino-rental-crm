'use client'

import { useState } from 'react'
import { api } from '@/lib/trpc/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { CheckCircle, XCircle, Loader2, FileText, Euro, Calendar, User } from 'lucide-react'

export default function ZohoSettingsPage() {
  const [isTestingConnection, setIsTestingConnection] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'success' | 'error'>('unknown')
  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false)
  const [invoiceForm, setInvoiceForm] = useState({
    tenantId: '',
    propertyId: '',
    amount: '',
    dueDate: '',
    description: '',
    invoiceType: 'rental' as const,
  })

  // Get data for dropdowns
  const { data: tenants } = api.tenant.list.useQuery({ page: 1, limit: 100 })
  const { data: properties } = api.property.list.useQuery({ page: 1, limit: 100 })
  
  // Test Zoho connection
  const testConnection = async () => {
    setIsTestingConnection(true)
    try {
      const result = await api.zoho.testConnection.query()
      setConnectionStatus('success')
      toast.success('Zoho Books kapcsolat sikeres!', {
        description: result.message,
      })
    } catch (error: any) {
      setConnectionStatus('error')
      toast.error('Zoho Books kapcsolat sikertelen', {
        description: error.message,
      })
    } finally {
      setIsTestingConnection(false)
    }
  }

  // Create test invoice
  const createTestInvoice = async () => {
    if (!invoiceForm.tenantId || !invoiceForm.propertyId || !invoiceForm.amount || !invoiceForm.dueDate) {
      toast.error('Kérjük töltse ki az összes kötelező mezőt')
      return
    }

    setIsCreatingInvoice(true)
    try {
      const result = await api.zoho.createInvoice.mutate({
        tenantId: invoiceForm.tenantId,
        propertyId: invoiceForm.propertyId,
        amount: parseFloat(invoiceForm.amount),
        dueDate: invoiceForm.dueDate,
        description: invoiceForm.description,
        invoiceType: invoiceForm.invoiceType,
      })

      toast.success('Számla sikeresen létrehozva!', {
        description: `Számla szám: ${result.invoiceNumber}`,
        action: result.pdfUrl ? {
          label: 'PDF megtekintése',
          onClick: () => window.open(result.pdfUrl, '_blank'),
        } : undefined,
      })

      // Reset form
      setInvoiceForm({
        tenantId: '',
        propertyId: '',
        amount: '',
        dueDate: '',
        description: '',
        invoiceType: 'rental',
      })
    } catch (error: any) {
      toast.error('Számla létrehozása sikertelen', {
        description: error.message,
      })
    } finally {
      setIsCreatingInvoice(false)
    }
  }

  const ConnectionStatusIcon = () => {
    switch (connectionStatus) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return null
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Zoho Books Integráció</h1>
        <p className="text-muted-foreground">
          Spanyol számlázási rendszer beállítása és tesztelése
        </p>
      </div>

      {/* Connection Test */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Kapcsolat Tesztelése
          </CardTitle>
          <CardDescription>
            Ellenőrizze a Zoho Books API kapcsolatot
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Button 
              onClick={testConnection} 
              disabled={isTestingConnection}
              variant="outline"
            >
              {isTestingConnection ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Kapcsolat Tesztelése
            </Button>
            
            {connectionStatus !== 'unknown' && (
              <div className="flex items-center gap-2">
                <ConnectionStatusIcon />
                <Badge variant={connectionStatus === 'success' ? 'default' : 'destructive'}>
                  {connectionStatus === 'success' ? 'Kapcsolódva' : 'Kapcsolat sikertelen'}
                </Badge>
              </div>
            )}
          </div>
          
          <div className="text-sm text-muted-foreground">
            <p><strong>Régiót:</strong> EU (Spanyolország)</p>
            <p><strong>API verzió:</strong> v3</p>
            <p><strong>Funkcionalitás:</strong> Automatikus számlázás, spanyol IVA kezelés, AEAT export</p>
          </div>
        </CardContent>
      </Card>

      {/* Test Invoice Creation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Teszt Számla Létrehozása
          </CardTitle>
          <CardDescription>
            Hozzon létre egy teszt számlát a Zoho Books-ban
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Tenant Selection */}
            <div className="space-y-2">
              <Label htmlFor="tenant">Bérlő *</Label>
              <Select 
                value={invoiceForm.tenantId} 
                onValueChange={(value) => setInvoiceForm(prev => ({ ...prev, tenantId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Válasszon bérlőt" />
                </SelectTrigger>
                <SelectContent>
                  {tenants?.tenants?.map((tenant) => (
                    <SelectItem key={tenant.id} value={tenant.id}>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {tenant.user.firstName} {tenant.user.lastName} ({tenant.user.email})
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Property Selection */}
            <div className="space-y-2">
              <Label htmlFor="property">Ingatlan *</Label>
              <Select 
                value={invoiceForm.propertyId} 
                onValueChange={(value) => setInvoiceForm(prev => ({ ...prev, propertyId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Válasszon ingatlant" />
                </SelectTrigger>
                <SelectContent>
                  {properties?.properties?.map((property) => (
                    <SelectItem key={property.id} value={property.id}>
                      {property.address} ({property.reference || property.id.slice(0, 8)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount">Összeg (EUR) *</Label>
              <div className="relative">
                <Euro className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  className="pl-10"
                  value={invoiceForm.amount}
                  onChange={(e) => setInvoiceForm(prev => ({ ...prev, amount: e.target.value }))}
                />
              </div>
            </div>

            {/* Due Date */}
            <div className="space-y-2">
              <Label htmlFor="dueDate">Esedékesség *</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="dueDate"
                  type="date"
                  className="pl-10"
                  value={invoiceForm.dueDate}
                  onChange={(e) => setInvoiceForm(prev => ({ ...prev, dueDate: e.target.value }))}
                />
              </div>
            </div>

            {/* Invoice Type */}
            <div className="space-y-2">
              <Label htmlFor="invoiceType">Számla típusa</Label>
              <Select 
                value={invoiceForm.invoiceType} 
                onValueChange={(value: any) => setInvoiceForm(prev => ({ ...prev, invoiceType: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rental">Bérleti díj</SelectItem>
                  <SelectItem value="maintenance">Karbantartás</SelectItem>
                  <SelectItem value="deposit">Óvadék</SelectItem>
                  <SelectItem value="other">Egyéb</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Leírás</Label>
              <Input
                id="description"
                placeholder="Számla leírása (opcionális)"
                value={invoiceForm.description}
                onChange={(e) => setInvoiceForm(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
          </div>

          <Button 
            onClick={createTestInvoice} 
            disabled={isCreatingInvoice}
            className="w-full"
          >
            {isCreatingInvoice ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <FileText className="h-4 w-4 mr-2" />
            )}
            Teszt Számla Létrehozása
          </Button>

          <div className="text-sm text-muted-foreground space-y-1">
            <p>🇪🇸 <strong>Spanyol IVA:</strong> Automatikusan 21% (IVA General)</p>
            <p>📄 <strong>Nyelv:</strong> Spanyol</p>
            <p>💱 <strong>Valuta:</strong> EUR</p>
            <p>📊 <strong>AEAT:</strong> SII kompatibilis formátum</p>
          </div>
        </CardContent>
      </Card>

      {/* Configuration Info */}
      <Card>
        <CardHeader>
          <CardTitle>Konfiguráció</CardTitle>
          <CardDescription>
            Zoho Books API beállítások
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <strong>API Endpoint:</strong><br />
              <code className="text-xs bg-muted px-2 py-1 rounded">
                https://books.zoho.eu/api/v3
              </code>
            </div>
            <div>
              <strong>Auth Endpoint:</strong><br />
              <code className="text-xs bg-muted px-2 py-1 rounded">
                https://accounts.zoho.eu/oauth/v2/token
              </code>
            </div>
            <div>
              <strong>Organization ID:</strong><br />
              <code className="text-xs bg-muted px-2 py-1 rounded">
                {process.env.NEXT_PUBLIC_ZOHO_ORG_ID || 'Nincs beállítva'}
              </code>
            </div>
            <div>
              <strong>Client ID:</strong><br />
              <code className="text-xs bg-muted px-2 py-1 rounded">
                {process.env.NEXT_PUBLIC_ZOHO_CLIENT_ID ? '***' : 'Nincs beállítva'}
              </code>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}