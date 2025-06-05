/**
 * Integration Configuration Helper
 * Provides database-first configuration with environment variable fallback
 */

import { db } from '@/lib/db'
import { env } from '@/env'
import crypto from 'crypto'

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-key-change-in-production-!!!'
const ALGORITHM = 'aes-256-cbc'

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

type IntegrationType = 'ZOHO_BOOKS' | 'CAIXABANK_PSD2' | 'WHATSAPP_BUSINESS' | 'BOOKING_COM' | 'UPLISTING_IO'

/**
 * Retrieves configuration for an integration, prioritizing database over environment variables
 */
export async function getIntegrationConfig<T>(
  type: IntegrationType,
  fallbackConfig: T
): Promise<T> {
  try {
    // Try to get from database first
    const dbConfig = await db.integrationConfig.findUnique({
      where: { 
        type,
        isEnabled: true
      }
    })

    if (dbConfig && dbConfig.config) {
      // Decrypt and return database config
      const decryptedConfig = JSON.parse(decrypt(dbConfig.config as string))
      return { ...fallbackConfig, ...decryptedConfig }
    }
  } catch (error) {
    console.warn(`Failed to retrieve database config for ${type}, falling back to environment variables:`, error)
  }

  // Fallback to environment variables
  return fallbackConfig
}

/**
 * Zoho Books Configuration
 */
export async function getZohoConfig() {
  const fallbackConfig = {
    clientId: env.ZOHO_CLIENT_ID || '',
    clientSecret: env.ZOHO_CLIENT_SECRET || '',
    refreshToken: env.ZOHO_REFRESH_TOKEN || '',
    organizationId: env.ZOHO_ORGANIZATION_ID || '',
    region: 'eu' as const,
    environment: 'production' as const,
    defaultVatRate: 21,
    aeatEnabled: true,
    aeatNif: env.AEAT_NIF || '',
    aeatCompanyName: env.AEAT_COMPANY_NAME || ''
  }

  return await getIntegrationConfig('ZOHO_BOOKS', fallbackConfig)
}

/**
 * CaixaBank PSD2 Configuration
 */
export async function getCaixaBankConfig() {
  const fallbackConfig = {
    clientId: env.CAIXABANK_CLIENT_ID || '',
    clientSecret: env.CAIXABANK_CLIENT_SECRET || '',
    iban: env.CAIXABANK_IBAN || '',
    accountName: env.CAIXABANK_ACCOUNT_NAME || '',
    environment: (env.CAIXABANK_SANDBOX === 'true' ? 'sandbox' : 'production') as 'sandbox' | 'production',
    autoReconcile: true,
    amountTolerance: 1.00,
    daysTolerance: 7,
    confidenceThreshold: 0.90,
    webhookUrl: env.CAIXABANK_WEBHOOK_URL || '',
    webhookSecret: env.CAIXABANK_WEBHOOK_SECRET || ''
  }

  return await getIntegrationConfig('CAIXABANK_PSD2', fallbackConfig)
}

/**
 * WhatsApp Business Configuration
 */
export async function getWhatsAppConfig() {
  const fallbackConfig = {
    businessAccountId: env.WHATSAPP_BUSINESS_ACCOUNT_ID || '',
    phoneNumberId: env.WHATSAPP_PHONE_NUMBER_ID || '',
    accessToken: env.WHATSAPP_ACCESS_TOKEN || '',
    webhookSecret: env.WHATSAPP_WEBHOOK_SECRET || '',
    defaultLanguage: 'es' as const,
    rentReminderTemplate: 'rent_reminder_spanish_v2',
    paymentConfirmTemplate: 'payment_confirmed_spanish',
    maintenanceTemplate: 'maintenance_notice_spanish',
    autoReminders: true,
    reminderDays: [5, 1, 0],
    overdueReminders: true,
    overdueFrequency: 3,
    enableBusinessHours: true,
    businessHoursStart: '09:00',
    businessHoursEnd: '18:00',
    businessDays: [1, 2, 3, 4, 5]
  }

  return await getIntegrationConfig('WHATSAPP_BUSINESS', fallbackConfig)
}

/**
 * Booking.com Configuration
 */
export async function getBookingConfig() {
  const fallbackConfig = {
    username: env.BOOKING_USERNAME || '',
    password: env.BOOKING_PASSWORD || '',
    hotelId: env.BOOKING_HOTEL_ID || '',
    environment: (env.BOOKING_ENVIRONMENT === 'live' ? 'live' : 'test') as 'test' | 'live',
    autoSync: true,
    syncFrequency: 60,
    enableDynamicPricing: true,
    basePrice: undefined,
    weekendMarkup: 1.30,
    highSeasonMarkup: 1.50,
    highSeasonDates: [],
    defaultCommission: 0.15,
    checkInTime: '15:00',
    checkOutTime: '11:00'
  }

  return await getIntegrationConfig('BOOKING_COM', fallbackConfig)
}

/**
 * Uplisting.io Configuration
 */
export async function getUplistingConfig() {
  const fallbackConfig = {
    apiKey: env.UPLISTING_API_KEY || '',
    apiSecret: env.UPLISTING_API_SECRET || '',
    accountId: env.UPLISTING_ACCOUNT_ID || '',
    environment: (env.UPLISTING_ENVIRONMENT === 'production' ? 'production' : 'sandbox') as 'sandbox' | 'production',
    enableAirbnb: true,
    enableBookingCom: true,
    enableVrbo: true,
    enableDirectBooking: true,
    autoSync: true,
    syncFrequency: 30,
    blockOffDays: 1,
    autoCalendarSync: true,
    defaultMinStay: 2,
    defaultMaxStay: 30,
    enableDynamicPricing: true,
    basePrice: undefined,
    weekendMarkup: 1.25,
    highSeasonMarkup: 1.40,
    lastMinuteDiscount: 0.90,
    highSeasonDates: [],
    autoGuestMessaging: true,
    checkInInstructions: '',
    checkOutInstructions: '',
    houseRules: '',
    autoCleaningSchedule: true,
    cleaningDuration: 120,
    cleaningFee: undefined,
    requireIdVerification: true,
    securityDeposit: undefined,
    damageProtection: true,
    channelCommissions: { airbnb: 0.03, booking: 0.15, vrbo: 0.05 },
    revenueOptimization: true,
    automationRules: undefined,
    webhookUrl: env.UPLISTING_WEBHOOK_URL || '',
    webhookSecret: env.UPLISTING_WEBHOOK_SECRET || ''
  }

  return await getIntegrationConfig('UPLISTING_IO', fallbackConfig)
}

/**
 * Check if an integration is enabled
 */
export async function isIntegrationEnabled(type: IntegrationType): Promise<boolean> {
  try {
    const dbConfig = await db.integrationConfig.findUnique({
      where: { type }
    })

    return dbConfig?.isEnabled || false
  } catch (error) {
    console.warn(`Failed to check integration status for ${type}:`, error)
    return false
  }
}

/**
 * Get integration status and metadata
 */
export async function getIntegrationStatus(type: IntegrationType) {
  try {
    const dbConfig = await db.integrationConfig.findUnique({
      where: { type }
    })

    return {
      isEnabled: dbConfig?.isEnabled || false,
      status: dbConfig?.status || 'INACTIVE',
      lastTested: dbConfig?.lastTested,
      lastTestResult: dbConfig?.lastTestResult,
      version: dbConfig?.version || 1
    }
  } catch (error) {
    console.warn(`Failed to get integration status for ${type}:`, error)
    return {
      isEnabled: false,
      status: 'INACTIVE' as const,
      lastTested: null,
      lastTestResult: null,
      version: 1
    }
  }
}