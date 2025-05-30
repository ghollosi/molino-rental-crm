import { NextRequest, NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// NO AUTH CHECK - Direct creation for testing
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      name, 
      email, 
      password, 
      phone,
      isCompany,
      companyName,
      taxNumber,
      billingStreet,
      billingCity,
      billingPostalCode,
      billingCountry,
      documents
    } = body

    console.log('Standalone API called:', { name, email, phone, isCompany })

    if (!name || !email || !password) {
      return NextResponse.json({ 
        error: 'Name, email and password are required' 
      }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ 
        error: 'Password must be at least 6 characters' 
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
    const hashedPassword = await hash(password, 12)

    // Create user with OWNER role
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone: phone || null,
        role: 'OWNER',
        isActive: true
      }
    })

    // Create owner profile with extended data
    const owner = await prisma.owner.create({
      data: {
        userId: user.id,
        isCompany: isCompany || false,
        companyName: isCompany ? companyName : null,
        taxNumber: taxNumber || null,
        billingStreet: billingStreet || null,
        billingCity: billingCity || null,
        billingPostalCode: billingPostalCode || null,
        billingCountry: billingCountry || null,
        documents: documents || []
      }
    })

    console.log('Owner created successfully:', { userId: user.id, ownerId: owner.id })

    return NextResponse.json({ 
      success: true, 
      owner: {
        id: owner.id,
        userId: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone
      }
    })

  } catch (error) {
    console.error('Standalone create owner error:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Also handle GET for testing
export async function GET() {
  return NextResponse.json({
    message: 'Standalone Create Owner API',
    status: 'Ready',
    timestamp: new Date().toISOString()
  })
}