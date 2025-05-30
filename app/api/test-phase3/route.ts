import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ 
    message: 'Phase 3 tenant module is deployed!',
    timestamp: new Date().toISOString(),
    features: [
      'Document upload for tenants',
      'Co-tenant management',
      'Booking system with special requests',
      'Schema update API'
    ]
  })
}