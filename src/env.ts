import { z } from "zod"

const envSchema = z.object({
  // Database - PostgreSQL connection strings are not standard URLs
  DATABASE_URL: z.string().min(1),
  
  // NextAuth
  NEXTAUTH_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(1),
  
  // Port
  PORT: z.string().optional(),
  
  // Cloudflare R2
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET_NAME: z.string().optional(),
  R2_ENDPOINT: z.string().optional(),
  
  // Email
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().optional(),
  
  // Maps
  NEXT_PUBLIC_GOOGLE_MAPS_KEY: z.string().optional(),
  
  // App
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_APP_VERSION: z.string().optional(),
  
  // Push Notifications
  VAPID_PUBLIC_KEY: z.string().optional(),
  VAPID_PRIVATE_KEY: z.string().optional(),
  
  // Uploadthing
  UPLOADTHING_SECRET: z.string().optional(),
  UPLOADTHING_APP_ID: z.string().optional(),
  
  // Cron
  CRON_SECRET: z.string().optional(),
  
  // Zoho Books API (Spanish Integration)
  ZOHO_CLIENT_ID: z.string().optional(),
  ZOHO_CLIENT_SECRET: z.string().optional(),
  ZOHO_REFRESH_TOKEN: z.string().optional(),
  ZOHO_ORGANIZATION_ID: z.string().optional(),
  
  // CaixaBank PSD2 API
  CAIXABANK_CLIENT_ID: z.string().optional(),
  CAIXABANK_CLIENT_SECRET: z.string().optional(),
  CAIXABANK_SANDBOX: z.string().optional().transform(val => val === 'true'),
  CAIXABANK_IBAN: z.string().optional(),
  CAIXABANK_CONSENT_ID: z.string().optional(),
  
  // WhatsApp Business API
  WHATSAPP_BUSINESS_ACCOUNT_ID: z.string().optional(),
  WHATSAPP_PHONE_NUMBER_ID: z.string().optional(),
  WHATSAPP_ACCESS_TOKEN: z.string().optional(),
  WHATSAPP_WEBHOOK_SECRET: z.string().optional(),
  
  // Booking.com Partner API
  BOOKING_USERNAME: z.string().optional(),
  BOOKING_PASSWORD: z.string().optional(),
  BOOKING_HOTEL_ID: z.string().optional(),
  BOOKING_ENVIRONMENT: z.enum(['test', 'production']).optional(),
})

export const env = envSchema.parse(process.env)