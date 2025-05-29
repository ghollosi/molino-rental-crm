import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'
import { createContext } from '@/server/context'
import { ownerRouter } from '@/server/routers/owner'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    
    const body = await request.json()
    const { name, email, password, phone } = body
    
    console.log('Debug TRPC - Creating owner with:', { name, email, phone })
    
    // Create TRPC context
    const ctx = await createContext({ 
      auth: session,
      req: request as any,
      res: {} as any 
    })
    
    // Call the quickCreate procedure directly
    const caller = ownerRouter.createCaller(ctx)
    
    const result = await caller.quickCreate({
      name,
      email,
      password,
      phone,
    })
    
    console.log('Owner created successfully:', result)
    
    return NextResponse.json({ 
      success: true,
      owner: result
    })
    
  } catch (error) {
    console.error('Debug TRPC error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to create owner',
      details: error,
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}