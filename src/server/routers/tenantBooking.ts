import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { createTRPCRouter, protectedProcedure } from '../trpc'

export const tenantBookingRouter = createTRPCRouter({
  listByTenant: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      // Check if user has access to this tenant
      const tenant = await ctx.db.tenant.findUnique({
        where: { id: input },
      })

      if (!tenant) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Tenant not found',
        })
      }

      // Check permissions
      if (ctx.session.user.role === 'TENANT' && tenant.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Access denied',
        })
      }

      const bookings = await ctx.db.tenantBooking.findMany({
        where: { tenantId: input },
        include: {
          property: true,
        },
        orderBy: { checkInDate: 'desc' },
      })

      return bookings
    }),

  create: protectedProcedure
    .input(z.object({
      tenantId: z.string(),
      propertyId: z.string(),
      checkInDate: z.date(),
      checkInTime: z.string(),
      checkOutDate: z.date(),
      checkOutTime: z.string(),
      babyBed: z.boolean(),
      childSeat: z.boolean(),
      foodPreparation: z.boolean(),
      specialRequests: z.string().optional(),
      status: z.enum(['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED']).default('PENDING'),
    }))
    .mutation(async ({ ctx, input }) => {
      // Check if user has access to this tenant
      const tenant = await ctx.db.tenant.findUnique({
        where: { id: input.tenantId },
      })

      if (!tenant) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Tenant not found',
        })
      }

      // Check permissions - tenants can create bookings for themselves
      if (ctx.session.user.role === 'TENANT' && tenant.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only create bookings for yourself',
        })
      } else if (!['ADMIN', 'EDITOR_ADMIN', 'OFFICE_ADMIN', 'TENANT'].includes(ctx.session.user.role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Insufficient permissions',
        })
      }

      // Check if property is available for the requested dates
      const conflictingBookings = await ctx.db.tenantBooking.findMany({
        where: {
          propertyId: input.propertyId,
          status: { in: ['CONFIRMED'] },
          OR: [
            {
              checkInDate: { lte: input.checkOutDate },
              checkOutDate: { gte: input.checkInDate },
            },
          ],
        },
      })

      if (conflictingBookings.length > 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Ez az ingatlan már foglalt a megadott időszakban',
        })
      }

      const booking = await ctx.db.tenantBooking.create({
        data: input,
      })

      return booking
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      propertyId: z.string().optional(),
      checkInDate: z.date().optional(),
      checkInTime: z.string().optional(),
      checkOutDate: z.date().optional(),
      checkOutTime: z.string().optional(),
      babyBed: z.boolean().optional(),
      childSeat: z.boolean().optional(),
      foodPreparation: z.boolean().optional(),
      specialRequests: z.string().optional(),
      status: z.enum(['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED']).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input

      // Get booking to check permissions
      const booking = await ctx.db.tenantBooking.findUnique({
        where: { id },
        include: { tenant: true },
      })

      if (!booking) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Booking not found',
        })
      }

      // Check permissions
      if (ctx.session.user.role === 'TENANT' && booking.tenant.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only update your own bookings',
        })
      } else if (!['ADMIN', 'EDITOR_ADMIN', 'OFFICE_ADMIN', 'TENANT'].includes(ctx.session.user.role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Insufficient permissions',
        })
      }

      // If dates or property are changing, check for conflicts
      if (data.propertyId || data.checkInDate || data.checkOutDate) {
        const propertyId = data.propertyId || booking.propertyId
        const checkInDate = data.checkInDate || booking.checkInDate
        const checkOutDate = data.checkOutDate || booking.checkOutDate

        const conflictingBookings = await ctx.db.tenantBooking.findMany({
          where: {
            id: { not: id },
            propertyId,
            status: { in: ['CONFIRMED'] },
            OR: [
              {
                checkInDate: { lte: checkOutDate },
                checkOutDate: { gte: checkInDate },
              },
            ],
          },
        })

        if (conflictingBookings.length > 0) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Ez az ingatlan már foglalt a megadott időszakban',
          })
        }
      }

      const updated = await ctx.db.tenantBooking.update({
        where: { id },
        data,
      })

      return updated
    }),

  delete: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      // Get booking to check permissions
      const booking = await ctx.db.tenantBooking.findUnique({
        where: { id: input },
        include: { tenant: true },
      })

      if (!booking) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Booking not found',
        })
      }

      // Check permissions
      if (ctx.session.user.role === 'TENANT' && booking.tenant.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only delete your own bookings',
        })
      } else if (!['ADMIN', 'EDITOR_ADMIN', 'OFFICE_ADMIN', 'TENANT'].includes(ctx.session.user.role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Insufficient permissions',
        })
      }

      await ctx.db.tenantBooking.delete({
        where: { id: input },
      })

      return { success: true }
    }),
})