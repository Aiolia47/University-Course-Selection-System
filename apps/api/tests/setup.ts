import { beforeAll, afterAll } from '@jest/globals'

// Set test environment variables
process.env.NODE_ENV = 'test'
process.env.JWT_SECRET = 'test-jwt-secret'
process.env.DB_HOST = 'localhost'
process.env.PORT = '3001'

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  // Uncomment to ignore specific console.log messages
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  // warn: jest.fn(),
  // error: jest.fn(),
}