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
      `ALTER TABLE "Provider" ADD COLUMN IF NOT EXISTS "registeredAt" TIMESTAMP(3)`,
      
      // Create CoTenant table
      `CREATE TABLE IF NOT EXISTS "CoTenant" (
        "id" TEXT NOT NULL,
        "tenantId" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "email" TEXT NOT NULL,
        "phone" TEXT,
        "idNumber" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "CoTenant_pkey" PRIMARY KEY ("id")
      )`,
      
      // Create TenantBooking table
      `CREATE TABLE IF NOT EXISTS "TenantBooking" (
        "id" TEXT NOT NULL,
        "tenantId" TEXT NOT NULL,
        "propertyId" TEXT NOT NULL,
        "checkInDate" TIMESTAMP(3) NOT NULL,
        "checkInTime" TEXT NOT NULL,
        "checkOutDate" TIMESTAMP(3) NOT NULL,
        "checkOutTime" TEXT NOT NULL,
        "guestCount" INTEGER NOT NULL DEFAULT 1,
        "babyBedRequired" BOOLEAN NOT NULL DEFAULT false,
        "childSeatRequired" BOOLEAN NOT NULL DEFAULT false,
        "foodPreparation" BOOLEAN NOT NULL DEFAULT false,
        "specialRequests" TEXT,
        "status" TEXT NOT NULL DEFAULT 'PENDING',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "TenantBooking_pkey" PRIMARY KEY ("id")
      )`,
      
      // Create PropertyService table
      `CREATE TABLE IF NOT EXISTS "PropertyService" (
        "id" TEXT NOT NULL,
        "propertyId" TEXT NOT NULL,
        "providerId" TEXT NOT NULL,
        "serviceType" TEXT NOT NULL DEFAULT 'MAINTENANCE',
        "description" TEXT,
        "monthlyFee" DECIMAL(65,30),
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "PropertyService_pkey" PRIMARY KEY ("id")
      )`,
      
      // Add foreign key constraints if they don't exist
      `DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CoTenant_tenantId_fkey') THEN
          ALTER TABLE "CoTenant" ADD CONSTRAINT "CoTenant_tenantId_fkey" 
          FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
      END $$;`,
      
      `DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'TenantBooking_tenantId_fkey') THEN
          ALTER TABLE "TenantBooking" ADD CONSTRAINT "TenantBooking_tenantId_fkey" 
          FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
      END $$;`,
      
      `DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'TenantBooking_propertyId_fkey') THEN
          ALTER TABLE "TenantBooking" ADD CONSTRAINT "TenantBooking_propertyId_fkey" 
          FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
      END $$;`,
      
      `DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PropertyService_propertyId_fkey') THEN
          ALTER TABLE "PropertyService" ADD CONSTRAINT "PropertyService_propertyId_fkey" 
          FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
      END $$;`,
      
      `DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PropertyService_providerId_fkey') THEN
          ALTER TABLE "PropertyService" ADD CONSTRAINT "PropertyService_providerId_fkey" 
          FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
      END $$;`
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