/**
 * @file Email service using Resend
 * @description Email sending functionality for notifications
 * @created 2025-05-28
 * @see DEVELOPMENT_DOCS.md - Email Integration
 */

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
}

export async function sendEmail({ to, subject, html, from }: EmailOptions) {
  try {
    // In development mode, just log the email instead of sending
    if (process.env.NODE_ENV === 'development' && !process.env.RESEND_API_KEY?.startsWith('re_')) {
      console.log('📧 EMAIL (DEV MODE):', {
        to,
        subject,
        from: from || process.env.EMAIL_FROM || 'noreply@molino-rental.com',
        htmlPreview: html.substring(0, 200) + '...'
      });
      return { success: true, messageId: 'dev-mode-' + Date.now() };
    }

    const result = await resend.emails.send({
      from: from || process.env.EMAIL_FROM || 'noreply@molino-rental.com',
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
    });

    console.log('Email sent successfully:', result);
    return { success: true, messageId: result.data?.id };
  } catch (error) {
    console.error('Failed to send email:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Email notification helpers
export interface IssueNotificationData {
  issueId: string;
  title: string;
  description: string;
  priority: string;
  category: string;
  propertyAddress: string;
  reportedBy: string;
  status: string;
}

export interface OfferNotificationData {
  offerId: string;
  offerNumber: string;
  totalAmount: number;
  currency: string;
  propertyAddress: string;
  createdBy: string;
  status: string;
}

/**
 * Generate modern HTML template for issue notifications
 */
export function generateIssueNotificationHTML(data: IssueNotificationData): string {
  const priorityColor = {
    LOW: '#10b981',
    MEDIUM: '#f59e0b', 
    HIGH: '#ef4444',
    URGENT: '#dc2626'
  }[data.priority] || '#6b7280';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Új hibabejelentés - ${data.title}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8fafc; }
        .container { background: white; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); overflow: hidden; }
        .header { background: linear-gradient(135deg, #1976d2, #1565c0); color: white; padding: 30px 20px; text-align: center; }
        .header h1 { margin: 0 0 8px 0; font-size: 24px; font-weight: 600; }
        .header p { margin: 0; opacity: 0.9; font-size: 16px; }
        .content { padding: 30px 20px; }
        .issue-card { background: #f8fafc; border-left: 4px solid ${priorityColor}; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .issue-title { margin: 0 0 12px 0; font-size: 20px; font-weight: 600; color: #1f2937; }
        .detail-row { margin: 8px 0; display: flex; align-items: center; }
        .detail-label { font-weight: 600; color: #374151; min-width: 100px; }
        .priority-badge { padding: 4px 12px; border-radius: 20px; color: white; font-weight: 600; font-size: 12px; background: ${priorityColor}; }
        .button { background: linear-gradient(135deg, #1976d2, #1565c0); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; display: inline-block; margin-top: 24px; font-weight: 600; box-shadow: 0 2px 4px rgba(25, 118, 210, 0.2); }
        .button:hover { transform: translateY(-1px); box-shadow: 0 4px 8px rgba(25, 118, 210, 0.3); }
        .footer { padding: 20px; background: #f8fafc; text-align: center; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔧 Molino Rental CRM</h1>
          <p>Új hibabejelentés érkezett</p>
        </div>
        
        <div class="content">
          <div class="issue-card">
            <h2 class="issue-title">${data.title}</h2>
            
            <div class="detail-row">
              <span class="detail-label">Prioritás:</span>
              <span class="priority-badge">${data.priority}</span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">Kategória:</span>
              <span>${data.category}</span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">Ingatlan:</span>
              <span>${data.propertyAddress}</span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">Bejelentő:</span>
              <span>${data.reportedBy}</span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">Státusz:</span>
              <span>${data.status}</span>
            </div>
          </div>
          
          ${data.description ? `
            <div style="margin: 20px 0;">
              <h3 style="color: #374151; margin-bottom: 12px;">Leírás:</h3>
              <div style="background: #f9fafb; padding: 16px; border-radius: 8px; border: 1px solid #e5e7eb;">
                ${data.description}
              </div>
            </div>
          ` : ''}
          
          <div style="text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/issues/${data.issueId}" class="button">
              Hibabejelentés megtekintése
            </a>
          </div>
        </div>
        
        <div class="footer">
          <p>Ez egy automatikus értesítés a Molino Rental CRM rendszerből.</p>
          <p>Ne válaszoljon erre az emailre.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Send issue notification email
 */
export async function sendIssueNotification(
  to: string | string[], 
  data: IssueNotificationData
) {
  const html = generateIssueNotificationHTML(data);
  
  return await sendEmail({
    to,
    subject: `🔧 Új hibabejelentés: ${data.title}`,
    html,
  });
}

/**
 * Send welcome email to new user
 */
export async function sendWelcomeEmail(to: string, name: string, role: string) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Üdvözöljük a Molino Rental CRM-ben!</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8fafc; }
        .container { background: white; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); overflow: hidden; }
        .header { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 30px 20px; text-align: center; }
        .content { padding: 30px 20px; }
        .button { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; display: inline-block; margin-top: 24px; font-weight: 600; }
        .footer { padding: 20px; background: #f8fafc; text-align: center; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏠 Molino Rental CRM</h1>
          <h2>Üdvözöljük!</h2>
        </div>
        
        <div class="content">
          <h3>Kedves ${name}!</h3>
          
          <p>Üdvözöljük a Molino Rental CRM rendszerben! Ön sikeresen regisztrált a következő szerepkörrel: <strong>${role}</strong>.</p>
          
          <p>A rendszerben az alábbi funkciókat érheti el:</p>
          <ul>
            <li>Ingatlanok kezelése</li>
            <li>Hibabejelentések követése</li>
            <li>Ajánlatok készítése</li>
            <li>Jelentések megtekintése</li>
          </ul>
          
          <div style="text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" class="button">
              Bejelentkezés a rendszerbe
            </a>
          </div>
        </div>
        
        <div class="footer">
          <p>Ha kérdése van, vegye fel velünk a kapcsolatot.</p>
          <p>Molino Rental CRM csapata</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to,
    subject: '🏠 Üdvözöljük a Molino Rental CRM-ben!',
    html,
  });
}

// Legacy templates for backward compatibility
export const emailTemplates = {
  issueCreated: (issue: any, property: any, owner: any) => {
    return {
      subject: `🔧 Új hibabejelentés: ${issue.title}`,
      html: generateIssueNotificationHTML({
        issueId: issue.id,
        title: issue.title,
        description: issue.description,
        priority: issue.priority,
        category: issue.category,
        propertyAddress: `${property.street}, ${property.city}`,
        reportedBy: owner?.user?.name || 'Ismeretlen',
        status: issue.status
      })
    };
  },

  issueStatusChanged: (issue: any, property: any, newStatus: string, changedBy: any) => ({
    subject: `🔄 Hibabejelentés státusz változás: ${issue.title}`,
    html: generateIssueNotificationHTML({
      issueId: issue.id,
      title: issue.title,
      description: `Státusz változás: ${newStatus}. Módosította: ${changedBy.name}`,
      priority: issue.priority,
      category: issue.category,
      propertyAddress: `${property.street}, ${property.city}`,
      reportedBy: changedBy.name,
      status: newStatus
    })
  }),

  issueAssigned: (issue: any, property: any, provider: any, owner: any) => ({
    subject: `👷 Hibabejelentés hozzárendelve: ${issue.title}`,
    html: generateIssueNotificationHTML({
      issueId: issue.id,
      title: issue.title,
      description: `Hozzárendelve: ${provider.businessName}. ${issue.description}`,
      priority: issue.priority,
      category: issue.category,
      propertyAddress: `${property.street}, ${property.city}`,
      reportedBy: owner?.user?.name || 'Tulajdonos',
      status: issue.status
    })
  })
}