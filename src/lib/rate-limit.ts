import { LRUCache } from 'lru-cache'
import { db } from '@/lib/db'

export type RateLimitOptions = {
  interval: number // Time window in milliseconds
  uniqueTokenPerInterval: number // Max requests per interval
  useDatabaseStorage?: boolean // Use database for persistent rate limiting
}

export function rateLimit(options: RateLimitOptions) {
  // Fallback LRU cache for when database is not available
  const tokenCache = new LRUCache({
    max: options.uniqueTokenPerInterval || 500,
    ttl: options.interval || 60000,
  })

  return {
    check: async (request: Request, limit: number, token: string) => {
      // Try database storage first if enabled
      if (options.useDatabaseStorage !== false) {
        try {
          const windowStart = new Date(Date.now() - options.interval)
          
          // Clean up old entries
          await db.$executeRaw`
            DELETE FROM "rate_limit_tokens" 
            WHERE "lastReset" < ${windowStart}
          `
          
          // Get or create token record
          const tokenRecord = await db.rateLimitToken.upsert({
            where: { token },
            update: {},
            create: {
              token,
              usage: 0,
              lastReset: new Date(),
            }
          })
          
          // Check if we need to reset the window
          const timeSinceReset = Date.now() - tokenRecord.lastReset.getTime()
          if (timeSinceReset >= options.interval) {
            await db.rateLimitToken.update({
              where: { token },
              data: {
                usage: 1,
                lastReset: new Date(),
              }
            })
            
            return {
              isRateLimited: false,
              limit,
              remaining: limit - 1,
              reset: Date.now() + options.interval,
            }
          }
          
          // Increment usage
          const isRateLimited = tokenRecord.usage >= limit
          const newUsage = isRateLimited ? tokenRecord.usage : tokenRecord.usage + 1
          
          if (!isRateLimited) {
            await db.rateLimitToken.update({
              where: { token },
              data: { usage: newUsage }
            })
          }
          
          return {
            isRateLimited,
            limit,
            remaining: Math.max(0, limit - newUsage),
            reset: tokenRecord.lastReset.getTime() + options.interval,
          }
        } catch (dbError) {
          console.warn('Database rate limiting failed, falling back to memory:', dbError)
          // Fall through to memory-based rate limiting
        }
      }
      
      // Fallback to memory-based rate limiting
      const tokenCount = (tokenCache.get(token) as number[]) || [0]
      const currentUsage = tokenCount[0]
      const isRateLimited = currentUsage >= limit
      const newUsage = isRateLimited ? currentUsage : currentUsage + 1
      tokenCache.set(token, [newUsage])
      
      return {
        isRateLimited,
        limit,
        remaining: Math.max(0, limit - newUsage),
        reset: Date.now() + options.interval,
      }
    },
  }
}