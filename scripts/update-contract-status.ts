import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function updateContractStatus() {
  try {
    const now = new Date()
    
    // Find all DRAFT contracts that should be ACTIVE
    const contractsToActivate = await prisma.contract.findMany({
      where: {
        status: 'DRAFT',
        startDate: { lte: now },
        endDate: { gte: now }
      }
    })
    
    console.log(`Found ${contractsToActivate.length} contracts to activate`)
    
    // Update them to ACTIVE
    for (const contract of contractsToActivate) {
      await prisma.contract.update({
        where: { id: contract.id },
        data: { status: 'ACTIVE' }
      })
      console.log(`Updated contract ${contract.id} to ACTIVE`)
    }
    
    console.log('Contract status update completed!')
    
  } catch (error) {
    console.error('Error updating contract status:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Uncomment to run the update
// updateContractStatus()

console.log('This script would update DRAFT contracts to ACTIVE status.')
console.log('Uncomment the updateContractStatus() call to execute.')