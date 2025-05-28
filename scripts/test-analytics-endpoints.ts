import { createTRPCContext } from '../src/server/trpc'
import { appRouter } from '../src/server/routers/_app'
import { db } from '../src/lib/db'

async function testEndpoints() {
  console.log('Testing analytics endpoints...')
  
  try {
    // Create a mock context
    const ctx = await createTRPCContext({
      req: new Request('http://localhost:3000') as any,
    })
    
    // Create caller
    const caller = appRouter.createCaller(ctx)
    
    // Test financial summary
    console.log('\n1. Testing getFinancialSummary...')
    const financialSummary = await caller.analytics.getFinancialSummary()
    console.log('Financial Summary:', JSON.stringify(financialSummary, null, 2))
    
    // Test expiring contracts
    console.log('\n2. Testing getExpiringContracts...')
    const expiringContracts = await caller.contracts.getExpiringContracts({ days: 60 })
    console.log('Expiring Contracts Count:', expiringContracts.length)
    if (expiringContracts.length > 0) {
      console.log('First contract:', JSON.stringify(expiringContracts[0], null, 2))
    }
    
    console.log('\n✅ All endpoints tested successfully!')
    
  } catch (error) {
    console.error('❌ Error testing endpoints:', error)
  } finally {
    await db.$disconnect()
  }
}

testEndpoints()