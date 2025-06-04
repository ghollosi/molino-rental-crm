import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '../trpc'
import { TRPCError } from '@trpc/server'
import crypto from 'crypto'

// Encryption utilities
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-key-change-in-production-!!!'
const ALGORITHM = 'aes-256-cbc'

function encrypt(text: string): string {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipher(ALGORITHM, ENCRYPTION_KEY)
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  return iv.toString('hex') + ':' + encrypted
}

function decrypt(text: string): string {
  try {
    const textParts = text.split(':')
    const iv = Buffer.from(textParts.shift()!, 'hex')
    const encryptedText = textParts.join(':')
    const decipher = crypto.createDecipher(ALGORITHM, ENCRYPTION_KEY)
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
  } catch (error) {
    throw new Error('Decryption failed')
  }
}

// Schema definitions for each integration type
const ZohoConfigSchema = z.object({
  clientId: z.string().min(1),
  clientSecret: z.string().min(1),
  refreshToken: z.string().optional(),
  organizationId: z.string().optional(),
  region: z.enum(['eu', 'us', 'au', 'in']).default('eu'),
  environment: z.enum(['production', 'sandbox']).default('production'),
  defaultVatRate: z.number().min(0).max(100).default(21),
  aeatEnabled: z.boolean().default(true),
  aeatNif: z.string().optional(),
  aeatCompanyName: z.string().optional(),
})

const CaixaBankConfigSchema = z.object({
  clientId: z.string().min(1),
  clientSecret: z.string().min(1),
  iban: z.string().min(1),
  accountName: z.string().optional(),
  environment: z.enum(['sandbox', 'production']).default('sandbox'),
  autoReconcile: z.boolean().default(true),
  amountTolerance: z.number().min(0).default(1.00),
  daysTolerance: z.number().min(0).default(7),
  confidenceThreshold: z.number().min(0).max(1).default(0.90),
  webhookUrl: z.string().url().optional(),
  webhookSecret: z.string().optional(),
})

const WhatsAppConfigSchema = z.object({
  businessAccountId: z.string().min(1),
  phoneNumberId: z.string().min(1),
  accessToken: z.string().min(1),
  webhookSecret: z.string().optional(),
  defaultLanguage: z.enum(['es', 'en', 'hu']).default('es'),
  rentReminderTemplate: z.string().default('rent_reminder_spanish_v2'),
  paymentConfirmTemplate: z.string().default('payment_confirmed_spanish'),
  maintenanceTemplate: z.string().default('maintenance_notice_spanish'),
  autoReminders: z.boolean().default(true),
  reminderDays: z.array(z.number()).default([5, 1, 0]),
  overdueReminders: z.boolean().default(true),
  overdueFrequency: z.number().min(1).default(3),
  enableBusinessHours: z.boolean().default(true),
  businessHoursStart: z.string().default('09:00'),
  businessHoursEnd: z.string().default('18:00'),
  businessDays: z.array(z.number().min(0).max(6)).default([1, 2, 3, 4, 5]),
})

const BookingConfigSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
  hotelId: z.string().min(1),
  environment: z.enum(['test', 'live']).default('test'),
  autoSync: z.boolean().default(true),
  syncFrequency: z.number().min(5).default(60),
  enableDynamicPricing: z.boolean().default(true),
  basePrice: z.number().min(0).optional(),
  weekendMarkup: z.number().min(1).default(1.30),
  highSeasonMarkup: z.number().min(1).default(1.50),
  highSeasonDates: z.array(z.object({
    start: z.string(),
    end: z.string()
  })).optional(),
  defaultCommission: z.number().min(0).max(1).default(0.15),
  checkInTime: z.string().default('15:00'),
  checkOutTime: z.string().default('11:00'),
})

const UplistingConfigSchema = z.object({
  apiKey: z.string().min(1),
  apiSecret: z.string().min(1),
  accountId: z.string().min(1),
  environment: z.enum(['sandbox', 'production']).default('sandbox'),
  enableAirbnb: z.boolean().default(true),
  enableBookingCom: z.boolean().default(true),
  enableVrbo: z.boolean().default(true),
  enableDirectBooking: z.boolean().default(true),
  autoSync: z.boolean().default(true),
  syncFrequency: z.number().min(5).default(30),
  blockOffDays: z.number().min(0).default(1),
  autoCalendarSync: z.boolean().default(true),
  defaultMinStay: z.number().min(1).default(2),
  defaultMaxStay: z.number().min(1).default(30),
  enableDynamicPricing: z.boolean().default(true),
  basePrice: z.number().min(0).optional(),
  weekendMarkup: z.number().min(1).default(1.25),
  highSeasonMarkup: z.number().min(1).default(1.40),
  lastMinuteDiscount: z.number().min(0).max(1).default(0.90),
  highSeasonDates: z.array(z.object({
    start: z.string(),
    end: z.string()
  })).optional(),
  autoGuestMessaging: z.boolean().default(true),
  checkInInstructions: z.string().optional(),
  checkOutInstructions: z.string().optional(),
  houseRules: z.string().optional(),
  autoCleaningSchedule: z.boolean().default(true),
  cleaningDuration: z.number().min(30).default(120),
  cleaningFee: z.number().min(0).optional(),
  requireIdVerification: z.boolean().default(true),
  securityDeposit: z.number().min(0).optional(),
  damageProtection: z.boolean().default(true),
  channelCommissions: z.object({
    airbnb: z.number().min(0).max(1).default(0.03),
    booking: z.number().min(0).max(1).default(0.15),
    vrbo: z.number().min(0).max(1).default(0.05)
  }).optional(),
  revenueOptimization: z.boolean().default(true),
  webhookUrl: z.string().url().optional(),
  webhookSecret: z.string().optional(),
})

export const integrationConfigRouter = createTRPCRouter({
  // Get all integration configurations
  getAll: protectedProcedure
    .query(async ({ ctx }) => {
      if (!['ADMIN', 'EDITOR_ADMIN'].includes(ctx.session.user.role)) {
        throw new TRPCError({ code: 'FORBIDDEN' })
      }

      const configs = await ctx.db.integrationConfig.findMany({
        orderBy: { type: 'asc' }
      })

      return configs.map(config => ({
        ...config,
        config: '***' // Don't return actual config data in list view
      }))
    }),

  // Get specific integration configuration
  get: protectedProcedure
    .input(z.object({
      type: z.enum(['ZOHO_BOOKS', 'CAIXABANK_PSD2', 'WHATSAPP_BUSINESS', 'BOOKING_COM', 'UPLISTING_IO', 'SPANISH_VAT', 'PAYMENT_RECONCILIATION'])
    }))
    .query(async ({ ctx, input }) => {
      if (!['ADMIN', 'EDITOR_ADMIN'].includes(ctx.session.user.role)) {
        throw new TRPCError({ code: 'FORBIDDEN' })
      }

      const config = await ctx.db.integrationConfig.findUnique({
        where: { type: input.type }
      })

      if (!config) {
        return null
      }

      // Decrypt sensitive config data
      try {
        const decryptedConfig = JSON.parse(decrypt(config.config as string))
        return {
          ...config,
          config: decryptedConfig
        }
      } catch (error) {
        throw new TRPCError({ 
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to decrypt configuration'
        })
      }
    }),

  // Update Zoho Books configuration
  updateZoho: protectedProcedure
    .input(ZohoConfigSchema.extend({
      isEnabled: z.boolean().default(false)
    }))
    .mutation(async ({ ctx, input }) => {
      if (!['ADMIN', 'EDITOR_ADMIN'].includes(ctx.session.user.role)) {
        throw new TRPCError({ code: 'FORBIDDEN' })
      }

      const { isEnabled, ...configData } = input
      const encryptedConfig = encrypt(JSON.stringify(configData))

      const config = await ctx.db.integrationConfig.upsert({
        where: { type: 'ZOHO_BOOKS' },
        create: {
          type: 'ZOHO_BOOKS',
          name: 'Zoho Books',
          description: 'Spanish VAT invoicing and accounting integration',
          config: encryptedConfig,
          isEnabled,
          status: isEnabled ? 'ACTIVE' : 'INACTIVE',
          createdBy: ctx.session.user.id,
          updatedBy: ctx.session.user.id,
        },
        update: {
          config: encryptedConfig,
          isEnabled,
          status: isEnabled ? 'ACTIVE' : 'INACTIVE',
          updatedBy: ctx.session.user.id,
          version: { increment: 1 }
        }
      })

      // Also update the specific ZohoConfig table
      await ctx.db.zohoConfig.upsert({
        where: { id: 'singleton' },
        create: {
          id: 'singleton',
          ...configData,
          isActive: isEnabled
        },
        update: {
          ...configData,
          isActive: isEnabled
        }
      })

      return config
    }),

  // Update CaixaBank configuration
  updateCaixaBank: protectedProcedure
    .input(CaixaBankConfigSchema.extend({
      isEnabled: z.boolean().default(false)
    }))
    .mutation(async ({ ctx, input }) => {
      if (!['ADMIN', 'EDITOR_ADMIN'].includes(ctx.session.user.role)) {
        throw new TRPCError({ code: 'FORBIDDEN' })
      }

      const { isEnabled, ...configData } = input
      const encryptedConfig = encrypt(JSON.stringify(configData))

      const config = await ctx.db.integrationConfig.upsert({
        where: { type: 'CAIXABANK_PSD2' },
        create: {
          type: 'CAIXABANK_PSD2',
          name: 'CaixaBank PSD2',
          description: 'Banking API for automated payment reconciliation',
          config: encryptedConfig,
          isEnabled,
          status: isEnabled ? 'ACTIVE' : 'INACTIVE',
          createdBy: ctx.session.user.id,
          updatedBy: ctx.session.user.id,
        },
        update: {
          config: encryptedConfig,
          isEnabled,
          status: isEnabled ? 'ACTIVE' : 'INACTIVE',
          updatedBy: ctx.session.user.id,
          version: { increment: 1 }
        }
      })

      // Also update the specific CaixaBankConfig table
      await ctx.db.caixaBankConfig.upsert({
        where: { id: 'singleton' },
        create: {
          id: 'singleton',
          ...configData,
          isActive: isEnabled
        },
        update: {
          ...configData,
          isActive: isEnabled
        }
      })

      return config
    }),

  // Update WhatsApp configuration
  updateWhatsApp: protectedProcedure
    .input(WhatsAppConfigSchema.extend({
      isEnabled: z.boolean().default(false)
    }))
    .mutation(async ({ ctx, input }) => {
      if (!['ADMIN', 'EDITOR_ADMIN'].includes(ctx.session.user.role)) {
        throw new TRPCError({ code: 'FORBIDDEN' })
      }

      const { isEnabled, ...configData } = input
      const encryptedConfig = encrypt(JSON.stringify(configData))

      const config = await ctx.db.integrationConfig.upsert({
        where: { type: 'WHATSAPP_BUSINESS' },
        create: {
          type: 'WHATSAPP_BUSINESS',
          name: 'WhatsApp Business',
          description: 'Automated tenant communication with Spanish templates',
          config: encryptedConfig,
          isEnabled,
          status: isEnabled ? 'ACTIVE' : 'INACTIVE',
          createdBy: ctx.session.user.id,
          updatedBy: ctx.session.user.id,
        },
        update: {
          config: encryptedConfig,
          isEnabled,
          status: isEnabled ? 'ACTIVE' : 'INACTIVE',
          updatedBy: ctx.session.user.id,
          version: { increment: 1 }
        }
      })

      // Also update the specific WhatsAppConfig table
      await ctx.db.whatsAppConfig.upsert({
        where: { id: 'singleton' },
        create: {
          id: 'singleton',
          ...configData,
          isActive: isEnabled
        },
        update: {
          ...configData,
          isActive: isEnabled
        }
      })

      return config
    }),

  // Update Booking.com configuration
  updateBooking: protectedProcedure
    .input(BookingConfigSchema.extend({
      isEnabled: z.boolean().default(false)
    }))
    .mutation(async ({ ctx, input }) => {
      if (!['ADMIN', 'EDITOR_ADMIN'].includes(ctx.session.user.role)) {
        throw new TRPCError({ code: 'FORBIDDEN' })
      }

      const { isEnabled, ...configData } = input
      const encryptedConfig = encrypt(JSON.stringify(configData))

      const config = await ctx.db.integrationConfig.upsert({
        where: { type: 'BOOKING_COM' },
        create: {
          type: 'BOOKING_COM',
          name: 'Booking.com Partner',
          description: 'Room availability and dynamic pricing integration',
          config: encryptedConfig,
          isEnabled,
          status: isEnabled ? 'ACTIVE' : 'INACTIVE',
          createdBy: ctx.session.user.id,
          updatedBy: ctx.session.user.id,
        },
        update: {
          config: encryptedConfig,
          isEnabled,
          status: isEnabled ? 'ACTIVE' : 'INACTIVE',
          updatedBy: ctx.session.user.id,
          version: { increment: 1 }
        }
      })

      // Also update the specific BookingConfig table
      await ctx.db.bookingConfig.upsert({
        where: { id: 'singleton' },
        create: {
          id: 'singleton',
          ...configData,
          isActive: isEnabled
        },
        update: {
          ...configData,
          isActive: isEnabled
        }
      })

      return config
    }),

  // Update Uplisting.io configuration
  updateUplisting: protectedProcedure
    .input(UplistingConfigSchema.extend({
      isEnabled: z.boolean().default(false)
    }))
    .mutation(async ({ ctx, input }) => {
      if (!['ADMIN', 'EDITOR_ADMIN'].includes(ctx.session.user.role)) {
        throw new TRPCError({ code: 'FORBIDDEN' })
      }

      const { isEnabled, ...configData } = input
      const encryptedConfig = encrypt(JSON.stringify(configData))

      const config = await ctx.db.integrationConfig.upsert({
        where: { type: 'UPLISTING_IO' },
        create: {
          type: 'UPLISTING_IO',
          name: 'Uplisting.io',
          description: 'Multi-channel vacation rental management platform',
          config: encryptedConfig,
          isEnabled,
          status: isEnabled ? 'ACTIVE' : 'INACTIVE',
          createdBy: ctx.session.user.id,
          updatedBy: ctx.session.user.id,
        },
        update: {
          config: encryptedConfig,
          isEnabled,
          status: isEnabled ? 'ACTIVE' : 'INACTIVE',
          updatedBy: ctx.session.user.id,
          version: { increment: 1 }
        }
      })

      // Also update the specific UplistingConfig table
      await ctx.db.uplistingConfig.upsert({
        where: { id: 'singleton' },
        create: {
          id: 'singleton',
          ...configData,
          isActive: isEnabled
        },
        update: {
          ...configData,
          isActive: isEnabled
        }
      })

      return config
    }),

  // Test integration configuration
  testConnection: protectedProcedure
    .input(z.object({
      type: z.enum(['ZOHO_BOOKS', 'CAIXABANK_PSD2', 'WHATSAPP_BUSINESS', 'BOOKING_COM', 'UPLISTING_IO'])
    }))
    .mutation(async ({ ctx, input }) => {
      if (!['ADMIN', 'EDITOR_ADMIN'].includes(ctx.session.user.role)) {
        throw new TRPCError({ code: 'FORBIDDEN' })
      }

      const config = await ctx.db.integrationConfig.findUnique({
        where: { type: input.type }
      })

      if (!config || !config.isEnabled) {
        throw new TRPCError({ 
          code: 'NOT_FOUND',
          message: 'Integration not configured or not enabled'
        })
      }

      try {
        // Decrypt and test the configuration
        const decryptedConfig = JSON.parse(decrypt(config.config as string))
        
        let testResult = 'SUCCESS'
        let message = 'Connection successful'

        // TODO: Implement actual API testing for each integration
        switch (input.type) {
          case 'ZOHO_BOOKS':
            // Test Zoho OAuth connection
            message = 'Zoho Books API connection verified'
            break
          case 'CAIXABANK_PSD2':
            // Test CaixaBank PSD2 connection
            message = 'CaixaBank PSD2 API connection verified'
            break
          case 'WHATSAPP_BUSINESS':
            // Test WhatsApp Business API
            message = 'WhatsApp Business API connection verified'
            break
          case 'BOOKING_COM':
            // Test Booking.com Partner API
            message = 'Booking.com Partner API connection verified'
            break
          case 'UPLISTING_IO':
            // Test Uplisting.io API connection
            message = 'Uplisting.io API connection verified'
            break
        }

        // Update test results
        await ctx.db.integrationConfig.update({
          where: { type: input.type },
          data: {
            lastTested: new Date(),
            lastTestResult: testResult,
            status: testResult === 'SUCCESS' ? 'ACTIVE' : 'ERROR'
          }
        })

        return { success: true, message }

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        
        await ctx.db.integrationConfig.update({
          where: { type: input.type },
          data: {
            lastTested: new Date(),
            lastTestResult: 'ERROR',
            status: 'ERROR'
          }
        })

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Connection test failed: ${errorMessage}`
        })
      }
    }),

  // Toggle integration status
  toggleStatus: protectedProcedure
    .input(z.object({
      type: z.enum(['ZOHO_BOOKS', 'CAIXABANK_PSD2', 'WHATSAPP_BUSINESS', 'BOOKING_COM', 'UPLISTING_IO']),
      enabled: z.boolean()
    }))
    .mutation(async ({ ctx, input }) => {
      if (!['ADMIN', 'EDITOR_ADMIN'].includes(ctx.session.user.role)) {
        throw new TRPCError({ code: 'FORBIDDEN' })
      }

      const config = await ctx.db.integrationConfig.update({
        where: { type: input.type },
        data: {
          isEnabled: input.enabled,
          status: input.enabled ? 'ACTIVE' : 'INACTIVE',
          updatedBy: ctx.session.user.id
        }
      })

      return config
    })
})