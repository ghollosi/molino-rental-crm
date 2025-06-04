import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '../trpc'
import { TRPCError } from '@trpc/server'
import { 
  generateRevenueForecasts, 
  calculatePropertyROI, 
  analyzePortfolioPerformance 
} from '../../lib/financial-forecasting'

export const financialForecastingRouter = createTRPCRouter({
  // Bevétel előrejelzés
  generateRevenueForecast: protectedProcedure
    .input(z.object({
      propertyId: z.string().optional(),
      months: z.number().min(1).max(60).default(12),
      includeSeasonality: z.boolean().default(true),
      includeGrowthTrend: z.boolean().default(true)
    }))
    .query(async ({ input }) => {
      try {
        const forecast = await generateRevenueForecasts(input)
        return forecast
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to generate revenue forecast'
        })
      }
    }),

  // Ingatlan ROI számítás
  calculateROI: protectedProcedure
    .input(z.object({
      propertyId: z.string(),
      timeframeMonths: z.number().min(1).max(60).default(12)
    }))
    .query(async ({ input }) => {
      try {
        const roi = await calculatePropertyROI(input.propertyId, input.timeframeMonths)
        return roi
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to calculate ROI'
        })
      }
    }),

  // Portfólió teljesítmény elemzés
  analyzePortfolio: protectedProcedure
    .query(async () => {
      try {
        const analysis = await analyzePortfolioPerformance()
        return analysis
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to analyze portfolio performance'
        })
      }
    }),

  // Pénzügyi összesítő dashboard
  getFinancialSummary: protectedProcedure
    .input(z.object({
      propertyId: z.string().optional(),
      dateFrom: z.date().optional(),
      dateTo: z.date().optional()
    }))
    .query(async ({ ctx, input }) => {
      try {
        const endDate = input.dateTo || new Date()
        const startDate = input.dateFrom || new Date(endDate.getTime() - 365 * 24 * 60 * 60 * 1000) // 1 év

        const whereClause: any = {
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        }

        if (input.propertyId) {
          whereClause.propertyId = input.propertyId
        }

        // Bevételek (aktív szerződések)
        const contracts = await ctx.db.contract.findMany({
          where: {
            ...whereClause,
            status: 'ACTIVE'
          },
          select: {
            monthlyRent: true,
            startDate: true,
            endDate: true,
            property: {
              select: {
                id: true,
                street: true,
                city: true
              }
            }
          }
        })

        // Kiadások (hibabejelentések költségei)
        const issues = await ctx.db.issue.findMany({
          where: {
            ...whereClause,
            status: 'CLOSED'
          },
          include: {
            offers: {
              where: {
                status: 'ACCEPTED'
              },
              select: {
                totalPrice: true
              }
            }
          }
        })

        // Havi bevételek számítása
        const monthlyRevenue = contracts.reduce((sum, contract) => {
          return sum + parseFloat(contract.monthlyRent.toString())
        }, 0)

        // Összes kiadás
        const totalExpenses = issues.reduce((sum, issue) => {
          const issueCost = issue.offers.reduce((offerSum, offer) => {
            return offerSum + parseFloat(offer.totalPrice.toString())
          }, 0)
          return sum + issueCost
        }, 0)

        const netIncome = monthlyRevenue - totalExpenses

        // Kihasználtság számítás
        const totalProperties = await ctx.db.property.count({
          where: input.propertyId ? { id: input.propertyId } : {}
        })

        const occupiedProperties = contracts.length
        const occupancyRate = totalProperties > 0 ? (occupiedProperties / totalProperties) * 100 : 0

        // Költségkategóriák
        const expensesByCategory = await ctx.db.issue.groupBy({
          by: ['category'],
          where: {
            ...whereClause,
            status: 'CLOSED'
          },
          _sum: {
            estimatedCost: true
          }
        })

        return {
          period: {
            startDate,
            endDate
          },
          revenue: {
            monthly: monthlyRevenue,
            total: monthlyRevenue * 12, // Éves becslés
            contracts: contracts.length
          },
          expenses: {
            total: totalExpenses,
            byCategory: expensesByCategory.map(cat => ({
              category: cat.category,
              amount: cat._sum.estimatedCost || 0
            })),
            issues: issues.length
          },
          netIncome,
          occupancyRate,
          properties: {
            total: totalProperties,
            occupied: occupiedProperties,
            vacant: totalProperties - occupiedProperties
          }
        }
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get financial summary'
        })
      }
    }),

  // Havi pénzügyi trend
  getMonthlyTrend: protectedProcedure
    .input(z.object({
      propertyId: z.string().optional(),
      months: z.number().min(3).max(24).default(12)
    }))
    .query(async ({ ctx, input }) => {
      try {
        const endDate = new Date()
        const startDate = new Date(endDate)
        startDate.setMonth(startDate.getMonth() - input.months)

        const whereClause: any = {
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        }

        if (input.propertyId) {
          whereClause.propertyId = input.propertyId
        }

        // Havi szerződések (bevételek)
        const monthlyContracts = await ctx.db.contract.findMany({
          where: whereClause,
          select: {
            monthlyRent: true,
            createdAt: true
          }
        })

        // Havi kiadások
        const monthlyExpenses = await ctx.db.issue.findMany({
          where: {
            ...whereClause,
            status: 'CLOSED'
          },
          include: {
            offers: {
              where: { status: 'ACCEPTED' },
              select: { totalPrice: true }
            }
          }
        })

        // Havi adatok szervezése
        const monthlyData: Record<string, { revenue: number; expenses: number }> = {}

        monthlyContracts.forEach(contract => {
          const monthKey = contract.createdAt.toISOString().substring(0, 7) // YYYY-MM
          if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = { revenue: 0, expenses: 0 }
          }
          monthlyData[monthKey].revenue += parseFloat(contract.monthlyRent.toString())
        })

        monthlyExpenses.forEach(issue => {
          const monthKey = issue.createdAt.toISOString().substring(0, 7)
          if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = { revenue: 0, expenses: 0 }
          }
          const issueCost = issue.offers.reduce((sum, offer) => 
            sum + parseFloat(offer.totalPrice.toString()), 0)
          monthlyData[monthKey].expenses += issueCost
        })

        // Rendezett havi trend
        const trendData = Object.entries(monthlyData)
          .map(([month, data]) => ({
            month,
            revenue: data.revenue,
            expenses: data.expenses,
            netIncome: data.revenue - data.expenses
          }))
          .sort((a, b) => a.month.localeCompare(b.month))

        return trendData
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get monthly trend'
        })
      }
    })
})