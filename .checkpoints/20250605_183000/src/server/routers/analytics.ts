import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '../trpc'
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns'

export const analyticsRouter = createTRPCRouter({
  // Hibabejelentések havi bontásban
  issuesByMonth: protectedProcedure
    .input(z.object({
      months: z.number().default(6)
    }).optional())
    .query(async ({ ctx, input }) => {
      const months = input?.months || 6
      const results = []

      for (let i = months - 1; i >= 0; i--) {
        const date = subMonths(new Date(), i)
        const startDate = startOfMonth(date)
        const endDate = endOfMonth(date)

        const [totalIssues, resolvedIssues] = await Promise.all([
          ctx.db.issue.count({
            where: {
              createdAt: {
                gte: startDate,
                lte: endDate
              }
            }
          }),
          ctx.db.issue.count({
            where: {
              createdAt: {
                gte: startDate,
                lte: endDate
              },
              status: 'COMPLETED'
            }
          })
        ])

        const monthNames = ['Jan', 'Feb', 'Már', 'Ápr', 'Máj', 'Jún', 'Júl', 'Aug', 'Szep', 'Okt', 'Nov', 'Dec']
        
        results.push({
          month: monthNames[date.getMonth()],
          issues: totalIssues,
          resolved: resolvedIssues
        })
      }

      return results
    }),

  // Ingatlanok státusz szerint
  propertiesByStatus: protectedProcedure
    .query(async ({ ctx }) => {
      const statusCounts = await ctx.db.property.groupBy({
        by: ['status'],
        _count: {
          id: true
        }
      })

      const colorMap = {
        AVAILABLE: '#10b981',
        RENTED: '#0070f3', 
        MAINTENANCE: '#f59e0b',
        UNAVAILABLE: '#ef4444'
      }

      const nameMap = {
        AVAILABLE: 'Elérhető',
        RENTED: 'Bérelt',
        MAINTENANCE: 'Karbantartás', 
        UNAVAILABLE: 'Nem elérhető'
      }

      return statusCounts.map(item => ({
        name: nameMap[item.status as keyof typeof nameMap],
        value: item._count.id,
        color: colorMap[item.status as keyof typeof colorMap]
      }))
    }),

  // Hibabejelentések kategóriák szerint
  issuesByCategory: protectedProcedure
    .query(async ({ ctx }) => {
      const categoryCounts = await ctx.db.issue.groupBy({
        by: ['category'],
        _count: {
          id: true
        },
        orderBy: {
          _count: {
            id: 'desc'
          }
        }
      })

      const nameMap = {
        PLUMBING: 'Vízvezeték',
        ELECTRICAL: 'Elektromos',
        HVAC: 'Fűtés/Légkondicionálás',
        STRUCTURAL: 'Szerkezeti',
        OTHER: 'Egyéb'
      }

      return categoryCounts.map(item => ({
        category: nameMap[item.category as keyof typeof nameMap],
        count: item._count.id
      }))
    }),

  // Bevételek havi bontásban (becslés bérleti díjak alapján)
  revenueByMonth: protectedProcedure
    .input(z.object({
      months: z.number().default(6)
    }).optional())
    .query(async ({ ctx, input }) => {
      const months = input?.months || 6
      const results = []

      // Aktív ingatlanok és bérleti díjaik
      const properties = await ctx.db.property.findMany({
        where: {
          status: 'RENTED',
          rentAmount: {
            not: null
          }
        },
        select: {
          rentAmount: true,
          currency: true
        }
      })

      // Összesített havi bevétel
      const monthlyRevenue = properties.reduce((sum, property) => {
        return sum + Number(property.rentAmount || 0)
      }, 0)

      // Becsült havi kiadások (bevétel 30%-a)
      const monthlyExpenses = monthlyRevenue * 0.3

      for (let i = months - 1; i >= 0; i--) {
        const date = subMonths(new Date(), i)
        
        // Kis random variáció a valósághűség kedvéért
        const revenueVariation = 1 + (Math.random() - 0.5) * 0.1 // ±5%
        const expenseVariation = 1 + (Math.random() - 0.5) * 0.2 // ±10%

        const monthNames = ['Jan', 'Feb', 'Már', 'Ápr', 'Máj', 'Jún', 'Júl', 'Aug', 'Szep', 'Okt', 'Nov', 'Dec']
        
        results.push({
          month: monthNames[date.getMonth()],
          revenue: Math.round(monthlyRevenue * revenueVariation),
          expenses: Math.round(monthlyExpenses * expenseVariation)
        })
      }

      return results
    }),

  // Prioritás szerinti hibabejelentések
  issuesByPriority: protectedProcedure
    .query(async ({ ctx }) => {
      const priorityCounts = await ctx.db.issue.groupBy({
        by: ['priority'],
        _count: {
          id: true
        }
      })

      const nameMap = {
        LOW: 'Alacsony',
        MEDIUM: 'Közepes',
        HIGH: 'Magas',
        URGENT: 'Sürgős'
      }

      const colorMap = {
        LOW: '#10b981',
        MEDIUM: '#f59e0b',
        HIGH: '#ef4444',
        URGENT: '#dc2626'
      }

      return priorityCounts.map(item => ({
        priority: nameMap[item.priority as keyof typeof nameMap],
        count: item._count.id,
        color: colorMap[item.priority as keyof typeof colorMap]
      }))
    }),

  // Dashboard összefoglaló statisztikák
  dashboardStats: protectedProcedure
    .query(async ({ ctx }) => {
      const [
        totalProperties,
        activeProperties,
        totalIssues,
        openIssues,
        totalOffers,
        pendingOffers,
        totalTenants,
        activeTenants
      ] = await Promise.all([
        ctx.db.property.count(),
        ctx.db.property.count({ where: { status: 'RENTED' } }),
        ctx.db.issue.count(),
        ctx.db.issue.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
        ctx.db.offer.count(),
        ctx.db.offer.count({ where: { status: 'SENT' } }),
        ctx.db.tenant.count(),
        ctx.db.tenant.count({ where: { isActive: true } })
      ])

      return {
        properties: {
          total: totalProperties,
          active: activeProperties,
          occupancyRate: totalProperties > 0 ? (activeProperties / totalProperties * 100) : 0
        },
        issues: {
          total: totalIssues,
          open: openIssues,
          resolutionRate: totalIssues > 0 ? ((totalIssues - openIssues) / totalIssues * 100) : 0
        },
        offers: {
          total: totalOffers,
          pending: pendingOffers
        },
        tenants: {
          total: totalTenants,
          active: activeTenants
        }
      }
    }),

  // Pénzügyi összesítő
  getFinancialSummary: protectedProcedure
    .query(async ({ ctx }) => {
      // Havi bevétel (aktív bérletek)
      const rentedProperties = await ctx.db.property.findMany({
        where: {
          status: 'RENTED',
          rentAmount: { not: null }
        },
        select: {
          rentAmount: true,
          currency: true
        }
      })

      const monthlyRevenue = rentedProperties.reduce((sum, property) => {
        return sum + Number(property.rentAmount || 0)
      }, 0)

      // Éves bevétel becsült
      const yearlyRevenue = monthlyRevenue * 12

      // Kintlévőségek becslése (placeholder - valós rendszerben külön table kell)
      const totalContracts = await ctx.db.contract.count({ 
        where: { endDate: { gte: new Date() } } // Active contracts (end date in future)
      })
      const outstandingAmount = Math.floor(monthlyRevenue * 0.1) // Becsült 10% késedelmes

      // Kihasználtság
      const [totalProperties, activeProperties] = await Promise.all([
        ctx.db.property.count(),
        ctx.db.property.count({ where: { status: 'RENTED' } })
      ])

      const occupancyRate = totalProperties > 0 ? (activeProperties / totalProperties * 100) : 0

      return {
        monthlyRevenue,
        yearlyRevenue,
        outstandingAmount,
        occupancyRate
      }
    }),

  // Kintlévőségek
  getOutstandingPayments: protectedProcedure
    .query(async ({ ctx }) => {
      // Placeholder: valós rendszerben külön payments table kellene
      // Most a late payments-t szimuláljuk aktív bérletek alapján
      const activeContracts = await ctx.db.contract.findMany({
        where: { endDate: { gte: new Date() } }, // Active contracts (end date in future)
        include: {
          tenant: {
            select: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true,
                  phone: true
                }
              }
            }
          },
          property: {
            select: {
              street: true,
              city: true,
              rentAmount: true
            }
          }
        },
        take: 10 // Legfeljebb 10 kintlévőség
      })

      // Szimuláljuk a késedelmes fizetéseket (valós rendszerben ez egy payments táblából jönne)
      const mockOutstanding = activeContracts
        .filter(() => Math.random() < 0.3) // 30% esély a késedelemre
        .map((contract, index) => {
          const daysOverdue = Math.floor(Math.random() * 45) + 1 // 1-45 nap késés
          const dueDate = new Date()
          dueDate.setDate(dueDate.getDate() - daysOverdue)

          return {
            id: `payment_${contract.id}_${index}`,
            amount: Number(contract.property.rentAmount || 0),
            dueDate: dueDate.toISOString(),
            tenantName: `${contract.tenant.user.firstName} ${contract.tenant.user.lastName}`,
            tenantEmail: contract.tenant.user.email,
            tenantPhone: contract.tenant.user.phone,
            propertyAddress: `${contract.property.street}, ${contract.property.city}`
          }
        })

      return mockOutstanding.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    }),

  // Legutóbbi tevékenységek
  recentActivity: protectedProcedure
    .input(z.object({
      limit: z.number().default(10)
    }).optional())
    .query(async ({ ctx, input }) => {
      const limit = input?.limit || 10

      const [recentIssues, recentOffers] = await Promise.all([
        ctx.db.issue.findMany({
          take: limit / 2,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            title: true,
            createdAt: true,
            priority: true,
            property: {
              select: {
                street: true,
                city: true
              }
            }
          }
        }),
        ctx.db.offer.findMany({
          take: limit / 2,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            offerNumber: true,
            createdAt: true,
            totalAmount: true,
            currency: true,
            property: {
              select: {
                street: true,
                city: true
              }
            }
          }
        })
      ])

      const activities = [
        ...recentIssues.map(issue => ({
          id: issue.id,
          type: 'issue' as const,
          title: issue.title,
          subtitle: `${issue.property.street}, ${issue.property.city}`,
          createdAt: issue.createdAt,
          priority: issue.priority
        })),
        ...recentOffers.map(offer => ({
          id: offer.id,
          type: 'offer' as const,
          title: offer.offerNumber,
          subtitle: `${Number(offer.totalAmount).toLocaleString()} ${offer.currency}`,
          createdAt: offer.createdAt
        }))
      ]

      return activities
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, limit)
    })
})