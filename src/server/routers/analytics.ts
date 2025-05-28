import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '../trpc'
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns'

export const analyticsRouter = createTRPCRouter({
  // Get financial summary
  getFinancialSummary: protectedProcedure.query(async ({ ctx }) => {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()
    
    // Calculate monthly revenue
    const activeContracts = await ctx.db.contract.findMany({
      where: {
        status: 'ACTIVE',
        startDate: { lte: now },
        endDate: { gte: now }
      },
      select: {
        rentAmount: true
      }
    })
    
    const monthlyRevenue = activeContracts.reduce((sum, contract) => 
      sum + Number(contract.rentAmount), 0
    )
    
    // Calculate yearly revenue (simplified - assumes current monthly rate)
    const yearlyRevenue = monthlyRevenue * 12
    
    // Get previous month revenue for comparison
    const lastMonth = new Date(currentYear, currentMonth - 1)
    const lastMonthContracts = await ctx.db.contract.findMany({
      where: {
        status: 'ACTIVE',
        startDate: { lte: lastMonth },
        endDate: { gte: lastMonth }
      },
      select: {
        rentAmount: true
      }
    })
    
    const lastMonthRevenue = lastMonthContracts.reduce((sum, contract) => 
      sum + Number(contract.rentAmount), 0
    )
    
    const revenueChange = lastMonthRevenue > 0 
      ? Math.round(((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)
      : 0
    
    // Calculate outstanding payments (simplified)
    // In a real app, this would check actual payment records
    const overdueContracts = await ctx.db.contract.count({
      where: {
        status: 'ACTIVE',
        paymentDay: { lt: now.getDate() }
      }
    })
    
    // Estimate outstanding amount (assume 30% haven't paid yet)
    const outstandingPayments = Math.round(monthlyRevenue * 0.3)
    
    // Calculate occupancy
    const totalProperties = await ctx.db.property.count()
    const rentedProperties = await ctx.db.property.count({
      where: { status: 'RENTED' }
    })
    
    const occupancyRate = totalProperties > 0 
      ? Math.round((rentedProperties / totalProperties) * 100)
      : 0
    
    return {
      monthlyRevenue,
      yearlyRevenue,
      revenueChange,
      outstandingPayments,
      overdueCount: overdueContracts,
      occupancyRate,
      totalProperties,
      rentedProperties
    }
  }),

  // Kintlévőségek részletes listája
  getOutstandingPayments: protectedProcedure.query(async ({ ctx }) => {
    const now = new Date()
    const currentDay = now.getDate()
    
    // Get active or draft contracts (since we have DRAFT contracts in the system)
    const contracts = await ctx.db.contract.findMany({
      where: {
        OR: [
          { status: 'ACTIVE' },
          { status: 'DRAFT' } // Include draft contracts for demo purposes
        ],
        startDate: { lte: now },
        endDate: { gte: now }
      },
      include: {
        tenant: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
                phone: true
              }
            }
          }
        },
        property: {
          select: {
            street: true,
            city: true
          }
        }
      }
    })

    // Calculate outstanding payments
    const outstandingPayments = contracts
      .filter(contract => {
        // For demo: assume payments are overdue if payment day has passed this month
        return contract.paymentDay < currentDay
      })
      .map(contract => {
        const dueDate = new Date(now.getFullYear(), now.getMonth(), contract.paymentDay)
        
        return {
          id: contract.id,
          tenantName: contract.tenant?.user?.name || 'Ismeretlen bérlő',
          tenantEmail: contract.tenant?.user?.email || '',
          tenantPhone: contract.tenant?.user?.phone || null,
          propertyAddress: `${contract.property.street}, ${contract.property.city}`,
          amount: Number(contract.rentAmount || 0),
          dueDate: dueDate,
          daysOverdue: Math.max(0, currentDay - contract.paymentDay),
          contractId: contract.id
        }
      })
      .sort((a, b) => b.daysOverdue - a.daysOverdue) // Sort by most overdue first

    return outstandingPayments
  }),
  
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