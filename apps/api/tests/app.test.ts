import request from 'supertest'
import app from '../src/app'

describe('API App', () => {
  it('should respond with health check', async () => {
    const response = await request(app)
      .get('/api/health')
      .expect(200)

    expect(response.body).toHaveProperty('status', 'ok')
    expect(response.body).toHaveProperty('timestamp')
  })

  it('should return 404 for unknown routes', async () => {
    await request(app)
      .get('/api/unknown')
      .expect(404)
  })
})