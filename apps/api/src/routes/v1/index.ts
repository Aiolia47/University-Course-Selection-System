import { Router } from 'express';
import { healthRouter } from './health';
import { authRouter } from './auth';
import permissionRoutes from './permissions';
import { coursesRouter } from './courses';

export const v1Router = Router();

// API version information
v1Router.get('/', (req, res) => {
  res.json({
    version: 'v1',
    message: 'BMAD7 API v1',
    endpoints: {
      health: '/health',
      auth: '/auth',
      permissions: '/permissions',
      courses: '/courses',
      // Add more endpoints as they are implemented
    },
  });
});

// Mount sub-routes
v1Router.use('/health', healthRouter);
v1Router.use('/auth', authRouter);
v1Router.use('/permissions', permissionRoutes);
v1Router.use('/courses', coursesRouter);

// TODO: Add more routes as they are implemented
// v1Router.use('/users', userRouter);