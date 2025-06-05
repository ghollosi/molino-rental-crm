'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Settings, 
  CreditCard, 
  DollarSign, 
  MessageCircle, 
  Calendar,
  Shield,
  AlertCircle,
  CheckCircle,
  Play,
  Pause,
  TestTube,
  Save,
  RefreshCw
} from 'lucide-react'
import { api } from '@/lib/trpc'
import { useToast } from '@/hooks/use-toast'

type IntegrationType = 'ZOHO_BOOKS' | 'CAIXABANK_PSD2' | 'WHATSAPP_BUSINESS' | 'BOOKING_COM' | 'UPLISTING_IO'

interface ZohoConfig {
  clientId: string
  clientSecret: string
  refreshToken?: string
  organizationId?: string
  region: 'eu' | 'us' | 'au' | 'in'
  environment: 'production' | 'sandbox'
  defaultVatRate: number
  aeatEnabled: boolean
  aeatNif?: string
  aeatCompanyName?: string
}

interface CaixaBankConfig {
  clientId: string
  clientSecret: string
  iban: string
  accountName?: string
  environment: 'sandbox' | 'production'
  autoReconcile: boolean
  amountTolerance: number
  daysTolerance: number
  confidenceThreshold: number
  webhookUrl?: string
  webhookSecret?: string
}

interface WhatsAppConfig {
  businessAccountId: string
  phoneNumberId: string
  accessToken: string
  webhookSecret?: string
  defaultLanguage: 'es' | 'en' | 'hu'
  rentReminderTemplate: string
  paymentConfirmTemplate: string
  maintenanceTemplate: string
  autoReminders: boolean
  reminderDays: number[]
  overdueReminders: boolean
  overdueFrequency: number
  enableBusinessHours: boolean
  businessHoursStart: string
  businessHoursEnd: string
  businessDays: number[]
}

interface BookingConfig {
  username: string
  password: string
  hotelId: string
  environment: 'test' | 'live'
  autoSync: boolean
  syncFrequency: number
  enableDynamicPricing: boolean
  basePrice?: number
  weekendMarkup: number
  highSeasonMarkup: number
  highSeasonDates?: Array<{ start: string; end: string }>
  defaultCommission: number
  checkInTime: string
  checkOutTime: string
}

interface UplistingConfig {
  apiKey: string
  apiSecret: string
  accountId: string
  environment: 'sandbox' | 'production'
  enableAirbnb: boolean
  enableBookingCom: boolean
  enableVrbo: boolean
  enableDirectBooking: boolean
  autoSync: boolean
  syncFrequency: number
  blockOffDays: number
  autoCalendarSync: boolean
  defaultMinStay: number
  defaultMaxStay: number
  enableDynamicPricing: boolean
  basePrice?: number
  weekendMarkup: number
  highSeasonMarkup: number
  lastMinuteDiscount: number
  highSeasonDates?: Array<{ start: string; end: string }>
  autoGuestMessaging: boolean
  checkInInstructions?: string
  checkOutInstructions?: string
  houseRules?: string
  autoCleaningSchedule: boolean
  cleaningDuration: number
  cleaningFee?: number
  requireIdVerification: boolean
  securityDeposit?: number
  damageProtection: boolean
  channelCommissions?: {
    airbnb: number
    booking: number
    vrbo: number
  }
  revenueOptimization: boolean
  webhookUrl?: string
  webhookSecret?: string
}

const INTEGRATION_CONFIG = {
  ZOHO_BOOKS: {
    title: 'Zoho Books',
    icon: CreditCard,
    description: 'Spanish VAT invoicing and accounting integration',
    defaultConfig: {
      clientId: '',
      clientSecret: '',
      refreshToken: '',
      organizationId: '',
      region: 'eu' as const,
      environment: 'production' as const,
      defaultVatRate: 21,
      aeatEnabled: true,
      aeatNif: '',
      aeatCompanyName: ''
    }
  },
  CAIXABANK_PSD2: {
    title: 'CaixaBank PSD2',
    icon: DollarSign,
    description: 'Banking API for automated payment reconciliation',
    defaultConfig: {
      clientId: '',
      clientSecret: '',
      iban: '',
      accountName: '',
      environment: 'sandbox' as const,
      autoReconcile: true,
      amountTolerance: 1.00,
      daysTolerance: 7,
      confidenceThreshold: 0.90,
      webhookUrl: '',
      webhookSecret: ''
    }
  },
  WHATSAPP_BUSINESS: {
    title: 'WhatsApp Business',
    icon: MessageCircle,
    description: 'Automated tenant communication with Spanish templates',
    defaultConfig: {
      businessAccountId: '',
      phoneNumberId: '',
      accessToken: '',
      webhookSecret: '',
      defaultLanguage: 'es' as const,
      rentReminderTemplate: 'rent_reminder_spanish_v2',
      paymentConfirmTemplate: 'payment_confirmed_spanish',
      maintenanceTemplate: 'maintenance_notice_spanish',
      autoReminders: true,
      reminderDays: [5, 1, 0],
      overdueReminders: true,
      overdueFrequency: 3,
      enableBusinessHours: true,
      businessHoursStart: '09:00',
      businessHoursEnd: '18:00',
      businessDays: [1, 2, 3, 4, 5]
    }
  },
  BOOKING_COM: {
    title: 'Booking.com Partner',
    icon: Calendar,
    description: 'Room availability and dynamic pricing integration',
    defaultConfig: {
      username: '',
      password: '',
      hotelId: '',
      environment: 'test' as const,
      autoSync: true,
      syncFrequency: 60,
      enableDynamicPricing: true,
      basePrice: undefined,
      weekendMarkup: 1.30,
      highSeasonMarkup: 1.50,
      highSeasonDates: [],
      defaultCommission: 0.15,
      checkInTime: '15:00',
      checkOutTime: '11:00'
    }
  },
  UPLISTING_IO: {
    title: 'Uplisting.io',
    icon: Settings,
    description: 'Multi-channel vacation rental management platform',
    defaultConfig: {
      apiKey: '',
      apiSecret: '',
      accountId: '',
      environment: 'sandbox' as const,
      enableAirbnb: true,
      enableBookingCom: true,
      enableVrbo: true,
      enableDirectBooking: true,
      autoSync: true,
      syncFrequency: 30,
      blockOffDays: 1,
      autoCalendarSync: true,
      defaultMinStay: 2,
      defaultMaxStay: 30,
      enableDynamicPricing: true,
      basePrice: undefined,
      weekendMarkup: 1.25,
      highSeasonMarkup: 1.40,
      lastMinuteDiscount: 0.90,
      highSeasonDates: [],
      autoGuestMessaging: true,
      checkInInstructions: '',
      checkOutInstructions: '',
      houseRules: '',
      autoCleaningSchedule: true,
      cleaningDuration: 120,
      cleaningFee: undefined,
      requireIdVerification: true,
      securityDeposit: undefined,
      damageProtection: true,
      channelCommissions: {
        airbnb: 0.03,
        booking: 0.15,
        vrbo: 0.05
      },
      revenueOptimization: true,
      webhookUrl: '',
      webhookSecret: ''
    }
  }
}

export default function AdminIntegrationsPage() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<IntegrationType>('ZOHO_BOOKS')
  const [formData, setFormData] = useState<Record<IntegrationType, any>>({
    ZOHO_BOOKS: { ...INTEGRATION_CONFIG.ZOHO_BOOKS.defaultConfig, isEnabled: false },
    CAIXABANK_PSD2: { ...INTEGRATION_CONFIG.CAIXABANK_PSD2.defaultConfig, isEnabled: false },
    WHATSAPP_BUSINESS: { ...INTEGRATION_CONFIG.WHATSAPP_BUSINESS.defaultConfig, isEnabled: false },
    BOOKING_COM: { ...INTEGRATION_CONFIG.BOOKING_COM.defaultConfig, isEnabled: false },
    UPLISTING_IO: { ...INTEGRATION_CONFIG.UPLISTING_IO.defaultConfig, isEnabled: false }
  })

  // Queries
  const { data: configs, refetch: refetchConfigs } = api.integrationConfig.getAll.useQuery()
  const { data: activeConfig, refetch: refetchActiveConfig } = api.integrationConfig.get.useQuery(
    { type: activeTab },
    { enabled: !!activeTab }
  )

  // Mutations
  const updateZoho = api.integrationConfig.updateZoho.useMutation()
  const updateCaixaBank = api.integrationConfig.updateCaixaBank.useMutation()
  const updateWhatsApp = api.integrationConfig.updateWhatsApp.useMutation()
  const updateBooking = api.integrationConfig.updateBooking.useMutation()
  const updateUplisting = api.integrationConfig.updateUplisting.useMutation()
  const testConnection = api.integrationConfig.testConnection.useMutation()
  const toggleStatus = api.integrationConfig.toggleStatus.useMutation()

  // Load active config data when it changes
  React.useEffect(() => {
    if (activeConfig) {
      setFormData(prev => ({
        ...prev,
        [activeTab]: {
          ...activeConfig.config,
          isEnabled: activeConfig.isEnabled
        }
      }))
    }
  }, [activeConfig, activeTab])

  const handleSave = async () => {
    try {
      const config = formData[activeTab]
      
      switch (activeTab) {
        case 'ZOHO_BOOKS':
          await updateZoho.mutateAsync(config)
          break
        case 'CAIXABANK_PSD2':
          await updateCaixaBank.mutateAsync(config)
          break
        case 'WHATSAPP_BUSINESS':
          await updateWhatsApp.mutateAsync(config)
          break
        case 'BOOKING_COM':
          await updateBooking.mutateAsync(config)
          break
        case 'UPLISTING_IO':
          await updateUplisting.mutateAsync(config)
          break
      }

      await refetchConfigs()
      await refetchActiveConfig()
      
      toast({
        title: "Configuration Saved",
        description: `${INTEGRATION_CONFIG[activeTab].title} configuration has been updated successfully.`
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Save Failed",
        description: error instanceof Error ? error.message : "Failed to save configuration"
      })
    }
  }

  const handleTest = async () => {
    try {
      const result = await testConnection.mutateAsync({ type: activeTab })
      
      toast({
        title: "Connection Test",
        description: result.message
      })
      
      await refetchConfigs()
      await refetchActiveConfig()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Test Failed",
        description: error instanceof Error ? error.message : "Connection test failed"
      })
    }
  }

  const handleToggle = async (enabled: boolean) => {
    try {
      await toggleStatus.mutateAsync({ 
        type: activeTab, 
        enabled 
      })
      
      setFormData(prev => ({
        ...prev,
        [activeTab]: {
          ...prev[activeTab],
          isEnabled: enabled
        }
      }))
      
      await refetchConfigs()
      await refetchActiveConfig()
      
      toast({
        title: enabled ? "Integration Enabled" : "Integration Disabled",
        description: `${INTEGRATION_CONFIG[activeTab].title} has been ${enabled ? 'enabled' : 'disabled'}.`
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Toggle Failed",
        description: error instanceof Error ? error.message : "Failed to toggle integration status"
      })
    }
  }

  const updateFormField = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab],
        [field]: value
      }
    }))
  }

  const getStatusBadge = (config: any) => {
    if (!config) return <Badge variant="secondary">Not Configured</Badge>
    
    switch (config.status) {
      case 'ACTIVE':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Active</Badge>
      case 'ERROR':
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Error</Badge>
      case 'TESTING':
        return <Badge variant="secondary"><RefreshCw className="w-3 h-3 mr-1" />Testing</Badge>
      default:
        return <Badge variant="secondary">Inactive</Badge>
    }
  }

  const renderConfigForm = () => {
    const config = formData[activeTab]
    const integrationInfo = INTEGRATION_CONFIG[activeTab]

    switch (activeTab) {
      case 'ZOHO_BOOKS':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="clientId">Client ID</Label>
                <Input
                  id="clientId"
                  type="password"
                  value={config.clientId}
                  onChange={(e) => updateFormField('clientId', e.target.value)}
                  placeholder="Enter Zoho Client ID"
                />
              </div>
              <div>
                <Label htmlFor="clientSecret">Client Secret</Label>
                <Input
                  id="clientSecret"
                  type="password"
                  value={config.clientSecret}
                  onChange={(e) => updateFormField('clientSecret', e.target.value)}
                  placeholder="Enter Zoho Client Secret"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="organizationId">Organization ID</Label>
                <Input
                  id="organizationId"
                  value={config.organizationId || ''}
                  onChange={(e) => updateFormField('organizationId', e.target.value)}
                  placeholder="Zoho Organization ID"
                />
              </div>
              <div>
                <Label htmlFor="region">Region</Label>
                <Select value={config.region} onValueChange={(value) => updateFormField('region', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="eu">Europe</SelectItem>
                    <SelectItem value="us">United States</SelectItem>
                    <SelectItem value="au">Australia</SelectItem>
                    <SelectItem value="in">India</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="environment">Environment</Label>
                <Select value={config.environment} onValueChange={(value) => updateFormField('environment', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="production">Production</SelectItem>
                    <SelectItem value="sandbox">Sandbox</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="defaultVatRate">Default VAT Rate (%)</Label>
                <Input
                  id="defaultVatRate"
                  type="number"
                  value={config.defaultVatRate}
                  onChange={(e) => updateFormField('defaultVatRate', parseFloat(e.target.value))}
                  min="0"
                  max="100"
                />
              </div>
              <div className="flex items-center space-x-2 pt-6">
                <Switch
                  id="aeatEnabled"
                  checked={config.aeatEnabled}
                  onCheckedChange={(checked) => updateFormField('aeatEnabled', checked)}
                />
                <Label htmlFor="aeatEnabled">AEAT SII Enabled</Label>
              </div>
            </div>

            {config.aeatEnabled && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="aeatNif">AEAT NIF</Label>
                  <Input
                    id="aeatNif"
                    value={config.aeatNif || ''}
                    onChange={(e) => updateFormField('aeatNif', e.target.value)}
                    placeholder="Spanish Tax ID"
                  />
                </div>
                <div>
                  <Label htmlFor="aeatCompanyName">AEAT Company Name</Label>
                  <Input
                    id="aeatCompanyName"
                    value={config.aeatCompanyName || ''}
                    onChange={(e) => updateFormField('aeatCompanyName', e.target.value)}
                    placeholder="Company name for AEAT"
                  />
                </div>
              </div>
            )}
          </div>
        )

      case 'CAIXABANK_PSD2':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="clientId">Client ID</Label>
                <Input
                  id="clientId"
                  type="password"
                  value={config.clientId}
                  onChange={(e) => updateFormField('clientId', e.target.value)}
                  placeholder="CaixaBank Client ID"
                />
              </div>
              <div>
                <Label htmlFor="clientSecret">Client Secret</Label>
                <Input
                  id="clientSecret"
                  type="password"
                  value={config.clientSecret}
                  onChange={(e) => updateFormField('clientSecret', e.target.value)}
                  placeholder="CaixaBank Client Secret"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="iban">Business IBAN</Label>
                <Input
                  id="iban"
                  value={config.iban}
                  onChange={(e) => updateFormField('iban', e.target.value)}
                  placeholder="ES12 3456 7890 1234 5678 90"
                />
              </div>
              <div>
                <Label htmlFor="environment">Environment</Label>
                <Select value={config.environment} onValueChange={(value) => updateFormField('environment', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sandbox">Sandbox</SelectItem>
                    <SelectItem value="production">Production</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="amountTolerance">Amount Tolerance (€)</Label>
                <Input
                  id="amountTolerance"
                  type="number"
                  step="0.01"
                  value={config.amountTolerance}
                  onChange={(e) => updateFormField('amountTolerance', parseFloat(e.target.value))}
                />
              </div>
              <div>
                <Label htmlFor="daysTolerance">Days Tolerance</Label>
                <Input
                  id="daysTolerance"
                  type="number"
                  value={config.daysTolerance}
                  onChange={(e) => updateFormField('daysTolerance', parseInt(e.target.value))}
                />
              </div>
              <div>
                <Label htmlFor="confidenceThreshold">Confidence Threshold</Label>
                <Input
                  id="confidenceThreshold"
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={config.confidenceThreshold}
                  onChange={(e) => updateFormField('confidenceThreshold', parseFloat(e.target.value))}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="autoReconcile"
                checked={config.autoReconcile}
                onCheckedChange={(checked) => updateFormField('autoReconcile', checked)}
              />
              <Label htmlFor="autoReconcile">Auto Reconciliation Enabled</Label>
            </div>
          </div>
        )

      case 'WHATSAPP_BUSINESS':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="businessAccountId">Business Account ID</Label>
                <Input
                  id="businessAccountId"
                  type="password"
                  value={config.businessAccountId}
                  onChange={(e) => updateFormField('businessAccountId', e.target.value)}
                  placeholder="WhatsApp Business Account ID"
                />
              </div>
              <div>
                <Label htmlFor="phoneNumberId">Phone Number ID</Label>
                <Input
                  id="phoneNumberId"
                  type="password"
                  value={config.phoneNumberId}
                  onChange={(e) => updateFormField('phoneNumberId', e.target.value)}
                  placeholder="WhatsApp Phone Number ID"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="accessToken">Access Token</Label>
              <Input
                id="accessToken"
                type="password"
                value={config.accessToken}
                onChange={(e) => updateFormField('accessToken', e.target.value)}
                placeholder="WhatsApp Access Token"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="defaultLanguage">Default Language</Label>
                <Select value={config.defaultLanguage} onValueChange={(value) => updateFormField('defaultLanguage', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="hu">Hungarian</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="overdueFrequency">Overdue Frequency (days)</Label>
                <Input
                  id="overdueFrequency"
                  type="number"
                  value={config.overdueFrequency}
                  onChange={(e) => updateFormField('overdueFrequency', parseInt(e.target.value))}
                />
              </div>
              <div className="flex items-center space-x-2 pt-6">
                <Switch
                  id="autoReminders"
                  checked={config.autoReminders}
                  onCheckedChange={(checked) => updateFormField('autoReminders', checked)}
                />
                <Label htmlFor="autoReminders">Auto Reminders</Label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="businessHoursStart">Business Hours Start</Label>
                <Input
                  id="businessHoursStart"
                  type="time"
                  value={config.businessHoursStart}
                  onChange={(e) => updateFormField('businessHoursStart', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="businessHoursEnd">Business Hours End</Label>
                <Input
                  id="businessHoursEnd"
                  type="time"
                  value={config.businessHoursEnd}
                  onChange={(e) => updateFormField('businessHoursEnd', e.target.value)}
                />
              </div>
            </div>
          </div>
        )

      case 'BOOKING_COM':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="password"
                  value={config.username}
                  onChange={(e) => updateFormField('username', e.target.value)}
                  placeholder="Booking.com username"
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={config.password}
                  onChange={(e) => updateFormField('password', e.target.value)}
                  placeholder="Booking.com password"
                />
              </div>
              <div>
                <Label htmlFor="hotelId">Hotel ID</Label>
                <Input
                  id="hotelId"
                  value={config.hotelId}
                  onChange={(e) => updateFormField('hotelId', e.target.value)}
                  placeholder="Property/Hotel ID"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="environment">Environment</Label>
                <Select value={config.environment} onValueChange={(value) => updateFormField('environment', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="test">Test</SelectItem>
                    <SelectItem value="live">Live</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="syncFrequency">Sync Frequency (min)</Label>
                <Input
                  id="syncFrequency"
                  type="number"
                  value={config.syncFrequency}
                  onChange={(e) => updateFormField('syncFrequency', parseInt(e.target.value))}
                  min="5"
                />
              </div>
              <div>
                <Label htmlFor="defaultCommission">Commission Rate</Label>
                <Input
                  id="defaultCommission"
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={config.defaultCommission}
                  onChange={(e) => updateFormField('defaultCommission', parseFloat(e.target.value))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="weekendMarkup">Weekend Markup</Label>
                <Input
                  id="weekendMarkup"
                  type="number"
                  step="0.01"
                  min="1"
                  value={config.weekendMarkup}
                  onChange={(e) => updateFormField('weekendMarkup', parseFloat(e.target.value))}
                />
              </div>
              <div>
                <Label htmlFor="highSeasonMarkup">High Season Markup</Label>
                <Input
                  id="highSeasonMarkup"
                  type="number"
                  step="0.01"
                  min="1"
                  value={config.highSeasonMarkup}
                  onChange={(e) => updateFormField('highSeasonMarkup', parseFloat(e.target.value))}
                />
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="autoSync"
                  checked={config.autoSync}
                  onCheckedChange={(checked) => updateFormField('autoSync', checked)}
                />
                <Label htmlFor="autoSync">Auto Sync</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="enableDynamicPricing"
                  checked={config.enableDynamicPricing}
                  onCheckedChange={(checked) => updateFormField('enableDynamicPricing', checked)}
                />
                <Label htmlFor="enableDynamicPricing">Dynamic Pricing</Label>
              </div>
            </div>
          </div>
        )

      case 'UPLISTING_IO':
        return (
          <div className="space-y-6">
            {/* API Credentials */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">API Credentials</h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="apiKey">API Key</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    value={config.apiKey}
                    onChange={(e) => updateFormField('apiKey', e.target.value)}
                    placeholder="Uplisting API Key"
                  />
                </div>
                <div>
                  <Label htmlFor="apiSecret">API Secret</Label>
                  <Input
                    id="apiSecret"
                    type="password"
                    value={config.apiSecret}
                    onChange={(e) => updateFormField('apiSecret', e.target.value)}
                    placeholder="Uplisting API Secret"
                  />
                </div>
                <div>
                  <Label htmlFor="accountId">Account ID</Label>
                  <Input
                    id="accountId"
                    value={config.accountId}
                    onChange={(e) => updateFormField('accountId', e.target.value)}
                    placeholder="Uplisting Account ID"
                  />
                </div>
              </div>
            </div>

            {/* Environment & Channel Settings */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">Channel Configuration</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="environment">Environment</Label>
                  <Select value={config.environment} onValueChange={(value) => updateFormField('environment', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sandbox">Sandbox</SelectItem>
                      <SelectItem value="production">Production</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="syncFrequency">Sync Frequency (min)</Label>
                  <Input
                    id="syncFrequency"
                    type="number"
                    value={config.syncFrequency}
                    onChange={(e) => updateFormField('syncFrequency', parseInt(e.target.value))}
                    min="5"
                    placeholder="30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="enableAirbnb"
                    checked={config.enableAirbnb}
                    onCheckedChange={(checked) => updateFormField('enableAirbnb', checked)}
                  />
                  <Label htmlFor="enableAirbnb">Airbnb</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="enableBookingCom"
                    checked={config.enableBookingCom}
                    onCheckedChange={(checked) => updateFormField('enableBookingCom', checked)}
                  />
                  <Label htmlFor="enableBookingCom">Booking.com</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="enableVrbo"
                    checked={config.enableVrbo}
                    onCheckedChange={(checked) => updateFormField('enableVrbo', checked)}
                  />
                  <Label htmlFor="enableVrbo">Vrbo</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="enableDirectBooking"
                    checked={config.enableDirectBooking}
                    onCheckedChange={(checked) => updateFormField('enableDirectBooking', checked)}
                  />
                  <Label htmlFor="enableDirectBooking">Direct</Label>
                </div>
              </div>
            </div>

            {/* Pricing & Revenue */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">Pricing & Revenue</h4>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="weekendMarkup">Weekend Markup</Label>
                  <Input
                    id="weekendMarkup"
                    type="number"
                    step="0.01"
                    min="1"
                    value={config.weekendMarkup}
                    onChange={(e) => updateFormField('weekendMarkup', parseFloat(e.target.value))}
                    placeholder="1.25"
                  />
                </div>
                <div>
                  <Label htmlFor="highSeasonMarkup">High Season Markup</Label>
                  <Input
                    id="highSeasonMarkup"
                    type="number"
                    step="0.01"
                    min="1"
                    value={config.highSeasonMarkup}
                    onChange={(e) => updateFormField('highSeasonMarkup', parseFloat(e.target.value))}
                    placeholder="1.40"
                  />
                </div>
                <div>
                  <Label htmlFor="lastMinuteDiscount">Last Minute Discount</Label>
                  <Input
                    id="lastMinuteDiscount"
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={config.lastMinuteDiscount}
                    onChange={(e) => updateFormField('lastMinuteDiscount', parseFloat(e.target.value))}
                    placeholder="0.90"
                  />
                </div>
                <div>
                  <Label htmlFor="cleaningDuration">Cleaning Duration (min)</Label>
                  <Input
                    id="cleaningDuration"
                    type="number"
                    min="30"
                    value={config.cleaningDuration}
                    onChange={(e) => updateFormField('cleaningDuration', parseInt(e.target.value))}
                    placeholder="120"
                  />
                </div>
              </div>
            </div>

            {/* Stay Rules */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">Stay Rules</h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="defaultMinStay">Minimum Stay (nights)</Label>
                  <Input
                    id="defaultMinStay"
                    type="number"
                    min="1"
                    value={config.defaultMinStay}
                    onChange={(e) => updateFormField('defaultMinStay', parseInt(e.target.value))}
                    placeholder="2"
                  />
                </div>
                <div>
                  <Label htmlFor="defaultMaxStay">Maximum Stay (nights)</Label>
                  <Input
                    id="defaultMaxStay"
                    type="number"
                    min="1"
                    value={config.defaultMaxStay}
                    onChange={(e) => updateFormField('defaultMaxStay', parseInt(e.target.value))}
                    placeholder="30"
                  />
                </div>
                <div>
                  <Label htmlFor="blockOffDays">Block Off Days</Label>
                  <Input
                    id="blockOffDays"
                    type="number"
                    min="0"
                    value={config.blockOffDays}
                    onChange={(e) => updateFormField('blockOffDays', parseInt(e.target.value))}
                    placeholder="1"
                  />
                </div>
              </div>
            </div>

            {/* Guest Instructions */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">Guest Instructions</h4>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="checkInInstructions">Check-in Instructions</Label>
                  <Textarea
                    id="checkInInstructions"
                    value={config.checkInInstructions || ''}
                    onChange={(e) => updateFormField('checkInInstructions', e.target.value)}
                    placeholder="Provide check-in instructions for guests..."
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="checkOutInstructions">Check-out Instructions</Label>
                  <Textarea
                    id="checkOutInstructions"
                    value={config.checkOutInstructions || ''}
                    onChange={(e) => updateFormField('checkOutInstructions', e.target.value)}
                    placeholder="Provide check-out instructions for guests..."
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="houseRules">House Rules</Label>
                  <Textarea
                    id="houseRules"
                    value={config.houseRules || ''}
                    onChange={(e) => updateFormField('houseRules', e.target.value)}
                    placeholder="List house rules for guests..."
                    rows={3}
                  />
                </div>
              </div>
            </div>

            {/* Automation Settings */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">Automation</h4>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="autoSync"
                      checked={config.autoSync}
                      onCheckedChange={(checked) => updateFormField('autoSync', checked)}
                    />
                    <Label htmlFor="autoSync">Auto Sync</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="autoCalendarSync"
                      checked={config.autoCalendarSync}
                      onCheckedChange={(checked) => updateFormField('autoCalendarSync', checked)}
                    />
                    <Label htmlFor="autoCalendarSync">Auto Calendar Sync</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="enableDynamicPricing"
                      checked={config.enableDynamicPricing}
                      onCheckedChange={(checked) => updateFormField('enableDynamicPricing', checked)}
                    />
                    <Label htmlFor="enableDynamicPricing">Dynamic Pricing</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="revenueOptimization"
                      checked={config.revenueOptimization}
                      onCheckedChange={(checked) => updateFormField('revenueOptimization', checked)}
                    />
                    <Label htmlFor="revenueOptimization">Revenue Optimization</Label>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="autoGuestMessaging"
                      checked={config.autoGuestMessaging}
                      onCheckedChange={(checked) => updateFormField('autoGuestMessaging', checked)}
                    />
                    <Label htmlFor="autoGuestMessaging">Auto Guest Messaging</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="autoCleaningSchedule"
                      checked={config.autoCleaningSchedule}
                      onCheckedChange={(checked) => updateFormField('autoCleaningSchedule', checked)}
                    />
                    <Label htmlFor="autoCleaningSchedule">Auto Cleaning Schedule</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="requireIdVerification"
                      checked={config.requireIdVerification}
                      onCheckedChange={(checked) => updateFormField('requireIdVerification', checked)}
                    />
                    <Label htmlFor="requireIdVerification">Require ID Verification</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="damageProtection"
                      checked={config.damageProtection}
                      onCheckedChange={(checked) => updateFormField('damageProtection', checked)}
                    />
                    <Label htmlFor="damageProtection">Damage Protection</Label>
                  </div>
                </div>
              </div>
            </div>

            {/* Webhook Configuration */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">Webhook Configuration</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="webhookUrl">Webhook URL</Label>
                  <Input
                    id="webhookUrl"
                    type="url"
                    value={config.webhookUrl || ''}
                    onChange={(e) => updateFormField('webhookUrl', e.target.value)}
                    placeholder="https://your-domain.com/webhooks/uplisting"
                  />
                </div>
                <div>
                  <Label htmlFor="webhookSecret">Webhook Secret</Label>
                  <Input
                    id="webhookSecret"
                    type="password"
                    value={config.webhookSecret || ''}
                    onChange={(e) => updateFormField('webhookSecret', e.target.value)}
                    placeholder="Webhook verification secret"
                  />
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Integration Configuration</h1>
          <p className="text-muted-foreground">
            Manage all integration configurations from a central admin interface
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => refetchConfigs()} 
            disabled={!configs}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {Object.entries(INTEGRATION_CONFIG).map(([key, info]) => {
          const config = configs?.find(c => c.type === key)
          const Icon = info.icon
          
          return (
            <Card key={key} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab(key as IntegrationType)}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Icon className="w-5 h-5 text-muted-foreground" />
                  {getStatusBadge(config)}
                </div>
              </CardHeader>
              <CardContent>
                <h3 className="font-semibold">{info.title}</h3>
                <p className="text-sm text-muted-foreground">{info.description}</p>
                {config?.lastTested && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Last tested: {new Date(config.lastTested).toLocaleDateString()}
                  </p>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Configuration Form */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {React.createElement(INTEGRATION_CONFIG[activeTab].icon, { className: 'w-6 h-6' })}
              <div>
                <CardTitle>{INTEGRATION_CONFIG[activeTab].title}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {INTEGRATION_CONFIG[activeTab].description}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={formData[activeTab]?.isEnabled || false}
                onCheckedChange={handleToggle}
                disabled={toggleStatus.isLoading}
              />
              <Label>Enabled</Label>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {renderConfigForm()}
            
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={handleTest}
                  disabled={testConnection.isLoading || !formData[activeTab]?.isEnabled}
                >
                  {testConnection.isLoading ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <TestTube className="w-4 h-4 mr-2" />
                  )}
                  Test Connection
                </Button>
                {activeConfig?.lastTestResult && (
                  <Badge variant={activeConfig.lastTestResult === 'SUCCESS' ? 'default' : 'destructive'}>
                    {activeConfig.lastTestResult}
                  </Badge>
                )}
              </div>
              
              <Button
                onClick={handleSave}
                disabled={updateZoho.isLoading || updateCaixaBank.isLoading || updateWhatsApp.isLoading || updateBooking.isLoading || updateUplisting.isLoading}
              >
                {(updateZoho.isLoading || updateCaixaBank.isLoading || updateWhatsApp.isLoading || updateBooking.isLoading || updateUplisting.isLoading) ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save Configuration
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Information */}
      {activeConfig && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Integration Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label className="text-sm text-muted-foreground">Status</Label>
                <p className="font-medium">{activeConfig.status}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Version</Label>
                <p className="font-medium">v{activeConfig.version}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Last Updated</Label>
                <p className="font-medium">{new Date(activeConfig.updatedAt).toLocaleDateString()}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Last Tested</Label>
                <p className="font-medium">
                  {activeConfig.lastTested 
                    ? new Date(activeConfig.lastTested).toLocaleDateString() 
                    : 'Never'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}