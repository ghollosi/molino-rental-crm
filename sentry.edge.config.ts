import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Set sample rates to capture a subset of the transactions
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Debug mode in development  
  debug: process.env.NODE_ENV === 'development',

  environment: process.env.NODE_ENV || 'development',

  // Edge runtime specific configuration
  beforeSend(event, hint) {
    // Filter out specific edge errors
    if (process.env.NODE_ENV === 'development') {
      // Don't send middleware errors in development
      if (event.exception?.values?.[0]?.value?.includes('middleware')) {
        return null
      }
    }
    
    return event
  },
})