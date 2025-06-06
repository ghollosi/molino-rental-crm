import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    // Create Owner table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "Owner" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "userId" TEXT NOT NULL UNIQUE,
        "companyName" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create Property table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "Property" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "ownerId" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "address" TEXT NOT NULL,
        "type" TEXT NOT NULL DEFAULT 'RESIDENTIAL',
        "monthlyRent" DECIMAL(10,2),
        "capacity" INTEGER DEFAULT 1,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create Tenant table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "Tenant" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "userId" TEXT NOT NULL UNIQUE,
        "occupation" TEXT,
        "monthlyIncome" DECIMAL(10,2),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create Provider table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "Provider" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "userId" TEXT NOT NULL UNIQUE,
        "specialization" TEXT NOT NULL,
        "hourlyRate" DECIMAL(10,2),
        "completedJobs" INTEGER NOT NULL DEFAULT 0,
        "rating" DECIMAL(3,2),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await prisma.$disconnect();

    return NextResponse.json({
      success: true,
      message: 'Basic tables created successfully',
      tables: ['Owner', 'Property', 'Tenant', 'Provider']
    });

  } catch (error) {
    console.error('Table creation error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}