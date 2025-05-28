import { db } from '../src/lib/db'
import { startOfMonth, endOfMonth, subMonths } from 'date-fns'

async function checkAllDashboardData() {
  console.log('🔍 Checking all dashboard data...\n')
  
  try {
    // 1. Issues by month
    console.log('📊 1. ISSUES BY MONTH:')
    const months = 6
    for (let i = months - 1; i >= 0; i--) {
      const date = subMonths(new Date(), i)
      const startDate = startOfMonth(date)
      const endDate = endOfMonth(date)

      const [totalIssues, resolvedIssues] = await Promise.all([
        db.issue.count({
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate
            }
          }
        }),
        db.issue.count({
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
      console.log(`  ${monthNames[date.getMonth()]}: ${totalIssues} issues, ${resolvedIssues} resolved`)
    }

    // 2. Properties by status
    console.log('\n🏠 2. PROPERTIES BY STATUS:')
    const statusCounts = await db.property.groupBy({
      by: ['status'],
      _count: {
        id: true
      }
    })

    const nameMap = {
      AVAILABLE: 'Elérhető',
      RENTED: 'Bérelt',
      MAINTENANCE: 'Karbantartás', 
      UNAVAILABLE: 'Nem elérhető'
    }

    statusCounts.forEach(item => {
      console.log(`  ${nameMap[item.status as keyof typeof nameMap]}: ${item._count.id}`)
    })

    // 3. Revenue calculation
    console.log('\n💰 3. REVENUE DATA:')
    const properties = await db.property.findMany({
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

    const monthlyRevenue = properties.reduce((sum, property) => {
      return sum + Number(property.rentAmount || 0)
    }, 0)

    console.log(`  Monthly revenue: ${monthlyRevenue.toLocaleString('hu-HU')} Ft`)
    console.log(`  Yearly revenue: ${(monthlyRevenue * 12).toLocaleString('hu-HU')} Ft`)
    console.log(`  From ${properties.length} rented properties`)

    // 4. Issues by category
    console.log('\n🔧 4. ISSUES BY CATEGORY:')
    const categoryCounts = await db.issue.groupBy({
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

    const categoryNameMap = {
      PLUMBING: 'Vízvezeték',
      ELECTRICAL: 'Elektromos',
      HVAC: 'Fűtés/Légkondicionálás',
      STRUCTURAL: 'Szerkezeti',
      OTHER: 'Egyéb'
    }

    categoryCounts.forEach(item => {
      console.log(`  ${categoryNameMap[item.category as keyof typeof categoryNameMap]}: ${item._count.id}`)
    })

    // 5. Total counts
    console.log('\n📈 5. TOTAL COUNTS:')
    const [totalProperties, totalTenants, totalIssues, totalContracts] = await Promise.all([
      db.property.count(),
      db.tenant.count(),
      db.issue.count(),
      db.contract.count()
    ])

    console.log(`  Properties: ${totalProperties}`)
    console.log(`  Tenants: ${totalTenants}`) 
    console.log(`  Issues: ${totalIssues}`)
    console.log(`  Contracts: ${totalContracts}`)

    console.log('\n✅ Dashboard data check complete!')

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await db.$disconnect()
  }
}

checkAllDashboardData()