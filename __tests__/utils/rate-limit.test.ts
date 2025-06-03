import { rateLimit } from '@/src/lib/rate-limit'

describe('Rate Limiting', () => {
  it('should allow requests within limit', async () => {
    const limiter = rateLimit({
      interval: 60000, // 1 minute
      uniqueTokenPerInterval: 500,
    })

    const mockRequest = new Request('http://localhost:3000/api/test')
    const token = 'test-token'
    const limit = 5

    const result = await limiter.check(mockRequest, limit, token)

    expect(result.isRateLimited).toBe(false)
    expect(result.limit).toBe(limit)
    expect(result.remaining).toBe(limit - 1)
    expect(result.reset).toBeGreaterThan(Date.now())
  })

  it('should rate limit when exceeding limit', async () => {
    const limiter = rateLimit({
      interval: 60000, // 1 minute
      uniqueTokenPerInterval: 500,
    })

    const mockRequest = new Request('http://localhost:3000/api/test')
    const token = 'test-token-2'
    const limit = 2

    // First request - should pass
    const result1 = await limiter.check(mockRequest, limit, token)
    expect(result1.isRateLimited).toBe(false)

    // Second request - should pass
    const result2 = await limiter.check(mockRequest, limit, token)
    expect(result2.isRateLimited).toBe(false)

    // Third request - should be rate limited
    const result3 = await limiter.check(mockRequest, limit, token)
    expect(result3.isRateLimited).toBe(true)
    expect(result3.remaining).toBe(0)
  })

  it('should handle different tokens separately', async () => {
    const limiter = rateLimit({
      interval: 60000, // 1 minute
      uniqueTokenPerInterval: 500,
    })

    const mockRequest = new Request('http://localhost:3000/api/test')
    const token1 = 'test-token-1'
    const token2 = 'test-token-2'
    const limit = 1

    // First token - should pass
    const result1 = await limiter.check(mockRequest, limit, token1)
    expect(result1.isRateLimited).toBe(false)

    // Second token - should also pass (different token)
    const result2 = await limiter.check(mockRequest, limit, token2)
    expect(result2.isRateLimited).toBe(false)

    // First token again - should be rate limited
    const result3 = await limiter.check(mockRequest, limit, token1)
    expect(result3.isRateLimited).toBe(true)
  })
})