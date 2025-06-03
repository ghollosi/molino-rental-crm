import { getRateLimitForPath, rateLimitConfig } from '@/src/lib/rate-limit-config'

describe('Rate Limit Configuration', () => {
  it('should return correct config for session endpoints', () => {
    const sessionConfig = getRateLimitForPath('/api/auth/session')
    expect(sessionConfig.max).toBe(100)
    expect(sessionConfig.windowMs).toBe(60 * 1000)

    const csrfConfig = getRateLimitForPath('/api/auth/csrf')
    expect(csrfConfig.max).toBe(100)
    expect(csrfConfig.windowMs).toBe(60 * 1000)
  })

  it('should return auth config for auth endpoints', () => {
    const loginConfig = getRateLimitForPath('/api/auth/signin')
    expect(loginConfig).toEqual(rateLimitConfig.auth)

    const forgotPasswordConfig = getRateLimitForPath('/forgot-password')
    expect(forgotPasswordConfig).toEqual(rateLimitConfig.auth)

    const resetPasswordConfig = getRateLimitForPath('/reset-password')
    expect(resetPasswordConfig).toEqual(rateLimitConfig.auth)
  })

  it('should return upload config for upload endpoints', () => {
    const uploadConfig = getRateLimitForPath('/api/upload')
    expect(uploadConfig).toEqual(rateLimitConfig.upload)

    const cloudStorageConfig = getRateLimitForPath('/api/cloud-storage')
    expect(cloudStorageConfig).toEqual(rateLimitConfig.upload)
  })

  it('should return export config for export endpoints', () => {
    const exportConfig = getRateLimitForPath('/api/export/excel')
    expect(exportConfig).toEqual(rateLimitConfig.export)

    const reportsConfig = getRateLimitForPath('/api/reports/generate')
    expect(reportsConfig).toEqual(rateLimitConfig.export)
  })

  it('should return email config for email endpoints', () => {
    const emailConfig = getRateLimitForPath('/api/email')
    expect(emailConfig).toEqual(rateLimitConfig.email)

    const testEmailConfig = getRateLimitForPath('/api/test-email')
    expect(testEmailConfig).toEqual(rateLimitConfig.email)
  })

  it('should return cron config for cron endpoints', () => {
    const cronConfig = getRateLimitForPath('/api/cron/workflow')
    expect(cronConfig).toEqual(rateLimitConfig.cron)
  })

  it('should return trpc config for trpc endpoints', () => {
    const trpcConfig = getRateLimitForPath('/api/trpc/user.getCurrentUser')
    expect(trpcConfig).toEqual(rateLimitConfig.trpc)
  })

  it('should return default api config for unknown endpoints', () => {
    const unknownConfig = getRateLimitForPath('/api/unknown-endpoint')
    expect(unknownConfig).toEqual(rateLimitConfig.api)
  })

  it('should have valid rate limit configurations', () => {
    // Check that all configs have required properties
    Object.values(rateLimitConfig).forEach(config => {
      expect(config).toHaveProperty('windowMs')
      expect(config).toHaveProperty('max')
      expect(typeof config.windowMs).toBe('number')
      expect(typeof config.max).toBe('number')
      expect(config.windowMs).toBeGreaterThan(0)
      expect(config.max).toBeGreaterThan(0)
    })
  })
})