import { Router } from 'express';
import { initializeDatabase } from '../../config/database';
import { logger } from '../../utils/logger';

const router = Router();

/**
 * @swagger
 * /v1/health:
 *   get:
 *     summary: API Health Check
 *     description: Returns the health status of the API server and its dependencies
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: API is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "OK"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 uptime:
 *                   type: number
 *                   description: Server uptime in seconds
 *                 version:
 *                   type: string
 *                   example: "1.0.0"
 *                 environment:
 *                   type: string
 *                   example: "development"
 *                 database:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       example: "connected"
 *                     latency:
 *                       type: number
 *                       description: Database connection latency in milliseconds
 *       503:
 *         description: Service unavailable
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', async (req, res) => {
  const startTime = Date.now();
  let databaseStatus = 'disconnected';
  let databaseLatency = null;

  try {
    // Test database connection
    await initializeDatabase();
    databaseStatus = 'connected';
    databaseLatency = Date.now() - startTime;
  } catch (error) {
    logger.error('Database health check failed:', error);
    databaseStatus = 'error';
  }

  const healthData = {
    status: databaseStatus === 'connected' ? 'OK' : 'ERROR',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    database: {
      status: databaseStatus,
      latency: databaseLatency,
    },
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024 * 100) / 100,
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024 * 100) / 100,
    },
  };

  const statusCode = databaseStatus === 'connected' ? 200 : 503;
  res.status(statusCode).json(healthData);
});

/**
 * @swagger
 * /v1/health/ping:
 *   get:
 *     summary: Simple Ping
 *     description: Simple ping endpoint for basic connectivity testing
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Pong response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "pong"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
router.get('/ping', (req, res) => {
  res.json({
    message: 'pong',
    timestamp: new Date().toISOString(),
  });
});

export { router as healthRouter };