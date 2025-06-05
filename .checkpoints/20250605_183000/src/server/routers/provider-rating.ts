import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '../trpc'
import { TRPCError } from '@trpc/server'

export const providerRatingRouter = createTRPCRouter({
  // Új értékelés létrehozása
  create: protectedProcedure
    .input(z.object({
      providerId: z.string(),
      propertyId: z.string(),
      issueId: z.string().optional(),
      rating: z.number().min(1).max(5),
      quality: z.number().min(1).max(5).optional(),
      timeliness: z.number().min(1).max(5).optional(),
      communication: z.number().min(1).max(5).optional(),
      price: z.number().min(1).max(5).optional(),
      comment: z.string().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Értékelés létrehozása
        const rating = await ctx.db.providerRating.create({
          data: {
            ...input,
            ratedById: ctx.session.user.id
          }
        })

        // Szolgáltató átlagos értékelésének frissítése
        const allRatings = await ctx.db.providerRating.findMany({
          where: { providerId: input.providerId }
        })

        const avgRating = allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length

        await ctx.db.provider.update({
          where: { id: input.providerId },
          data: { rating: avgRating }
        })

        return rating
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create rating'
        })
      }
    }),

  // Értékelések listázása
  list: protectedProcedure
    .input(z.object({
      providerId: z.string().optional(),
      propertyId: z.string().optional(),
      page: z.number().default(1),
      limit: z.number().default(10)
    }))
    .query(async ({ ctx, input }) => {
      try {
        const whereClause: any = {}
        
        if (input.providerId) {
          whereClause.providerId = input.providerId
        }
        
        if (input.propertyId) {
          whereClause.propertyId = input.propertyId
        }

        const ratings = await ctx.db.providerRating.findMany({
          where: whereClause,
          include: {
            provider: {
              select: {
                id: true,
                businessName: true,
                representativeName: true
              }
            },
            property: {
              select: {
                id: true,
                street: true,
                city: true
              }
            },
            issue: {
              select: {
                id: true,
                title: true
              }
            },
            ratedBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip: (input.page - 1) * input.limit,
          take: input.limit
        })

        const total = await ctx.db.providerRating.count({
          where: whereClause
        })

        return {
          items: ratings,
          pagination: {
            total,
            pages: Math.ceil(total / input.limit),
            page: input.page,
            limit: input.limit
          }
        }
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch ratings'
        })
      }
    }),

  // Szolgáltató statisztikák
  getStats: protectedProcedure
    .input(z.object({
      providerId: z.string()
    }))
    .query(async ({ ctx, input }) => {
      try {
        // Összesített statisztikák
        const ratingStats = await ctx.db.providerRating.aggregate({
          where: { providerId: input.providerId },
          _avg: {
            rating: true,
            quality: true,
            timeliness: true,
            communication: true,
            price: true
          },
          _count: {
            id: true
          }
        })

        // Befejezett munkák száma
        const completedJobs = await ctx.db.issue.count({
          where: {
            assignedProviderId: input.providerId,
            status: 'CLOSED'
          }
        })

        // Átlagos válaszidő (SLA tracking alapján)
        const slaStats = await ctx.db.sLATracking.aggregate({
          where: { 
            providerId: input.providerId,
            actualResponseTime: { not: null }
          },
          _avg: {
            actualResponseTime: true
          }
        })

        // Értékelések eloszlása
        const ratingDistribution = await ctx.db.providerRating.groupBy({
          by: ['rating'],
          where: { providerId: input.providerId },
          _count: {
            rating: true
          }
        })

        return {
          averageRating: ratingStats._avg.rating || 0,
          totalRatings: ratingStats._count.id || 0,
          completedJobs,
          averageResponseTime: Math.round(slaStats._avg.actualResponseTime || 0),
          detailedRatings: {
            quality: ratingStats._avg.quality || 0,
            timeliness: ratingStats._avg.timeliness || 0,
            communication: ratingStats._avg.communication || 0,
            price: ratingStats._avg.price || 0
          },
          ratingDistribution: ratingDistribution.reduce((acc, item) => {
            acc[item.rating] = item._count.rating
            return acc
          }, {} as Record<number, number>)
        }
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch provider stats'
        })
      }
    }),

  // Top szolgáltatók
  getTopProviders: protectedProcedure
    .input(z.object({
      limit: z.number().default(10),
      minRatings: z.number().default(3)
    }))
    .query(async ({ ctx, input }) => {
      try {
        // Szolgáltatók értékeléssel és statisztikákkal
        const providers = await ctx.db.provider.findMany({
          where: {
            rating: { not: null },
            user: { isActive: true }
          },
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true
              }
            },
            ratings: {
              select: {
                rating: true
              }
            }
          },
          orderBy: [
            { rating: 'desc' },
            { createdAt: 'desc' }
          ]
        })

        // Szűrés minimum értékelés szerint és top N kiválasztása
        const topProviders = providers
          .filter(provider => provider.ratings.length >= input.minRatings)
          .slice(0, input.limit)
          .map(provider => ({
            id: provider.id,
            businessName: provider.businessName,
            representativeName: provider.representativeName,
            rating: provider.rating,
            totalRatings: provider.ratings.length,
            specialty: provider.specialty,
            hourlyRate: provider.hourlyRate,
            user: provider.user
          }))

        return topProviders
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch top providers'
        })
      }
    }),

  // Szolgáltató értékelési trend
  getTrend: protectedProcedure
    .input(z.object({
      providerId: z.string(),
      months: z.number().default(12)
    }))
    .query(async ({ ctx, input }) => {
      try {
        const startDate = new Date()
        startDate.setMonth(startDate.getMonth() - input.months)

        const monthlyRatings = await ctx.db.providerRating.findMany({
          where: {
            providerId: input.providerId,
            createdAt: { gte: startDate }
          },
          select: {
            rating: true,
            createdAt: true
          },
          orderBy: { createdAt: 'asc' }
        })

        // Havi bontás
        const monthlyData = monthlyRatings.reduce((acc, rating) => {
          const monthKey = rating.createdAt.toISOString().substring(0, 7) // YYYY-MM
          if (!acc[monthKey]) {
            acc[monthKey] = { sum: 0, count: 0 }
          }
          acc[monthKey].sum += rating.rating
          acc[monthKey].count++
          return acc
        }, {} as Record<string, { sum: number; count: number }>)

        const trendData = Object.entries(monthlyData).map(([month, data]) => ({
          month,
          averageRating: data.sum / data.count,
          totalRatings: data.count
        }))

        return trendData
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch rating trend'
        })
      }
    }),

  // Értékelés frissítése (csak saját értékelés)
  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      rating: z.number().min(1).max(5),
      quality: z.number().min(1).max(5).optional(),
      timeliness: z.number().min(1).max(5).optional(),
      communication: z.number().min(1).max(5).optional(),
      price: z.number().min(1).max(5).optional(),
      comment: z.string().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Ellenőrizzük, hogy saját értékelés-e
        const existingRating = await ctx.db.providerRating.findUnique({
          where: { id: input.id }
        })

        if (!existingRating) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Rating not found'
          })
        }

        if (existingRating.ratedById !== ctx.session.user.id) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You can only update your own ratings'
          })
        }

        // Értékelés frissítése
        const updatedRating = await ctx.db.providerRating.update({
          where: { id: input.id },
          data: {
            rating: input.rating,
            quality: input.quality,
            timeliness: input.timeliness,
            communication: input.communication,
            price: input.price,
            comment: input.comment
          }
        })

        // Szolgáltató átlagos értékelésének újraszámítása
        const allRatings = await ctx.db.providerRating.findMany({
          where: { providerId: existingRating.providerId }
        })

        const avgRating = allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length

        await ctx.db.provider.update({
          where: { id: existingRating.providerId },
          data: { rating: avgRating }
        })

        return updatedRating
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update rating'
        })
      }
    }),

  // Értékelés törlése (csak saját értékelés)
  delete: protectedProcedure
    .input(z.object({
      id: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Ellenőrizzük, hogy saját értékelés-e
        const existingRating = await ctx.db.providerRating.findUnique({
          where: { id: input.id }
        })

        if (!existingRating) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Rating not found'
          })
        }

        if (existingRating.ratedById !== ctx.session.user.id) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You can only delete your own ratings'
          })
        }

        // Értékelés törlése
        await ctx.db.providerRating.delete({
          where: { id: input.id }
        })

        // Szolgáltató átlagos értékelésének újraszámítása
        const allRatings = await ctx.db.providerRating.findMany({
          where: { providerId: existingRating.providerId }
        })

        const avgRating = allRatings.length > 0 
          ? allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length
          : null

        await ctx.db.provider.update({
          where: { id: existingRating.providerId },
          data: { rating: avgRating }
        })

        return { success: true }
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete rating'
        })
      }
    })
})