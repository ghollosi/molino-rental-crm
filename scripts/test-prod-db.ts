import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres.bwpuhldzbgxfjohjjnll:Kata_1979A@aws-0-eu-west-3.pooler.supabase.com:6543/postgres?pgbouncer=true"
    }
  },
  log: ['query', 'error', 'warn']
})

async function testProductionDb() {
  try {
    console.log('🔍 Testing production database connection...')
    
    // Test connection
    await prisma.$connect()
    console.log('✅ Connected to production database')
    
    // Count records
    const counts = await Promise.all([
      prisma.user.count(),
      prisma.owner.count(),
      prisma.property.count(),
      prisma.tenant.count(),
      prisma.contract.count(),
    ])
    
    console.log('\n📊 Record counts:')
    console.log('   Users:', counts[0])
    console.log('   Owners:', counts[1])
    console.log('   Properties:', counts[2])
    console.log('   Tenants:', counts[3])
    console.log('   Contracts:', counts[4])
    
    // Try to create a test user
    console.log('\n🧪 Testing user creation...')
    const testEmail = `test-${Date.now()}@example.com`
    
    try {
      const newUser = await prisma.user.create({
        data: {
          email: testEmail,
          name: 'Test User',
          password: 'hashed-password',
          role: 'VIEWER',
        }
      })
      
      console.log('✅ User created successfully:', newUser.id)
      
      // Clean up
      await prisma.user.delete({
        where: { id: newUser.id }
      })
      console.log('✅ Test user deleted')
      
    } catch (createError) {
      console.error('❌ Failed to create user:', createError)
    }
    
  } catch (error) {
    console.error('❌ Database error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testProductionDb()