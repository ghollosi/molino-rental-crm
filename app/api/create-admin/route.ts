import { NextResponse } from 'next/server'
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

    // Create a new Prisma client instance with the production URL
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      }
    })

    const hashedPassword = await bcrypt.hash('admin123', 10)
    const adminEmail = 'admin@molino.com'

    try {
      // Try to use the simple user fields that should exist
      const existingUser = await prisma.user.findFirst({
        where: { email: adminEmail },
        select: { id: true, email: true, role: true }
      })

      if (existingUser) {
        // Update existing user - use minimal fields
        const updated = await prisma.user.update({
          where: { email: adminEmail },
          data: {
            password: hashedPassword,
            role: 'ADMIN',
            isActive: true
          },
          select: { email: true, role: true }
        })
        
        return NextResponse.json({ 
          message: 'Admin user password updated successfully',
          email: updated.email,
          role: updated.role
        })
      } else {
        // Create new user - use minimal required fields only
        const admin = await prisma.user.create({
          data: {
            email: adminEmail,
            password: hashedPassword,
            name: 'Admin User',
            role: 'ADMIN',
            language: 'HU',
            isActive: true
          },
          select: { email: true, role: true }
        })

        return NextResponse.json({ 
          message: 'Admin user created successfully',
          email: admin.email,
          role: admin.role
        })
      }
    } finally {
      await prisma.$disconnect()
    }
  } catch (error) {
    console.error('Error creating admin:', error)
    return NextResponse.json({ 
      error: 'Failed to create admin user',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}