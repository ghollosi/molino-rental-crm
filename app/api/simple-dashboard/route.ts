import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Direct database queries without tRPC
    const userCount = await prisma.user.count();
    const ownerCount = await prisma.owner.count();
    const tenantCount = await prisma.tenant.count();
    const providerCount = await prisma.provider.count();
    const propertyCount = await prisma.property.count();

    const users = await prisma.user.findMany({
      take: 5,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      success: true,
      stats: {
        users: userCount,
        owners: ownerCount,
        tenants: tenantCount,
        providers: providerCount,
        properties: propertyCount
      },
      recentUsers: users
    });
  } catch (error) {
    console.error('Simple dashboard error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}