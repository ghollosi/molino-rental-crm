import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Set sample rates to capture a subset of the transactions
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Capture Replay for 10% of all sessions,
  // plus for 100% of sessions with an error
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  // Debug mode in development
  debug: process.env.NODE_ENV === 'development',

  environment: process.env.NODE_ENV || 'development',

  // Additional options
  beforeSend(event, hint) {
    // Filter out specific errors in development
    if (process.env.NODE_ENV === 'development') {
      // Don't send hydration errors in development
      if (event.exception?.values?.[0]?.value?.includes('Hydration')) {
        return null
      }
    }
    
    return event
  },

  integrations: [
    // Replay integration for session recordings
    new Sentry.Replay({
      // Mask all text and input elements
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
})