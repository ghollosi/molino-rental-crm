/**
 * WhatsApp Business API Integration
 * Automated tenant communication for Spanish rental properties
 */

import { env } from '@/env'

export interface WhatsAppConfig {
  businessAccountId: string
  phoneNumberId: string
  accessToken: string
  webhookSecret: string
}

export interface SpanishWhatsAppTemplates {
  rentReminder: 'rent_reminder_es'
  maintenanceScheduled: 'maintenance_scheduled_es'
  issueReceived: 'issue_received_es'
  paymentConfirmed: 'payment_confirmed_es'
  welcomeMessage: 'welcome_tenant_es'
  contractReminder: 'contract_renewal_es'
}

export interface TemplateComponent {
  type: 'header' | 'body' | 'footer' | 'button'
  parameters?: Array<{
    type: 'text' | 'currency' | 'date_time'
    text?: string
    currency?: {
      fallback_value: string
      code: string
      amount_1000: number
    }
    date_time?: {
      fallback_value: string
      calendar?: string
      timestamp?: number
    }
  }>
}

export interface WhatsAppMessage {
  messaging_product: 'whatsapp'
  to: string
  type: 'template' | 'text' | 'interactive'
  template?: {
    name: keyof SpanishWhatsAppTemplates
    language: {
      code: 'es' | 'es_ES'
    }
    components?: TemplateComponent[]
  }
  text?: {
    body: string
  }
  interactive?: {
    type: 'button' | 'list'
    header?: {
      type: 'text'
      text: string
    }
    body: {
      text: string
    }
    footer?: {
      text: string
    }
    action: {
      buttons?: Array<{
        type: 'reply'
        reply: {
          id: string
          title: string
        }
      }>
      sections?: Array<{
        title: string
        rows: Array<{
          id: string
          title: string
          description?: string
        }>
      }>
    }
  }
}

export interface WhatsAppWebhook {
  object: string
  entry: Array<{
    id: string
    changes: Array<{
      value: {
        messaging_product: 'whatsapp'
        metadata: {
          display_phone_number: string
          phone_number_id: string
        }
        contacts?: Array<{
          profile: {
            name: string
          }
          wa_id: string
        }>
        messages?: Array<{
          from: string
          id: string
          timestamp: string
          text?: {
            body: string
          }
          type: 'text' | 'interactive' | 'button'
          interactive?: {
            type: 'button_reply' | 'list_reply'
            button_reply?: {
              id: string
              title: string
            }
            list_reply?: {
              id: string
              title: string
              description?: string
            }
          }
          button?: {
            payload: string
            text: string
          }
        }>
        statuses?: Array<{
          id: string
          status: 'sent' | 'delivered' | 'read' | 'failed'
          timestamp: string
          recipient_id: string
          errors?: Array<{
            code: number
            title: string
            message: string
          }>
        }>
      }
      field: string
    }>
  }>
}

export interface MessageTemplate {
  name: keyof SpanishWhatsAppTemplates
  category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION'
  language: 'es'
  headerText?: string
  bodyText: string
  footerText?: string
  buttons?: Array<{
    type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER'
    text: string
    url?: string
    phone_number?: string
  }>
  examples?: {
    header_text?: string[]
    body_text?: string[][]
  }
}

class WhatsAppBusinessAPI {
  private baseUrl: string
  private config: WhatsAppConfig

  constructor(config: WhatsAppConfig) {
    this.config = config
    this.baseUrl = 'https://graph.facebook.com/v18.0'
  }

  /**
   * Send WhatsApp message
   */
  async sendMessage(message: WhatsAppMessage): Promise<{
    messaging_product: string
    contacts: Array<{
      input: string
      wa_id: string
    }>
    messages: Array<{
      id: string
    }>
  }> {
    const response = await fetch(`${this.baseUrl}/${this.config.phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`WhatsApp API error: ${response.status} - ${JSON.stringify(errorData)}`)
    }

    return response.json()
  }

  /**
   * Send rent reminder message
   */
  async sendRentReminder(params: {
    phoneNumber: string
    tenantName: string
    amount: number
    currency: string
    dueDate: string
    propertyAddress: string
  }): Promise<any> {
    const message: WhatsAppMessage = {
      messaging_product: 'whatsapp',
      to: params.phoneNumber,
      type: 'template',
      template: {
        name: 'rent_reminder_es',
        language: { code: 'es' },
        components: [
          {
            type: 'header',
            parameters: [
              {
                type: 'text',
                text: params.tenantName,
              },
            ],
          },
          {
            type: 'body',
            parameters: [
              {
                type: 'currency',
                currency: {
                  fallback_value: `${params.amount} ${params.currency}`,
                  code: params.currency,
                  amount_1000: Math.round(params.amount * 1000),
                },
              },
              {
                type: 'text',
                text: params.propertyAddress,
              },
              {
                type: 'text',
                text: params.dueDate,
              },
            ],
          },
        ],
      },
    }

    return this.sendMessage(message)
  }

  /**
   * Send maintenance scheduling message
   */
  async sendMaintenanceScheduled(params: {
    phoneNumber: string
    tenantName: string
    serviceType: string
    scheduledDate: string
    providerName: string
    propertyAddress: string
  }): Promise<any> {
    const message: WhatsAppMessage = {
      messaging_product: 'whatsapp',
      to: params.phoneNumber,
      type: 'template',
      template: {
        name: 'maintenance_scheduled_es',
        language: { code: 'es' },
        components: [
          {
            type: 'body',
            parameters: [
              {
                type: 'text',
                text: params.tenantName,
              },
              {
                type: 'text',
                text: params.serviceType,
              },
              {
                type: 'text',
                text: params.scheduledDate,
              },
              {
                type: 'text',
                text: params.providerName,
              },
              {
                type: 'text',
                text: params.propertyAddress,
              },
            ],
          },
        ],
      },
    }

    return this.sendMessage(message)
  }

  /**
   * Send issue received confirmation
   */
  async sendIssueReceived(params: {
    phoneNumber: string
    tenantName: string
    issueTitle: string
    ticketNumber: string
    priority: string
  }): Promise<any> {
    const message: WhatsAppMessage = {
      messaging_product: 'whatsapp',
      to: params.phoneNumber,
      type: 'template',
      template: {
        name: 'issue_received_es',
        language: { code: 'es' },
        components: [
          {
            type: 'body',
            parameters: [
              {
                type: 'text',
                text: params.tenantName,
              },
              {
                type: 'text',
                text: params.issueTitle,
              },
              {
                type: 'text',
                text: params.ticketNumber,
              },
              {
                type: 'text',
                text: params.priority,
              },
            ],
          },
        ],
      },
    }

    return this.sendMessage(message)
  }

  /**
   * Send payment confirmation
   */
  async sendPaymentConfirmed(params: {
    phoneNumber: string
    tenantName: string
    amount: number
    currency: string
    paymentDate: string
    invoiceNumber: string
  }): Promise<any> {
    const message: WhatsAppMessage = {
      messaging_product: 'whatsapp',
      to: params.phoneNumber,
      type: 'template',
      template: {
        name: 'payment_confirmed_es',
        language: { code: 'es' },
        components: [
          {
            type: 'body',
            parameters: [
              {
                type: 'text',
                text: params.tenantName,
              },
              {
                type: 'currency',
                currency: {
                  fallback_value: `${params.amount} ${params.currency}`,
                  code: params.currency,
                  amount_1000: Math.round(params.amount * 1000),
                },
              },
              {
                type: 'text',
                text: params.paymentDate,
              },
              {
                type: 'text',
                text: params.invoiceNumber,
              },
            ],
          },
        ],
      },
    }

    return this.sendMessage(message)
  }

  /**
   * Send interactive menu for issue reporting
   */
  async sendIssueReportingMenu(params: {
    phoneNumber: string
    tenantName: string
  }): Promise<any> {
    const message: WhatsAppMessage = {
      messaging_product: 'whatsapp',
      to: params.phoneNumber,
      type: 'interactive',
      interactive: {
        type: 'button',
        header: {
          type: 'text',
          text: `Hola ${params.tenantName}`,
        },
        body: {
          text: '¿Cómo podemos ayudarte hoy? Selecciona una opción:',
        },
        footer: {
          text: 'Responderemos lo antes posible',
        },
        action: {
          buttons: [
            {
              type: 'reply',
              reply: {
                id: 'report_issue',
                title: 'Reportar Avería',
              },
            },
            {
              type: 'reply',
              reply: {
                id: 'payment_status',
                title: 'Estado de Pago',
              },
            },
            {
              type: 'reply',
              reply: {
                id: 'contact_admin',
                title: 'Contactar Admin',
              },
            },
          ],
        },
      },
    }

    return this.sendMessage(message)
  }

  /**
   * Send simple text message
   */
  async sendTextMessage(phoneNumber: string, text: string): Promise<any> {
    const message: WhatsAppMessage = {
      messaging_product: 'whatsapp',
      to: phoneNumber,
      type: 'text',
      text: {
        body: text,
      },
    }

    return this.sendMessage(message)
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(signature: string, body: string): boolean {
    const crypto = require('crypto')
    const expectedSignature = crypto
      .createHmac('sha256', this.config.webhookSecret)
      .update(body)
      .digest('hex')
    
    return signature === `sha256=${expectedSignature}`
  }

  /**
   * Process incoming webhook
   */
  processWebhook(webhook: WhatsAppWebhook): Array<{
    type: 'message_received' | 'status_update'
    from?: string
    messageId?: string
    text?: string
    buttonId?: string
    status?: string
    timestamp: string
  }> {
    const events = []

    for (const entry of webhook.entry) {
      for (const change of entry.changes) {
        if (change.field === 'messages') {
          // Process incoming messages
          if (change.value.messages) {
            for (const message of change.value.messages) {
              let buttonId: string | undefined
              let text = message.text?.body

              // Handle interactive messages
              if (message.interactive) {
                if (message.interactive.button_reply) {
                  buttonId = message.interactive.button_reply.id
                  text = message.interactive.button_reply.title
                } else if (message.interactive.list_reply) {
                  buttonId = message.interactive.list_reply.id
                  text = message.interactive.list_reply.title
                }
              }

              events.push({
                type: 'message_received',
                from: message.from,
                messageId: message.id,
                text,
                buttonId,
                timestamp: message.timestamp,
              })
            }
          }

          // Process status updates
          if (change.value.statuses) {
            for (const status of change.value.statuses) {
              events.push({
                type: 'status_update',
                messageId: status.id,
                status: status.status,
                timestamp: status.timestamp,
              })
            }
          }
        }
      }
    }

    return events
  }

  /**
   * Get phone number insights
   */
  async getPhoneNumberInsights(): Promise<{
    id: string
    display_phone_number: string
    verified_name: string
    code_verification_status: string
    quality_rating: string
    platform_type: string
    throughput: {
      level: string
    }
  }> {
    const response = await fetch(`${this.baseUrl}/${this.config.phoneNumberId}`, {
      headers: {
        'Authorization': `Bearer ${this.config.accessToken}`,
      },
    })

    if (!response.ok) {
      throw new Error(`WhatsApp API error: ${response.status}`)
    }

    return response.json()
  }
}

// Singleton instance
let whatsappInstance: WhatsAppBusinessAPI | null = null

export function getWhatsAppClient(): WhatsAppBusinessAPI {
  if (!whatsappInstance) {
    const config: WhatsAppConfig = {
      businessAccountId: env.WHATSAPP_BUSINESS_ACCOUNT_ID || '',
      phoneNumberId: env.WHATSAPP_PHONE_NUMBER_ID || '',
      accessToken: env.WHATSAPP_ACCESS_TOKEN || '',
      webhookSecret: env.WHATSAPP_WEBHOOK_SECRET || '',
    }

    whatsappInstance = new WhatsAppBusinessAPI(config)
  }

  return whatsappInstance
}

// Helper class for rental-specific WhatsApp communication
export class RentalWhatsAppHelper {
  private whatsapp: WhatsAppBusinessAPI

  constructor() {
    this.whatsapp = getWhatsAppClient()
  }

  /**
   * Send automated rent reminder based on due date
   */
  async sendAutomatedRentReminder(params: {
    tenantPhone: string
    tenantName: string
    rentAmount: number
    dueDate: string
    propertyAddress: string
    daysUntilDue: number
  }): Promise<void> {
    // Different messages based on timing
    if (params.daysUntilDue === 5) {
      // 5 days before due date
      await this.whatsapp.sendRentReminder({
        phoneNumber: params.tenantPhone,
        tenantName: params.tenantName,
        amount: params.rentAmount,
        currency: 'EUR',
        dueDate: params.dueDate,
        propertyAddress: params.propertyAddress,
      })
    } else if (params.daysUntilDue === 1) {
      // 1 day before due date
      await this.whatsapp.sendTextMessage(
        params.tenantPhone,
        `🏠 Recordatorio: Tu alquiler de ${params.rentAmount}€ vence mañana (${params.dueDate}) para ${params.propertyAddress}. ¡Gracias!`
      )
    } else if (params.daysUntilDue <= 0) {
      // Overdue
      const daysOverdue = Math.abs(params.daysUntilDue)
      await this.whatsapp.sendTextMessage(
        params.tenantPhone,
        `⚠️ Tu alquiler de ${params.rentAmount}€ está vencido desde hace ${daysOverdue} día(s). Por favor, contacta con nosotros lo antes posible.`
      )
    }
  }

  /**
   * Handle incoming tenant messages and route appropriately
   */
  async handleTenantMessage(params: {
    from: string
    text: string
    buttonId?: string
  }): Promise<{
    response: string
    action?: 'create_issue' | 'check_payment' | 'contact_admin'
  }> {
    const { text, buttonId } = params

    // Handle button responses
    if (buttonId) {
      switch (buttonId) {
        case 'report_issue':
          return {
            response: 'Por favor, describe brevemente el problema que has encontrado en tu vivienda:',
            action: 'create_issue',
          }
        
        case 'payment_status':
          return {
            response: 'Te ayudaremos a verificar el estado de tu pago. Un momento...',
            action: 'check_payment',
          }
        
        case 'contact_admin':
          return {
            response: 'Hemos notificado al administrador. Te contactaremos pronto por teléfono.',
            action: 'contact_admin',
          }
        
        default:
          return {
            response: 'No he entendido esa opción. ¿Puedes intentarlo de nuevo?',
          }
      }
    }

    // Handle free text - simple keyword detection
    const lowerText = text.toLowerCase()
    
    if (lowerText.includes('avería') || lowerText.includes('problema') || lowerText.includes('roto')) {
      await this.whatsapp.sendTextMessage(
        params.from,
        'He detectado que tienes un problema. Voy a crear un ticket de avería con tu mensaje.'
      )
      return {
        response: 'Ticket creado. Te mantendremos informado del estado.',
        action: 'create_issue',
      }
    }
    
    if (lowerText.includes('pago') || lowerText.includes('alquiler') || lowerText.includes('transferencia')) {
      return {
        response: 'Te ayudo con información sobre pagos. Revisando tu cuenta...',
        action: 'check_payment',
      }
    }
    
    // Default response with menu
    await this.whatsapp.sendIssueReportingMenu({
      phoneNumber: params.from,
      tenantName: 'inquilino', // Default, should be looked up from database
    })
    
    return {
      response: 'He enviado un menú con opciones. ¿En qué te puedo ayudar?',
    }
  }

  /**
   * Notify about maintenance completion
   */
  async notifyMaintenanceCompleted(params: {
    tenantPhone: string
    tenantName: string
    serviceDescription: string
    completedDate: string
    providerName: string
  }): Promise<void> {
    const message = `✅ ¡Hola ${params.tenantName}! 

El servicio de "${params.serviceDescription}" ha sido completado el ${params.completedDate} por ${params.providerName}.

Si tienes alguna incidencia o no estás satisfecho con el trabajo, por favor contacta con nosotros.

¡Gracias por tu paciencia!`

    await this.whatsapp.sendTextMessage(params.tenantPhone, message)
  }
}