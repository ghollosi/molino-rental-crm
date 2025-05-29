import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

export async function GET() {
  const results: any = {
    timestamp: new Date().toISOString(),
    env: {
      NODE_ENV: process.env.NODE_ENV,
      DATABASE_URL_EXISTS: !!process.env.DATABASE_URL,
      DATABASE_URL_STARTS: process.env.DATABASE_URL?.substring(0, 30) + '...',
    },
    tests: []
  }

  let prisma: PrismaClient | null = null

  try {
    // Test 1: Create Prisma Client
    prisma = new PrismaClient({
      log: ['query', 'error', 'warn']
    })
    results.tests.push({ test: 'Create PrismaClient', status: 'OK' })

    // Test 2: Connect to database
    await prisma.$connect()
    results.tests.push({ test: 'Connect to database', status: 'OK' })

    // Test 3: Query users count
    const userCount = await prisma.user.count()
    results.tests.push({ 
      test: 'Count users', 
      status: 'OK', 
      result: `${userCount} users found` 
    })

    // Test 4: Get first 3 users
    const users = await prisma.user.findMany({
      take: 3,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    })
    results.tests.push({ 
      test: 'Get users', 
      status: 'OK', 
      result: users 
    })

    // Test 5: Check owner table
    const ownerCount = await prisma.owner.count()
    results.tests.push({ 
      test: 'Count owners', 
      status: 'OK', 
      result: `${ownerCount} owners found` 
    })

    results.overall = 'SUCCESS - Database connection working!'

  } catch (error) {
    results.tests.push({ 
      test: 'Database operation', 
      status: 'ERROR', 
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    results.overall = 'FAILED - Database connection error!'
  } finally {
    if (prisma) {
      await prisma.$disconnect()
    }
  }

  return NextResponse.json(results, { 
    status: results.overall?.includes('SUCCESS') ? 200 : 500 
  })
}