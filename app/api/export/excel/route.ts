/**
 * @file Excel Export API Endpoint
 * @description API endpoint for generating Excel exports
 * @created 2025-05-28
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/src/lib/db';
import { 
  exportPropertiesToExcel,
  exportOwnersToExcel,
  exportTenantsToExcel,
  exportIssuesToExcel,
  exportOffersToExcel,
  exportProvidersToExcel
} from '@/src/lib/excel';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session) {
      return NextResponse.json({ error: 'Nem vagy bejelentkezve' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const filters = {};

    let buffer: Buffer;
    let filename: string;

    switch (type) {
      case 'properties':
        const properties = await db.property.findMany({
          where: buildWhereClause(filters, session),
          include: {
            owner: { include: { user: true } },
            currentTenant: { include: { user: true } },
          },
          orderBy: { createdAt: 'desc' },
        });
        
        buffer = await exportPropertiesToExcel(properties);
        filename = `ingatlanok-${new Date().toISOString().split('T')[0]}.xlsx`;
        break;

      case 'owners':
        const owners = await db.owner.findMany({
          include: {
            user: true,
            _count: { select: { properties: true } },
          },
          orderBy: { createdAt: 'desc' },
        });
        
        buffer = await exportOwnersToExcel(owners);
        filename = `tulajdonosok-${new Date().toISOString().split('T')[0]}.xlsx`;
        break;

      case 'tenants':
        const tenants = await db.tenant.findMany({
          include: {
            user: true,
            _count: { select: { properties: true } },
          },
          orderBy: { createdAt: 'desc' },
        });
        
        buffer = await exportTenantsToExcel(tenants);
        filename = `berlok-${new Date().toISOString().split('T')[0]}.xlsx`;
        break;

      case 'issues':
        const issuesWhere = await buildIssuesWhereClause(filters, session);
        const issues = await db.issue.findMany({
          where: issuesWhere,
          include: {
            property: true,
            reportedBy: true,
            assignedTo: { include: { user: true } },
          },
          orderBy: { createdAt: 'desc' },
        });
        
        buffer = await exportIssuesToExcel(issues);
        filename = `hibabejelentesek-${new Date().toISOString().split('T')[0]}.xlsx`;
        break;

      case 'offers':
        const offersWhere = await buildOffersWhereClause(filters, session);
        const offers = await db.offer.findMany({
          where: offersWhere,
          include: {
            property: true,
            issue: true,
            createdBy: true,
          },
          orderBy: { createdAt: 'desc' },
        });
        
        buffer = await exportOffersToExcel(offers);
        filename = `ajanlatok-${new Date().toISOString().split('T')[0]}.xlsx`;
        break;

      case 'providers':
        const providers = await db.provider.findMany({
          include: {
            user: true,
            _count: { select: { assignedIssues: true } },
          },
          orderBy: { createdAt: 'desc' },
        });
        
        buffer = await exportProvidersToExcel(providers);
        filename = `szolgaltatok-${new Date().toISOString().split('T')[0]}.xlsx`;
        break;

      default:
        return NextResponse.json({ error: 'Érvénytelen export típus' }, { status: 400 });
    }

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length.toString(),
      },
    });

  } catch (error) {
    console.error('Excel export error:', error);
    return NextResponse.json(
      { 
        error: 'Hiba történt az Excel generálása során', 
        details: error instanceof Error ? error.message : 'Ismeretlen hiba' 
      },
      { status: 500 }
    );
  }
}

// Helper functions to build where clauses based on filters and permissions
function buildWhereClause(filters: any, session: any): any {
  const where: any = {};

  // Apply filters
  if (filters.search) {
    where.OR = [
      { street: { contains: filters.search, mode: 'insensitive' } },
      { city: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.type) {
    where.type = filters.type;
  }

  return where;
}

async function buildIssuesWhereClause(filters: any, session: any): Promise<any> {
  const where: any = {};

  // Role-based filtering
  if (session.user.role === 'OWNER') {
    const owner = await db.owner.findUnique({
      where: { userId: session.user.id },
      include: { properties: { select: { id: true } } },
    });
    if (owner) {
      where.propertyId = { in: owner.properties.map(p => p.id) };
    }
  } else if (session.user.role === 'TENANT') {
    where.reportedById = session.user.id;
  } else if (session.user.role === 'PROVIDER') {
    const provider = await db.provider.findUnique({
      where: { userId: session.user.id },
    });
    if (provider) {
      where.assignedToId = provider.id;
    }
  }

  // Apply filters
  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search, mode: 'insensitive' } },
      { description: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.priority) {
    where.priority = filters.priority;
  }

  if (filters.category) {
    where.category = filters.category;
  }

  return where;
}

async function buildOffersWhereClause(filters: any, session: any): Promise<any> {
  const where: any = {};

  // Role-based filtering for non-admins
  if (!['ADMIN', 'EDITOR_ADMIN', 'OFFICE_ADMIN'].includes(session.user.role)) {
    if (session.user.role === 'OWNER') {
      const owner = await db.owner.findUnique({
        where: { userId: session.user.id },
        include: { properties: { select: { id: true } } },
      });
      if (owner) {
        where.propertyId = { in: owner.properties.map(p => p.id) };
      }
    } else {
      where.createdById = session.user.id;
    }
  }

  // Apply filters
  if (filters.search) {
    where.OR = [
      { offerNumber: { contains: filters.search, mode: 'insensitive' } },
      { notes: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  if (filters.status) {
    where.status = filters.status;
  }

  return where;
}