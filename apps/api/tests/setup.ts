import { beforeAll, afterAll } from '@jest/globals'

// Set test environment variables
process.env.NODE_ENV = 'test'
process.env.JWT_SECRET = 'test-jwt-secret'
process.env.DB_HOST = 'localhost'
process.env.DB_PORT = '3306'
process.env.DB_NAME = 'bmad7_course_selection_test'
process.env.DB_USER = 'root'
process.env.DB_PASSWORD = ''
process.env.DB_SYNCHRONIZE = 'true'
process.env.PORT = '3001'

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  // Uncomment to ignore specific console.log messages
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  // Keep error messages for debugging
  // error: jest.fn(),
}