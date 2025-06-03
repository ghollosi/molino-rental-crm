import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Set sample rates to capture a subset of the transactions
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Debug mode in development
  debug: process.env.NODE_ENV === 'development',

  environment: process.env.NODE_ENV || 'development',

  // Additional server-specific options
  beforeSend(event, hint) {
    // Filter out specific server errors
    if (process.env.NODE_ENV === 'development') {
      // Don't send database connection errors in development
      if (event.exception?.values?.[0]?.value?.includes('ECONNREFUSED')) {
        return null
      }
    }
    
    return event
  },

  // Server-specific integrations
  integrations: [
    // HTTP integration for tracking requests
    new Sentry.Integrations.Http({ tracing: true }),
  ],
})