import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Debug auth called')
    
    const session = await auth()
    const headers = Object.fromEntries(request.headers.entries())
    
    return NextResponse.json({
      session: session ? {
        user: session.user,
        expires: session.expires
      } : null,
      cookies: request.cookies.getAll(),
      userAgent: headers['user-agent'],
      host: headers.host,
      origin: headers.origin,
      referer: headers.referer,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('❌ Auth debug error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}