import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    // Test database connection
    const userCount = await prisma.user.count()
    const ownerCount = await prisma.owner.count()
    const propertyCount = await prisma.property.count()
    
    // Try to get the admin user
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@molino.com' }
    })
    
    // Test if we can create a simple record
    const testTime = new Date().toISOString()
    
    return NextResponse.json({
      status: 'connected',
      counts: {
        users: userCount,
        owners: ownerCount,
        properties: propertyCount,
      },
      adminUser: adminUser ? {
        id: adminUser.id,
        email: adminUser.email,
        name: adminUser.name,
        role: adminUser.role,
      } : null,
      testTime,
      databaseUrl: process.env.DATABASE_URL ? 'SET' : 'NOT SET',
      nodeEnv: process.env.NODE_ENV,
    })
  } catch (error) {
    console.error('Database test error:', error)
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      databaseUrl: process.env.DATABASE_URL ? 'SET' : 'NOT SET',
      nodeEnv: process.env.NODE_ENV,
    }, { status: 500 })
  }
}