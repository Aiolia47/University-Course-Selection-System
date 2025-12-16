import { Router } from 'express';
import { AuthController } from '../../controllers/authController';
import { validateDto } from '../../middleware/validation.middleware';
import { authenticate } from '../../middleware/auth';
import { RegisterDto, LoginDto, RefreshTokenDto } from '../../validators/user.validator';
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

// Login endpoint with stricter rate limiting (20 requests per 15 minutes)
authRouter.post(
  '/login',
  rateLimiterMiddleware({ windowMs: 15 * 60 * 1000, max: 20 }), // 15 minutes, 20 requests
  validateDto(LoginDto),
  authController.login
);

// Refresh token endpoint with rate limiting (10 requests per 15 minutes)
authRouter.post(
  '/refresh',
  rateLimiterMiddleware({ windowMs: 15 * 60 * 1000, max: 10 }), // 15 minutes, 10 requests
  validateDto(RefreshTokenDto),
  authController.refreshToken
);

// Logout endpoint (protected by auth middleware)
authRouter.post(
  '/logout',
  rateLimiterMiddleware({ windowMs: 15 * 60 * 1000, max: 30 }), // 15 minutes, 30 requests
  authenticate,
  authController.logout
);

// Get current user (protected by auth middleware)
authRouter.get(
  '/me',
  rateLimiterMiddleware({ windowMs: 15 * 60 * 1000, max: 50 }), // 15 minutes, 50 requests
  authenticate,
  authController.getCurrentUser
);