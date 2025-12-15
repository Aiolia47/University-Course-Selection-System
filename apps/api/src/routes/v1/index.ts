import { Router } from 'express';
import { healthRouter } from './health';

export const v1Router = Router();

// API version information
v1Router.get('/', (req, res) => {
  res.json({
    version: 'v1',
    message: 'BMAD7 API v1',
    endpoints: {
      health: '/health',
      // Add more endpoints as they are implemented
    },
  });
});

// Mount sub-routes
v1Router.use('/health', healthRouter);

// TODO: Add more routes as they are implemented
// v1Router.use('/auth', authRouter);
// v1Router.use('/users', userRouter);
// v1Router.use('/courses', courseRouter);