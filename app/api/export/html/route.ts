/**
 * @file HTML Export API Endpoint
 * @description API endpoint for generating printable HTML (for PDF conversion)
 * @created 2025-05-28
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { generateOfferHTML, generateReportHTML } from '@/lib/pdf-simple';
import { 
  generatePropertiesListHTML,
  generateOwnersListHTML,
  generateTenantsListHTML,
  generateIssuesListHTML,
  generateOffersListHTML,
  generateProvidersListHTML
} from '@/lib/pdf-lists';

// POST metódus egyedi dokumentumokhoz (ajánlat, riport)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session) {
      return NextResponse.json({ error: 'Nem vagy bejelentkezve' }, { status: 401 });
    }

    const body = await request.json();
    const { type, id, data } = body;

    let html: string;

    switch (type) {
      case 'offer':
        if (id) {
          // Generate HTML from database offer
          const offer = await db.offer.findUnique({
            where: { id },
            include: {
              property: {
                include: {
                  owner: { include: { user: true } }
                }
              },
              createdBy: true,
            }
          });

          if (!offer) {
            return NextResponse.json({ error: 'Ajánlat nem található' }, { status: 404 });
          }

          // Check permissions
          const hasAccess = await checkOfferAccess(session, offer);
          if (!hasAccess) {
            return NextResponse.json({ error: 'Hozzáférés megtagadva' }, { status: 403 });
          }

          const offerData = {
            id: offer.id,
            offerNumber: offer.offerNumber,
            property: offer.property,
            items: offer.items as any[],
            laborCost: Number(offer.laborCost),
            materialCost: Number(offer.materialCost),
            totalAmount: Number(offer.totalAmount),
            currency: offer.currency,
            validUntil: offer.validUntil,
            notes: offer.notes,
            createdAt: offer.createdAt,
            createdBy: offer.createdBy
          };

          html = generateOfferHTML(offerData);
        } else if (data) {
          // Generate HTML from provided data
          html = generateOfferHTML(data);
        } else {
          return NextResponse.json({ error: 'Hiányzó adatok' }, { status: 400 });
        }
        break;

      case 'report':
        if (data) {
          html = generateReportHTML(data);
        } else {
          return NextResponse.json({ error: 'Hiányzó riport adatok' }, { status: 400 });
        }
        break;

      default:
        return NextResponse.json({ error: 'Érvénytelen export típus' }, { status: 400 });
    }

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });

  } catch (error) {
    console.error('HTML generation error:', error);
    return NextResponse.json(
      { 
        error: 'Hiba történt a HTML generálása során', 
        details: error instanceof Error ? error.message : 'Ismeretlen hiba' 
      },
      { status: 500 }
    );
  }
}

// GET metódus listák exportálásához
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session) {
      return NextResponse.json({ error: 'Nem vagy bejelentkezve' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const list = searchParams.get('list') === 'true';

    if (!list) {
      return NextResponse.json({ error: 'Használd a POST metódust egyedi dokumentumokhoz' }, { status: 400 });
    }

    let html: string;

    switch (type) {
      case 'properties':
        const properties = await db.property.findMany({
          include: {
            owner: { include: { user: true } },
            currentTenant: { include: { user: true } },
          },
          orderBy: { createdAt: 'desc' },
        });
        html = generatePropertiesListHTML(properties);
        break;

      case 'owners':
        const owners = await db.owner.findMany({
          include: {
            user: true,
            _count: { select: { properties: true } },
          },
          orderBy: { createdAt: 'desc' },
        });
        html = generateOwnersListHTML(owners);
        break;

      case 'tenants':
        const tenants = await db.tenant.findMany({
          include: {
            user: true,
            _count: { select: { properties: true } },
          },
          orderBy: { createdAt: 'desc' },
        });
        html = generateTenantsListHTML(tenants);
        break;

      case 'issues':
        const issues = await db.issue.findMany({
          include: {
            property: true,
            reportedBy: true,
            assignedTo: { include: { user: true } },
          },
          orderBy: { createdAt: 'desc' },
        });
        html = generateIssuesListHTML(issues);
        break;

      case 'offers':
        const offers = await db.offer.findMany({
          include: {
            property: true,
            issue: true,
            createdBy: true,
          },
          orderBy: { createdAt: 'desc' },
        });
        html = generateOffersListHTML(offers);
        break;

      case 'providers':
        const providers = await db.provider.findMany({
          include: {
            user: true,
            _count: { select: { assignedIssues: true } },
          },
          orderBy: { createdAt: 'desc' },
        });
        html = generateProvidersListHTML(providers);
        break;

      default:
        return NextResponse.json({ error: 'Érvénytelen lista típus' }, { status: 400 });
    }

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });

  } catch (error) {
    console.error('HTML generation error:', error);
    return NextResponse.json(
      { 
        error: 'Hiba történt a HTML generálása során', 
        details: error instanceof Error ? error.message : 'Ismeretlen hiba' 
      },
      { status: 500 }
    );
  }
}

async function checkOfferAccess(session: any, offer: any): Promise<boolean> {
  const userRole = session.user.role;
  const userId = session.user.id;

  // Admins have access to all offers
  if (['ADMIN', 'EDITOR_ADMIN', 'OFFICE_ADMIN'].includes(userRole)) {
    return true;
  }

  // Check if user is the owner of the property
  if (userRole === 'OWNER') {
    const owner = await db.owner.findUnique({
      where: { userId },
    });
    return owner ? offer.property.ownerId === owner.id : false;
  }

  // Check if user created the offer
  return offer.createdById === userId;
}