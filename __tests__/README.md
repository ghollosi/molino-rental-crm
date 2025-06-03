# Testing Guide

## Test Structure

```
__tests__/
├── components/     # React component tests
├── utils/         # Utility function tests
├── api/           # API endpoint tests
├── pages/         # Page component tests
└── README.md      # This file
```

## Running Tests

### All Tests
```bash
npm test
```

### Specific Test Categories
```bash
npm run test:components    # UI component tests
npm run test:utils        # Utility function tests
npm run test:api          # API endpoint tests
```

### Test Coverage
```bash
npm run test:coverage     # Run with coverage report
```

### Watch Mode
```bash
npm run test:watch        # Run in watch mode for development
```

## Test Types

### 1. Unit Tests
- **Location**: `__tests__/utils/`
- **Purpose**: Test individual functions and utilities
- **Examples**: Rate limiting, configuration, helpers

### 2. Component Tests
- **Location**: `__tests__/components/`
- **Purpose**: Test React components in isolation
- **Examples**: Button, Card, Form components

### 3. API Tests
- **Location**: `__tests__/api/`
- **Purpose**: Test API endpoints and routes
- **Examples**: Health check, authentication, CRUD operations

### 4. Integration Tests
- **Location**: `__tests__/api/trpc/`
- **Purpose**: Test tRPC routers and database interactions
- **Examples**: User management, data fetching

## Writing Tests

### Component Test Example
```typescript
import { render, screen } from '@testing-library/react'
import { Button } from '@/components/ui/button'

describe('Button Component', () => {
  it('should render button with text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })
})
```

### Utility Test Example
```typescript
import { getRateLimitForPath } from '@/src/lib/rate-limit-config'

describe('Rate Limit Configuration', () => {
  it('should return correct config', () => {
    const config = getRateLimitForPath('/api/auth/session')
    expect(config.max).toBe(100)
  })
})
```

### API Test Example
```typescript
import { GET } from '@/app/api/health-check/route'

describe('/api/health-check', () => {
  it('should return health status', async () => {
    const request = new Request('http://localhost:3000/api/health-check')
    const response = await GET(request)
    expect(response.status).toBe(200)
  })
})
```

## Test Configuration

### Jest Configuration
- **File**: `jest.config.js`
- **Setup**: `jest.setup.js`
- **Environment**: jsdom (for React components)

### Mocks and Polyfills
- NextAuth mocked for authentication tests
- Next.js router mocked for navigation tests
- Request/Response polyfills for Node.js environment

## Current Test Coverage

### ✅ Implemented Tests
- **Rate Limiting**: Core logic and configuration
- **UI Components**: Button, Card components
- **Configuration**: Rate limit path mapping

### 🔄 In Progress
- API endpoint testing (need better mocks)
- Page component testing (NextAuth integration)
- tRPC router testing (database mocking)

### 📋 Todo
- Database integration tests
- Authentication flow tests
- E2E tests with Playwright
- Performance tests
- Error handling tests

## Best Practices

1. **Test Naming**: Use descriptive test names that explain the expected behavior
2. **Test Structure**: Follow Arrange-Act-Assert pattern
3. **Mocking**: Mock external dependencies but test business logic
4. **Coverage**: Aim for high coverage on critical paths
5. **Isolation**: Each test should be independent and idempotent

## Debugging Tests

### Run Specific Test
```bash
npm test -- --testPathPattern="button.test.tsx"
```

### Verbose Output
```bash
npm test -- --verbose
```

### Debug Mode
```bash
npm test -- --runInBand --detectOpenHandles
```

## CI/CD Integration

For continuous integration, use:
```bash
npm run test:ci
```

This runs tests with coverage and without watch mode, suitable for CI environments.