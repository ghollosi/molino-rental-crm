import * as Sentry from '@sentry/nextjs'

// Only initialize Sentry in production
if (process.env.NODE_ENV === 'production') {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    
    // Performance Monitoring
    tracesSampleRate: 0.1, // 10% of transactions
    
    // Release tracking
    environment: process.env.NODE_ENV,
    
    beforeSend(event, hint) {
      // Don't send events in development
      if (process.env.NODE_ENV === 'development') {
        return null
      }
      
      return event
    },
  })
}