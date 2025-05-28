import { db } from '../src/lib/db'

async function checkContracts() {
  try {
    const contracts = await db.contract.findMany({
      include: {
        tenant: {
          include: {
            user: true
          }
        },
        property: true
      }
    })
    
    console.log(`Total contracts: ${contracts.length}`)
    
    contracts.forEach(contract => {
      console.log(`Contract ${contract.id}:`)
      console.log(`  Status: ${contract.status}`)
      console.log(`  Tenant: ${contract.tenant?.user?.name || 'None'}`)
      console.log(`  Property: ${contract.property?.street || 'None'}`)
      console.log(`  Rent: ${contract.rentAmount} ${contract.currency}`)
      console.log(`  Payment day: ${contract.paymentDay}`)
      console.log(`  Start: ${contract.startDate?.toISOString().split('T')[0]}`)
      console.log(`  End: ${contract.endDate?.toISOString().split('T')[0]}`)
      console.log('')
    })
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await db.$disconnect()
  }
}

checkContracts()