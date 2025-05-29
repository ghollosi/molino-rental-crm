import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres.bwpuhldzbgxfjohjjnll:Kata_1979A@aws-0-eu-west-3.pooler.supabase.com:6543/postgres?pgbouncer=true"
    }
  }
})

async function checkDatabase() {
  try {
    console.log('🔍 Checking production database state...\n')
    
    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        owner: true,
      }
    })
    
    console.log(`📊 Total users: ${users.length}`)
    users.forEach(user => {
      console.log(`\n👤 User: ${user.email}`)
      console.log(`   ID: ${user.id}`)
      console.log(`   Name: ${user.name}`)
      console.log(`   Role: ${user.role}`)
      console.log(`   Has owner profile: ${user.owner ? 'YES' : 'NO'}`)
    })
    
    // Check owners
    const owners = await prisma.owner.findMany({
      include: {
        user: true
      }
    })
    
    console.log(`\n📊 Total owners: ${owners.length}`)
    
    // Check if tables exist
    console.log('\n🔍 Checking table structure...')
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    ` as any[]
    
    console.log('📋 Tables in database:')
    tables.forEach(table => {
      console.log(`   - ${table.table_name}`)
    })
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkDatabase()