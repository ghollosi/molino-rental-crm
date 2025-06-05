import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
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

    // Check if admin exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@molino.com' }
    })

    const hashedPassword = await bcrypt.hash('admin123', 10)

    if (existingAdmin) {
      // Update password
      const updated = await prisma.user.update({
        where: { email: 'admin@molino.com' },
        data: {
          password: hashedPassword,
          role: 'ADMIN',
          isActive: true,
          updatedAt: new Date()
        }
      })
      
      return NextResponse.json({ 
        message: 'Admin user password updated successfully',
        email: updated.email,
        role: updated.role
      })
    } else {
      // Create new admin
      const admin = await prisma.user.create({
        data: {
          email: 'admin@molino.com',
          password: hashedPassword,
          firstName: 'Admin',
          lastName: 'User',
          role: 'ADMIN',
          language: 'HU',
          isActive: true
        }
      })

      return NextResponse.json({ 
        message: 'Admin user created successfully',
        email: admin.email,
        role: admin.role
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