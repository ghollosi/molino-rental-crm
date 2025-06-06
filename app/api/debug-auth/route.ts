import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Import dinamikusan a függőségeket
    const { PrismaClient } = await import('@prisma/client');
    
    // Új Prisma instance minden request-hez
    const prisma = new PrismaClient({
      log: ['query', 'error', 'warn'],
    });

    console.log('Debug auth - Finding user:', email);

    // Get user directly - firstName is mapped to 'name' column
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        firstName: true,  // This maps to 'name' column
        lastName: true,
        role: true,
        isActive: true
      }
    });

    await prisma.$disconnect();

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User not found',
        debug: { email, userFound: false }
      });
    }

    // Test password
    const isValidPassword = await bcrypt.compare(password, user.password);

    // Generate test hash
    const testHash = await bcrypt.hash(password, 10);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,  // This is actually the 'name' column
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive
      },
      auth: {
        passwordValid: isValidPassword,
        passwordLength: user.password.length,
        hashPreview: user.password.substring(0, 30) + '...',
        testHashPreview: testHash.substring(0, 30) + '...'
      },
      debug: {
        nodeEnv: process.env.NODE_ENV,
        hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
        hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
        databaseUrlSet: !!process.env.DATABASE_URL
      }
    });

  } catch (error) {
    console.error('Debug auth error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      type: error instanceof Error ? error.constructor.name : 'Unknown'
    }, { status: 500 });
  }
}