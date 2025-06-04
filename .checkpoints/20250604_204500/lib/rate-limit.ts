import { LRUCache } from 'lru-cache'

export type RateLimitOptions = {
  interval: number // Time window in milliseconds
  uniqueTokenPerInterval: number // Max requests per interval
}

export function rateLimit(options: RateLimitOptions) {
  const tokenCache = new LRUCache({
    max: options.uniqueTokenPerInterval || 500,
    ttl: options.interval || 60000,
  })

  return {
    check: async (request: Request, limit: number, token: string) => {
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