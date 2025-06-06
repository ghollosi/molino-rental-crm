import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

export async function POST() {
  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    // Get admin user with password
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@molino.com' },
      select: { 
        id: true, 
        email: true, 
        firstName: true, 
        role: true,
        password: true 
      }
    });

    if (!admin) {
      return NextResponse.json({
        success: false,
        error: 'Admin user not found'
      });
    }

    // Test password verification
    const testPassword = 'admin123';
    const isValidPassword = await bcrypt.compare(testPassword, admin.password);

    // Generate new hash for comparison
    const newHash = await bcrypt.hash(testPassword, 10);

    await prisma.$disconnect();

    return NextResponse.json({
      success: true,
      admin: {
        id: admin.id,
        email: admin.email,
        firstName: admin.firstName,
        role: admin.role
      },
      passwordCheck: {
        currentHashValid: isValidPassword,
        currentHashLength: admin.password.length,
        currentHashPreview: admin.password.substring(0, 20) + '...',
        newHashSample: newHash.substring(0, 20) + '...'
      }
    });

  } catch (error) {
    console.error('Password check error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}