import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    // Get all data from all tables
    const users = await prisma.user.findMany({
      select: { id: true, email: true, firstName: true, lastName: true, role: true }
    });

    const owners = await prisma.owner.findMany({
      include: { user: { select: { email: true, firstName: true, lastName: true } } }
    });

    const tenants = await prisma.tenant.findMany({
      include: { user: { select: { email: true, firstName: true, lastName: true } } }
    });

    const properties = await prisma.property.findMany({
      include: { owner: { include: { user: true } } }
    });

    const providers = await prisma.provider.findMany({
      include: { user: { select: { email: true, firstName: true, lastName: true } } }
    });

    const issues = await prisma.issue.findMany({
      include: { 
        property: true,
        reportedBy: { select: { email: true, firstName: true } }
      }
    });

    await prisma.$disconnect();

    return NextResponse.json({
      success: true,
      counts: {
        users: users.length,
        owners: owners.length,
        tenants: tenants.length,
        properties: properties.length,
        providers: providers.length,
        issues: issues.length
      },
      data: {
        users,
        owners,
        tenants,
        properties,
        providers,
        issues
      }
    });

  } catch (error) {
    console.error('Debug data error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}