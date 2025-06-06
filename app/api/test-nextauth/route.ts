import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    // Test session
    const session = await auth();
    
    // Test direct auth config
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    // Get admin user
    const user = await prisma.user.findUnique({
      where: { email: 'admin@molino.com' },
      select: {
        id: true,
        email: true,
        password: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true
      }
    });
    
    await prisma.$disconnect();
    
    // Test password directly
    let passwordTest = null;
    if (user) {
      passwordTest = await bcrypt.compare('admin123', user.password);
    }
    
    return NextResponse.json({
      session: session || null,
      user: user ? {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        role: user.role,
        isActive: user.isActive
      } : null,
      passwordTest,
      environment: {
        NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'NOT SET',
        NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'SET' : 'NOT SET',
        NODE_ENV: process.env.NODE_ENV
      }
    });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      type: error instanceof Error ? error.constructor.name : 'Unknown'
    }, { status: 500 });
  }
}