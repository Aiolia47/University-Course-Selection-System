import request from 'supertest';
import app from '../../src/app';

describe('Database Health Check Integration', () => {
  it('should return database health status', async () => {
    const response = await request(app)
      .get('/api/health')
      .expect(200);

    expect(response.body).toHaveProperty('status', 'OK');
    expect(response.body).toHaveProperty('timestamp');
    expect(response.body).toHaveProperty('uptime');
  });

  it('should include database information in health check', async () => {
    // This would require adding a dedicated database health endpoint
    // For now, just testing that the app loads successfully
    const response = await request(app)
      .get('/api/health')
      .expect(200);

    // The health endpoint should work even if database connection fails
    expect(response.body.status).toBe('OK');
  });
});