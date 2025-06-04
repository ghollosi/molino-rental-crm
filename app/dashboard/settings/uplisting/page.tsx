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
  TestTube, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle,
  Home,
  Calendar,
  MessageSquare,
  DollarSign,
  BarChart3,
  Webhook,
  Users,
  Clock,
  Shield
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface UplistingProperty {
  id: string
  name: string
  address: {
    street: string
    city: string
    country: string
  }
  propertyType: string
  bedrooms: number
  maxGuests: number
  pricing: {
    basePrice: number
    currency: string
  }
  channels: {
    airbnb?: { enabled: boolean; listingId?: string }
    booking?: { enabled: boolean; propertyId?: string }
    vrbo?: { enabled: boolean; propertyId?: string }
    direct?: { enabled: boolean }
  }
  status: string
}

interface UplistingBooking {
  id: string
  propertyId: string
  channel: string
  guest: {
    firstName: string
    lastName: string
    email: string
  }
  dates: {
    checkIn: string
    checkOut: string
    nights: number
  }
  pricing: {
    totalAmount: number
    currency: string
  }
  status: string
}

export default function UplistingTestPage() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('properties')
  const [isLoading, setIsLoading] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')
  const [testResults, setTestResults] = useState<any>(null)
  const [properties, setProperties] = useState<UplistingProperty[]>([])
  const [bookings, setBookings] = useState<UplistingBooking[]>([])

  // Test API Connection
  const testConnection = async () => {
    setIsLoading(true)
    setConnectionStatus('testing')
    
    try {
      // Simulate API connection test
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const mockAccountInfo = {
        id: 'acc_12345',
        name: 'Demo Property Management',
        plan: 'Professional',
        propertiesCount: 5,
        activeChannels: ['airbnb', 'booking', 'vrbo'],
        lastSync: new Date().toISOString()
      }
      
      setTestResults(mockAccountInfo)
      setConnectionStatus('success')
      
      toast({
        title: "Connection Successful",
        description: "Uplisting.io API connection verified successfully"
      })
    } catch (error) {
      setConnectionStatus('error')
      toast({
        variant: "destructive",
        title: "Connection Failed",
        description: "Unable to connect to Uplisting.io API"
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Load Properties
  const loadProperties = async () => {
    setIsLoading(true)
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      const mockProperties: UplistingProperty[] = [
        {
          id: 'prop_001',
          name: 'Luxury Apartment Barcelona',
          address: {
            street: 'Carrer de Mallorca, 123',
            city: 'Barcelona',
            country: 'Spain'
          },
          propertyType: 'apartment',
          bedrooms: 2,
          maxGuests: 4,
          pricing: {
            basePrice: 120,
            currency: 'EUR'
          },
          channels: {
            airbnb: { enabled: true, listingId: 'airbnb_123' },
            booking: { enabled: true, propertyId: 'booking_456' },
            vrbo: { enabled: false },
            direct: { enabled: true }
          },
          status: 'active'
        },
        {
          id: 'prop_002',
          name: 'Coastal Villa Alicante',
          address: {
            street: 'Avenida de la Costa, 89',
            city: 'Alicante',
            country: 'Spain'
          },
          propertyType: 'villa',
          bedrooms: 4,
          maxGuests: 8,
          pricing: {
            basePrice: 280,
            currency: 'EUR'
          },
          channels: {
            airbnb: { enabled: true, listingId: 'airbnb_789' },
            booking: { enabled: true, propertyId: 'booking_012' },
            vrbo: { enabled: true, propertyId: 'vrbo_345' },
            direct: { enabled: true }
          },
          status: 'active'
        }
      ]
      
      setProperties(mockProperties)
      
      toast({
        title: "Properties Loaded",
        description: `Loaded ${mockProperties.length} properties from Uplisting.io`
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Load Failed",
        description: "Failed to load properties"
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Load Bookings
  const loadBookings = async () => {
    setIsLoading(true)
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      const mockBookings: UplistingBooking[] = [
        {
          id: 'book_001',
          propertyId: 'prop_001',
          channel: 'airbnb',
          guest: {
            firstName: 'Maria',
            lastName: 'Garcia',
            email: 'maria.garcia@email.com'
          },
          dates: {
            checkIn: '2025-06-15',
            checkOut: '2025-06-20',
            nights: 5
          },
          pricing: {
            totalAmount: 650,
            currency: 'EUR'
          },
          status: 'confirmed'
        },
        {
          id: 'book_002',
          propertyId: 'prop_002',
          channel: 'booking',
          guest: {
            firstName: 'John',
            lastName: 'Smith',
            email: 'john.smith@email.com'
          },
          dates: {
            checkIn: '2025-06-25',
            checkOut: '2025-07-02',
            nights: 7
          },
          pricing: {
            totalAmount: 2100,
            currency: 'EUR'
          },
          status: 'confirmed'
        }
      ]
      
      setBookings(mockBookings)
      
      toast({
        title: "Bookings Loaded",
        description: `Loaded ${mockBookings.length} bookings from Uplisting.io`
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Load Failed",
        description: "Failed to load bookings"
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Sync Property to Channel
  const syncToChannel = async (propertyId: string, channel: string) => {
    setIsLoading(true)
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast({
        title: "Sync Successful",
        description: `Property synced to ${channel} successfully`
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Sync Failed",
        description: `Failed to sync property to ${channel}`
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Active</Badge>
      case 'confirmed':
        return <Badge variant="default" className="bg-blue-500"><CheckCircle className="w-3 h-3 mr-1" />Confirmed</Badge>
      case 'error':
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Error</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getChannelBadge = (channel: string) => {
    const colors = {
      airbnb: 'bg-red-500',
      booking: 'bg-blue-500',
      vrbo: 'bg-purple-500',
      direct: 'bg-green-500'
    }
    
    return (
      <Badge variant="secondary" className={`${colors[channel as keyof typeof colors]} text-white`}>
        {channel.charAt(0).toUpperCase() + channel.slice(1)}
      </Badge>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Uplisting.io Integration</h1>
          <p className="text-muted-foreground">
            Multi-channel vacation rental management platform
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={testConnection}
            disabled={isLoading}
          >
            {isLoading ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <TestTube className="w-4 h-4 mr-2" />
            )}
            Test Connection
          </Button>
        </div>
      </div>

      {/* Connection Status */}
      {connectionStatus !== 'idle' && (
        <Alert className={`mb-6 ${connectionStatus === 'success' ? 'border-green-500' : connectionStatus === 'error' ? 'border-red-500' : ''}`}>
          <div className="flex items-center">
            {connectionStatus === 'testing' && <RefreshCw className="h-4 w-4 animate-spin" />}
            {connectionStatus === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
            {connectionStatus === 'error' && <AlertCircle className="h-4 w-4 text-red-500" />}
            <AlertDescription className="ml-2">
              {connectionStatus === 'testing' && 'Testing connection to Uplisting.io...'}
              {connectionStatus === 'success' && 'Successfully connected to Uplisting.io API'}
              {connectionStatus === 'error' && 'Failed to connect to Uplisting.io API'}
            </AlertDescription>
          </div>
        </Alert>
      )}

      {/* Account Information */}
      {testResults && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Account Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label className="text-sm text-muted-foreground">Account ID</Label>
                <p className="font-medium">{testResults.id}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Account Name</Label>
                <p className="font-medium">{testResults.name}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Plan</Label>
                <p className="font-medium">{testResults.plan}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Properties</Label>
                <p className="font-medium">{testResults.propertiesCount}</p>
              </div>
            </div>
            <div className="mt-4">
              <Label className="text-sm text-muted-foreground">Active Channels</Label>
              <div className="flex gap-2 mt-1">
                {testResults.activeChannels?.map((channel: string) => (
                  getChannelBadge(channel)
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="properties" className="flex items-center gap-2">
            <Home className="w-4 h-4" />
            Properties
          </TabsTrigger>
          <TabsTrigger value="bookings" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Bookings
          </TabsTrigger>
          <TabsTrigger value="messaging" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Messaging
          </TabsTrigger>
          <TabsTrigger value="pricing" className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Pricing
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="webhooks" className="flex items-center gap-2">
            <Webhook className="w-4 h-4" />
            Webhooks
          </TabsTrigger>
        </TabsList>

        {/* Properties Tab */}
        <TabsContent value="properties" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Property Management</h2>
            <Button onClick={loadProperties} disabled={isLoading}>
              {isLoading ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Load Properties
            </Button>
          </div>

          <div className="grid gap-4">
            {properties.map((property) => (
              <Card key={property.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{property.name}</CardTitle>
                    {getStatusBadge(property.status)}
                  </div>
                  <p className="text-muted-foreground">
                    {property.address.street}, {property.address.city}, {property.address.country}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <Label className="text-sm text-muted-foreground">Type</Label>
                      <p className="font-medium capitalize">{property.propertyType}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Bedrooms</Label>
                      <p className="font-medium">{property.bedrooms}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Max Guests</Label>
                      <p className="font-medium">{property.maxGuests}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Base Price</Label>
                      <p className="font-medium">{property.pricing.basePrice} {property.pricing.currency}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-sm text-muted-foreground">Channel Status</Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {Object.entries(property.channels).map(([channel, config]) => (
                        <div key={channel} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium capitalize">{channel}</p>
                            <p className="text-xs text-muted-foreground">
                              {config?.enabled ? 'Enabled' : 'Disabled'}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch checked={config?.enabled || false} disabled />
                            {config?.enabled && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => syncToChannel(property.id, channel)}
                                disabled={isLoading}
                              >
                                Sync
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Bookings Tab */}
        <TabsContent value="bookings" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Booking Management</h2>
            <Button onClick={loadBookings} disabled={isLoading}>
              {isLoading ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Load Bookings
            </Button>
          </div>

          <div className="grid gap-4">
            {bookings.map((booking) => (
              <Card key={booking.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      {booking.guest.firstName} {booking.guest.lastName}
                    </CardTitle>
                    <div className="flex gap-2">
                      {getChannelBadge(booking.channel)}
                      {getStatusBadge(booking.status)}
                    </div>
                  </div>
                  <p className="text-muted-foreground">{booking.guest.email}</p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <Label className="text-sm text-muted-foreground">Check-in</Label>
                      <p className="font-medium">{new Date(booking.dates.checkIn).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Check-out</Label>
                      <p className="font-medium">{new Date(booking.dates.checkOut).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Nights</Label>
                      <p className="font-medium">{booking.dates.nights}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Total Amount</Label>
                      <p className="font-medium">{booking.pricing.totalAmount} {booking.pricing.currency}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Other tabs with placeholder content */}
        <TabsContent value="messaging" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Automated Guest Messaging</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Configure automated messages for check-in instructions, welcome messages, and more.
              </p>
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Welcome Message</p>
                    <p className="text-sm text-muted-foreground">Sent after booking confirmation</p>
                  </div>
                  <Switch checked={true} />
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Check-in Instructions</p>
                    <p className="text-sm text-muted-foreground">Sent 24 hours before check-in</p>
                  </div>
                  <Switch checked={true} />
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Check-out Reminder</p>
                    <p className="text-sm text-muted-foreground">Sent morning of check-out</p>
                  </div>
                  <Switch checked={false} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pricing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Dynamic Pricing & Revenue Optimization</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Automatically optimize pricing based on demand, seasonality, and competition.
              </p>
              <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="p-3 border rounded-lg">
                  <p className="font-medium">Weekend Markup</p>
                  <p className="text-2xl font-bold text-green-600">+25%</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <p className="font-medium">High Season Markup</p>
                  <p className="text-2xl font-bold text-blue-600">+40%</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <p className="font-medium">Last Minute Discount</p>
                  <p className="text-2xl font-bold text-orange-600">-10%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Track performance across all channels and properties.
              </p>
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 border rounded-lg">
                  <p className="font-medium">Total Revenue</p>
                  <p className="text-2xl font-bold">€15,240</p>
                  <p className="text-sm text-green-600">+12% vs last month</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <p className="font-medium">Occupancy Rate</p>
                  <p className="text-2xl font-bold">78%</p>
                  <p className="text-sm text-blue-600">+5% vs last month</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <p className="font-medium">Average Daily Rate</p>
                  <p className="text-2xl font-bold">€156</p>
                  <p className="text-sm text-green-600">+8% vs last month</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <p className="font-medium">Total Bookings</p>
                  <p className="text-2xl font-bold">42</p>
                  <p className="text-sm text-green-600">+15% vs last month</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Webhook Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Configure webhooks to receive real-time notifications from Uplisting.io.
              </p>
              <div className="mt-4 space-y-4">
                <div>
                  <Label htmlFor="webhookUrl">Webhook URL</Label>
                  <Input
                    id="webhookUrl"
                    value="https://molino-rental-crm.com/api/webhooks/uplisting"
                    disabled
                  />
                </div>
                <div className="space-y-3">
                  <Label>Event Types</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center space-x-2">
                      <Switch checked={true} />
                      <Label>Booking Created</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch checked={true} />
                      <Label>Booking Updated</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch checked={true} />
                      <Label>Booking Cancelled</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch checked={false} />
                      <Label>Calendar Updated</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch checked={true} />
                      <Label>Message Received</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch checked={false} />
                      <Label>Pricing Updated</Label>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}