import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkCurrentRevenue() {
  try {
    const now = new Date()
    console.log('Current date:', now.toISOString())
    console.log('Current day of month:', now.getDate())
    
    // Check contracts with DRAFT or ACTIVE status in current date range
    const contracts = await prisma.contract.findMany({
      where: {
        OR: [
          { status: 'ACTIVE' },
          { status: 'DRAFT' }
        ],
        startDate: { lte: now },
        endDate: { gte: now }
      },
      include: {
        property: true,
        tenant: {
          include: {
            user: true
          }
        }
      }
    })
    
    console.log(`\nFound ${contracts.length} contracts in current date range:`)
    
    let totalRevenue = 0
    contracts.forEach(contract => {
      const amount = Number(contract.rentAmount)
      totalRevenue += amount
      console.log(`- ${contract.property.street}: ${amount.toLocaleString('hu-HU')} Ft (Tenant: ${contract.tenant?.user?.name})`)
    })
    
    console.log(`\nTotal monthly revenue: ${totalRevenue.toLocaleString('hu-HU')} Ft`)
    
    // Check overdue payments
    const overdueContracts = contracts.filter(c => c.paymentDay < now.getDate())
    console.log(`\nOverdue payments: ${overdueContracts.length}`)
    overdueContracts.forEach(contract => {
      console.log(`- ${contract.property.street}: Payment day ${contract.paymentDay}, current day ${now.getDate()}`)
    })
    
    // Check property occupancy
    const totalProperties = await prisma.property.count()
    const rentedProperties = await prisma.property.count({ where: { status: 'RENTED' } })
    
    console.log(`\nOccupancy: ${rentedProperties}/${totalProperties} (${Math.round((rentedProperties/totalProperties)*100)}%)`)
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkCurrentRevenue()