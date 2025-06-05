import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '../trpc'
import { AIPricingService } from '@/lib/ai-pricing'
import { TRPCError } from '@trpc/server'

const pricingRecommendationSchema = z.object({
  propertyId: z.string(),
  date: z.date(),
  basePrice: z.number().positive(),
  location: z.object({
    lat: z.number(),
    lng: z.number()
  }).optional()
})

export const aiPricingRouter = createTRPCRouter({
  /**
   * Get AI pricing recommendation for a property
   */
  getRecommendation: protectedProcedure
    .input(pricingRecommendationSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        // Get property details
        const property = await ctx.db.property.findUnique({
          where: { id: input.propertyId },
          include: {
            bookings: {
              where: {
                checkIn: {
                  gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) // Last year
                }
              },
              select: {
                checkIn: true,
                checkOut: true,
                totalAmount: true,
                status: true
              }
            }
          }
        })

        if (!property) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Property not found'
          })
        }

        // Check permissions
        if (!['ADMIN', 'EDITOR_ADMIN'].includes(ctx.session.user.role)) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Insufficient permissions'
          })
        }

        // Initialize AI pricing service
        const aiPricing = new AIPricingService({
          openAiApiKey: process.env.OPENAI_API_KEY,
          weatherApiKey: process.env.WEATHER_API_KEY,
          eventsApiKey: process.env.EVENTS_API_KEY
        })

        // Get location (use provided or property location)
        const location = input.location || {
          lat: 38.3452, // Default Alicante coordinates
          lng: -0.4810
        }

        // Prepare historical data
        const historicalData = property.bookings.map(booking => ({
          startDate: booking.checkIn,
          endDate: booking.checkOut,
          price: booking.totalAmount,
          status: booking.status
        }))

        // Get AI recommendation
        const recommendation = await aiPricing.getRecommendation({
          propertyId: property.id,
          date: input.date,
          basePrice: input.basePrice,
          location,
          propertyType: property.type,
          amenities: [], // TODO: Add amenities to property model
          maxOccupancy: property.bedrooms * 2, // Estimate
          historicalData
        })

        return recommendation
      } catch (error) {
        console.error('AI Pricing Error:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get pricing recommendation'
        })
      }
    }),

  /**
   * Apply AI pricing recommendation
   */
  applyRecommendation: protectedProcedure
    .input(z.object({
      propertyId: z.string(),
      date: z.date(),
      price: z.number().positive(),
      source: z.enum(['ai', 'manual']).default('ai')
    }))
    .mutation(async ({ ctx, input }) => {
      // Only admins can apply pricing
      if (!['ADMIN', 'EDITOR_ADMIN'].includes(ctx.session.user.role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only administrators can apply pricing'
        })
      }

      // TODO: Integrate with Booking.com and Uplisting APIs to update prices
      // For now, we'll store it in a pricing history table

      // Create pricing history record
      const pricingHistory = await ctx.db.propertyPricing.create({
        data: {
          propertyId: input.propertyId,
          date: input.date,
          price: input.price,
          source: input.source,
          appliedBy: ctx.session.user.id,
          appliedAt: new Date()
        }
      })

      // TODO: Call Booking.com API to update price
      // TODO: Call Uplisting API to update price

      return {
        success: true,
        pricingHistory
      }
    }),

  /**
   * Get pricing history for a property
   */
  getPricingHistory: protectedProcedure
    .input(z.object({
      propertyId: z.string(),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
      limit: z.number().min(1).max(100).default(30)
    }))
    .query(async ({ ctx, input }) => {
      const where: any = {
        propertyId: input.propertyId
      }

      if (input.startDate || input.endDate) {
        where.date = {}
        if (input.startDate) where.date.gte = input.startDate
        if (input.endDate) where.date.lte = input.endDate
      }

      const history = await ctx.db.propertyPricing.findMany({
        where,
        orderBy: { date: 'desc' },
        take: input.limit,
        include: {
          appliedByUser: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true
            }
          }
        }
      })

      return history
    }),

  /**
   * Get competitor analysis
   */
  getCompetitorAnalysis: protectedProcedure
    .input(z.object({
      location: z.object({
        lat: z.number(),
        lng: z.number()
      }),
      date: z.date(),
      radius: z.number().min(0.5).max(10).default(2) // km
    }))
    .query(async ({ ctx, input }) => {
      // Initialize AI pricing service
      const aiPricing = new AIPricingService()

      // This would normally scrape real data
      // For now, we'll return simulated competitor data
      const competitors = await aiPricing['scrapeCompetitorPrices'](
        input.location,
        input.date
      )

      return {
        competitors,
        averagePrice: competitors.reduce((sum, c) => sum + c.price, 0) / competitors.length,
        lowestPrice: Math.min(...competitors.map(c => c.price)),
        highestPrice: Math.max(...competitors.map(c => c.price)),
        availableCount: competitors.filter(c => c.availability).length,
        totalCount: competitors.length
      }
    }),

  /**
   * Get market insights
   */
  getMarketInsights: protectedProcedure
    .input(z.object({
      location: z.object({
        lat: z.number(),
        lng: z.number()
      }),
      dateRange: z.object({
        start: z.date(),
        end: z.date()
      })
    }))
    .query(async ({ ctx, input }) => {
      // This would aggregate data from multiple sources
      // For now, return simulated insights

      const insights = {
        averageOccupancy: 72,
        averagePrice: 125,
        demandTrend: 'increasing' as const,
        seasonalFactors: {
          spring: 0.85,
          summer: 1.5,
          autumn: 0.9,
          winter: 0.7
        },
        topEvents: [
          {
            name: 'Hogueras de San Juan',
            date: new Date('2025-06-24'),
            impact: 'high',
            expectedPriceIncrease: 40
          },
          {
            name: 'Alicante Summer Festival',
            date: new Date('2025-07-15'),
            impact: 'medium',
            expectedPriceIncrease: 25
          }
        ],
        competitorTrends: {
          averagePriceChange: 5.2, // % in last 30 days
          newListings: 12,
          delistedProperties: 3
        }
      }

      return insights
    })
})