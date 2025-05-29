import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testFinancialCalculation() {
  try {
    const now = new Date()
    console.log('Current date:', now)
    
    // 1. Check active contracts
    console.log('\n=== CHECKING ACTIVE CONTRACTS ===')
    const activeContracts = await prisma.contract.findMany({
      where: {
        status: 'ACTIVE',
        startDate: { lte: now },
        endDate: { gte: now }
      },
      include: {
        property: true
      }
    })
    
    console.log(`Found ${activeContracts.length} active contracts`)
    
    // 2. Check ALL contracts
    console.log('\n=== ALL CONTRACTS ===')
    const allContracts = await prisma.contract.findMany({
      include: {
        property: true
      }
    })
    
    allContracts.forEach(contract => {
      console.log(`\nContract ${contract.id}:`)
      console.log(`  Status: ${contract.status}`)
      console.log(`  Start: ${contract.startDate}`)
      console.log(`  End: ${contract.endDate}`)
      console.log(`  Current date is between? ${contract.startDate <= now && contract.endDate >= now}`)
      console.log(`  Rent: ${contract.rentAmount}`)
    })
    
    // 3. Check what getFinancialSummary would calculate
    console.log('\n=== FINANCIAL SUMMARY CALCULATION ===')
    
    // Try with DRAFT contracts too (since all contracts are DRAFT)
    const draftContracts = await prisma.contract.findMany({
      where: {
        status: 'DRAFT',
        startDate: { lte: now },
        endDate: { gte: now }
      }
    })
    
    console.log(`Found ${draftContracts.length} DRAFT contracts in date range`)
    
    const monthlyRevenue = draftContracts.reduce((sum, contract) => 
      sum + Number(contract.rentAmount), 0
    )
    
    console.log(`Monthly revenue from DRAFT contracts: ${monthlyRevenue}`)
    
    // 4. Check properties with RENTED status
    console.log('\n=== RENTED PROPERTIES ===')
    const rentedProperties = await prisma.property.findMany({
      where: {
        status: 'RENTED'
      }
    })
    
    console.log(`Found ${rentedProperties.length} RENTED properties`)
    
    const propertyRevenue = rentedProperties.reduce((sum, property) => 
      sum + Number(property.rentAmount || 0), 0
    )
    
    console.log(`Monthly revenue from RENTED properties: ${propertyRevenue}`)
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testFinancialCalculation()