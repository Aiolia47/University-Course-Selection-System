import request from 'supertest';
import app from '../src/app';
import { CustomError, ValidationError, NotFoundError } from '../src/middleware/errorHandler';

// Mock the logger to suppress console output during tests
jest.mock('../src/utils/logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

describe('Error Handling', () => {
  describe('Global Error Handler', () => {
    it('should handle CustomError correctly', async () => {
      // Create a test route that throws a CustomError
      const testApp = app;

      // Mock a route that throws an error for testing
      testApp.get('/test/error', (req, res, next) => {
        const error = new CustomError(
          'Test error message',
          400,
          'TEST_ERROR',
          { field: 'value' }
        );
        next(error);
      });

      const response = await request(testApp)
        .get('/test/error')
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toMatchObject({
        code: 'TEST_ERROR',
        message: 'Test error message',
      });
      expect(response.body.error).toHaveProperty('timestamp');
      expect(response.body.error).toHaveProperty('requestId');
      expect(response.body.error.details).toEqual({ field: 'value' });
    });

    it('should handle ValidationError correctly', async () => {
      const testApp = app;

      testApp.get('/test/validation', (req, res, next) => {
        const error = new ValidationError(
          'Validation failed',
          { email: 'Invalid email format' }
        );
        next(error);
      });

      const response = await request(testApp)
        .get('/test/validation')
        .expect(400);

      expect(response.body.error).toMatchObject({
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: { email: 'Invalid email format' },
      });
    });

    it('should handle NotFoundError correctly', async () => {
      const testApp = app;

      testApp.get('/test/notfound', (req, res, next) => {
        const error = new NotFoundError('Resource not found');
        next(error);
      });

      const response = await request(testApp)
        .get('/test/notfound')
        .expect(404);

      expect(response.body.error).toMatchObject({
        code: 'NOT_FOUND',
        message: 'Resource not found',
      });
    });

    it('should handle generic Error correctly', async () => {
      const testApp = app;

      testApp.get('/test/generic', (req, res, next) => {
        const error = new Error('Generic error message');
        next(error);
      });

      const response = await request(testApp)
        .get('/test/generic')
        .expect(500);

      expect(response.body.error).toMatchObject({
        code: 'INTERNAL_ERROR',
        message: 'Generic error message',
      });
    });

    it('should include stack trace in development mode', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const testApp = app;

      testApp.get('/test/stack', (req, res, next) => {
        const error = new Error('Test error with stack');
        next(error);
      });

      const response = await request(testApp)
        .get('/test/stack')
        .expect(500);

      expect(response.body.error).toHaveProperty('stack');

      // Restore original environment
      process.env.NODE_ENV = originalEnv;
    });

    it('should not include stack trace in production mode', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const testApp = app;

      testApp.get('/test/no-stack', (req, res, next) => {
        const error = new Error('Test error without stack');
        next(error);
      });

      const response = await request(testApp)
        .get('/test/no-stack')
        .expect(500);

      expect(response.body.error).not.toHaveProperty('stack');

      // Restore original environment
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('404 Handler', () => {
    it('should return proper 404 error for non-existent routes', async () => {
      const response = await request(app)
        .get('/this-route-does-not-exist')
        .expect(404);

      expect(response.body.error).toMatchObject({
        code: 'NOT_FOUND',
        message: 'Route /this-route-does-not-exist not found',
      });
      expect(response.body.error).toHaveProperty('timestamp');
      expect(response.body.error).toHaveProperty('requestId');
    });

    it('should return proper 404 error for non-existent v1 routes', async () => {
      const response = await request(app)
        .get('/v1/this-route-does-not-exist')
        .expect(404);

      expect(response.body.error).toMatchObject({
        code: 'NOT_FOUND',
        message: 'Route /v1/this-route-does-not-exist not found',
      });
    });
  });

  describe('Error Response Structure', () => {
    it('should maintain consistent error response structure', async () => {
      const testApp = app;

      testApp.get('/test/structure', (req, res, next) => {
        const error = new ValidationError('Structure test');
        next(error);
      });

      const response = await request(testApp)
        .get('/test/structure')
        .expect(400);

      // Verify error response structure
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code');
      expect(response.body.error).toHaveProperty('message');
      expect(response.body.error).toHaveProperty('timestamp');
      expect(response.body.error).toHaveProperty('requestId');

      // Verify timestamp format (ISO 8601)
      expect(response.body.error.timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
      );

      // Verify requestId format (UUID)
      expect(response.body.error.requestId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      );
    });
  });
});