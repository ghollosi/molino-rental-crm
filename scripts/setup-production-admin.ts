import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

// Use production database URL
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || "postgresql://postgres.bwpuhldzbgxfjohjjnll:Kata_1979A@aws-0-eu-west-3.pooler.supabase.com:6543/postgres?pgbouncer=true"
    }
  }
})

async function setupProductionAdmin() {
  try {
    console.log('🔍 Checking production database connection...')
    
    // Test connection
    await prisma.$connect()
    console.log('✅ Connected to production database')
    
    // Check if admin user exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@molino.com' }
    })
    
    if (existingAdmin) {
      console.log('👤 Admin user already exists')
      console.log('   Email:', existingAdmin.email)
      console.log('   Name:', existingAdmin.name)
      console.log('   Role:', existingAdmin.role)
      console.log('   Active:', existingAdmin.isActive)
      
      // Update password to ensure it's correct
      const hashedPassword = await hash('admin123', 12)
      await prisma.user.update({
        where: { email: 'admin@molino.com' },
        data: { 
          password: hashedPassword,
          isActive: true 
        }
      })
      console.log('🔄 Password updated and user activated')
      
    } else {
      console.log('❌ Admin user does not exist, creating...')
      
      const hashedPassword = await hash('admin123', 12)
      
      const newAdmin = await prisma.user.create({
        data: {
          email: 'admin@molino.com',
          name: 'Admin',
          password: hashedPassword,
          role: 'ADMIN',
          language: 'HU',
          isActive: true,
        }
      })
      
      console.log('✅ Admin user created successfully')
      console.log('   ID:', newAdmin.id)
      console.log('   Email:', newAdmin.email)
      console.log('   Name:', newAdmin.name)
    }
    
    // Test login credentials
    console.log('\n📋 Login credentials:')
    console.log('   Email: admin@molino.com')
    console.log('   Password: admin123')
    
    // Check total users
    const userCount = await prisma.user.count()
    console.log(`\n👥 Total users in production: ${userCount}`)
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

setupProductionAdmin()