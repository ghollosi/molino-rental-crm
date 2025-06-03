import { NextRequest, NextResponse } from 'next/server'
import { logError, logApiError, logDatabaseError, trackPerformance } from '@/src/lib/sentry'
import * as Sentry from '@sentry/nextjs'

export async function GET(request: NextRequest) {
  try {
    const testType = request.nextUrl.searchParams.get('type') || 'basic'
    
    switch (testType) {
      case 'basic':
        // Test basic error logging
        const testError = new Error('Test error from Sentry API endpoint')
        logError(testError, { source: 'api', test: true })
        
        return NextResponse.json({
          success: true,
          message: 'Basic error logged to Sentry',
          type: 'basic'
        })
        
      case 'api':
        // Test API error logging
        try {
          throw new Error('Simulated API error for testing')
        } catch (error) {
          logApiError(error as Error, '/api/sentry-test', 'GET', 'test-user')
          
          return NextResponse.json({
            success: true,
            message: 'API error logged to Sentry',
            type: 'api'
          })
        }
        
      case 'database':
        // Test database error logging
        const dbError = new Error('Simulated database connection error')
        logDatabaseError(dbError, 'SELECT', 'test_table')
        
        return NextResponse.json({
          success: true,
          message: 'Database error logged to Sentry',
          type: 'database'
        })
        
      case 'performance':
        // Test performance tracking
        const start = Date.now()
        await new Promise(resolve => setTimeout(resolve, 100)) // Simulate slow operation
        const duration = Date.now() - start
        
        trackPerformance('test_operation', duration, {
          endpoint: '/api/sentry-test',
          operation: 'performance_test'
        })
        
        return NextResponse.json({
          success: true,
          message: `Performance tracked: ${duration}ms`,
          type: 'performance',
          duration
        })
        
      case 'message':
        // Test custom message
        Sentry.captureMessage('Custom test message from API', 'info')
        
        return NextResponse.json({
          success: true,
          message: 'Custom message sent to Sentry',
          type: 'message'
        })
        
      default:
        return NextResponse.json({
          error: 'Invalid test type',
          available: ['basic', 'api', 'database', 'performance', 'message']
        }, { status: 400 })
    }
    
  } catch (error) {
    // This error will be caught by Sentry automatically
    console.error('Sentry test endpoint error:', error)
    
    return NextResponse.json({
      error: 'Test endpoint failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { errorMessage, errorType, context } = body
    
    // Create custom error with provided details
    const customError = new Error(errorMessage || 'Custom test error from POST request')
    
    // Log with custom context
    Sentry.withScope((scope) => {
      scope.setTag('test_type', errorType || 'custom')
      scope.setTag('source', 'api_post')
      
      if (context) {
        scope.setContext('test_context', context)
      }
      
      Sentry.captureException(customError)
    })
    
    return NextResponse.json({
      success: true,
      message: 'Custom error logged to Sentry',
      details: {
        errorMessage,
        errorType,
        context
      }
    })
    
  } catch (error) {
    console.error('Sentry POST test error:', error)
    
    return NextResponse.json({
      error: 'POST test failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}