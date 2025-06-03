import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    message: 'Rate limit test endpoint working',
    timestamp: new Date().toISOString(),
    ip: request.ip || request.headers.get('x-forwarded-for') || 'unknown'
  })
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  
  return NextResponse.json({ 
    message: 'Rate limit test POST endpoint working',
    timestamp: new Date().toISOString(),
    ip: request.ip || request.headers.get('x-forwarded-for') || 'unknown',
    body
  })
}