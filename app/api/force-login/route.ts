import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

export async function GET() {
  try {
    // Create a temporary JWT token for admin session
    const payload = {
      id: 'cmb9bk7zv0000jnsh3qx43rth',
      email: 'admin@molino.com',
      name: 'admin',
      role: 'ADMIN',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    }
    
    const token = jwt.sign(payload, process.env.NEXTAUTH_SECRET || 'fallback-secret')
    
    const response = NextResponse.redirect(new URL('/dashboard', 'https://molino-rental-crm.vercel.app'))
    
    // Set NextAuth session cookie
    response.cookies.set('next-auth.session-token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/'
    })
    
    return response
  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to create session',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}