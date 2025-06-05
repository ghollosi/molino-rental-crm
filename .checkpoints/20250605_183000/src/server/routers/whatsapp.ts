/**
 * WhatsApp Business tRPC Router
 * Handles Spanish tenant communication automation
 */

import { z } from 'zod'
import { createTRPCRouter, protectedProcedure, publicProcedure } from '@/server/trpc'
import { getWhatsAppClient, RentalWhatsAppHelper } from '@/lib/whatsapp'
import { TRPCError } from '@trpc/server'

const sendRentReminderSchema = z.object({
  tenantId: z.string(),
  customMessage: z.string().optional(),
})

const sendMaintenanceNotificationSchema = z.object({
  tenantId: z.string(),
  issueId: z.string(),
  providerId: z.string(),
  scheduledDate: z.string(),
})

const sendTextMessageSchema = z.object({
  phoneNumber: z.string(),
  message: z.string(),
})

const webhookSchema = z.object({
  object: z.string(),
  entry: z.array(z.any()),
})

export const whatsappRouter = createTRPCRouter({
  /**
   * Test WhatsApp Business API connection
   */
  testConnection: protectedProcedure
    .query(async ({ ctx }) => {
      if (ctx.session.user.role !== 'ADMIN') {
        throw new TRPCError({ 
          code: 'FORBIDDEN',
          message: 'Only admins can test WhatsApp connection'
        })
      }

      try {
        const whatsapp = getWhatsAppClient()
        const insights = await whatsapp.getPhoneNumberInsights()
        
        return {
          success: true,
          message: 'WhatsApp Business API connection successful',
          phoneNumber: insights.display_phone_number,
          verifiedName: insights.verified_name,
          qualityRating: insights.quality_rating,
          timestamp: new Date().toISOString(),
        }
      } catch (error) {
        console.error('WhatsApp connection test failed:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to connect to WhatsApp Business API',
        })
      }
    }),

  /**
   * Send rent reminder to tenant
   */
  sendRentReminder: protectedProcedure
    .input(sendRentReminderSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        // Get tenant and contract information
        const tenant = await ctx.db.tenant.findUnique({
          where: { id: input.tenantId },
          include: { 
            user: true,
            contracts: {
              where: {
                startDate: { lte: new Date() },
                endDate: { gte: new Date() },
              },
              include: {
                property: true,
              },
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        })

        if (!tenant || !tenant.contracts[0]) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Tenant or active contract not found'
          })
        }

        const contract = tenant.contracts[0]
        const whatsapp = getWhatsAppClient()

        // Calculate next due date
        const now = new Date()
        const dueDate = new Date(now.getFullYear(), now.getMonth(), contract.paymentDay)
        if (dueDate < now) {
          dueDate.setMonth(dueDate.getMonth() + 1)
        }

        await whatsapp.sendRentReminder({
          phoneNumber: tenant.user.phone || '',
          tenantName: `${tenant.user.firstName} ${tenant.user.lastName}`,
          amount: Number(contract.rentAmount),
          currency: 'EUR',
          dueDate: dueDate.toLocaleDateString('es-ES'),
          propertyAddress: contract.property.address,
        })

        return {
          success: true,
          message: 'Rent reminder sent successfully',
          recipient: tenant.user.phone,
          amount: Number(contract.rentAmount),
        }
      } catch (error) {
        console.error('Failed to send rent reminder:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to send rent reminder via WhatsApp',
        })
      }
    }),

  /**
   * Send maintenance notification
   */
  sendMaintenanceNotification: protectedProcedure
    .input(sendMaintenanceNotificationSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        // Get all related information
        const issue = await ctx.db.issue.findUnique({
          where: { id: input.issueId },
          include: {
            property: {
              include: {
                currentTenant: {
                  include: { user: true }
                }
              }
            }
          }
        })

        const provider = await ctx.db.provider.findUnique({
          where: { id: input.providerId },
          include: { user: true }
        })

        if (!issue || !provider || !issue.property.currentTenant) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Issue, provider, or tenant not found'
          })
        }

        const tenant = issue.property.currentTenant
        const whatsapp = getWhatsAppClient()

        await whatsapp.sendMaintenanceScheduled({
          phoneNumber: tenant.user.phone || '',
          tenantName: `${tenant.user.firstName} ${tenant.user.lastName}`,
          serviceType: issue.title,
          scheduledDate: new Date(input.scheduledDate).toLocaleDateString('es-ES'),
          providerName: provider.user.firstName || provider.businessName,
          propertyAddress: issue.property.address,
        })

        return {
          success: true,
          message: 'Maintenance notification sent successfully',
          recipient: tenant.user.phone,
          serviceType: issue.title,
        }
      } catch (error) {
        console.error('Failed to send maintenance notification:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to send maintenance notification via WhatsApp',
        })
      }
    }),

  /**
   * Send issue received confirmation
   */
  sendIssueConfirmation: protectedProcedure
    .input(z.object({ issueId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const issue = await ctx.db.issue.findUnique({
          where: { id: input.issueId },
          include: {
            reportedBy: true,
            property: true,
          }
        })

        if (!issue) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Issue not found'
          })
        }

        const whatsapp = getWhatsAppClient()

        await whatsapp.sendIssueReceived({
          phoneNumber: issue.reportedBy.phone || '',
          tenantName: `${issue.reportedBy.firstName} ${issue.reportedBy.lastName}`,
          issueTitle: issue.title,
          ticketNumber: issue.ticketNumber,
          priority: issue.priority,
        })

        return {
          success: true,
          message: 'Issue confirmation sent successfully',
          ticketNumber: issue.ticketNumber,
        }
      } catch (error) {
        console.error('Failed to send issue confirmation:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to send issue confirmation via WhatsApp',
        })
      }
    }),

  /**
   * Send payment confirmation
   */
  sendPaymentConfirmation: protectedProcedure
    .input(z.object({ 
      invoiceId: z.string(),
      paymentDate: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const invoice = await ctx.db.invoice.findUnique({
          where: { id: input.invoiceId },
          include: {
            tenant: {
              include: { user: true }
            }
          }
        })

        if (!invoice) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Invoice not found'
          })
        }

        const whatsapp = getWhatsAppClient()

        await whatsapp.sendPaymentConfirmed({
          phoneNumber: invoice.tenant.user.phone || '',
          tenantName: `${invoice.tenant.user.firstName} ${invoice.tenant.user.lastName}`,
          amount: Number(invoice.amount),
          currency: invoice.currency,
          paymentDate: new Date(input.paymentDate).toLocaleDateString('es-ES'),
          invoiceNumber: invoice.externalInvoiceNumber || invoice.id,
        })

        return {
          success: true,
          message: 'Payment confirmation sent successfully',
          amount: Number(invoice.amount),
        }
      } catch (error) {
        console.error('Failed to send payment confirmation:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to send payment confirmation via WhatsApp',
        })
      }
    }),

  /**
   * Send custom text message
   */
  sendTextMessage: protectedProcedure
    .input(sendTextMessageSchema)
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.role !== 'ADMIN') {
        throw new TRPCError({ 
          code: 'FORBIDDEN',
          message: 'Only admins can send custom messages'
        })
      }

      try {
        const whatsapp = getWhatsAppClient()
        await whatsapp.sendTextMessage(input.phoneNumber, input.message)

        return {
          success: true,
          message: 'Text message sent successfully',
          recipient: input.phoneNumber,
        }
      } catch (error) {
        console.error('Failed to send text message:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to send text message via WhatsApp',
        })
      }
    }),

  /**
   * Send interactive menu to tenant
   */
  sendInteractiveMenu: protectedProcedure
    .input(z.object({ tenantId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const tenant = await ctx.db.tenant.findUnique({
          where: { id: input.tenantId },
          include: { user: true }
        })

        if (!tenant) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Tenant not found'
          })
        }

        const whatsapp = getWhatsAppClient()

        await whatsapp.sendIssueReportingMenu({
          phoneNumber: tenant.user.phone || '',
          tenantName: `${tenant.user.firstName} ${tenant.user.lastName}`,
        })

        return {
          success: true,
          message: 'Interactive menu sent successfully',
          recipient: tenant.user.phone,
        }
      } catch (error) {
        console.error('Failed to send interactive menu:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to send interactive menu via WhatsApp',
        })
      }
    }),

  /**
   * Process automated rent reminders (for cron job)
   */
  processAutomatedRentReminders: protectedProcedure
    .mutation(async ({ ctx }) => {
      if (ctx.session.user.role !== 'ADMIN') {
        throw new TRPCError({ 
          code: 'FORBIDDEN',
          message: 'Only admins can process automated reminders'
        })
      }

      try {
        const helper = new RentalWhatsAppHelper()
        
        // Get all active contracts with payment due soon
        const activeContracts = await ctx.db.contract.findMany({
          where: {
            startDate: { lte: new Date() },
            endDate: { gte: new Date() },
          },
          include: {
            tenant: {
              include: { user: true }
            },
            property: true,
          },
        })

        const results = []
        const today = new Date()

        for (const contract of activeContracts) {
          if (!contract.tenant.user.phone) continue

          // Calculate next due date
          const dueDate = new Date(today.getFullYear(), today.getMonth(), contract.paymentDay)
          if (dueDate < today) {
            dueDate.setMonth(dueDate.getMonth() + 1)
          }

          const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

          // Send reminders at specific intervals
          if ([5, 1, 0, -1, -3, -7].includes(daysUntilDue)) {
            try {
              await helper.sendAutomatedRentReminder({
                tenantPhone: contract.tenant.user.phone,
                tenantName: `${contract.tenant.user.firstName} ${contract.tenant.user.lastName}`,
                rentAmount: Number(contract.rentAmount),
                dueDate: dueDate.toLocaleDateString('es-ES'),
                propertyAddress: contract.property.address,
                daysUntilDue,
              })

              results.push({
                tenantId: contract.tenant.id,
                daysUntilDue,
                sent: true,
              })
            } catch (error) {
              console.error(`Failed to send reminder to tenant ${contract.tenant.id}:`, error)
              results.push({
                tenantId: contract.tenant.id,
                daysUntilDue,
                sent: false,
                error: error instanceof Error ? error.message : 'Unknown error',
              })
            }
          }
        }

        return {
          processedDate: today.toISOString().split('T')[0],
          contractsChecked: activeContracts.length,
          remindersSent: results.filter(r => r.sent).length,
          failures: results.filter(r => !r.sent).length,
          results,
        }
      } catch (error) {
        console.error('Failed to process automated rent reminders:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to process automated rent reminders',
        })
      }
    }),

  /**
   * Webhook handler for incoming WhatsApp messages
   */
  handleWebhook: publicProcedure
    .input(webhookSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const whatsapp = getWhatsAppClient()
        const helper = new RentalWhatsAppHelper()
        
        const events = whatsapp.processWebhook(input as any)
        const responses = []

        for (const event of events) {
          if (event.type === 'message_received' && event.from && event.text) {
            // Find tenant by phone number
            const tenant = await ctx.db.tenant.findFirst({
              where: {
                user: {
                  phone: event.from
                }
              },
              include: { user: true }
            })

            if (tenant) {
              const response = await helper.handleTenantMessage({
                from: event.from,
                text: event.text,
                buttonId: event.buttonId,
              })

              // Handle specific actions
              if (response.action === 'create_issue') {
                // Create issue from WhatsApp message
                await ctx.db.issue.create({
                  data: {
                    title: event.text || 'WhatsApp Issue Report',
                    description: event.text || 'Issue reported via WhatsApp',
                    category: 'OTHER',
                    priority: 'MEDIUM',
                    status: 'OPEN',
                    propertyId: tenant.properties[0]?.id || '', // Use first property if available
                    reportedById: tenant.user.id,
                    photos: [],
                  }
                })
              }

              responses.push({
                from: event.from,
                action: response.action,
                responseText: response.response,
              })
            }
          }
        }

        return {
          eventsProcessed: events.length,
          responses,
        }
      } catch (error) {
        console.error('Failed to process WhatsApp webhook:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to process WhatsApp webhook',
        })
      }
    }),

  /**
   * Get phone number insights and status
   */
  getPhoneNumberInsights: protectedProcedure
    .query(async ({ ctx }) => {
      if (ctx.session.user.role !== 'ADMIN') {
        throw new TRPCError({ 
          code: 'FORBIDDEN',
          message: 'Only admins can access phone number insights'
        })
      }

      try {
        const whatsapp = getWhatsAppClient()
        const insights = await whatsapp.getPhoneNumberInsights()
        
        return {
          phoneNumber: insights.display_phone_number,
          verifiedName: insights.verified_name,
          qualityRating: insights.quality_rating,
          verificationStatus: insights.code_verification_status,
          platformType: insights.platform_type,
          throughputLevel: insights.throughput.level,
        }
      } catch (error) {
        console.error('Failed to get phone number insights:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get phone number insights',
        })
      }
    }),
})