import { beforeAll, afterAll } from '@jest/globals'
import dotenv from 'dotenv'

// Load test environment variables
dotenv.config({ path: '.env.test' })

// Set test environment variables
process.env.NODE_ENV = 'test'
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret'
process.env.JWT_EXPIRES_IN = '1h'
process.env.JWT_REFRESH_EXPIRES_IN = '24h'
process.env.DB_HOST = process.env.DB_HOST || 'localhost'
process.env.DB_PORT = process.env.DB_PORT || '3306'
process.env.DB_NAME = process.env.DB_NAME || 'bmad7_course_selection_test'
process.env.DB_USERNAME = process.env.DB_USERNAME || 'root'
process.env.DB_PASSWORD = process.env.DB_PASSWORD || ''
process.env.DB_SYNCHRONIZE = 'true'
process.env.DB_LOGGING = 'false'
process.env.PORT = process.env.PORT || '3001'
process.env.CORS_ORIGIN = 'http://localhost:3000'
process.env.CORS_CREDENTIALS = 'true'
process.env.LOG_LEVEL = 'error'
process.env.RATE_LIMIT_WINDOW = '15'
process.env.RATE_LIMIT_MAX = '100'

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