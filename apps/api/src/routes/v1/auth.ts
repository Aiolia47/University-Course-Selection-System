import { Router } from 'express';
import { AuthController } from '../../controllers/authController';
import { validateDto } from '../../middleware/validation.middleware';
import { RegisterDto } from '../../validators/user.validator';
import { rateLimiterMiddleware } from '../../middleware/rateLimiter.middleware';

export const authRouter = Router();
const authController = new AuthController();

// Registration endpoint with rate limiting (100 requests per 15 minutes)
authRouter.post(
  '/register',
  rateLimiterMiddleware({ windowMs: 15 * 60 * 1000, max: 100 }), // 15 minutes, 100 requests
  validateDto(RegisterDto),
  authController.register
);

// TODO: Add more auth endpoints
// authRouter.post('/login', authController.login);
// authRouter.post('/logout', authController.logout);
// authRouter.post('/refresh', authController.refreshToken);
// authRouter.get('/me', authController.getCurrentUser);