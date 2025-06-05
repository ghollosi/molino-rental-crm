import * as Sentry from "@sentry/nextjs"

// Error logging with context
export function logError(error: Error, context?: Record<string, any>) {
  Sentry.withScope((scope) => {
    if (context) {
      scope.setContext("error_context", context)
    }
    Sentry.captureException(error)
  })
}

// Custom error logging with tags
export function logErrorWithTags(error: Error, tags?: Record<string, string>, context?: Record<string, any>) {
  Sentry.withScope((scope) => {
    if (tags) {
      Object.entries(tags).forEach(([key, value]) => {
        scope.setTag(key, value)
      })
    }
    
    if (context) {
      scope.setContext("error_context", context)
    }
    
    Sentry.captureException(error)
  })
}

// API Error logging
export function logApiError(error: Error, endpoint: string, method: string, userId?: string) {
  logErrorWithTags(
    error,
    {
      endpoint,
      method,
      error_type: 'api_error'
    },
    {
      userId,
      timestamp: new Date().toISOString()
    }
  )
}

// Database Error logging
export function logDatabaseError(error: Error, operation: string, table?: string) {
  logErrorWithTags(
    error,
    {
      operation,
      table: table || 'unknown',
      error_type: 'database_error'
    }
  )
}

// Authentication Error logging
export function logAuthError(error: Error, action: string, email?: string) {
  logErrorWithTags(
    error,
    {
      action,
      error_type: 'auth_error'
    },
    {
      email: email ? email.substring(0, 3) + '***' : undefined // Masked email for privacy
    }
  )
}

// Rate Limiting Error logging
export function logRateLimitError(ip: string, endpoint: string, limit: number) {
  Sentry.withScope((scope) => {
    scope.setTag('error_type', 'rate_limit')
    scope.setTag('endpoint', endpoint)
    scope.setContext('rate_limit_context', {
      ip: ip.substring(0, 8) + '***', // Masked IP for privacy
      limit,
      timestamp: new Date().toISOString()
    })
    
    Sentry.captureMessage(`Rate limit exceeded for ${endpoint}`, 'warning')
  })
}

// Performance monitoring
export function trackPerformance(name: string, duration: number, metadata?: Record<string, any>) {
  Sentry.withScope((scope) => {
    scope.setTag('performance_metric', name)
    scope.setContext('performance_context', {
      duration,
      ...metadata
    })
    
    // Only log slow operations (> 1 second) as warnings
    if (duration > 1000) {
      Sentry.captureMessage(`Slow operation: ${name} took ${duration}ms`, 'warning')
    }
  })
}

// User feedback capture
export function captureUserFeedback(userId: string, name: string, email: string, message: string) {
  const user = {
    id: userId,
    username: name,
    email: email
  }
  
  Sentry.captureUserFeedback({
    event_id: Sentry.lastEventId(),
    name,
    email,
    comments: message
  })
}