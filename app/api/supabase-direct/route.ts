import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Use direct connection instead of pooler
    const directUrl = "postgresql://postgres:Gabo123kekw@db.wymltaiembzuugxnaqzz.supabase.co:5432/postgres";
    
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: directUrl
        }
      }
    });

    // Test with a very simple query
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@molino.com' },
      select: { id: true, email: true, firstName: true, role: true }
    });

    await prisma.$disconnect();

    return NextResponse.json({
      success: true,
      admin: admin,
      connection: 'Direct Supabase (not pooler)',
      environment: {
        DATABASE_URL: process.env.DATABASE_URL ? 'SET (pooler)' : 'MISSING',
        NEXTAUTH_URL: process.env.NEXTAUTH_URL ? 'SET' : 'MISSING',
        NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'SET' : 'MISSING'
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      connection: 'Direct Supabase (not pooler)',
      note: 'If this fails too, the Supabase project may not be accessible'
    }, { status: 500 });
  }
}