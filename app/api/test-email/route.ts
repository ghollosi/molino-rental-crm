import { NextRequest, NextResponse } from 'next/server'
import { sendEmail, emailTemplates } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const { to } = await request.json()
    
    if (!to) {
      return NextResponse.json({ error: 'Email address required' }, { status: 400 })
    }

    // Test email content
    const testIssue = {
      id: 'test-123',
      title: 'Teszt hibabejelentés',
      description: 'Ez egy teszt email küldéséhez.',
      priority: 'HIGH',
      category: 'PLUMBING'
    }
    
    const testProperty = {
      street: 'Teszt utca 123',
      city: 'Budapest'
    }
    
    const testOwner = {
      user: {
        name: 'Teszt Tulajdonos',
        email: to
      }
    }

    const emailContent = emailTemplates.issueCreated(testIssue, testProperty, testOwner)
    
    const result = await sendEmail({
      to,
      subject: emailContent.subject,
      html: emailContent.html,
    })

    if (result.success) {
      return NextResponse.json({ 
        success: true, 
        message: 'Test email sent successfully',
        messageId: result.messageId 
      })
    } else {
      return NextResponse.json({ 
        error: 'Failed to send email', 
        details: result.error 
      }, { status: 500 })
    }
  } catch (error) {
    console.error('Test email error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}