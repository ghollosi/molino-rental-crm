import '@testing-library/jest-dom'
import { TextEncoder, TextDecoder } from 'util'

// Polyfill for Request/Response in Node.js environment
global.Request = class Request {
  constructor(url, options = {}) {
    this.url = url
    this.method = options.method || 'GET'
    this.headers = new Map(Object.entries(options.headers || {}))
    this.body = options.body
    this.ip = options.ip
  }
  
  async json() {
    try {
      return JSON.parse(this.body)
    } catch {
      throw new Error('Invalid JSON')
    }
  }
  
  headers = new Map()
}

global.Response = class Response {
  constructor(body, options = {}) {
    this.body = body
    this.status = options.status || 200
    this.statusText = options.statusText || 'OK'
    this.headers = new Map(Object.entries(options.headers || {}))
  }
  
  static json(data, options = {}) {
    return new Response(JSON.stringify(data), {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    })
  }
  
  async json() {
    return JSON.parse(this.body)
  }
  
  async text() {
    return this.body
  }
}

// Text encoding polyfills
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// Mock NextResponse
global.NextResponse = {
  json: (data, options = {}) => {
    return new Response(JSON.stringify(data), {
      status: 200,
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    })
  }
}

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return ''
  },
}))

// Mock NextAuth - avoid full module import
jest.doMock('next-auth/react', () => ({
  useSession: jest.fn(() => ({
    data: {
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        role: 'ADMIN',
        language: 'HU',
      },
    },
    status: 'authenticated',
  })),
  signIn: jest.fn(),
  signOut: jest.fn(),
  getSession: jest.fn(),
  SessionProvider: ({ children }) => children,
}))

// Mock tRPC will be done per test file as needed

// Mock environment variables
process.env.NEXTAUTH_SECRET = 'test-secret'
process.env.NEXTAUTH_URL = 'http://localhost:3000'
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

// Suppress console warnings in tests
const originalWarn = console.warn
beforeAll(() => {
  console.warn = (...args) => {
    if (args[0]?.includes?.('Warning:')) {
      return
    }
    originalWarn(...args)
  }
})

afterAll(() => {
  console.warn = originalWarn
})