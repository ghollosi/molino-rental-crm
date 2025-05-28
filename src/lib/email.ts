/**
 * @file Email service using Resend
 * @description Email sending functionality for notifications
 * @created 2025-05-28
 * @see DEVELOPMENT_DOCS.md - Email Integration
 */

import { Resend } from 'resend';

// Only initialize Resend if we have a real API key
const resend = process.env.RESEND_API_KEY?.startsWith('re_') 
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
}

export async function sendEmail({ to, subject, html, from }: EmailOptions) {
  try {
    // In development mode or without valid API key, just log the email instead of sending
    if (!resend || process.env.NODE_ENV === 'development' || !process.env.RESEND_API_KEY?.startsWith('re_')) {
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

export interface PaymentReminderData {
  tenantName: string;
  propertyAddress: string;
  rentAmount: number;
  currency: string;
  dueDate: string;
  daysOverdue: number;
  landlordName: string;
}

export interface ContractExpiryData {
  contractId: string;
  tenantName: string;
  propertyAddress: string;
  endDate: string;
  daysUntilExpiry: number;
  rentAmount: number;
  currency: string;
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

/**
 * Generate HTML template for payment reminders
 */
export function generatePaymentReminderHTML(data: PaymentReminderData): string {
  const urgencyColor = data.daysOverdue > 7 ? '#dc2626' : (data.daysOverdue > 0 ? '#f59e0b' : '#3b82f6');
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Fizetési emlékeztető</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8fafc; }
        .container { background: white; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); overflow: hidden; }
        .header { background: linear-gradient(135deg, ${urgencyColor}, ${urgencyColor}dd); color: white; padding: 30px 20px; text-align: center; }
        .header h1 { margin: 0 0 8px 0; font-size: 24px; font-weight: 600; }
        .content { padding: 30px 20px; }
        .payment-box { background: #fef3c7; border: 2px solid #fbbf24; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .amount { font-size: 32px; font-weight: bold; color: #92400e; margin: 10px 0; }
        .detail-row { margin: 12px 0; }
        .detail-label { font-weight: 600; color: #374151; }
        .button { background: ${urgencyColor}; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; display: inline-block; margin-top: 24px; font-weight: 600; }
        .footer { padding: 20px; background: #f8fafc; text-align: center; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
        .warning { background: #fee2e2; color: #991b1b; padding: 12px; border-radius: 6px; margin: 16px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>💰 Fizetési emlékeztető</h1>
          <p>${data.daysOverdue > 0 ? `${data.daysOverdue} napja lejárt!` : 'Fizetési határidő közeledik'}</p>
        </div>
        
        <div class="content">
          <p>Tisztelt ${data.tenantName}!</p>
          
          <p>Szeretnénk emlékeztetni, hogy a bérleti díj fizetési határideje ${data.daysOverdue > 0 ? 'lejárt' : 'hamarosan lejár'}.</p>
          
          <div class="payment-box">
            <div class="detail-row">
              <span class="detail-label">Ingatlan:</span>
              <div>${data.propertyAddress}</div>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">Fizetendő összeg:</span>
              <div class="amount">${data.rentAmount.toLocaleString('hu-HU')} ${data.currency}</div>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">Esedékesség:</span>
              <div style="color: ${urgencyColor}; font-weight: bold;">${data.dueDate}</div>
            </div>
            
            ${data.daysOverdue > 0 ? `
              <div class="detail-row">
                <span class="detail-label">Késedelmi napok:</span>
                <div style="color: #dc2626; font-weight: bold;">${data.daysOverdue} nap</div>
              </div>
            ` : ''}
          </div>
          
          ${data.daysOverdue > 7 ? `
            <div class="warning">
              ⚠️ <strong>Figyelmeztetés:</strong> A bérleti díj több mint egy hete esedékes. 
              Kérjük, rendezze tartozását a szerződés felmondásának elkerülése érdekében.
            </div>
          ` : ''}
          
          <p>Kérjük, hogy a bérleti díjat az alábbi bankszámlaszámra utalja:</p>
          <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; font-family: monospace;">
            [Bankszámlaszám]<br>
            Közlemény: ${data.propertyAddress} - ${new Date().toLocaleDateString('hu-HU', { year: 'numeric', month: 'long' })}
          </div>
          
          <p>Ha már rendezte a fizetést, kérjük, hagyja figyelmen kívül ezt az emlékeztetőt.</p>
          
          <p>Üdvözlettel,<br>
          ${data.landlordName}</p>
        </div>
        
        <div class="footer">
          <p>Ez egy automatikus emlékeztető a Molino Rental CRM rendszerből.</p>
          <p>Kérdés esetén vegye fel a kapcsolatot a bérbeadóval.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Send payment reminder email
 */
export async function sendPaymentReminder(
  to: string | string[],
  data: PaymentReminderData
) {
  const html = generatePaymentReminderHTML(data);
  const urgencyPrefix = data.daysOverdue > 7 ? '🚨' : (data.daysOverdue > 0 ? '⚠️' : '💰');
  
  return await sendEmail({
    to,
    subject: `${urgencyPrefix} Fizetési emlékeztető - ${data.propertyAddress}`,
    html,
  });
}

/**
 * Generate HTML template for contract expiry notifications
 */
export function generateContractExpiryHTML(data: ContractExpiryData): string {
  const urgencyColor = data.daysUntilExpiry <= 7 ? '#dc2626' : (data.daysUntilExpiry <= 30 ? '#f59e0b' : '#3b82f6');
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Szerződés lejárati értesítés</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8fafc; }
        .container { background: white; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); overflow: hidden; }
        .header { background: linear-gradient(135deg, #6366f1, #4f46e5); color: white; padding: 30px 20px; text-align: center; }
        .header h1 { margin: 0 0 8px 0; font-size: 24px; font-weight: 600; }
        .content { padding: 30px 20px; }
        .contract-box { background: #f0f9ff; border: 2px solid #0ea5e9; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .days-remaining { font-size: 48px; font-weight: bold; color: ${urgencyColor}; text-align: center; margin: 20px 0; }
        .detail-row { margin: 12px 0; display: flex; justify-content: space-between; }
        .detail-label { font-weight: 600; color: #374151; }
        .button { background: #6366f1; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; display: inline-block; margin: 12px 8px; font-weight: 600; }
        .button-secondary { background: #e5e7eb; color: #374151; }
        .footer { padding: 20px; background: #f8fafc; text-align: center; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
        .action-box { background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📋 Szerződés lejárati értesítés</h1>
          <p>Bérleti szerződése hamarosan lejár</p>
        </div>
        
        <div class="content">
          <p>Tisztelt ${data.tenantName}!</p>
          
          <p>Értesítjük, hogy az alábbi ingatlanra vonatkozó bérleti szerződése hamarosan lejár:</p>
          
          <div class="contract-box">
            <div class="days-remaining">
              ${data.daysUntilExpiry} nap
            </div>
            <p style="text-align: center; margin: 0; color: #6b7280;">a szerződés lejáratáig</p>
          </div>
          
          <div style="background: #f9fafb; padding: 16px; border-radius: 8px; margin: 20px 0;">
            <div class="detail-row">
              <span class="detail-label">Ingatlan:</span>
              <span>${data.propertyAddress}</span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">Lejárat dátuma:</span>
              <span style="color: ${urgencyColor}; font-weight: bold;">${data.endDate}</span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">Havi bérleti díj:</span>
              <span>${data.rentAmount.toLocaleString('hu-HU')} ${data.currency}</span>
            </div>
          </div>
          
          <div class="action-box">
            <h3 style="margin-top: 0;">Mit szeretne tenni?</h3>
            <p>Kérjük, jelezze szándékát a szerződés lejárta előtt.</p>
            
            <div>
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/contracts/${data.contractId}" class="button">
                Szerződés meghosszabbítása
              </a>
              <a href="mailto:${process.env.EMAIL_FROM}" class="button button-secondary">
                Kapcsolatfelvétel
              </a>
            </div>
          </div>
          
          ${data.daysUntilExpiry <= 14 ? `
            <div style="background: #fef3c7; border: 1px solid #fbbf24; padding: 16px; border-radius: 8px; margin: 20px 0;">
              <strong>⏰ Sürgős intézkedés szükséges!</strong><br>
              A szerződés ${data.daysUntilExpiry} napon belül lejár. Kérjük, mielőbb jelezze szándékát a bérlés folytatásával kapcsolatban.
            </div>
          ` : ''}
          
          <p>Ha szeretné meghosszabbítani a bérleti szerződést, kérjük, vegye fel velünk a kapcsolatot minél hamarabb, hogy megbeszélhessük a részleteket.</p>
          
          <p>Köszönjük együttműködését!</p>
        </div>
        
        <div class="footer">
          <p>Ez egy automatikus értesítés a Molino Rental CRM rendszerből.</p>
          <p>Kérdés esetén vegye fel a kapcsolatot a bérbeadóval.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Send contract expiry notification email
 */
export async function sendContractExpiryNotification(
  to: string | string[],
  data: ContractExpiryData
) {
  const html = generateContractExpiryHTML(data);
  const urgencyPrefix = data.daysUntilExpiry <= 7 ? '🚨' : (data.daysUntilExpiry <= 30 ? '⏰' : '📅');
  
  return await sendEmail({
    to,
    subject: `${urgencyPrefix} Bérleti szerződés lejár ${data.daysUntilExpiry} nap múlva - ${data.propertyAddress}`,
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