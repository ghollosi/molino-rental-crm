import * as Sentry from '@sentry/nextjs'

// Only initialize Sentry in production
if (process.env.NODE_ENV === 'production') {
  Sentry.init({
    dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,
    
    // Performance Monitoring
    tracesSampleRate: 0.1, // 10% of transactions
    
    // Release tracking
    environment: process.env.NODE_ENV,
    
    // Filtering
    ignoreErrors: [
      // Prisma client known errors
      'PrismaClientKnownRequestError',
      // Rate limiting
      'Too Many Requests',
    ],
    
    beforeSend(event, hint) {
      // Don't send events in development
      if (process.env.NODE_ENV === 'development') {
        return null
      }
      
      // Add additional context
      if (event.request) {
        // Remove sensitive data from request
        delete event.request.cookies
        delete event.request.headers?.authorization
        delete event.request.headers?.cookie
      }
      
      return event
    },
    
    // Integrations
    integrations: [
      Sentry.captureConsoleIntegration({
        levels: ['error', 'warn'],
      }),
    ],
  })
}