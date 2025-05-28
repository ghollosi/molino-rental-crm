/**
 * @file PDF Export API Endpoint
 * @description API endpoint for generating PDFs
 * @created 2025-05-28
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/auth.config';
import { db } from '@/src/lib/db';
import { generateOfferPDF, generateReportPDF } from '@/src/lib/pdf-new';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type, id, data } = body;

    let pdfBuffer: Buffer;
    let filename: string;

    switch (type) {
      case 'offer':
        if (id) {
          // Generate PDF from database offer
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
            return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
          }

          // Check permissions
          const hasAccess = await checkOfferAccess(session, offer);
          if (!hasAccess) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
          }

          const offerData = {
            id: offer.id,
            offerNumber: offer.offerNumber,
            property: offer.property,
            items: Array.isArray(offer.items) ? offer.items as any[] : [],
            laborCost: Number(offer.laborCost || 0),
            materialCost: Number(offer.materialCost || 0),
            totalAmount: Number(offer.totalAmount),
            currency: offer.currency,
            validUntil: offer.validUntil,
            notes: offer.notes,
            createdAt: offer.createdAt,
            createdBy: offer.createdBy
          };

          pdfBuffer = await generateOfferPDF(offerData);
          filename = `ajanlat-${offer.offerNumber}.pdf`;
        } else if (data) {
          // Generate PDF from provided data
          pdfBuffer = await generateOfferPDF(data);
          filename = `ajanlat-${data.offerNumber || 'test'}.pdf`;
        } else {
          return NextResponse.json({ error: 'Missing offer ID or data' }, { status: 400 });
        }
        break;

      case 'report':
        if (!data) {
          return NextResponse.json({ error: 'Missing report data' }, { status: 400 });
        }
        
        pdfBuffer = await generateReportPDF(data);
        filename = `jelentes-${new Date().toISOString().split('T')[0]}.pdf`;
        break;

      case 'test':
        // Test PDF generation
        const testOfferData = {
          id: 'test-123',
          offerNumber: 'TEST-2025-001',
          property: {
            street: 'Teszt utca 123',
            city: 'Budapest',
            owner: {
              user: {
                name: 'Teszt Tulajdonos',
                email: 'teszt@example.com'
              }
            }
          },
          items: [
            {
              description: 'Vízcsap javítás',
              quantity: 1,
              unitPrice: 15000,
              total: 15000
            },
            {
              description: 'Csővezeték ellenőrzés',
              quantity: 2,
              unitPrice: 8000,
              total: 16000
            }
          ],
          laborCost: 25000,
          materialCost: 6000,
          totalAmount: 31000,
          currency: 'EUR',
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          notes: 'Ez egy teszt ajánlat a PDF generálás teszteléséhez.',
          createdAt: new Date(),
          createdBy: { name: session.user.name || 'Test User' }
        };

        pdfBuffer = await generateOfferPDF(testOfferData);
        filename = 'teszt-ajanlat.pdf';
        break;

      default:
        return NextResponse.json({ error: 'Invalid PDF type' }, { status: 400 });
    }

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });

  } catch (error) {
    console.error('PDF generation error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate PDF', 
        details: error instanceof Error ? error.message : 'Unknown error' 
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
    return owner && offer.property.ownerId === owner.id;
  }

  // Check if user created the offer
  return offer.createdById === userId;
}