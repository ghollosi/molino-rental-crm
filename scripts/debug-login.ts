import { PrismaClient } from '@prisma/client'
import { compare } from 'bcryptjs'

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || "postgresql://postgres.bwpuhldzbgxfjohjjnll:Kata_1979A@aws-0-eu-west-3.pooler.supabase.com:6543/postgres?pgbouncer=true"
    }
  }
})

async function debugLogin() {
  try {
    console.log('🔍 Testing login credentials...')
    
    // Test connection
    await prisma.$connect()
    console.log('✅ Connected to production database')
    
    // Find admin user
    const user = await prisma.user.findUnique({
      where: { email: 'admin@molino.com' },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
        role: true,
        isActive: true,
      }
    })
    
    if (!user) {
      console.log('❌ Admin user not found!')
      return
    }
    
    console.log('👤 User found:')
    console.log('   ID:', user.id)
    console.log('   Email:', user.email)
    console.log('   Name:', user.name)
    console.log('   Role:', user.role)
    console.log('   Active:', user.isActive)
    console.log('   Password hash:', user.password.substring(0, 20) + '...')
    
    // Test password
    const testPassword = 'admin123'
    const isValid = await compare(testPassword, user.password)
    
    console.log('\n🔐 Password test:')
    console.log('   Input password:', testPassword)
    console.log('   Is valid:', isValid ? '✅ YES' : '❌ NO')
    
    if (!isValid) {
      console.log('\n🔄 Regenerating password...')
      const { hash } = await import('bcryptjs')
      const newHash = await hash(testPassword, 12)
      
      await prisma.user.update({
        where: { email: 'admin@molino.com' },
        data: { password: newHash }
      })
      
      console.log('✅ Password updated!')
      
      // Test again
      const retestValid = await compare(testPassword, newHash)
      console.log('   Retest valid:', retestValid ? '✅ YES' : '❌ NO')
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

debugLogin()