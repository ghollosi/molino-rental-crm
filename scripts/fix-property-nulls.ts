import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixPropertyNulls() {
  console.log('=== Fixing NULL values in properties ===\n')
  
  try {
    // Update all properties with NULL values to have default values
    const result = await prisma.$executeRaw`
      UPDATE "Property"
      SET 
        "shortTermRental" = COALESCE("shortTermRental", false),
        "longTermRental" = COALESCE("longTermRental", true),
        "licenseRequired" = COALESCE("licenseRequired", false)
      WHERE 
        "shortTermRental" IS NULL OR 
        "longTermRental" IS NULL OR 
        "licenseRequired" IS NULL
    `
    
    console.log(`Updated ${result} properties with NULL values`)
    
    // Verify the fix
    const properties = await prisma.property.findMany({
      select: {
        id: true,
        street: true,
        city: true,
        shortTermRental: true,
        longTermRental: true,
        licenseRequired: true,
      }
    })
    
    console.log('\nAll properties after fix:')
    properties.forEach((prop) => {
      console.log(`- ${prop.street}, ${prop.city}`)
      console.log(`  shortTermRental: ${prop.shortTermRental}`)
      console.log(`  longTermRental: ${prop.longTermRental}`)
      console.log(`  licenseRequired: ${prop.licenseRequired}`)
    })
    
  } catch (error) {
    console.error('Error fixing property nulls:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Only run this if called directly
if (require.main === module) {
  console.log('This script will update all properties with NULL values in the new fields.')
  console.log('Run this on your PRODUCTION database to fix the issue.')
  console.log('\nTo run on production:')
  console.log('DATABASE_URL="your-production-db-url" npx tsx scripts/fix-property-nulls.ts')
}

export { fixPropertyNulls }