import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Test the database connection with a simple query
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      }
    });

    // Simple query to test connection
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    
    // Get admin user
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@molino.com' },
      select: { id: true, email: true, firstName: true, role: true }
    });

    await prisma.$disconnect();

    return NextResponse.json({
      success: true,
      database: 'Connected',
      test: result,
      admin: admin,
      environment: {
        DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'MISSING',
        NEXTAUTH_URL: process.env.NEXTAUTH_URL ? 'SET' : 'MISSING',
        NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'SET' : 'MISSING'
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      environment: {
        DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'MISSING',
        NEXTAUTH_URL: process.env.NEXTAUTH_URL ? 'SET' : 'MISSING',
        NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'SET' : 'MISSING'
      }
    }, { status: 500 });
  }
}