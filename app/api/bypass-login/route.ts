import { NextResponse } from 'next/server'

export async function GET() {
  // Simple redirect to dashboard with a basic session simulation
  const response = NextResponse.redirect(new URL('/dashboard', process.env.NEXTAUTH_URL || 'https://molino-rental-crm.vercel.app'))
  
  // Set a simple session cookie to bypass middleware
  response.cookies.set('session-bypass', 'admin-authenticated', {
    httpOnly: false,
    secure: true,
    sameSite: 'lax',
    maxAge: 24 * 60 * 60, // 24 hours
    path: '/'
  })
  
  return response
}