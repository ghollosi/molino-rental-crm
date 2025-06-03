import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '@/src/server/trpc'
import { TRPCError } from '@trpc/server'
import { PrismaClient } from '@prisma/client'
import { 
  findBestProviders, 
  autoAssignProvider, 
  updateProviderPerformance,
  handleEscalation 
} from '@/src/lib/provider-matching'
import {
  calculateSLAMetrics,
  generateSLAAlerts,
  getProviderLeaderboard,
  predictSLAPerformance
} from '@/src/lib/sla-analytics'

const prisma = new PrismaClient()

export const providerMatchingRouter = createTRPCRouter({
  // Legjobb szolgáltatók keresése adott kritériumok alapján
  findBestProviders: protectedProcedure
    .input(z.object({
      propertyId: z.string(),
      category: z.enum(['PLUMBING', 'ELECTRICAL', 'HVAC', 'STRUCTURAL', 'OTHER']),
      priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
    }))
    .query(async ({ input }) => {
      try {
        const results = await findBestProviders(input)
        
        // Szolgáltató részletek hozzáadása
        const providersWithDetails = await Promise.all(
          results.map(async (result) => {
            const provider = await prisma.provider.findUnique({
              where: { id: result.providerId },
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                    email: true,
                    phone: true
                  }
                }
              }
            })
            
            return {
              ...result,
              provider
            }
          })
        )
        
        return providersWithDetails
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to find providers'
        })
      }
    }),

  // Automatikus szolgáltató hozzárendelés
  autoAssignProvider: protectedProcedure
    .input(z.object({
      issueId: z.string()
    }))
    .mutation(async ({ input }) => {
      try {
        const assignedProviderId = await autoAssignProvider(input.issueId)
        
        if (!assignedProviderId) {
          return {
            success: false,
            message: 'Nem található megfelelő szolgáltató automatikus hozzárendeléshez'
          }
        }
        
        return {
          success: true,
          providerId: assignedProviderId,
          message: 'Szolgáltató sikeresen hozzárendelve'
        }
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to auto-assign provider'
        })
      }
    }),

  // Szolgáltató-ingatlan kapcsolat létrehozása/frissítése
  createPropertyAssignment: protectedProcedure
    .input(z.object({
      propertyId: z.string(),
      providerId: z.string(),
      categories: z.array(z.enum(['PLUMBING', 'ELECTRICAL', 'HVAC', 'STRUCTURAL', 'OTHER'])),
      isPrimary: z.boolean().default(false)
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Ellenőrizzük, hogy már létezik-e a kapcsolat
        const existing = await ctx.db.propertyProvider.findFirst({
          where: {
            propertyId: input.propertyId,
            providerId: input.providerId
          }
        })

        if (existing) {
          // Frissítjük a meglévő kapcsolatot
          const updated = await ctx.db.propertyProvider.update({
            where: { id: existing.id },
            data: {
              categories: input.categories,
              isPrimary: input.isPrimary,
              isActive: true
            }
          })
          return updated
        } else {
          // Új kapcsolat létrehozása
          const created = await ctx.db.propertyProvider.create({
            data: {
              propertyId: input.propertyId,
              providerId: input.providerId,
              categories: input.categories,
              isPrimary: input.isPrimary
            }
          })
          return created
        }
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create provider assignment'
        })
      }
    }),

  // Szolgáltató értékelése
  rateProvider: protectedProcedure
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

        // Ingatlan-specifikus teljesítmény frissítése
        await updateProviderPerformance(input.providerId, input.propertyId)

        return rating
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to rate provider'
        })
      }
    }),

  // Ingatlan szolgáltatóinak listázása
  getPropertyProviders: protectedProcedure
    .input(z.object({
      propertyId: z.string()
    }))
    .query(async ({ ctx, input }) => {
      try {
        const assignments = await ctx.db.propertyProvider.findMany({
          where: {
            propertyId: input.propertyId,
            isActive: true
          },
          include: {
            provider: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                    email: true,
                    phone: true
                  }
                }
              }
            }
          },
          orderBy: [
            { isPrimary: 'desc' },
            { rating: 'desc' }
          ]
        })

        return assignments
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get property providers'
        })
      }
    }),

  // SLA teljesítmény statisztikák
  getSLAStats: protectedProcedure
    .input(z.object({
      providerId: z.string().optional(),
      propertyId: z.string().optional(),
      dateFrom: z.date().optional(),
      dateTo: z.date().optional()
    }))
    .query(async ({ ctx, input }) => {
      try {
        const whereClause: any = {}
        
        if (input.providerId) {
          whereClause.providerId = input.providerId
        }
        
        if (input.propertyId) {
          whereClause.issue = {
            propertyId: input.propertyId
          }
        }

        if (input.dateFrom || input.dateTo) {
          whereClause.createdAt = {}
          if (input.dateFrom) {
            whereClause.createdAt.gte = input.dateFrom
          }
          if (input.dateTo) {
            whereClause.createdAt.lte = input.dateTo
          }
        }

        const slaRecords = await ctx.db.sLATracking.findMany({
          where: whereClause,
          include: {
            issue: {
              select: {
                id: true,
                title: true,
                priority: true,
                status: true,
                createdAt: true
              }
            },
            provider: {
              select: {
                id: true,
                businessName: true
              }
            }
          }
        })

        // Statisztikák számítása
        const total = slaRecords.length
        const responseBreaches = slaRecords.filter(r => r.responseBreached).length
        const resolutionBreaches = slaRecords.filter(r => r.resolutionBreached).length
        
        const avgResponseTime = slaRecords
          .filter(r => r.actualResponseTime)
          .reduce((sum, r) => sum + (r.actualResponseTime || 0), 0) / 
          slaRecords.filter(r => r.actualResponseTime).length || 0

        const avgResolutionTime = slaRecords
          .filter(r => r.actualResolutionTime)
          .reduce((sum, r) => sum + (r.actualResolutionTime || 0), 0) / 
          slaRecords.filter(r => r.actualResolutionTime).length || 0

        return {
          total,
          responseBreaches,
          resolutionBreaches,
          responseBreachRate: total > 0 ? (responseBreaches / total) * 100 : 0,
          resolutionBreachRate: total > 0 ? (resolutionBreaches / total) * 100 : 0,
          avgResponseTime: Math.round(avgResponseTime),
          avgResolutionTime: Math.round(avgResolutionTime),
          records: slaRecords
        }
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get SLA stats'
        })
      }
    }),

  // Eszkaláció manuális indítása
  escalateIssue: protectedProcedure
    .input(z.object({
      issueId: z.string()
    }))
    .mutation(async ({ input }) => {
      try {
        await handleEscalation(input.issueId)
        return {
          success: true,
          message: 'Eszkaláció sikeresen végrehajtva'
        }
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to escalate issue'
        })
      }
    }),

  // Részletes SLA metrikák
  getDetailedSLAMetrics: protectedProcedure
    .input(z.object({
      dateFrom: z.date(),
      dateTo: z.date(),
      propertyId: z.string().optional(),
      providerId: z.string().optional()
    }))
    .query(async ({ input }) => {
      try {
        const metrics = await calculateSLAMetrics(
          input.dateFrom,
          input.dateTo,
          input.propertyId,
          input.providerId
        )
        return metrics
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to calculate SLA metrics'
        })
      }
    }),

  // SLA riasztások
  getSLAAlerts: protectedProcedure
    .input(z.object({
      propertyId: z.string().optional()
    }))
    .query(async ({ input }) => {
      try {
        const alerts = await generateSLAAlerts(input.propertyId)
        return alerts
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to generate SLA alerts'
        })
      }
    }),

  // Szolgáltató teljesítmény rangsor
  getProviderLeaderboard: protectedProcedure
    .input(z.object({
      dateFrom: z.date(),
      dateTo: z.date()
    }))
    .query(async ({ input }) => {
      try {
        const leaderboard = await getProviderLeaderboard(
          input.dateFrom,
          input.dateTo
        )
        return leaderboard
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get provider leaderboard'
        })
      }
    }),

  // SLA előrejelzés
  getSLAForecast: protectedProcedure
    .input(z.object({
      propertyId: z.string(),
      daysAhead: z.number().default(30)
    }))
    .query(async ({ input }) => {
      try {
        const forecast = await predictSLAPerformance(
          input.propertyId,
          input.daysAhead
        )
        return forecast
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to generate SLA forecast'
        })
      }
    })
})