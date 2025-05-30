import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const prismaClientConfig = {
  log: process.env.NODE_ENV === 'development' 
    ? (['query', 'error', 'warn'] as any)
    : (['error'] as any),
  errorFormat: process.env.NODE_ENV === 'development' ? 'pretty' : 'minimal' as any,
}

// Production optimizations
if (process.env.NODE_ENV === 'production') {
  // Connection pool settings are handled by DATABASE_URL in production
  // using ?pgbouncer=true&connection_limit=1
}

export const db = globalForPrisma.prisma ?? new PrismaClient(prismaClientConfig)
export const prisma = db

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

// Graceful shutdown - disabled for Edge Runtime compatibility
// Note: Edge Runtime doesn't support process.on
// Prisma Client will automatically disconnect when the function ends