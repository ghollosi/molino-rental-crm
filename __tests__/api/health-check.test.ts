import { GET } from '@/app/api/health-check/route'

describe('/api/health-check', () => {
  it('should return health status', async () => {
    const request = new Request('http://localhost:3000/api/health-check')
    const response = await GET(request)
    
    expect(response.status).toBe(200)
    
    const data = await response.json()
    expect(data).toHaveProperty('status', 'healthy')
    expect(data).toHaveProperty('timestamp')
    expect(data).toHaveProperty('version', '1.0.0')
    expect(data).toHaveProperty('environment', 'development')
    expect(data).toHaveProperty('database')
    expect(data).toHaveProperty('services')
    
    // Check timestamp is recent (within last minute)
    const timestamp = new Date(data.timestamp)
    const now = new Date()
    const timeDiff = now.getTime() - timestamp.getTime()
    expect(timeDiff).toBeLessThan(60000) // Less than 1 minute
  })

  it('should include database status', async () => {
    const request = new Request('http://localhost:3000/api/health-check')
    const response = await GET(request)
    const data = await response.json()
    
    expect(data.database).toHaveProperty('status')
    expect(['connected', 'disconnected']).toContain(data.database.status)
  })

  it('should include services status', async () => {
    const request = new Request('http://localhost:3000/api/health-check')
    const response = await GET(request)
    const data = await response.json()
    
    expect(data.services).toHaveProperty('email')
    expect(data.services).toHaveProperty('storage')
    expect(data.services).toHaveProperty('auth')
    
    // Check service statuses are valid
    const validStatuses = ['operational', 'degraded', 'down']
    expect(validStatuses).toContain(data.services.email)
    expect(validStatuses).toContain(data.services.storage)
    expect(validStatuses).toContain(data.services.auth)
  })

  it('should handle errors gracefully', async () => {
    // Mock a failing database connection
    const originalEnv = process.env.DATABASE_URL
    delete process.env.DATABASE_URL
    
    const request = new Request('http://localhost:3000/api/health-check')
    const response = await GET(request)
    
    // Should still return a response, even if degraded
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data).toHaveProperty('status')
    
    // Restore environment
    process.env.DATABASE_URL = originalEnv
  })
})