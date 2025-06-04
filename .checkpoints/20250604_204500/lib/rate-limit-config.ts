// Rate limiting configuration for different route types

export const rateLimitConfig = {
  // API routes - general
  api: {
    windowMs: 60 * 1000, // 1 minute
    max: 10, // 10 requests per minute
  },
  
  // Auth routes (login, register, reset password)
  auth: {
    windowMs: 60 * 1000, // 1 minute
    max: 30, // 30 requests per minute (NextAuth needs frequent session checks)
  },
  
  // File upload routes
  upload: {
    windowMs: 60 * 1000, // 1 minute
    max: 20, // 20 uploads per minute (increased for testing)
  },
  
  // Export routes (PDF, Excel)
  export: {
    windowMs: 60 * 1000, // 1 minute
    max: 20, // 20 exports per minute
  },
  
  // Email sending routes
  email: {
    windowMs: 60 * 1000, // 1 minute
    max: 3, // 3 emails per minute
  },
  
  // tRPC routes
  trpc: {
    windowMs: 60 * 1000, // 1 minute
    max: 60, // 60 requests per minute
  },
  
  // Cron/workflow routes
  cron: {
    windowMs: 60 * 1000, // 1 minute
    max: 1, // 1 request per minute
  },
}

// Get rate limit config for a specific path
export function getRateLimitForPath(pathname: string): { windowMs: number; max: number } {
  // NextAuth session endpoints need higher limits
  if (pathname.includes('/api/auth/session') || pathname.includes('/api/auth/csrf')) {
    return {
      windowMs: 60 * 1000, // 1 minute
      max: 100, // 100 requests per minute for session checks
    }
  }
  
  if (pathname.includes('/api/auth/') || pathname.includes('/forgot-password') || pathname.includes('/reset-password')) {
    return rateLimitConfig.auth
  }
  
  if (pathname.includes('/api/upload') || pathname.includes('/api/cloud-storage')) {
    return rateLimitConfig.upload
  }
  
  if (pathname.includes('/api/export') || pathname.includes('/api/reports')) {
    return rateLimitConfig.export
  }
  
  if (pathname.includes('/api/email') || pathname.includes('/api/test-email')) {
    return rateLimitConfig.email
  }
  
  if (pathname.includes('/api/cron')) {
    return rateLimitConfig.cron
  }
  
  if (pathname.includes('/api/trpc')) {
    return rateLimitConfig.trpc
  }
  
  // Default for all other API routes
  return rateLimitConfig.api
}