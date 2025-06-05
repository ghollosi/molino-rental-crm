'use client'

import { useState } from 'react'
import { api } from '@/lib/trpc/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { CheckCircle, XCircle, Loader2, MessageCircle, Phone, Send, Users, TrendingUp, Bell } from 'lucide-react'

export default function WhatsAppSettingsPage() {
  const [isTestingConnection, setIsTestingConnection] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'success' | 'error'>('unknown')
  const [isSendingMessage, setIsSendingMessage] = useState(false)
  const [isProcessingReminders, setIsProcessingReminders] = useState(false)
  const [messageForm, setMessageForm] = useState({
    type: 'rent_reminder' as 'rent_reminder' | 'maintenance' | 'custom' | 'interactive',
    tenantId: '',
    phoneNumber: '',
    customMessage: '',
    issueId: '',
    providerId: '',
    scheduledDate: '',
  })

  // Get data for dropdowns
  const { data: tenants } = api.tenant.list.useQuery({ page: 1, limit: 100 })
  const { data: issues } = api.issue.list.useQuery({ page: 1, limit: 100, status: 'OPEN' })
  const { data: providers } = api.provider.list.useQuery({ page: 1, limit: 100 })

  // Test WhatsApp connection
  const testConnection = async () => {
    setIsTestingConnection(true)
    try {
      const result = await api.whatsapp.testConnection.query()
      setConnectionStatus('success')
      toast.success('WhatsApp Business API kapcsolat sikeres!', {
        description: `Phone: ${result.phoneNumber} (${result.qualityRating})`,
      })
    } catch (error: any) {
      setConnectionStatus('error')
      toast.error('WhatsApp Business API kapcsolat sikertelen', {
        description: error.message,
      })
    } finally {
      setIsTestingConnection(false)
    }
  }

  // Send message based on type
  const sendMessage = async () => {
    if (messageForm.type === 'custom' && (!messageForm.phoneNumber || !messageForm.customMessage)) {
      toast.error('Kérjük töltse ki a telefonszámot és az üzenetet')
      return
    }

    if (messageForm.type !== 'custom' && !messageForm.tenantId) {
      toast.error('Kérjük válasszon bérlőt')
      return
    }

    setIsSendingMessage(true)
    try {
      let result

      switch (messageForm.type) {
        case 'rent_reminder':
          result = await api.whatsapp.sendRentReminder.mutate({
            tenantId: messageForm.tenantId,
          })
          break

        case 'maintenance':
          if (!messageForm.issueId || !messageForm.providerId || !messageForm.scheduledDate) {
            toast.error('Kérjük töltse ki az összes mezőt a karbantartási értesítéshez')
            return
          }
          result = await api.whatsapp.sendMaintenanceNotification.mutate({
            tenantId: messageForm.tenantId,
            issueId: messageForm.issueId,
            providerId: messageForm.providerId,
            scheduledDate: messageForm.scheduledDate,
          })
          break

        case 'interactive':
          result = await api.whatsapp.sendInteractiveMenu.mutate({
            tenantId: messageForm.tenantId,
          })
          break

        case 'custom':
          result = await api.whatsapp.sendTextMessage.mutate({
            phoneNumber: messageForm.phoneNumber,
            message: messageForm.customMessage,
          })
          break
      }

      toast.success('Üzenet sikeresen elküldve!', {
        description: result?.message,
      })

      // Reset form
      setMessageForm({
        type: 'rent_reminder',
        tenantId: '',
        phoneNumber: '',
        customMessage: '',
        issueId: '',
        providerId: '',
        scheduledDate: '',
      })
    } catch (error: any) {
      toast.error('Üzenet küldése sikertelen', {
        description: error.message,
      })
    } finally {
      setIsSendingMessage(false)
    }
  }

  // Process automated reminders
  const processAutomatedReminders = async () => {
    setIsProcessingReminders(true)
    try {
      const result = await api.whatsapp.processAutomatedRentReminders.mutate()
      
      toast.success('Automatikus emlékeztetők feldolgozva!', {
        description: `${result.remindersSent} üzenet elküldve, ${result.failures} hiba`,
      })
    } catch (error: any) {
      toast.error('Automatikus emlékeztetők feldolgozása sikertelen', {
        description: error.message,
      })
    } finally {
      setIsProcessingReminders(false)
    }
  }

  // Fetch phone insights
  const { data: phoneInsights } = api.whatsapp.getPhoneNumberInsights.useQuery(undefined, {
    enabled: connectionStatus === 'success',
  })

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
        <h1 className="text-2xl font-bold">WhatsApp Business Integráció</h1>
        <p className="text-muted-foreground">
          Automatikus bérlői kommunikáció spanyol ingatlanokhoz
        </p>
      </div>

      {/* Connection Test */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            API Kapcsolat Tesztelése
          </CardTitle>
          <CardDescription>
            Ellenőrizze a WhatsApp Business API kapcsolatot
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
              API Kapcsolat Tesztelése
            </Button>
            
            {connectionStatus !== 'unknown' && (
              <div className="flex items-center gap-2">
                <ConnectionStatusIcon />
                <Badge variant={connectionStatus === 'success' ? 'default' : 'destructive'}>
                  {connectionStatus === 'success' ? 'API Kapcsolódva' : 'API Kapcsolat sikertelen'}
                </Badge>
              </div>
            )}
          </div>
          
          <div className="text-sm text-muted-foreground">
            <p><strong>Platform:</strong> Meta Business API</p>
            <p><strong>Verzió:</strong> v18.0</p>
            <p><strong>Funkciók:</strong> Template üzenetek, interaktív menük, webhook</p>
          </div>
        </CardContent>
      </Card>

      {/* Phone Number Status */}
      {phoneInsights && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Telefonszám Státusz
            </CardTitle>
            <CardDescription>
              WhatsApp Business telefonszám információk
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Telefonszám</Label>
                <div className="font-medium">{phoneInsights.phoneNumber}</div>
              </div>
              <div>
                <Label>Ellenőrzött név</Label>
                <div className="font-medium">{phoneInsights.verifiedName}</div>
              </div>
              <div>
                <Label>Minőségi értékelés</Label>
                <Badge variant={phoneInsights.qualityRating === 'HIGH' ? 'default' : 'secondary'}>
                  {phoneInsights.qualityRating}
                </Badge>
              </div>
              <div>
                <Label>Átviteli sebesség</Label>
                <div className="font-medium">{phoneInsights.throughputLevel}</div>
              </div>
              <div>
                <Label>Ellenőrzési státusz</Label>
                <div className="font-medium">{phoneInsights.verificationStatus}</div>
              </div>
              <div>
                <Label>Platform típus</Label>
                <div className="font-medium">{phoneInsights.platformType}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Send Messages */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Üzenet Küldése
          </CardTitle>
          <CardDescription>
            Különböző típusú üzenetek küldése bérlőknek
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Message Type Selection */}
          <div className="space-y-2">
            <Label htmlFor="messageType">Üzenet típusa</Label>
            <Select 
              value={messageForm.type} 
              onValueChange={(value: any) => setMessageForm(prev => ({ ...prev, type: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rent_reminder">💰 Bérleti díj emlékeztető</SelectItem>
                <SelectItem value="maintenance">🔧 Karbantartási értesítés</SelectItem>
                <SelectItem value="interactive">📋 Interaktív menü</SelectItem>
                <SelectItem value="custom">✏️ Egyéni üzenet</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tenant Selection (for all except custom) */}
          {messageForm.type !== 'custom' && (
            <div className="space-y-2">
              <Label htmlFor="tenant">Bérlő</Label>
              <Select 
                value={messageForm.tenantId} 
                onValueChange={(value) => setMessageForm(prev => ({ ...prev, tenantId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Válasszon bérlőt" />
                </SelectTrigger>
                <SelectContent>
                  {tenants?.tenants?.map((tenant) => (
                    <SelectItem key={tenant.id} value={tenant.id}>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        {tenant.user.firstName} {tenant.user.lastName} 
                        <span className="text-muted-foreground">({tenant.user.phone})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Custom message fields */}
          {messageForm.type === 'custom' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Telefonszám</Label>
                <Input
                  id="phoneNumber"
                  placeholder="+34123456789"
                  value={messageForm.phoneNumber}
                  onChange={(e) => setMessageForm(prev => ({ ...prev, phoneNumber: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customMessage">Üzenet</Label>
                <Textarea
                  id="customMessage"
                  placeholder="Írja be az üzenetet..."
                  value={messageForm.customMessage}
                  onChange={(e) => setMessageForm(prev => ({ ...prev, customMessage: e.target.value }))}
                  rows={4}
                />
              </div>
            </>
          )}

          {/* Maintenance specific fields */}
          {messageForm.type === 'maintenance' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="issue">Hibabejelentés</Label>
                <Select 
                  value={messageForm.issueId} 
                  onValueChange={(value) => setMessageForm(prev => ({ ...prev, issueId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Válasszon hibabejelentést" />
                  </SelectTrigger>
                  <SelectContent>
                    {issues?.issues?.map((issue) => (
                      <SelectItem key={issue.id} value={issue.id}>
                        {issue.title} ({issue.ticketNumber})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="provider">Szolgáltató</Label>
                <Select 
                  value={messageForm.providerId} 
                  onValueChange={(value) => setMessageForm(prev => ({ ...prev, providerId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Válasszon szolgáltatót" />
                  </SelectTrigger>
                  <SelectContent>
                    {providers?.providers?.map((provider) => (
                      <SelectItem key={provider.id} value={provider.id}>
                        {provider.businessName} ({provider.user.firstName})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="scheduledDate">Ütemezett dátum</Label>
                <Input
                  id="scheduledDate"
                  type="datetime-local"
                  value={messageForm.scheduledDate}
                  onChange={(e) => setMessageForm(prev => ({ ...prev, scheduledDate: e.target.value }))}
                />
              </div>
            </>
          )}

          <Button 
            onClick={sendMessage} 
            disabled={isSendingMessage}
            className="w-full"
          >
            {isSendingMessage ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Üzenet Küldése
          </Button>
        </CardContent>
      </Card>

      {/* Automated Reminders */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Automatikus Emlékeztetők
          </CardTitle>
          <CardDescription>
            Bérleti díj emlékeztetők automatikus feldolgozása
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={processAutomatedReminders} 
            disabled={isProcessingReminders}
            variant="outline"
          >
            {isProcessingReminders ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <TrendingUp className="h-4 w-4 mr-2" />
            )}
            Automatikus Emlékeztetők Feldolgozása
          </Button>

          <div className="text-sm text-muted-foreground space-y-1">
            <p>📅 <strong>Ütemezés:</strong> 5 nappal esedékesség előtt, 1 nappal előtte, lejárat napján, 1, 3, 7 nappal késés után</p>
            <p>🇪🇸 <strong>Nyelv:</strong> Spanyol</p>
            <p>💱 <strong>Valuta:</strong> EUR</p>
            <p>📱 <strong>Template üzenetek:</strong> Előre jóváhagyott WhatsApp Business sablonok</p>
          </div>
        </CardContent>
      </Card>

      {/* Message Templates */}
      <Card>
        <CardHeader>
          <CardTitle>Üzenet Sablonok</CardTitle>
          <CardDescription>
            Előre konfigurált spanyol üzenet sablonok
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <Badge>rent_reminder_es</Badge>
              <p className="text-muted-foreground">
                Bérleti díj emlékeztető sablon spanyol nyelvű bérlőknek
              </p>
            </div>
            <div className="space-y-2">
              <Badge>maintenance_scheduled_es</Badge>
              <p className="text-muted-foreground">
                Karbantartási munkálatok ütemezési értesítés
              </p>
            </div>
            <div className="space-y-2">
              <Badge>issue_received_es</Badge>
              <p className="text-muted-foreground">
                Hibabejelentés fogadásának visszaigazolása
              </p>
            </div>
            <div className="space-y-2">
              <Badge>payment_confirmed_es</Badge>
              <p className="text-muted-foreground">
                Fizetés visszaigazolás automatikus üzenet
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>API Konfiguráció</CardTitle>
          <CardDescription>
            WhatsApp Business API beállítások
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <strong>API Endpoint:</strong><br />
              <code className="text-xs bg-muted px-2 py-1 rounded">
                https://graph.facebook.com/v18.0
              </code>
            </div>
            <div>
              <strong>Business Account ID:</strong><br />
              <code className="text-xs bg-muted px-2 py-1 rounded">
                {process.env.NEXT_PUBLIC_WHATSAPP_BUSINESS_ID ? '***' : 'Nincs beállítva'}
              </code>
            </div>
            <div>
              <strong>Phone Number ID:</strong><br />
              <code className="text-xs bg-muted px-2 py-1 rounded">
                {process.env.NEXT_PUBLIC_WHATSAPP_PHONE_ID ? '***' : 'Nincs beállítva'}
              </code>
            </div>
            <div>
              <strong>Webhook URL:</strong><br />
              <code className="text-xs bg-muted px-2 py-1 rounded">
                {process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/whatsapp
              </code>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}