import rateLimit from 'express-rate-limit';

export const rateLimiterMiddleware = (options: {
  windowMs: number;
  max: number;
  message?: string;
}) => {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    message: options.message || {
      error: {
        code: 'TOO_MANY_REQUESTS',
        message: '请求过于频繁，请稍后再试'
      }
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};