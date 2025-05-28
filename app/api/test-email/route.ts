/**
 * @file Test Email API Endpoint
 * @description Test endpoint for email functionality
 * @created 2025-05-28
 */

import { NextRequest, NextResponse } from 'next/server';
import { sendIssueNotification, sendWelcomeEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type = 'issue', to, data = {} } = body;

    if (!to) {
      return NextResponse.json({ error: 'Email address required' }, { status: 400 });
    }

    let result;

    switch (type) {
      case 'issue':
        result = await sendIssueNotification(to, {
          issueId: 'test-issue-123',
          title: 'Csepegő vízcsap a konyhában',
          description: 'A konyhában található vízcsap folyamatosan csepeg. Sürgős javítás szükséges a vízkár elkerülése érdekében.',
          priority: 'HIGH',
          category: 'PLUMBING',
          propertyAddress: 'Teszt utca 123, 1234 Budapest',
          reportedBy: 'Teszt Bérlő',
          status: 'OPEN'
        });
        break;

      case 'welcome':
        result = await sendWelcomeEmail(
          to, 
          data.name || 'Teszt Felhasználó', 
          data.role || 'TENANT'
        );
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid email type. Use "issue" or "welcome"' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      message: process.env.NODE_ENV === 'development' 
        ? 'Email logged to console (development mode)' 
        : 'Email sent successfully',
      type
    });

  } catch (error) {
    console.error('Test email error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to send test email', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}