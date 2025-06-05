import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

// This script creates an admin user in the production database
// Usage: DATABASE_URL="postgresql://..." npx tsx scripts/seed-production-admin.ts

async function main() {
  // Validate DATABASE_URL
  if (!process.env.DATABASE_URL) {
    console.error('❌ Error: DATABASE_URL environment variable is required')
    console.error('Usage: DATABASE_URL="postgresql://..." npx tsx scripts/seed-production-admin.ts')
    process.exit(1)
  }

  // Initialize Prisma client with production URL
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  })

  try {
    console.log('🌱 Seeding production database with admin user...')
    console.log('📍 Database URL:', process.env.DATABASE_URL.replace(/:[^:]*@/, ':****@')) // Hide password in logs

    // Admin user details
    const adminEmail = 'admin@molino.com'
    const adminPassword = 'admin123'
    const hashedPassword = await bcrypt.hash(adminPassword, 10)

    // Check if admin user already exists using raw SQL to avoid column issues
    const existingUsers = await prisma.$queryRaw`
      SELECT id, email, name, role, "isActive", "createdAt" 
      FROM "User" 
      WHERE email = ${adminEmail}
    ` as any[]

    if (existingUsers.length > 0) {
      const existingAdmin = existingUsers[0]
      console.log('⚠️  Admin user already exists with email:', adminEmail)
      console.log('📊 Existing user details:')
      console.log(`   - ID: ${existingAdmin.id}`)
      console.log(`   - Name: ${existingAdmin.name}`)
      console.log(`   - Role: ${existingAdmin.role}`)
      console.log(`   - Active: ${existingAdmin.isActive}`)
      console.log(`   - Created: ${existingAdmin.createdAt}`)
      
      // Ask if they want to update the password
      console.log('\n❓ Do you want to update the password for this user?')
      console.log('   (The script will exit now. Re-run with UPDATE_PASSWORD=true to update)')
      
      if (process.env.UPDATE_PASSWORD === 'true') {
        await prisma.$executeRaw`
          UPDATE "User" 
          SET password = ${hashedPassword}, "isActive" = true, "updatedAt" = NOW()
          WHERE email = ${adminEmail}
        `
        console.log('✅ Password updated successfully for admin user')
        console.log('🔐 Login credentials:')
        console.log(`   - Email: ${adminEmail}`)
        console.log(`   - Password: ${adminPassword}`)
      }
      
      process.exit(0)
    }

    // Check if lastName column exists
    let hasLastNameColumn = false
    try {
      await prisma.$queryRaw`SELECT column_name FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'lastName'`
      hasLastNameColumn = true
    } catch (error) {
      // Column doesn't exist
    }

    // Generate a CUID-like ID to match Prisma's format
    const generateId = () => {
      const timestamp = Date.now().toString(36)
      const randomPart = Math.random().toString(36).substring(2, 15)
      return `c${timestamp}${randomPart}`
    }
    const newUserId = generateId()

    // Create new admin user using raw SQL
    let createdUser: any[]
    if (hasLastNameColumn) {
      createdUser = await prisma.$queryRaw`
        INSERT INTO "User" (id, email, password, name, "lastName", role, language, "isActive", phone, "createdAt", "updatedAt")
        VALUES (${newUserId}, ${adminEmail}, ${hashedPassword}, 'Admin', 'User', 'ADMIN', 'HU', true, '+36 1 234 5678', NOW(), NOW())
        RETURNING id, email, name, "lastName", role, language, "isActive", phone, "createdAt"
      `
    } else {
      createdUser = await prisma.$queryRaw`
        INSERT INTO "User" (id, email, password, name, role, language, "isActive", phone, "createdAt", "updatedAt")
        VALUES (${newUserId}, ${adminEmail}, ${hashedPassword}, 'Admin', 'ADMIN', 'HU', true, '+36 1 234 5678', NOW(), NOW())
        RETURNING id, email, name, role, language, "isActive", phone, "createdAt"
      `
      console.log('ℹ️  Note: lastName column not found. Consider running migrations to add it.')
    }

    const adminUser = createdUser[0]

    console.log('✅ Admin user created successfully!')
    console.log('\n📊 User details:')
    console.log(`   - ID: ${adminUser.id}`)
    console.log(`   - Email: ${adminUser.email}`)
    console.log(`   - Name: ${adminUser.name}${adminUser.lastName ? ' ' + adminUser.lastName : ''}`)
    console.log(`   - Role: ${adminUser.role}`)
    console.log(`   - Language: ${adminUser.language}`)
    console.log(`   - Active: ${adminUser.isActive}`)
    console.log(`   - Created: ${adminUser.createdAt}`)
    
    console.log('\n🔐 Login credentials:')
    console.log(`   - Email: ${adminEmail}`)
    console.log(`   - Password: ${adminPassword}`)
    
    console.log('\n⚠️  IMPORTANT: Please change the password after first login!')
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error)
    if (error instanceof Error) {
      console.error('Error details:', error.message)
    }
    process.exit(1)
  } finally {
    await prisma.$disconnect()
    console.log('\n✅ Database connection closed')
  }
}

// Run the main function
main()
  .catch((error) => {
    console.error('❌ Unexpected error:', error)
    process.exit(1)
  })