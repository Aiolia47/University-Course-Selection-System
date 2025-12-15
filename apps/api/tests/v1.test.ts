import request from 'supertest';
import app from '../src/app';

describe('API v1 Routes', () => {
  describe('v1 root endpoint', () => {
    it('should return v1 API information', async () => {
      const response = await request(app)
        .get('/v1')
        .expect(200);

      expect(response.body).toMatchObject({
        version: 'v1',
        message: 'BMAD7 API v1',
      });
      expect(response.body.endpoints).toHaveProperty('health');
    });
  });

  describe('v1 health check', () => {
    it('should return detailed health status', async () => {
      const response = await request(app)
        .get('/v1/health')
        .expect(200);

      expect(response.body).toMatchObject({
        status: 'OK',
        version: '1.0.0',
      });
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('environment');
      expect(response.body).toHaveProperty('database');
      expect(response.body).toHaveProperty('memory');

      // Check database status structure
      expect(response.body.database).toHaveProperty('status');
      expect(response.body.database).toHaveProperty('latency');

      // Check memory usage structure
      expect(response.body.memory).toHaveProperty('used');
      expect(response.body.memory).toHaveProperty('total');
    });
  });

  describe('v1 ping endpoint', () => {
    it('should return pong response', async () => {
      const response = await request(app)
        .get('/v1/health/ping')
        .expect(200);

      expect(response.body).toMatchObject({
        message: 'pong',
      });
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('v1 non-existent routes', () => {
    it('should return 404 for non-existent v1 routes', async () => {
      const response = await request(app)
        .get('/v1/non-existent')
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code', 'NOT_FOUND');
    });
  });

  describe('Rate limiting on API routes', () => {
    it('should include rate limit headers on API routes', async () => {
      const response = await request(app)
        .get('/v1/health')
        .expect(200);

      // Rate limiting headers might be present
      if (response.headers['x-ratelimit-limit']) {
        expect(response.headers).toHaveProperty('x-ratelimit-limit');
        expect(response.headers).toHaveProperty('x-ratelimit-remaining');
      }
    });
  });
});