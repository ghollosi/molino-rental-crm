import { PrismaClient } from '@prisma/client'
import { compare } from 'bcryptjs'

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || "postgresql://postgres.bwpuhldzbgxfjohjjnll:Kata_1979A@aws-0-eu-west-3.pooler.supabase.com:6543/postgres?pgbouncer=true"
    }
  }
})

async function testAuthFlow() {
  try {
    console.log('🔐 Testing complete auth flow...')
    
    await prisma.$connect()
    console.log('✅ Connected to database')
    
    // Simulate the exact same flow as in auth.config.ts
    const email = 'admin@molino.com'
    const password = 'admin123'
    
    console.log('\n1️⃣ Looking up user...')
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
        role: true,
        language: true,
        isActive: true,
      }
    })
    
    if (!user) {
      console.log('❌ User not found')
      return
    }
    
    console.log('✅ User found:', user.email)
    
    if (!user.isActive) {
      console.log('❌ User is not active')
      return
    }
    
    console.log('✅ User is active')
    
    console.log('\n2️⃣ Testing password...')
    const isValidPassword = await compare(password, user.password)
    
    if (!isValidPassword) {
      console.log('❌ Invalid password')
      return
    }
    
    console.log('✅ Password is valid')
    
    console.log('\n3️⃣ Auth flow result:')
    const authResult = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      language: user.language,
    }
    
    console.log('✅ Auth flow successful!')
    console.log('Result:', authResult)
    
    console.log('\n🎯 If this works but login doesn\'t, the issue is likely:')
    console.log('   - NextAuth JWT callback')
    console.log('   - Cookie domain/SameSite settings')
    console.log('   - CSRF token issues')
    console.log('   - NEXTAUTH_URL mismatch')
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testAuthFlow()