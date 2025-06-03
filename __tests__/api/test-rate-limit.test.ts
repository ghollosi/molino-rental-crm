import { GET, POST } from '@/app/api/test-rate-limit/route'

describe('/api/test-rate-limit', () => {
  it('should handle GET requests', async () => {
    const request = new Request('http://localhost:3000/api/test-rate-limit', {
      method: 'GET',
      headers: {
        'x-forwarded-for': '127.0.0.1',
      },
    })

    const response = await GET(request)
    expect(response.status).toBe(200)

    const data = await response.json()
    expect(data).toHaveProperty('message', 'Rate limit test endpoint working')
    expect(data).toHaveProperty('timestamp')
    expect(data).toHaveProperty('ip')

    // Verify timestamp is recent
    const timestamp = new Date(data.timestamp)
    const now = new Date()
    const timeDiff = now.getTime() - timestamp.getTime()
    expect(timeDiff).toBeLessThan(5000) // Less than 5 seconds
  })

  it('should handle POST requests', async () => {
    const testBody = { test: 'data', number: 123 }
    
    const request = new Request('http://localhost:3000/api/test-rate-limit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': '127.0.0.1',
      },
      body: JSON.stringify(testBody),
    })

    const response = await POST(request)
    expect(response.status).toBe(200)

    const data = await response.json()
    expect(data).toHaveProperty('message', 'Rate limit test POST endpoint working')
    expect(data).toHaveProperty('timestamp')
    expect(data).toHaveProperty('ip')
    expect(data).toHaveProperty('body', testBody)
  })

  it('should extract IP from headers', async () => {
    const testIp = '192.168.1.100'
    
    const request = new Request('http://localhost:3000/api/test-rate-limit', {
      method: 'GET',
      headers: {
        'x-forwarded-for': testIp,
      },
    })

    const response = await GET(request)
    const data = await response.json()
    
    expect(data.ip).toBe(testIp)
  })

  it('should handle missing IP gracefully', async () => {
    const request = new Request('http://localhost:3000/api/test-rate-limit', {
      method: 'GET',
    })

    const response = await GET(request)
    const data = await response.json()
    
    expect(data.ip).toBe('unknown')
  })

  it('should handle malformed JSON in POST', async () => {
    const request = new Request('http://localhost:3000/api/test-rate-limit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: 'invalid json',
    })

    // Should not throw, but handle gracefully
    const response = await POST(request)
    expect(response.status).toBe(200)
  })
})