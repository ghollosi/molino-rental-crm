import { NextResponse } from 'next/server'
import { prisma } from '@/src/lib/db'
import bcrypt from 'bcryptjs'

// IMPORTANT: Delete this file after using it!
export async function GET(request: Request) {
  try {
    // Security check - only allow from specific secret
    const { searchParams } = new URL(request.url)
    const secret = searchParams.get('secret')
    
    if (secret !== 'molino-admin-setup-2025') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const hashedPassword = await bcrypt.hash('admin123', 10)
    const adminEmail = 'admin@molino.com'

    // Use raw SQL to avoid schema conflicts
    // Check if admin exists
    const existingUsers = await prisma.$queryRaw`
      SELECT id, email, name, role FROM "User" WHERE email = ${adminEmail}
    ` as any[]

    if (existingUsers.length > 0) {
      // Update existing admin
      await prisma.$executeRaw`
        UPDATE "User" 
        SET password = ${hashedPassword}, role = 'ADMIN', "isActive" = true, "updatedAt" = NOW()
        WHERE email = ${adminEmail}
      `
      
      return NextResponse.json({ 
        message: 'Admin user password updated successfully',
        email: adminEmail,
        role: 'ADMIN'
      })
    } else {
      // Generate CUID-like ID
      const generateId = () => {
        const timestamp = Date.now().toString(36)
        const randomPart = Math.random().toString(36).substring(2, 15)
        return `c${timestamp}${randomPart}`
      }
      const newUserId = generateId()

      // Create new admin using raw SQL
      await prisma.$executeRaw`
        INSERT INTO "User" (id, email, password, name, role, language, "isActive", "createdAt", "updatedAt")
        VALUES (${newUserId}, ${adminEmail}, ${hashedPassword}, 'Admin User', 'ADMIN', 'HU', true, NOW(), NOW())
      `

      return NextResponse.json({ 
        message: 'Admin user created successfully',
        email: adminEmail,
        role: 'ADMIN'
      })
    }
  } catch (error) {
    console.error('Error creating admin:', error)
    return NextResponse.json({ 
      error: 'Failed to create admin user',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}