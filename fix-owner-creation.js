// Direct production database test
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prodDb = "postgresql://postgres.bwpuhldzbgxfjohjjnll:Kata_1979A@aws-0-eu-west-3.pooler.supabase.com:6543/postgres?pgbouncer=true"

const prisma = new PrismaClient({
  datasources: { db: { url: prodDb } }
})

async function createOwner() {
  try {
    console.log('🚀 PRODUCTION OWNER CREATION TEST')
    console.log('=' .repeat(50))
    
    const email = `fixed-owner-${Date.now()}@example.com`
    const name = 'WORKING Owner Test'
    const password = 'test123'
    
    console.log('📝 Creating owner:')
    console.log(`   Name: ${name}`)
    console.log(`   Email: ${email}`)
    console.log('')
    
    // Step 1: Create user
    console.log('Step 1: Creating user with OWNER role...')
    const hashedPassword = await bcrypt.hash(password, 10)
    
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role: 'OWNER',
      }
    })
    
    console.log('✅ User created:', user.id)
    
    // Step 2: Create owner profile
    console.log('Step 2: Creating owner profile...')
    const owner = await prisma.owner.create({
      data: {
        userId: user.id,
      }
    })
    
    console.log('✅ Owner profile created:', owner.id)
    
    // Step 3: Verify
    console.log('Step 3: Verification...')
    const result = await prisma.owner.findUnique({
      where: { id: owner.id },
      include: { user: true }
    })
    
    console.log('')
    console.log('🎉 SUCCESS! Owner létrehozva a production adatbázisban!')
    console.log('📊 Details:')
    console.log(`   Owner ID: ${result.id}`)
    console.log(`   User ID: ${result.user.id}`)
    console.log(`   Name: ${result.user.name}`)
    console.log(`   Email: ${result.user.email}`)
    console.log(`   Role: ${result.user.role}`)
    console.log('')
    console.log('✅ A production adatbázis kapcsolat és owner creation MŰKÖDIK!')
    console.log('❌ A probléma a Vercel deployment vagy a frontend cache!')
    
  } catch (error) {
    console.error('❌ HIBA:', error.message)
    console.error('')
    console.error('Stack trace:', error.stack)
  } finally {
    await prisma.$disconnect()
  }
}

createOwner()