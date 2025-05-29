import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Rate limiting map to track requests
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

// Note: setInterval cleanup disabled for Edge Runtime compatibility
// Rate limit entries will be cleaned up naturally as they expire

function getRateLimitKey(request: NextRequest): string {
  const ip = request.headers.get('x-forwarded-for') || 
             request.headers.get('x-real-ip') || 
             'anonymous'
  return `${ip}:${request.nextUrl.pathname}`
}

function checkRateLimit(key: string): boolean {
  const limit = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100')
  const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000')
  
  const now = Date.now()
  const entry = rateLimitMap.get(key)
  
  if (!entry || entry.resetTime < now) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs })
    return true
  }
  
  if (entry.count >= limit) {
    return false
  }
  
  entry.count++
  return true
}

export function middleware(request: NextRequest) {
  // Skip middleware temporarily for debugging mobile issues
  return NextResponse.next()
  
  // Skip middleware in development
  if (process.env.NODE_ENV === 'development') {
    return NextResponse.next()
  }
  
  // Apply rate limiting to API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const rateLimitKey = getRateLimitKey(request)
    
    if (!checkRateLimit(rateLimitKey)) {
      return new NextResponse('Too Many Requests', { 
        status: 429,
        headers: {
          'Retry-After': '60',
          'X-RateLimit-Limit': process.env.RATE_LIMIT_MAX_REQUESTS || '100',
          'X-RateLimit-Remaining': '0',
        }
      })
    }
  }
  
  // Add security headers
  const response = NextResponse.next()
  
  // Security headers
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  
  // Add CSP header in production
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Content-Security-Policy',
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; " +
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
      "font-src 'self' https://fonts.gstatic.com; " +
      "img-src 'self' data: https: blob:; " +
      "connect-src 'self' https://api.uploadthing.com https://uploadthing.com; " +
      "frame-ancestors 'none';"
    )
  }
  
  // Add HSTS in production
  if (process.env.NODE_ENV === 'production' && request.nextUrl.protocol === 'https:') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains'
    )
  }
  
  return response
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

// Global type declaration removed - not needed without setInterval