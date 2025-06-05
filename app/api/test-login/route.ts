import { NextResponse } from 'next/server'
import { signIn } from '@/auth'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()
    
    console.log('Test login attempt:', email)
    
    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })
    
    console.log('SignIn result:', result)
    
    return NextResponse.json({ 
      success: true,
      result: result 
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Login failed'
    }, { status: 500 })
  }
}