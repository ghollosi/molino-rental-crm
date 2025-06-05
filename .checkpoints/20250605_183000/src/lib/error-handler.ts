import { TRPCError } from '@trpc/server'
import { NextRequest, NextResponse } from 'next/server'
import { logError, logApiError, logDatabaseError, logAuthError } from './sentry'

// Global error handler for API routes
export function handleApiError(error: unknown, req: NextRequest): NextResponse {
  console.error('API Error:', error)

  if (error instanceof Error) {
    // Log to Sentry with context
    logApiError(
      error,
      req.nextUrl.pathname,
      req.method,
      req.headers.get('user-id') || undefined
    )

    // Return appropriate error response
    if (error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      )
    }

    if (error.message.includes('Forbidden')) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    if (error.message.includes('Not found')) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Resource not found' },
        { status: 404 }
      )
    }

    // Generic error
    return NextResponse.json(
      { 
        error: 'Internal Server Error', 
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
      },
      { status: 500 }
    )
  }

  // Unknown error type
  logError(new Error('Unknown API error'), { error: String(error) })
  return NextResponse.json(
    { error: 'Internal Server Error', message: 'Something went wrong' },
    { status: 500 }
  )
}

// tRPC error handler
export function handleTRPCError(error: unknown, procedure: string, input?: any): TRPCError {
  console.error(`tRPC Error in ${procedure}:`, error)

  if (error instanceof TRPCError) {
    // Already a tRPC error, just log it
    logError(new Error(`tRPC ${error.code}: ${error.message}`), {
      procedure,
      code: error.code,
      input: input ? JSON.stringify(input).substring(0, 500) : undefined
    })
    return error
  }

  if (error instanceof Error) {
    // Convert regular error to tRPC error
    logError(error, {
      procedure,
      input: input ? JSON.stringify(input).substring(0, 500) : undefined
    })

    // Check for specific error types
    if (error.message.includes('Unique constraint')) {
      return new TRPCError({
        code: 'CONFLICT',
        message: 'Resource already exists',
      })
    }

    if (error.message.includes('Record to update not found')) {
      return new TRPCError({
        code: 'NOT_FOUND',
        message: 'Resource not found',
      })
    }

    if (error.message.includes('P2002')) { // Prisma unique constraint
      return new TRPCError({
        code: 'CONFLICT',
        message: 'Duplicate entry detected',
      })
    }

    if (error.message.includes('P2025')) { // Prisma record not found
      return new TRPCError({
        code: 'NOT_FOUND',
        message: 'Record not found',
      })
    }

    // Generic internal server error
    return new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    })
  }

  // Unknown error
  logError(new Error('Unknown tRPC error'), { 
    procedure, 
    error: String(error),
    input: input ? JSON.stringify(input).substring(0, 500) : undefined
  })
  
  return new TRPCError({
    code: 'INTERNAL_SERVER_ERROR',
    message: 'Something went wrong',
  })
}

// Database error handler
export function handleDatabaseError(error: unknown, operation: string, table?: string): never {
  console.error(`Database Error (${operation}):`, error)

  if (error instanceof Error) {
    logDatabaseError(error, operation, table)
    
    // Re-throw as tRPC error
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Database operation failed',
    })
  }

  // Unknown error
  logError(new Error('Unknown database error'), { 
    operation, 
    table, 
    error: String(error) 
  })
  
  throw new TRPCError({
    code: 'INTERNAL_SERVER_ERROR',
    message: 'Database operation failed',
  })
}

// Authentication error handler
export function handleAuthError(error: unknown, action: string, email?: string): never {
  console.error(`Auth Error (${action}):`, error)

  if (error instanceof Error) {
    logAuthError(error, action, email)
    
    // Re-throw as tRPC error
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Authentication failed',
    })
  }

  // Unknown error
  logError(new Error('Unknown auth error'), { 
    action, 
    email: email ? email.substring(0, 3) + '***' : undefined,
    error: String(error) 
  })
  
  throw new TRPCError({
    code: 'UNAUTHORIZED',
    message: 'Authentication failed',
  })
}