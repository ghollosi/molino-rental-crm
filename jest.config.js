const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jsdom',
  moduleDirectories: ['node_modules', '<rootDir>/'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@/src/(.*)$': '<rootDir>/src/$1',
    '^@/components/(.*)$': '<rootDir>/src/components/$1',
    '^@/lib/(.*)$': '<rootDir>/src/lib/$1',
  },
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/build/',
  ],
  transformIgnorePatterns: [
    'node_modules/(?!(next-auth|@auth)/)',
  ],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    'app/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/lib/db.ts', // Skip database file
    '!**/*.stories.{js,jsx,ts,tsx}',
    '!**/node_modules/**',
  ],
  testMatch: [
    '<rootDir>/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/**/*.(test|spec).{js,jsx,ts,tsx}',
  ],
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)