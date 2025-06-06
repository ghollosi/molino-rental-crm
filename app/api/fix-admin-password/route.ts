import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

export async function POST() {
  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    // Generate correct password hash
    const correctPassword = 'admin123';
    const hashedPassword = await bcrypt.hash(correctPassword, 10);

    // Update admin user password
    const updatedAdmin = await prisma.user.update({
      where: { email: 'admin@molino.com' },
      data: { password: hashedPassword },
      select: {
        id: true,
        email: true,
        firstName: true,
        role: true
      }
    });

    // Verify the fix worked
    const verification = await bcrypt.compare(correctPassword, hashedPassword);

    await prisma.$disconnect();

    return NextResponse.json({
      success: true,
      message: 'Admin password updated successfully',
      admin: updatedAdmin,
      verification: verification,
      newHashPreview: hashedPassword.substring(0, 20) + '...'
    });

  } catch (error) {
    console.error('Password fix error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}