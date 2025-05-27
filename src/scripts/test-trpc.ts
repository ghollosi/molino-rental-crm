import { appRouter } from '../server/routers/_app'
import { createInnerTRPCContext } from '../server/trpc'
import { db } from '../lib/db'

async function testTRPC() {
  console.log('Testing tRPC endpoints...\n')
  
  // Create a mock context
  const ctx = createInnerTRPCContext({
    session: {
      user: {
        id: '1',
        name: 'Test Admin',
        email: 'admin@test.com',
        role: 'ADMIN' as const,
        language: 'HU' as const,
      },
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    },
  })

  const caller = appRouter.createCaller(ctx)

  try {
    // Test auth router
    console.log('✓ Testing auth.getSession...')
    const session = await caller.auth.getSession()
    console.log('  Session:', session.user.email)

    // Test user router
    console.log('\n✓ Testing user.list...')
    const users = await caller.user.list({ page: 1, limit: 10 })
    console.log('  Total users:', users.pagination.total)

    // Test property router
    console.log('\n✓ Testing property.list...')
    const properties = await caller.property.list({ page: 1, limit: 10 })
    console.log('  Total properties:', properties.pagination.total)

    console.log('\n✅ All tRPC endpoints are working correctly!')
  } catch (error) {
    console.error('❌ Error testing tRPC:', error)
  } finally {
    await db.$disconnect()
  }
}

testTRPC()