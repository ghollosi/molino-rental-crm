import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const prismaClientConfig = {
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'error', 'warn'] 
    : ['error'],
  errorFormat: process.env.NODE_ENV === 'development' ? 'pretty' : 'minimal',
}

// Production optimizations
if (process.env.NODE_ENV === 'production') {
  // Connection pool settings are handled by DATABASE_URL in production
  // using ?pgbouncer=true&connection_limit=1
}

export const db = globalForPrisma.prisma ?? new PrismaClient(prismaClientConfig)
export const prisma = db

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

// Graceful shutdown
if (process.env.NODE_ENV === 'production') {
  process.on('beforeExit', async () => {
    await db.$disconnect()
  })
}