import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    // Try to add the missing columns
    const queries = [
      `ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "shortTermRental" BOOLEAN DEFAULT false`,
      `ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "longTermRental" BOOLEAN DEFAULT true`, 
      `ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "licenseRequired" BOOLEAN DEFAULT false`,
      // Owner updates
      `ALTER TABLE "Owner" ADD COLUMN IF NOT EXISTS "companyName" TEXT`,
      `ALTER TABLE "Owner" ADD COLUMN IF NOT EXISTS "isCompany" BOOLEAN DEFAULT false`,
      `ALTER TABLE "Owner" ADD COLUMN IF NOT EXISTS "documents" TEXT[] DEFAULT '{}'`,
      // Tenant updates
      `ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "documents" TEXT[] DEFAULT '{}'`,
      // Provider updates  
      `ALTER TABLE "Provider" ADD COLUMN IF NOT EXISTS "contactName" TEXT`,
      `ALTER TABLE "Provider" ADD COLUMN IF NOT EXISTS "contactEmail" TEXT`,
      `ALTER TABLE "Provider" ADD COLUMN IF NOT EXISTS "contactPhone" TEXT`,
      `ALTER TABLE "Provider" ADD COLUMN IF NOT EXISTS "travelCostPerKm" DECIMAL`,
      `ALTER TABLE "Provider" ADD COLUMN IF NOT EXISTS "companyDetails" TEXT`,
      `ALTER TABLE "Provider" ADD COLUMN IF NOT EXISTS "referenceSource" TEXT`,
      `ALTER TABLE "Provider" ADD COLUMN IF NOT EXISTS "isVerified" BOOLEAN DEFAULT false`,
      `ALTER TABLE "Provider" ADD COLUMN IF NOT EXISTS "inviteToken" TEXT`,
      `ALTER TABLE "Provider" ADD COLUMN IF NOT EXISTS "invitedAt" TIMESTAMP(3)`,
      `ALTER TABLE "Provider" ADD COLUMN IF NOT EXISTS "registeredAt" TIMESTAMP(3)`
    ]
    
    const results = []
    
    for (const query of queries) {
      try {
        await prisma.$executeRawUnsafe(query)
        results.push({ query: query.substring(0, 50) + '...', status: 'success' })
      } catch (error: any) {
        results.push({ 
          query: query.substring(0, 50) + '...', 
          status: 'error',
          message: error.message 
        })
      }
    }
    
    // Test if properties can be queried now
    let testResult = 'not tested'
    try {
      const count = await prisma.property.count()
      const firstProperty = await prisma.property.findFirst({
        select: {
          id: true,
          street: true,
          shortTermRental: true,
          longTermRental: true,
          licenseRequired: true
        }
      })
      testResult = `Success! Found ${count} properties. First property has new fields: ${JSON.stringify({
        shortTermRental: firstProperty?.shortTermRental,
        longTermRental: firstProperty?.longTermRental,
        licenseRequired: firstProperty?.licenseRequired
      })}`
    } catch (error: any) {
      testResult = `Failed: ${error.message}`
    }
    
    return NextResponse.json({ 
      message: 'Schema update attempted',
      results,
      testResult,
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Failed to update schema',
      message: error.message
    }, { status: 500 })
  }
}