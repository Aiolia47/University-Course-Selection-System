import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { validateEnv } from '@bmad7/shared/config/env-validator';

// Load environment variables
dotenv.config();

// Validate environment variables
const env = validateEnv(process.env);

const app = express();
const PORT = env.apiPort || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: env.cors.origin,
  credentials: env.cors.credentials,
}));
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: env.nodeEnv,
    version: '1.0.0',
  });
});

// API routes
app.use('/api', (req, res) => {
  res.json({
    message: 'BMAD7 API Server',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      future: 'More endpoints coming soon...',
    },
  });
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`📚 Health check: http://localhost:${PORT}/health`);
  console.log(`🌍 Environment: ${env.nodeEnv}`);
});