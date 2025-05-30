import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    // Get total count
    const totalCount = await prisma.property.count()
    
    // Get first 5 properties raw
    const properties = await prisma.property.findMany({
      take: 5,
      select: {
        id: true,
        street: true,
        city: true,
        status: true,
        shortTermRental: true,
        longTermRental: true,
        licenseRequired: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' }
    })
    
    // Get schema info by checking if columns exist
    let schemaInfo = 'Schema check: '
    try {
      // This will fail if columns don't exist
      await prisma.$queryRaw`SELECT "shortTermRental", "longTermRental", "licenseRequired" FROM "Property" LIMIT 1`
      schemaInfo += 'New columns EXIST'
    } catch (e) {
      schemaInfo += 'New columns MISSING - Schema not updated!'
    }
    
    return NextResponse.json({ 
      totalCount,
      properties,
      schemaInfo,
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Database error',
      message: error.message,
      code: error.code
    }, { status: 500 })
  }
}