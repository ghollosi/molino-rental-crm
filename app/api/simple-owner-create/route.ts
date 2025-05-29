import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { auth } from '@/auth'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Check permissions
    if (!['ADMIN', 'EDITOR_ADMIN', 'OFFICE_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const { name, email, password, phone } = body

    console.log('Simple owner create - received data:', { name, email, phone })
    
    // Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json({ 
        error: 'Name, email and password are required' 
      }, { status: 400 })
    }
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })
    
    if (existingUser) {
      return NextResponse.json({ 
        error: 'User with this email already exists' 
      }, { status: 400 })
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)
    
    // Create user with OWNER role
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone,
        role: 'OWNER',
      }
    })
    
    console.log('User created successfully:', user.id)
    
    // Create owner profile
    const owner = await prisma.owner.create({
      data: {
        userId: user.id,
      }
    })
    
    console.log('Owner profile created successfully:', owner.id)
    
    return NextResponse.json({ 
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone
      },
      owner: {
        id: owner.id,
        userId: owner.userId
      },
      message: 'Owner created successfully'
    })
    
  } catch (error) {
    console.error('Simple owner create error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to create owner',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Simple Owner Creation API',
    usage: 'POST with { name, email, password, phone? }',
    timestamp: new Date().toISOString()
  })
}