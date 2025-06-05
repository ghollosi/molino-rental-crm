import { NextResponse } from 'next/server'
import { compare } from 'bcryptjs'
import { prisma } from '@/src/lib/db'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()
    
    console.log('Direct test login attempt:', email)
    
    // Direct database check
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        password: true,
        role: true,
        language: true,
        isActive: true,
      }
    })
    
    if (!user) {
      return NextResponse.json({ 
        success: false,
        error: 'User not found',
        debug: { email, userFound: false }
      })
    }
    
    if (!user.isActive) {
      return NextResponse.json({ 
        success: false,
        error: 'User not active',
        debug: { email, userFound: true, isActive: false }
      })
    }
    
    console.log('User found:', user.email, 'Active:', user.isActive)
    
    const isValidPassword = await compare(password, user.password)
    
    console.log('Password validation:', isValidPassword)
    
    if (!isValidPassword) {
      return NextResponse.json({ 
        success: false,
        error: 'Invalid password',
        debug: { 
          email, 
          userFound: true, 
          isActive: true, 
          passwordValid: false,
          passwordLength: user.password.length
        }
      })
    }
    
    return NextResponse.json({ 
      success: true,
      message: 'Login would succeed',
      user: {
        id: user.id,
        email: user.email,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        role: user.role
      }
    })
  } catch (error) {
    console.error('Direct login test error:', error)
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Test failed',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}