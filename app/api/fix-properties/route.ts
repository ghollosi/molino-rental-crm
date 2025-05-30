import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    // Count properties with potential NULL values
    const propertiesWithNulls = await prisma.property.findMany({
      where: {
        OR: [
          { shortTermRental: null },
          { longTermRental: null },
          { licenseRequired: null }
        ]
      }
    })
    
    console.log(`Found ${propertiesWithNulls.length} properties with NULL values`)
    
    // Update all properties to ensure they have default values
    const updatePromises = propertiesWithNulls.map(property => 
      prisma.property.update({
        where: { id: property.id },
        data: {
          shortTermRental: property.shortTermRental ?? false,
          longTermRental: property.longTermRental ?? true,
          licenseRequired: property.licenseRequired ?? false,
        }
      })
    )
    
    await Promise.all(updatePromises)
    
    // Get updated count
    const totalProperties = await prisma.property.count()
    
    return NextResponse.json({ 
      success: true, 
      message: `Fixed ${propertiesWithNulls.length} properties with NULL values`,
      totalProperties 
    })
  } catch (error) {
    console.error('Error fixing properties:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fix properties' 
    }, { status: 500 })
  }
}