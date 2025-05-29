import { createCaller } from '@/server'
import { prisma } from '@/lib/prisma'
import { generatePassword, hashPassword } from '@/lib/password'

async function testOwnerCreation() {
  try {
    console.log('🔍 Testing owner creation API...\n')
    
    // Create a mock session
    const mockSession = {
      user: {
        id: 'cjxyz12345',
        email: 'admin@example.com',
        role: 'ADMIN' as const,
        name: 'Test Admin'
      },
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    }
    
    // Create caller with session
    const caller = createCaller({
      session: mockSession,
      db: prisma
    })
    
    // Test data
    const testEmail = `test-api-${Date.now()}@example.com`
    
    console.log('📝 Creating owner via tRPC quickCreate...')
    console.log('   Email:', testEmail)
    
    const result = await caller.owner.quickCreate({
      name: 'Test Owner via API',
      email: testEmail,
      password: 'test123',
      phone: '+36 20 123 4567'
    })
    
    console.log('\n✅ Owner created successfully!')
    console.log('   Owner ID:', result.id)
    console.log('   User ID:', result.userId)
    console.log('   User Name:', result.user.name)
    console.log('   User Email:', result.user.email)
    
    // Cleanup
    console.log('\n🧹 Cleaning up...')
    await prisma.owner.delete({ where: { id: result.id } })
    await prisma.user.delete({ where: { id: result.userId } })
    console.log('✅ Cleanup complete')
    
  } catch (error) {
    console.error('❌ Error:', error)
    if (error instanceof Error) {
      console.error('   Message:', error.message)
      console.error('   Stack:', error.stack)
    }
  } finally {
    await prisma.$disconnect()
  }
}

testOwnerCreation()