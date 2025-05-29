import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prodDatabaseUrl = "postgresql://postgres.bwpuhldzbgxfjohjjnll:Kata_1979A@aws-0-eu-west-3.pooler.supabase.com:6543/postgres?pgbouncer=true"

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: prodDatabaseUrl
    }
  }
})

async function debugOwnerCreation() {
  try {
    console.log('🔍 Testing owner creation in production database...\n')
    
    // Test data
    const testEmail = `test-owner-${Date.now()}@example.com`
    const testName = 'Test Owner ' + new Date().toISOString()
    const testPassword = 'test123'
    
    console.log('📝 Creating test owner with:')
    console.log('   Email:', testEmail)
    console.log('   Name:', testName)
    console.log('')
    
    // Step 1: Create user
    console.log('Step 1: Creating user...')
    const hashedPassword = await bcrypt.hash(testPassword, 10)
    
    const user = await prisma.user.create({
      data: {
        email: testEmail,
        name: testName,
        password: hashedPassword,
        role: 'OWNER',
      }
    })
    
    console.log('✅ User created successfully!')
    console.log('   User ID:', user.id)
    console.log('   Role:', user.role)
    console.log('')
    
    // Step 2: Create owner profile
    console.log('Step 2: Creating owner profile...')
    const owner = await prisma.owner.create({
      data: {
        userId: user.id,
      }
    })
    
    console.log('✅ Owner profile created successfully!')
    console.log('   Owner ID:', owner.id)
    console.log('   User ID:', owner.userId)
    console.log('')
    
    // Step 3: Verify the relationship
    console.log('Step 3: Verifying the relationship...')
    const verifyUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { owner: true }
    })
    
    console.log('✅ Verification successful!')
    console.log('   User has owner profile:', verifyUser?.owner ? 'YES' : 'NO')
    console.log('')
    
    // Cleanup
    console.log('🧹 Cleaning up test data...')
    await prisma.owner.delete({ where: { id: owner.id } })
    await prisma.user.delete({ where: { id: user.id } })
    console.log('✅ Test data cleaned up')
    
  } catch (error) {
    console.error('❌ Error during owner creation:', error)
    if (error instanceof Error) {
      console.error('   Message:', error.message)
      console.error('   Stack:', error.stack)
    }
  } finally {
    await prisma.$disconnect()
  }
}

debugOwnerCreation()