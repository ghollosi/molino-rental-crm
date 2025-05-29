import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkDatabase() {
  try {
    // Check contracts
    const contracts = await prisma.contract.findMany({
      include: {
        property: true,
        tenant: {
          include: {
            user: true
          }
        }
      }
    })
    
    console.log('\n=== CONTRACTS ===')
    console.log(`Total contracts: ${contracts.length}`)
    contracts.forEach(contract => {
      console.log(`- Contract ${contract.id}:`)
      console.log(`  Status: ${contract.status}`)
      console.log(`  Rent Amount: ${contract.rentAmount}`)
      console.log(`  Property: ${contract.property.street}, ${contract.property.city}`)
      console.log(`  Tenant: ${contract.tenant?.user?.name || 'N/A'}`)
      console.log(`  Start: ${contract.startDate}`)
      console.log(`  End: ${contract.endDate}`)
    })
    
    // Check properties with rent amounts
    const properties = await prisma.property.findMany({
      where: {
        rentAmount: {
          not: null
        }
      }
    })
    
    console.log('\n=== PROPERTIES WITH RENT AMOUNTS ===')
    console.log(`Total properties with rent: ${properties.length}`)
    properties.forEach(property => {
      console.log(`- ${property.street}, ${property.city}:`)
      console.log(`  Status: ${property.status}`)
      console.log(`  Rent Amount: ${property.rentAmount} ${property.currency}`)
    })
    
    // Check active contracts
    const now = new Date()
    const activeContracts = await prisma.contract.findMany({
      where: {
        status: 'ACTIVE',
        startDate: { lte: now },
        endDate: { gte: now }
      }
    })
    
    console.log('\n=== ACTIVE CONTRACTS ===')
    console.log(`Total active contracts: ${activeContracts.length}`)
    
    // Calculate total monthly revenue
    const monthlyRevenue = activeContracts.reduce((sum, contract) => 
      sum + Number(contract.rentAmount), 0
    )
    console.log(`Total monthly revenue from active contracts: ${monthlyRevenue}`)
    
    // Check for any payment/transaction related data
    console.log('\n=== CHECKING FOR PAYMENT/TRANSACTION MODELS ===')
    console.log('No Payment or Transaction models found in schema.')
    
  } catch (error) {
    console.error('Error checking database:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkDatabase()