import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, password, phone } = body

    console.log('Test owner create - received data:', { name, email, phone })
    
    // Check if database URL is set
    const dbUrl = process.env.DATABASE_URL
    if (!dbUrl) {
      return NextResponse.json({ error: 'DATABASE_URL not configured' }, { status: 500 })
    }
    
    console.log('Database URL exists:', dbUrl.substring(0, 50) + '...')
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })
    
    if (existingUser) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 })
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
      userId: user.id,
      ownerId: owner.id,
      message: 'Owner created successfully'
    })
    
  } catch (error) {
    console.error('Test owner create error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to create owner',
      details: error
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

export async function GET() {
  try {
    // Test database connection
    const dbUrl = process.env.DATABASE_URL
    if (!dbUrl) {
      return NextResponse.json({ error: 'DATABASE_URL not configured' }, { status: 500 })
    }
    
    // Try to count users
    const userCount = await prisma.user.count()
    const ownerCount = await prisma.owner.count()
    
    return NextResponse.json({
      status: 'Database connection OK',
      dbUrl: dbUrl.substring(0, 50) + '...',
      userCount,
      ownerCount,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Database test error:', error)
    return NextResponse.json({ 
      error: 'Database connection failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}