import nodemailer from 'nodemailer'

// Email configuration
const createTransporter = () => {
  // For development, use Ethereal Email (test email service)
  // For production, use real SMTP settings
  if (process.env.NODE_ENV === 'development') {
    // This will create a test account automatically
    return nodemailer.createTransporter({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: {
        user: 'ethereal.user@ethereal.email',
        pass: 'ethereal.pass'
      }
    })
  }
  
  // Production email settings (configure these in .env)
  return nodemailer.createTransporter({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })
}

interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

export async function sendEmail({ to, subject, html, text }: EmailOptions) {
  try {
    const transporter = createTransporter()
    
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || 'Molino Rental CRM <noreply@molino.com>',
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
    })

    console.log('Email sent:', info.messageId)
    
    // For development, log the preview URL
    if (process.env.NODE_ENV === 'development') {
      console.log('Preview URL:', nodemailer.getTestMessageUrl(info))
    }
    
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('Email sending failed:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// Email templates
export const emailTemplates = {
  issueCreated: (issue: any, property: any, owner: any) => ({
    subject: `Új hibabejelentés: ${issue.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Új hibabejelentés érkezett</h2>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0; color: #495057;">${issue.title}</h3>
          <p style="margin: 5px 0;"><strong>Prioritás:</strong> ${issue.priority}</p>
          <p style="margin: 5px 0;"><strong>Kategória:</strong> ${issue.category}</p>
          <p style="margin: 5px 0;"><strong>Ingatlan:</strong> ${property.street}, ${property.city}</p>
        </div>
        
        ${issue.description ? `
          <div style="margin: 20px 0;">
            <h4>Leírás:</h4>
            <p style="background: #ffffff; padding: 15px; border: 1px solid #dee2e6; border-radius: 4px;">
              ${issue.description}
            </p>
          </div>
        ` : ''}
        
        <div style="margin: 30px 0;">
          <a href="${process.env.NEXTAUTH_URL}/dashboard/issues/${issue.id}" 
             style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Hibabejelentés megtekintése
          </a>
        </div>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #dee2e6;">
        <p style="color: #6c757d; font-size: 14px;">
          Ez egy automatikus értesítés a Molino Rental CRM rendszerből.
        </p>
      </div>
    `
  }),

  issueStatusChanged: (issue: any, property: any, newStatus: string, changedBy: any) => ({
    subject: `Hibabejelentés státusz változás: ${issue.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Hibabejelentés státusz frissítve</h2>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0; color: #495057;">${issue.title}</h3>
          <p style="margin: 5px 0;"><strong>Új státusz:</strong> <span style="color: #28a745;">${newStatus}</span></p>
          <p style="margin: 5px 0;"><strong>Módosította:</strong> ${changedBy.name}</p>
          <p style="margin: 5px 0;"><strong>Ingatlan:</strong> ${property.street}, ${property.city}</p>
        </div>
        
        <div style="margin: 30px 0;">
          <a href="${process.env.NEXTAUTH_URL}/dashboard/issues/${issue.id}" 
             style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Hibabejelentés megtekintése
          </a>
        </div>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #dee2e6;">
        <p style="color: #6c757d; font-size: 14px;">
          Ez egy automatikus értesítés a Molino Rental CRM rendszerből.
        </p>
      </div>
    `
  }),

  issueAssigned: (issue: any, property: any, provider: any, owner: any) => ({
    subject: `Hibabejelentés hozzárendelve: ${issue.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Új feladat hozzárendelve</h2>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0; color: #495057;">${issue.title}</h3>
          <p style="margin: 5px 0;"><strong>Prioritás:</strong> ${issue.priority}</p>
          <p style="margin: 5px 0;"><strong>Kategória:</strong> ${issue.category}</p>
          <p style="margin: 5px 0;"><strong>Ingatlan:</strong> ${property.street}, ${property.city}</p>
          <p style="margin: 5px 0;"><strong>Tulajdonos:</strong> ${owner.user.name}</p>
        </div>
        
        ${issue.description ? `
          <div style="margin: 20px 0;">
            <h4>Leírás:</h4>
            <p style="background: #ffffff; padding: 15px; border: 1px solid #dee2e6; border-radius: 4px;">
              ${issue.description}
            </p>
          </div>
        ` : ''}
        
        <div style="margin: 30px 0;">
          <a href="${process.env.NEXTAUTH_URL}/dashboard/issues/${issue.id}" 
             style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Feladat megtekintése
          </a>
        </div>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #dee2e6;">
        <p style="color: #6c757d; font-size: 14px;">
          Ez egy automatikus értesítés a Molino Rental CRM rendszerből.
        </p>
      </div>
    `
  })
}