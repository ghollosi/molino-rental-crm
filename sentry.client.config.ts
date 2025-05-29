import * as Sentry from '@sentry/nextjs'

// Only initialize Sentry in production
if (process.env.NODE_ENV === 'production') {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    
    // Performance Monitoring
    tracesSampleRate: 0.1, // 10% of transactions
    
    // Session Replay
    replaysSessionSampleRate: 0.1, // 10% of sessions
    replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors
    
    // Release tracking
    environment: process.env.NODE_ENV,
    
    // Filtering
    ignoreErrors: [
      // Browser extensions
      'top.GLOBALS',
      // Random network errors
      'Network request failed',
      'NetworkError',
      'Failed to fetch',
      // User cancelled actions
      'AbortError',
      'User cancelled',
    ],
    
    beforeSend(event, hint) {
      // Don't send events in development
      if (process.env.NODE_ENV === 'development') {
        return null
      }
      
      // Filter out non-critical errors
      if (event.level === 'log' || event.level === 'debug') {
        return null
      }
      
      return event
    },
  })
}