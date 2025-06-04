/**
 * Uplisting.io API Integration
 * Multi-channel vacation rental management platform
 * Supports Airbnb, Booking.com, Vrbo, and direct bookings
 */

import { env } from '@/env'
import { getUplistingConfig } from '@/lib/integration-config'

export interface UplistingConfig {
  apiKey: string
  apiSecret: string
  accountId: string
  environment: 'sandbox' | 'production'
}

export interface UplistingProperty {
  id: string
  name: string
  address: {
    street: string
    city: string
    country: string
    postalCode: string
    coordinates?: {
      latitude: number
      longitude: number
    }
  }
  propertyType: 'apartment' | 'house' | 'villa' | 'condo'
  bedrooms: number
  bathrooms: number
  maxGuests: number
  amenities: string[]
  pricing: {
    basePrice: number
    currency: string
    weekendMarkup?: number
    cleaningFee?: number
    securityDeposit?: number
  }
  availability: {
    minimumStay: number
    maximumStay: number
    checkInTime: string
    checkOutTime: string
  }
  channels: {
    airbnb?: {
      enabled: boolean
      listingId?: string
      url?: string
    }
    booking?: {
      enabled: boolean
      propertyId?: string
      url?: string
    }
    vrbo?: {
      enabled: boolean
      propertyId?: string
      url?: string
    }
    direct?: {
      enabled: boolean
      url?: string
    }
  }
  status: 'active' | 'inactive' | 'draft'
}

export interface UplistingBooking {
  id: string
  propertyId: string
  channel: 'airbnb' | 'booking' | 'vrbo' | 'direct'
  channelBookingId: string
  guest: {
    firstName: string
    lastName: string
    email: string
    phone?: string
    country?: string
  }
  dates: {
    checkIn: string
    checkOut: string
    nights: number
  }
  pricing: {
    totalAmount: number
    hostPayout: number
    channelCommission: number
    cleaningFee?: number
    taxes?: number
    currency: string
  }
  guests: {
    adults: number
    children: number
    infants: number
  }
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  specialRequests?: string
  createdAt: string
  updatedAt: string
}

export interface UplistingCalendar {
  propertyId: string
  date: string
  status: 'available' | 'blocked' | 'booked'
  price?: number
  minimumStay?: number
  notes?: string
}

export interface UplistingRevenueReport {
  propertyId: string
  period: {
    start: string
    end: string
  }
  metrics: {
    totalRevenue: number
    totalBookings: number
    occupancyRate: number
    averageDailyRate: number
    averageStayLength: number
  }
  channelBreakdown: {
    channel: string
    revenue: number
    bookings: number
    commission: number
  }[]
  currency: string
}

export interface UplistingMessage {
  id: string
  bookingId: string
  from: 'host' | 'guest'
  message: string
  timestamp: string
  channel: string
  automated: boolean
}

export class UplistingAPI {
  private config: UplistingConfig
  private baseUrl: string

  constructor(config: UplistingConfig) {
    this.config = config
    this.baseUrl = config.environment === 'production' 
      ? 'https://api.uplisting.io/v1'
      : 'https://sandbox-api.uplisting.io/v1'
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`
    
    const headers = {
      'Authorization': `Bearer ${this.config.apiKey}`,
      'X-API-Secret': this.config.apiSecret,
      'Content-Type': 'application/json',
      'User-Agent': 'Molino-Rental-CRM/1.0',
      ...options.headers,
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`Uplisting API Error: ${response.status} - ${errorData.message || response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Uplisting API request failed: ${error.message}`)
      }
      throw new Error('Unknown error occurred during Uplisting API request')
    }
  }

  // Property Management
  async getProperties(): Promise<UplistingProperty[]> {
    return await this.makeRequest('/properties')
  }

  async getProperty(propertyId: string): Promise<UplistingProperty> {
    return await this.makeRequest(`/properties/${propertyId}`)
  }

  async createProperty(property: Partial<UplistingProperty>): Promise<UplistingProperty> {
    return await this.makeRequest('/properties', {
      method: 'POST',
      body: JSON.stringify(property)
    })
  }

  async updateProperty(propertyId: string, updates: Partial<UplistingProperty>): Promise<UplistingProperty> {
    return await this.makeRequest(`/properties/${propertyId}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    })
  }

  // Booking Management
  async getBookings(params?: {
    propertyId?: string
    startDate?: string
    endDate?: string
    status?: string
    channel?: string
  }): Promise<UplistingBooking[]> {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) searchParams.append(key, value)
      })
    }
    
    const endpoint = `/bookings${searchParams.toString() ? `?${searchParams}` : ''}`
    return await this.makeRequest(endpoint)
  }

  async getBooking(bookingId: string): Promise<UplistingBooking> {
    return await this.makeRequest(`/bookings/${bookingId}`)
  }

  async createBooking(booking: Partial<UplistingBooking>): Promise<UplistingBooking> {
    return await this.makeRequest('/bookings', {
      method: 'POST',
      body: JSON.stringify(booking)
    })
  }

  async cancelBooking(bookingId: string, reason?: string): Promise<{ success: boolean }> {
    return await this.makeRequest(`/bookings/${bookingId}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    })
  }

  // Calendar Management
  async getCalendar(propertyId: string, startDate: string, endDate: string): Promise<UplistingCalendar[]> {
    return await this.makeRequest(`/properties/${propertyId}/calendar?start=${startDate}&end=${endDate}`)
  }

  async updateCalendar(propertyId: string, updates: UplistingCalendar[]): Promise<{ success: boolean }> {
    return await this.makeRequest(`/properties/${propertyId}/calendar`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    })
  }

  async blockDates(propertyId: string, startDate: string, endDate: string, reason?: string): Promise<{ success: boolean }> {
    return await this.makeRequest(`/properties/${propertyId}/calendar/block`, {
      method: 'POST',
      body: JSON.stringify({ startDate, endDate, reason })
    })
  }

  // Channel Management
  async syncToChannel(propertyId: string, channel: 'airbnb' | 'booking' | 'vrbo'): Promise<{ success: boolean }> {
    return await this.makeRequest(`/properties/${propertyId}/channels/${channel}/sync`, {
      method: 'POST'
    })
  }

  async enableChannel(propertyId: string, channel: 'airbnb' | 'booking' | 'vrbo', settings: any): Promise<{ success: boolean }> {
    return await this.makeRequest(`/properties/${propertyId}/channels/${channel}`, {
      method: 'POST',
      body: JSON.stringify(settings)
    })
  }

  async disableChannel(propertyId: string, channel: 'airbnb' | 'booking' | 'vrbo'): Promise<{ success: boolean }> {
    return await this.makeRequest(`/properties/${propertyId}/channels/${channel}`, {
      method: 'DELETE'
    })
  }

  // Messaging
  async getMessages(bookingId: string): Promise<UplistingMessage[]> {
    return await this.makeRequest(`/bookings/${bookingId}/messages`)
  }

  async sendMessage(bookingId: string, message: string, automated = false): Promise<UplistingMessage> {
    return await this.makeRequest(`/bookings/${bookingId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ message, automated })
    })
  }

  async sendAutomatedMessage(bookingId: string, templateType: 'check_in' | 'check_out' | 'welcome' | 'reminder'): Promise<UplistingMessage> {
    return await this.makeRequest(`/bookings/${bookingId}/messages/automated`, {
      method: 'POST',
      body: JSON.stringify({ templateType })
    })
  }

  // Analytics & Reporting
  async getRevenueReport(propertyId: string, startDate: string, endDate: string): Promise<UplistingRevenueReport> {
    return await this.makeRequest(`/properties/${propertyId}/reports/revenue?start=${startDate}&end=${endDate}`)
  }

  async getOccupancyReport(propertyId: string, startDate: string, endDate: string): Promise<any> {
    return await this.makeRequest(`/properties/${propertyId}/reports/occupancy?start=${startDate}&end=${endDate}`)
  }

  async getChannelPerformance(propertyId?: string): Promise<any> {
    const endpoint = propertyId 
      ? `/properties/${propertyId}/reports/channels`
      : '/reports/channels'
    return await this.makeRequest(endpoint)
  }

  // Cleaning & Maintenance
  async scheduleCleaningTask(propertyId: string, bookingId: string, scheduledDate: string): Promise<{ success: boolean, taskId: string }> {
    return await this.makeRequest('/tasks/cleaning', {
      method: 'POST',
      body: JSON.stringify({
        propertyId,
        bookingId,
        scheduledDate,
        type: 'cleaning'
      })
    })
  }

  async getCleaningTasks(propertyId?: string): Promise<any[]> {
    const endpoint = propertyId 
      ? `/tasks/cleaning?propertyId=${propertyId}`
      : '/tasks/cleaning'
    return await this.makeRequest(endpoint)
  }

  // Webhooks
  async createWebhook(url: string, events: string[]): Promise<{ success: boolean, webhookId: string }> {
    return await this.makeRequest('/webhooks', {
      method: 'POST',
      body: JSON.stringify({ url, events })
    })
  }

  async processWebhook(payload: any, signature: string): Promise<{ success: boolean, processed: boolean }> {
    // Webhook signature validation would go here
    try {
      // Process different webhook event types
      switch (payload.event) {
        case 'booking.created':
        case 'booking.updated':
        case 'booking.cancelled':
          return { success: true, processed: true }
        case 'calendar.updated':
          return { success: true, processed: true }
        case 'message.received':
          return { success: true, processed: true }
        default:
          return { success: true, processed: false }
      }
    } catch (error) {
      throw new Error(`Webhook processing failed: ${error}`)
    }
  }

  // Testing & Validation
  async testConnection(): Promise<{ success: boolean, accountInfo?: any }> {
    try {
      const accountInfo = await this.makeRequest('/account')
      return { 
        success: true, 
        accountInfo: {
          id: accountInfo.id,
          name: accountInfo.name,
          plan: accountInfo.plan,
          propertiesCount: accountInfo.propertiesCount
        }
      }
    } catch (error) {
      return { success: false }
    }
  }
}

// Singleton instance
let uplistingInstance: UplistingAPI | null = null

export async function getUplistingClient(): Promise<UplistingAPI> {
  if (!uplistingInstance) {
    const config = await getUplistingConfig()
    const uplistingConfig: UplistingConfig = {
      apiKey: config.apiKey,
      apiSecret: config.apiSecret,
      accountId: config.accountId,
      environment: config.environment,
    }

    uplistingInstance = new UplistingAPI(uplistingConfig)
  }

  return uplistingInstance
}

// Helper class for rental property integration
export class UplistingRentalHelper {
  private uplisting: UplistingAPI

  constructor(uplistingClient: UplistingAPI) {
    this.uplisting = uplistingClient
  }

  async syncPropertyFromCRM(property: any): Promise<UplistingProperty> {
    const uplistingProperty: Partial<UplistingProperty> = {
      name: `${property.street}, ${property.city}`,
      address: {
        street: property.street,
        city: property.city,
        country: property.country || 'Spain',
        postalCode: property.postalCode || '',
        coordinates: property.latitude && property.longitude ? {
          latitude: property.latitude,
          longitude: property.longitude
        } : undefined
      },
      propertyType: this.mapPropertyType(property.type),
      bedrooms: property.rooms || 1,
      bathrooms: Math.ceil((property.rooms || 1) / 2), // Estimate
      maxGuests: (property.rooms || 1) * 2,
      pricing: {
        basePrice: parseFloat(property.rentAmount?.toString() || '0'),
        currency: property.currency || 'EUR'
      },
      availability: {
        minimumStay: 2,
        maximumStay: 30,
        checkInTime: '15:00',
        checkOutTime: '11:00'
      },
      channels: {
        airbnb: { enabled: true },
        booking: { enabled: true },
        vrbo: { enabled: true },
        direct: { enabled: true }
      },
      status: property.status === 'AVAILABLE' ? 'active' : 'inactive'
    }

    return await this.uplisting.createProperty(uplistingProperty)
  }

  private mapPropertyType(crmType: string): 'apartment' | 'house' | 'villa' | 'condo' {
    switch (crmType) {
      case 'HOUSE': return 'house'
      case 'APARTMENT': return 'apartment'
      case 'COMMERCIAL': return 'condo'
      default: return 'apartment'
    }
  }

  async getPropertyPerformanceAnalytics(propertyId: string, days = 30): Promise<any> {
    const endDate = new Date().toISOString().split('T')[0]
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    const [revenue, occupancy, channelPerformance] = await Promise.all([
      this.uplisting.getRevenueReport(propertyId, startDate, endDate),
      this.uplisting.getOccupancyReport(propertyId, startDate, endDate),
      this.uplisting.getChannelPerformance(propertyId)
    ])

    return {
      revenue,
      occupancy,
      channelPerformance,
      period: { startDate, endDate, days }
    }
  }

  async optimizePropertyListings(propertyId: string): Promise<{
    recommendations: string[]
    optimizations: any[]
  }> {
    const property = await this.uplisting.getProperty(propertyId)
    const performance = await this.getPropertyPerformanceAnalytics(propertyId)
    
    const recommendations: string[] = []
    const optimizations: any[] = []

    // Analyze pricing
    if (performance.revenue.metrics.averageDailyRate < 50) {
      recommendations.push('Consider increasing base price - currently below market average')
      optimizations.push({
        type: 'pricing',
        action: 'increase_base_price',
        current: performance.revenue.metrics.averageDailyRate,
        suggested: performance.revenue.metrics.averageDailyRate * 1.15
      })
    }

    // Analyze occupancy
    if (performance.occupancy.rate < 0.7) {
      recommendations.push('Low occupancy detected - consider reducing minimum stay or adjusting pricing')
      optimizations.push({
        type: 'availability',
        action: 'reduce_minimum_stay',
        current: property.availability.minimumStay,
        suggested: Math.max(1, property.availability.minimumStay - 1)
      })
    }

    // Channel performance analysis
    const topChannel = performance.channelPerformance.reduce((a: any, b: any) => 
      a.revenue > b.revenue ? a : b
    )
    
    if (topChannel.revenue > performance.revenue.metrics.totalRevenue * 0.7) {
      recommendations.push(`${topChannel.channel} generates most revenue - consider optimizing other channels`)
    }

    return { recommendations, optimizations }
  }
}

// Multi-channel booking management
export class UplistingBookingManager {
  private uplisting: UplistingAPI

  constructor(uplistingClient: UplistingAPI) {
    this.uplisting = uplistingClient
  }

  async importBookingsToMolinoCRM(propertyId?: string): Promise<any[]> {
    const bookings = await this.uplisting.getBookings({
      propertyId,
      startDate: new Date().toISOString().split('T')[0]
    })

    return bookings.map(booking => ({
      externalId: booking.id,
      platform: 'UPLISTING',
      guestName: `${booking.guest.firstName} ${booking.guest.lastName}`,
      guestEmail: booking.guest.email,
      guestPhone: booking.guest.phone,
      checkIn: booking.dates.checkIn,
      checkOut: booking.dates.checkOut,
      nights: booking.dates.nights,
      adults: booking.guests.adults,
      children: booking.guests.children,
      totalAmount: booking.pricing.totalAmount,
      currency: booking.pricing.currency,
      commission: booking.pricing.channelCommission,
      netAmount: booking.pricing.hostPayout,
      status: this.mapBookingStatus(booking.status),
      bookedAt: booking.createdAt,
      channel: booking.channel.toUpperCase(),
      specialRequests: booking.specialRequests
    }))
  }

  private mapBookingStatus(uplistingStatus: string): 'CONFIRMED' | 'CANCELLED' | 'CHECKED_IN' | 'CHECKED_OUT' {
    switch (uplistingStatus) {
      case 'confirmed': return 'CONFIRMED'
      case 'cancelled': return 'CANCELLED'
      case 'completed': return 'CHECKED_OUT'
      default: return 'CONFIRMED'
    }
  }

  async autoConfirmBooking(bookingId: string): Promise<boolean> {
    try {
      // Auto-send welcome message
      await this.uplisting.sendAutomatedMessage(bookingId, 'welcome')
      
      // Schedule cleaning task
      const booking = await this.uplisting.getBooking(bookingId)
      await this.uplisting.scheduleCleaningTask(
        booking.propertyId, 
        bookingId, 
        booking.dates.checkOut
      )
      
      return true
    } catch (error) {
      console.error('Auto-confirm booking failed:', error)
      return false
    }
  }
}