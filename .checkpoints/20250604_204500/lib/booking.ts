/**
 * Booking.com Partner API Integration
 * Short-term rental management for Spanish properties
 */

import { env } from '@/env'
import { getBookingConfig } from '@/lib/integration-config'

export interface BookingConfig {
  username: string
  password: string
  hotelId: string
  environment: 'test' | 'production'
}

export interface BookingAvailability {
  roomId: string
  date: string
  available: boolean
  price: number
  currency: 'EUR'
  minimumStay: number
  maximumStay: number
  closedToArrival: boolean
  closedToDeparture: boolean
  inventory?: number
}

export interface BookingReservation {
  reservationId: string
  hotelId: string
  roomId: string
  guestName: string
  guestEmail?: string
  guestPhone?: string
  guestCountry?: string
  checkIn: string
  checkOut: string
  nights: number
  adults: number
  children: number
  totalPrice: number
  currency: string
  commission: number
  status: 'confirmed' | 'cancelled' | 'modified' | 'no_show'
  bookedAt: string
  cancellationPolicy?: string
  specialRequests?: string
  guestComments?: string
  arrivalTime?: string
}

export interface BookingRoom {
  roomId: string
  roomType: string
  roomName: string
  maxOccupancy: number
  bedConfiguration: string
  amenities: string[]
  photos: string[]
  basePrice: number
  currency: string
  description?: string
}

export interface BookingProperty {
  hotelId: string
  propertyName: string
  address: {
    street: string
    city: string
    postalCode: string
    country: string
    latitude?: number
    longitude?: number
  }
  contactInfo: {
    phone: string
    email: string
  }
  checkInTime: string
  checkOutTime: string
  currency: string
  timezone: string
  rooms: BookingRoom[]
}

export interface BookingRateUpdate {
  roomId: string
  date: string
  rate: number
  currency: 'EUR'
  rateType: 'per_night' | 'per_person'
}

export interface BookingInventoryUpdate {
  roomId: string
  date: string
  inventory: number
  minimumStay: number
  maximumStay: number
  closedToArrival: boolean
  closedToDeparture: boolean
}

class BookingPartnerAPI {
  private baseUrl: string
  private config: BookingConfig
  private authToken: string | null = null

  constructor(config: BookingConfig) {
    this.config = config
    this.baseUrl = config.environment === 'test' 
      ? 'https://supply-api.test.booking.com'
      : 'https://supply-api.booking.com'
  }

  /**
   * Authenticate with Booking.com API
   */
  private async authenticate(): Promise<string> {
    if (this.authToken) {
      return this.authToken
    }

    const response = await fetch(`${this.baseUrl}/v2/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${this.config.username}:${this.config.password}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        scope: 'read write',
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Booking.com auth failed: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    this.authToken = data.access_token
    return this.authToken
  }

  /**
   * Make authenticated API request
   */
  private async apiRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = await this.authenticate()
    
    const url = `${this.baseUrl}${endpoint}`
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Booking.com API error: ${response.status} - ${errorText}`)
    }

    return response.json()
  }

  /**
   * Get property information
   */
  async getProperty(): Promise<BookingProperty> {
    return this.apiRequest<BookingProperty>(`/v2/hotels/${this.config.hotelId}`)
  }

  /**
   * Get all rooms for the property
   */
  async getRooms(): Promise<BookingRoom[]> {
    const response = await this.apiRequest<{ rooms: BookingRoom[] }>(`/v2/hotels/${this.config.hotelId}/rooms`)
    return response.rooms
  }

  /**
   * Get reservations for a date range
   */
  async getReservations(
    dateFrom: string,
    dateTo: string,
    status?: string
  ): Promise<BookingReservation[]> {
    let endpoint = `/v2/hotels/${this.config.hotelId}/reservations?from=${dateFrom}&to=${dateTo}`
    
    if (status) {
      endpoint += `&status=${status}`
    }

    const response = await this.apiRequest<{ reservations: BookingReservation[] }>(endpoint)
    return response.reservations
  }

  /**
   * Get specific reservation details
   */
  async getReservation(reservationId: string): Promise<BookingReservation> {
    return this.apiRequest<BookingReservation>(`/v2/hotels/${this.config.hotelId}/reservations/${reservationId}`)
  }

  /**
   * Update room rates
   */
  async updateRates(rates: BookingRateUpdate[]): Promise<void> {
    await this.apiRequest(`/v2/hotels/${this.config.hotelId}/rates`, {
      method: 'PUT',
      body: JSON.stringify({ rates }),
    })
  }

  /**
   * Update room availability and inventory
   */
  async updateAvailability(inventory: BookingInventoryUpdate[]): Promise<void> {
    await this.apiRequest(`/v2/hotels/${this.config.hotelId}/availability`, {
      method: 'PUT',
      body: JSON.stringify({ availability: inventory }),
    })
  }

  /**
   * Get availability and rates for date range
   */
  async getAvailability(
    roomId: string,
    dateFrom: string,
    dateTo: string
  ): Promise<BookingAvailability[]> {
    const response = await this.apiRequest<{ availability: BookingAvailability[] }>(
      `/v2/hotels/${this.config.hotelId}/rooms/${roomId}/availability?from=${dateFrom}&to=${dateTo}`
    )
    return response.availability
  }

  /**
   * Update room availability for specific dates
   */
  async updateRoomAvailability(updates: {
    roomId: string
    date: string
    available: boolean
    price?: number
    minimumStay?: number
    maximumStay?: number
  }[]): Promise<void> {
    const availabilityUpdates = updates.map(update => ({
      roomId: update.roomId,
      date: update.date,
      inventory: update.available ? 1 : 0,
      minimumStay: update.minimumStay || 1,
      maximumStay: update.maximumStay || 365,
      closedToArrival: !update.available,
      closedToDeparture: !update.available,
    }))

    await this.updateAvailability(availabilityUpdates)

    if (updates.some(u => u.price)) {
      const rateUpdates = updates
        .filter(u => u.price)
        .map(update => ({
          roomId: update.roomId,
          date: update.date,
          rate: update.price!,
          currency: 'EUR' as const,
          rateType: 'per_night' as const,
        }))

      await this.updateRates(rateUpdates)
    }
  }

  /**
   * Sync local property with Booking.com room
   */
  async syncPropertyWithBooking(params: {
    propertyId: string
    roomId: string
    basePrice: number
    availability: Array<{
      date: string
      available: boolean
      price?: number
    }>
  }): Promise<void> {
    const updates = params.availability.map(avail => ({
      roomId: params.roomId,
      date: avail.date,
      available: avail.available,
      price: avail.price || params.basePrice,
      minimumStay: 1,
      maximumStay: 30,
    }))

    await this.updateRoomAvailability(updates)
  }

  /**
   * Import reservation to local database format
   */
  importReservationToLocal(reservation: BookingReservation): {
    guestInfo: {
      name: string
      email?: string
      phone?: string
      country?: string
    }
    stayInfo: {
      checkIn: string
      checkOut: string
      nights: number
      adults: number
      children: number
    }
    paymentInfo: {
      totalAmount: number
      currency: string
      commission: number
      netAmount: number
    }
    bookingInfo: {
      platform: 'booking_com'
      externalId: string
      status: string
      bookedAt: string
      specialRequests?: string
    }
  } {
    return {
      guestInfo: {
        name: reservation.guestName,
        email: reservation.guestEmail,
        phone: reservation.guestPhone,
        country: reservation.guestCountry,
      },
      stayInfo: {
        checkIn: reservation.checkIn,
        checkOut: reservation.checkOut,
        nights: reservation.nights,
        adults: reservation.adults,
        children: reservation.children,
      },
      paymentInfo: {
        totalAmount: reservation.totalPrice,
        currency: reservation.currency,
        commission: reservation.commission,
        netAmount: reservation.totalPrice - reservation.commission,
      },
      bookingInfo: {
        platform: 'booking_com',
        externalId: reservation.reservationId,
        status: reservation.status,
        bookedAt: reservation.bookedAt,
        specialRequests: reservation.specialRequests,
      },
    }
  }

  /**
   * Handle reservation status changes
   */
  async handleReservationStatusChange(
    reservationId: string,
    newStatus: 'confirmed' | 'cancelled' | 'modified' | 'no_show'
  ): Promise<BookingReservation> {
    // Booking.com typically sends webhook notifications for status changes
    // This method gets the updated reservation details
    return this.getReservation(reservationId)
  }

  /**
   * Get occupancy statistics for reporting
   */
  async getOccupancyStats(dateFrom: string, dateTo: string): Promise<{
    totalNights: number
    bookedNights: number
    occupancyRate: number
    totalRevenue: number
    averageRate: number
    currency: string
  }> {
    const reservations = await this.getReservations(dateFrom, dateTo, 'confirmed')
    const rooms = await this.getRooms()
    
    const startDate = new Date(dateFrom)
    const endDate = new Date(dateTo)
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    const totalNights = totalDays * rooms.length

    const bookedNights = reservations.reduce((sum, res) => sum + res.nights, 0)
    const totalRevenue = reservations.reduce((sum, res) => sum + res.totalPrice, 0)
    const occupancyRate = totalNights > 0 ? (bookedNights / totalNights) * 100 : 0
    const averageRate = bookedNights > 0 ? totalRevenue / bookedNights : 0

    return {
      totalNights,
      bookedNights,
      occupancyRate,
      totalRevenue,
      averageRate,
      currency: 'EUR',
    }
  }
}

// Singleton instance
let bookingInstance: BookingPartnerAPI | null = null

export async function getBookingClient(): Promise<BookingPartnerAPI> {
  if (!bookingInstance) {
    const config = await getBookingConfig()
    const bookingConfig: BookingConfig = {
      username: config.username,
      password: config.password,
      hotelId: config.hotelId,
      environment: config.environment,
    }

    bookingInstance = new BookingPartnerAPI(bookingConfig)
  }

  return bookingInstance
}

// Helper class for rental property integration
export class BookingRentalHelper {
  private booking: BookingPartnerAPI

  constructor() {
    this.booking = getBookingClient()
  }

  /**
   * Sync property availability with Booking.com
   */
  async syncPropertyAvailability(params: {
    propertyId: string
    roomId: string
    dateFrom: string
    dateTo: string
    basePrice: number
    blockedDates?: string[] // Local maintenance or long-term rental dates
  }): Promise<{
    updatedDates: number
    blockedDates: number
    averagePrice: number
  }> {
    const startDate = new Date(params.dateFrom)
    const endDate = new Date(params.dateTo)
    const availability = []
    let updatedDates = 0
    let blockedDates = 0
    let totalPrice = 0

    // Generate availability for each date
    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      const dateStr = date.toISOString().split('T')[0]
      const isBlocked = params.blockedDates?.includes(dateStr) || false
      
      // Dynamic pricing based on season and day of week
      const dayOfWeek = date.getDay()
      const isWeekend = dayOfWeek === 5 || dayOfWeek === 6 // Friday, Saturday
      const isHighSeason = date.getMonth() >= 5 && date.getMonth() <= 8 // June-September (Spanish coast high season)
      
      let price = params.basePrice
      if (isWeekend) price *= 1.3 // 30% weekend markup
      if (isHighSeason) price *= 1.5 // 50% high season markup
      
      price = Math.round(price * 100) / 100 // Round to cents

      availability.push({
        date: dateStr,
        available: !isBlocked,
        price,
      })

      if (!isBlocked) {
        updatedDates++
        totalPrice += price
      } else {
        blockedDates++
      }
    }

    await this.booking.syncPropertyWithBooking({
      propertyId: params.propertyId,
      roomId: params.roomId,
      basePrice: params.basePrice,
      availability,
    })

    return {
      updatedDates,
      blockedDates,
      averagePrice: updatedDates > 0 ? totalPrice / updatedDates : 0,
    }
  }

  /**
   * Import new reservations and create local records
   */
  async importNewReservations(
    dateFrom: string,
    dateTo: string
  ): Promise<Array<{
    reservationId: string
    guestName: string
    checkIn: string
    checkOut: string
    totalAmount: number
    imported: boolean
    error?: string
  }>> {
    try {
      const reservations = await this.booking.getReservations(dateFrom, dateTo, 'confirmed')
      const results = []

      for (const reservation of reservations) {
        try {
          const localData = this.booking.importReservationToLocal(reservation)
          
          results.push({
            reservationId: reservation.reservationId,
            guestName: reservation.guestName,
            checkIn: reservation.checkIn,
            checkOut: reservation.checkOut,
            totalAmount: reservation.totalPrice,
            imported: true,
          })
        } catch (error) {
          results.push({
            reservationId: reservation.reservationId,
            guestName: reservation.guestName,
            checkIn: reservation.checkIn,
            checkOut: reservation.checkOut,
            totalAmount: reservation.totalPrice,
            imported: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          })
        }
      }

      return results
    } catch (error) {
      console.error('Failed to import reservations:', error)
      throw error
    }
  }

  /**
   * Generate occupancy report for Spanish properties
   */
  async generateOccupancyReport(params: {
    dateFrom: string
    dateTo: string
    includeRevenue: boolean
  }): Promise<{
    period: string
    occupancyRate: number
    totalNights: number
    bookedNights: number
    revenue?: {
      total: number
      average: number
      currency: string
      commission: number
      net: number
    }
    bookingStats: {
      totalReservations: number
      averageStay: number
      leadTime: number
    }
  }> {
    const stats = await this.booking.getOccupancyStats(params.dateFrom, params.dateTo)
    const reservations = await this.booking.getReservations(params.dateFrom, params.dateTo, 'confirmed')

    const totalReservations = reservations.length
    const averageStay = totalReservations > 0 ? stats.bookedNights / totalReservations : 0
    
    // Calculate average lead time (days between booking and check-in)
    const leadTimes = reservations.map(res => {
      const bookedDate = new Date(res.bookedAt)
      const checkInDate = new Date(res.checkIn)
      return Math.ceil((checkInDate.getTime() - bookedDate.getTime()) / (1000 * 60 * 60 * 24))
    })
    const averageLeadTime = leadTimes.length > 0 ? leadTimes.reduce((sum, days) => sum + days, 0) / leadTimes.length : 0

    const report: any = {
      period: `${params.dateFrom} to ${params.dateTo}`,
      occupancyRate: stats.occupancyRate,
      totalNights: stats.totalNights,
      bookedNights: stats.bookedNights,
      bookingStats: {
        totalReservations,
        averageStay,
        leadTime: averageLeadTime,
      },
    }

    if (params.includeRevenue) {
      const totalCommission = reservations.reduce((sum, res) => sum + res.commission, 0)
      report.revenue = {
        total: stats.totalRevenue,
        average: stats.averageRate,
        currency: stats.currency,
        commission: totalCommission,
        net: stats.totalRevenue - totalCommission,
      }
    }

    return report
  }
}