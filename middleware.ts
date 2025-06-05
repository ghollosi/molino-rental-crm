import NextAuth from "next-auth"
import authConfig from "./auth.config"
import { rateLimit } from "@/src/lib/rate-limit"
import { getRateLimitForPath } from "@/src/lib/rate-limit-config"
import { NextResponse } from "next/server"

const { auth } = NextAuth(authConfig)

// Rate limiting configuration - use database storage for production
const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500, // Max 500 users per interval
  useDatabaseStorage: true, // Enable persistent database storage
})

export default auth(async (req) => {
  // Rate limiting for API routes
  if (req.nextUrl.pathname.startsWith("/api/")) {
    const ip = req.ip ?? req.headers.get('x-forwarded-for') ?? 'anonymous'
    const config = getRateLimitForPath(req.nextUrl.pathname)
    const limit = config.max
    
    const { isRateLimited, remaining, reset } = await limiter.check(
      req,
      limit,
      ip
    )

    // Add rate limit headers
    const res = NextResponse.next()
    res.headers.set('X-RateLimit-Limit', limit.toString())
    res.headers.set('X-RateLimit-Remaining', remaining.toString())
    res.headers.set('X-RateLimit-Reset', new Date(reset).toISOString())

    if (isRateLimited) {
      return new NextResponse(JSON.stringify({
        error: 'Too Many Requests',
        message: `Rate limit exceeded. Please try again later.`,
        retryAfter: Math.floor((reset - Date.now()) / 1000),
      }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': new Date(reset).toISOString(),
          'Retry-After': Math.floor((reset - Date.now()) / 1000).toString(),
        },
      })
    }
  }

  const isLoggedIn = !!req.auth
  const isAuthRoute = req.nextUrl.pathname.startsWith("/login") || 
                     req.nextUrl.pathname.startsWith("/register")
  const isPublicRoute = req.nextUrl.pathname === "/" || 
                        req.nextUrl.pathname.startsWith("/api")
  const isDashboardRoute = req.nextUrl.pathname.startsWith("/dashboard")

  // Auth logic
  if (isAuthRoute) {
    if (isLoggedIn) {
      return Response.redirect(new URL("/dashboard", req.nextUrl))
    }
    return
  }

  if (!isLoggedIn && isDashboardRoute) {
    return Response.redirect(new URL("/login", req.nextUrl))
  }

  return
})

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
}