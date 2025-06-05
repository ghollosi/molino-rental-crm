/**
 * Booking.com Partner tRPC Router
 * Handles short-term rental integration and management
 */

import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '@/server/trpc'
import { getBookingClient, BookingRentalHelper } from '@/lib/booking'
import { TRPCError } from '@trpc/server'

const syncAvailabilitySchema = z.object({
  propertyId: z.string(),
  roomId: z.string(),
  dateFrom: z.string(),
  dateTo: z.string(),
  basePrice: z.number().positive(),
  blockedDates: z.array(z.string()).optional(),
})

const getReservationsSchema = z.object({
  dateFrom: z.string(),
  dateTo: z.string(),
  status: z.enum(['confirmed', 'cancelled', 'modified', 'no_show']).optional(),
})

const occupancyReportSchema = z.object({
  dateFrom: z.string(),
  dateTo: z.string(),
  includeRevenue: z.boolean().default(true),
})

export const bookingRouter = createTRPCRouter({
  /**
   * Test Booking.com API connection
   */
  testConnection: protectedProcedure
    .query(async ({ ctx }) => {
      if (ctx.session.user.role !== 'ADMIN') {
        throw new TRPCError({ 
          code: 'FORBIDDEN',
          message: 'Only admins can test Booking.com connection'
        })
      }

      try {
        const booking = getBookingClient()
        const property = await booking.getProperty()
        
        return {
          success: true,
          message: 'Booking.com Partner API connection successful',
          property: {
            id: property.hotelId,
            name: property.propertyName,
            city: property.address.city,
            country: property.address.country,
            roomCount: property.rooms.length,
          },
          timestamp: new Date().toISOString(),
        }
      } catch (error) {
        console.error('Booking.com connection test failed:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to connect to Booking.com Partner API',
        })
      }
    }),

  /**
   * Get property information from Booking.com
   */
  getProperty: protectedProcedure
    .query(async ({ ctx }) => {
      if (ctx.session.user.role !== 'ADMIN') {
        throw new TRPCError({ 
          code: 'FORBIDDEN',
          message: 'Only admins can access property information'
        })
      }

      try {
        const booking = getBookingClient()
        const property = await booking.getProperty()
        
        return {
          hotelId: property.hotelId,
          name: property.propertyName,
          address: property.address,
          contactInfo: property.contactInfo,
          checkInTime: property.checkInTime,
          checkOutTime: property.checkOutTime,
          currency: property.currency,
          timezone: property.timezone,
          rooms: property.rooms.map(room => ({
            roomId: room.roomId,
            roomType: room.roomType,
            roomName: room.roomName,
            maxOccupancy: room.maxOccupancy,
            bedConfiguration: room.bedConfiguration,
            amenities: room.amenities,
            basePrice: room.basePrice,
            currency: room.currency,
            description: room.description,
          })),
        }
      } catch (error) {
        console.error('Failed to get property information:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get property information from Booking.com',
        })
      }
    }),

  /**
   * Get reservations for date range
   */
  getReservations: protectedProcedure
    .input(getReservationsSchema)
    .query(async ({ ctx, input }) => {
      if (ctx.session.user.role !== 'ADMIN') {
        throw new TRPCError({ 
          code: 'FORBIDDEN',
          message: 'Only admins can access reservation data'
        })
      }

      try {
        const booking = getBookingClient()
        const reservations = await booking.getReservations(
          input.dateFrom,
          input.dateTo,
          input.status
        )
        
        return reservations.map(reservation => ({
          reservationId: reservation.reservationId,
          guestName: reservation.guestName,
          guestEmail: reservation.guestEmail,
          guestPhone: reservation.guestPhone,
          guestCountry: reservation.guestCountry,
          checkIn: reservation.checkIn,
          checkOut: reservation.checkOut,
          nights: reservation.nights,
          adults: reservation.adults,
          children: reservation.children,
          totalPrice: reservation.totalPrice,
          currency: reservation.currency,
          commission: reservation.commission,
          netAmount: reservation.totalPrice - reservation.commission,
          status: reservation.status,
          bookedAt: reservation.bookedAt,
          specialRequests: reservation.specialRequests,
          arrivalTime: reservation.arrivalTime,
        }))
      } catch (error) {
        console.error('Failed to get reservations:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get reservations from Booking.com',
        })
      }
    }),

  /**
   * Get specific reservation details
   */
  getReservation: protectedProcedure
    .input(z.object({ reservationId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (ctx.session.user.role !== 'ADMIN') {
        throw new TRPCError({ 
          code: 'FORBIDDEN',
          message: 'Only admins can access reservation details'
        })
      }

      try {
        const booking = getBookingClient()
        const reservation = await booking.getReservation(input.reservationId)
        
        return {
          reservationId: reservation.reservationId,
          hotelId: reservation.hotelId,
          roomId: reservation.roomId,
          guestName: reservation.guestName,
          guestEmail: reservation.guestEmail,
          guestPhone: reservation.guestPhone,
          guestCountry: reservation.guestCountry,
          checkIn: reservation.checkIn,
          checkOut: reservation.checkOut,
          nights: reservation.nights,
          adults: reservation.adults,
          children: reservation.children,
          totalPrice: reservation.totalPrice,
          currency: reservation.currency,
          commission: reservation.commission,
          netAmount: reservation.totalPrice - reservation.commission,
          status: reservation.status,
          bookedAt: reservation.bookedAt,
          cancellationPolicy: reservation.cancellationPolicy,
          specialRequests: reservation.specialRequests,
          guestComments: reservation.guestComments,
          arrivalTime: reservation.arrivalTime,
        }
      } catch (error) {
        console.error('Failed to get reservation details:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get reservation details from Booking.com',
        })
      }
    }),

  /**
   * Sync property availability with Booking.com
   */
  syncAvailability: protectedProcedure
    .input(syncAvailabilitySchema)
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.role !== 'ADMIN') {
        throw new TRPCError({ 
          code: 'FORBIDDEN',
          message: 'Only admins can sync availability'
        })
      }

      try {
        const helper = new BookingRentalHelper()
        const result = await helper.syncPropertyAvailability({
          propertyId: input.propertyId,
          roomId: input.roomId,
          dateFrom: input.dateFrom,
          dateTo: input.dateTo,
          basePrice: input.basePrice,
          blockedDates: input.blockedDates,
        })
        
        return {
          success: true,
          message: 'Availability synced successfully',
          updatedDates: result.updatedDates,
          blockedDates: result.blockedDates,
          averagePrice: result.averagePrice,
          syncedAt: new Date().toISOString(),
        }
      } catch (error) {
        console.error('Failed to sync availability:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to sync availability with Booking.com',
        })
      }
    }),

  /**
   * Import new reservations
   */
  importReservations: protectedProcedure
    .input(z.object({
      dateFrom: z.string(),
      dateTo: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.role !== 'ADMIN') {
        throw new TRPCError({ 
          code: 'FORBIDDEN',
          message: 'Only admins can import reservations'
        })
      }

      try {
        const helper = new BookingRentalHelper()
        const results = await helper.importNewReservations(
          input.dateFrom,
          input.dateTo
        )

        // Store successful imports in database as bookings
        const successful = results.filter(r => r.imported)
        
        for (const reservation of successful) {
          // Create booking record in database
          await ctx.db.booking.create({
            data: {
              externalId: reservation.reservationId,
              platform: 'booking_com',
              guestName: reservation.guestName,
              checkIn: new Date(reservation.checkIn),
              checkOut: new Date(reservation.checkOut),
              totalAmount: reservation.totalAmount,
              currency: 'EUR',
              status: 'confirmed',
              // propertyId: input.propertyId, // Would need to be mapped
            }
          }).catch(() => {
            // Ignore duplicates
          })
        }
        
        return {
          totalReservations: results.length,
          successfulImports: successful.length,
          failedImports: results.filter(r => !r.imported).length,
          results: results.map(r => ({
            reservationId: r.reservationId,
            guestName: r.guestName,
            checkIn: r.checkIn,
            checkOut: r.checkOut,
            totalAmount: r.totalAmount,
            imported: r.imported,
            error: r.error,
          })),
          importedAt: new Date().toISOString(),
        }
      } catch (error) {
        console.error('Failed to import reservations:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to import reservations from Booking.com',
        })
      }
    }),

  /**
   * Generate occupancy report
   */
  getOccupancyReport: protectedProcedure
    .input(occupancyReportSchema)
    .query(async ({ ctx, input }) => {
      if (ctx.session.user.role !== 'ADMIN') {
        throw new TRPCError({ 
          code: 'FORBIDDEN',
          message: 'Only admins can access occupancy reports'
        })
      }

      try {
        const helper = new BookingRentalHelper()
        const report = await helper.generateOccupancyReport({
          dateFrom: input.dateFrom,
          dateTo: input.dateTo,
          includeRevenue: input.includeRevenue,
        })
        
        return {
          period: report.period,
          occupancy: {
            rate: report.occupancyRate,
            totalNights: report.totalNights,
            bookedNights: report.bookedNights,
          },
          bookingStats: {
            totalReservations: report.bookingStats.totalReservations,
            averageStay: report.bookingStats.averageStay,
            averageLeadTime: report.bookingStats.leadTime,
          },
          revenue: report.revenue ? {
            total: report.revenue.total,
            average: report.revenue.average,
            currency: report.revenue.currency,
            commission: report.revenue.commission,
            net: report.revenue.net,
            netMargin: ((report.revenue.net / report.revenue.total) * 100),
          } : undefined,
          generatedAt: new Date().toISOString(),
        }
      } catch (error) {
        console.error('Failed to generate occupancy report:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to generate occupancy report',
        })
      }
    }),

  /**
   * Get room availability for specific room and date range
   */
  getRoomAvailability: protectedProcedure
    .input(z.object({
      roomId: z.string(),
      dateFrom: z.string(),
      dateTo: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      if (ctx.session.user.role !== 'ADMIN') {
        throw new TRPCError({ 
          code: 'FORBIDDEN',
          message: 'Only admins can access room availability'
        })
      }

      try {
        const booking = getBookingClient()
        const availability = await booking.getAvailability(
          input.roomId,
          input.dateFrom,
          input.dateTo
        )
        
        return availability.map(avail => ({
          roomId: avail.roomId,
          date: avail.date,
          available: avail.available,
          price: avail.price,
          currency: avail.currency,
          minimumStay: avail.minimumStay,
          maximumStay: avail.maximumStay,
          closedToArrival: avail.closedToArrival,
          closedToDeparture: avail.closedToDeparture,
          inventory: avail.inventory,
        }))
      } catch (error) {
        console.error('Failed to get room availability:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get room availability from Booking.com',
        })
      }
    }),

  /**
   * Update room rates for specific dates
   */
  updateRoomRates: protectedProcedure
    .input(z.object({
      roomId: z.string(),
      rates: z.array(z.object({
        date: z.string(),
        rate: z.number().positive(),
      })),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.role !== 'ADMIN') {
        throw new TRPCError({ 
          code: 'FORBIDDEN',
          message: 'Only admins can update room rates'
        })
      }

      try {
        const booking = getBookingClient()
        const rateUpdates = input.rates.map(rate => ({
          roomId: input.roomId,
          date: rate.date,
          rate: rate.rate,
          currency: 'EUR' as const,
          rateType: 'per_night' as const,
        }))

        await booking.updateRates(rateUpdates)
        
        return {
          success: true,
          message: 'Room rates updated successfully',
          updatedRates: input.rates.length,
          roomId: input.roomId,
          updatedAt: new Date().toISOString(),
        }
      } catch (error) {
        console.error('Failed to update room rates:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update room rates on Booking.com',
        })
      }
    }),

  /**
   * Get occupancy statistics for dashboard
   */
  getOccupancyStats: protectedProcedure
    .input(z.object({
      dateFrom: z.string(),
      dateTo: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      try {
        const booking = getBookingClient()
        const stats = await booking.getOccupancyStats(input.dateFrom, input.dateTo)
        
        return {
          occupancyRate: Math.round(stats.occupancyRate * 100) / 100,
          totalNights: stats.totalNights,
          bookedNights: stats.bookedNights,
          availableNights: stats.totalNights - stats.bookedNights,
          totalRevenue: stats.totalRevenue,
          averageRate: Math.round(stats.averageRate * 100) / 100,
          currency: stats.currency,
        }
      } catch (error) {
        console.error('Failed to get occupancy stats:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get occupancy statistics',
        })
      }
    }),
})