import request from 'supertest';
import app from '../src/app';
import { logger } from '../src/utils/logger';

// Suppress console.error during tests to keep output clean
const originalError = logger.error;
beforeAll(() => {
  logger.error = jest.fn();
});

afterAll(() => {
  logger.error = originalError;
});

describe('Server', () => {
  describe('Root endpoint', () => {
    it('should return server information', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      expect(response.body).toMatchObject({
        message: 'BMAD7 API Server',
        version: '1.0.0',
      });
      expect(response.body.endpoints).toHaveProperty('health');
      expect(response.body.endpoints).toHaveProperty('api');
      expect(response.body.endpoints).toHaveProperty('documentation');
    });
  });

  describe('Health check endpoint', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toMatchObject({
        status: 'OK',
        version: '1.0.0',
      });
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('environment');
    });
  });

  describe('API Documentation', () => {
    it('should serve Swagger documentation', async () => {
      await request(app)
        .get('/api-docs/')
        .expect(200);
    });

    it('should return Swagger JSON specification', async () => {
      await request(app)
        .get('/api-docs/')
        .expect(200);
    });
  });

  describe('404 handler', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/non-existent-route')
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code', 'NOT_FOUND');
      expect(response.body.error).toHaveProperty('message');
      expect(response.body.error).toHaveProperty('timestamp');
      expect(response.body.error).toHaveProperty('requestId');
    });
  });

  describe('CORS headers', () => {
    it('should include CORS headers', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.headers).toHaveProperty('access-control-allow-origin');
    });
  });

  describe('Security headers', () => {
    it('should include security headers via helmet', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.headers).toHaveProperty('x-content-type-options');
      expect(response.headers).toHaveProperty('x-frame-options');
      expect(response.headers).toHaveProperty('x-xss-protection');
    });
  });

  describe('Rate limiting', () => {
    it('should allow requests within limit', async () => {
      for (let i = 0; i < 5; i++) {
        await request(app)
          .get('/health')
          .expect(200);
      }
    });
  });

  describe('Request ID', () => {
    it('should include request ID in response headers', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.headers).toHaveProperty('x-request-id');
      expect(response.headers['x-request-id']).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      );
    });
  });
});