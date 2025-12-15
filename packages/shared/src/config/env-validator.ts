import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']),
  PORT: z.string().transform(Number).pipe(z.number().min(1).max(65535)),

  // Frontend
  REACT_APP_API_URL: z.string().url().optional(),
  REACT_APP_ENVIRONMENT: z.enum(['development', 'production', 'test']).optional(),

  // Backend
  API_PORT: z.string().transform(Number).pipe(z.number().min(1).max(65535)).optional(),
  API_HOST: z.string().optional(),

  // Database
  DB_HOST: z.string().min(1),
  DB_PORT: z.string().transform(Number).pipe(z.number().min(1).max(65535)),
  DB_NAME: z.string().min(1),
  DB_USER: z.string().min(1),
  DB_PASSWORD: z.string().min(1),

  // JWT
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().min(1),

  // Redis (optional)
  REDIS_URL: z.string().url().optional(),

  // CORS
  CORS_ORIGIN: z.string().min(1),

  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']),

  // Upload
  UPLOAD_MAX_SIZE: z.string().transform(Number).pipe(z.number().min(1)),
  UPLOAD_ALLOWED_TYPES: z.string().min(1),

  // Email (optional)
  SMTP_HOST: z.string().min(1).optional(),
  SMTP_PORT: z.string().transform(Number).pipe(z.number().min(1).max(65535)).optional(),
  SMTP_USER: z.string().email().optional(),
  SMTP_PASS: z.string().min(1).optional(),

  // Third-party services (optional)
  GOOGLE_CLIENT_ID: z.string().min(1).optional(),
  GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),
  SENTRY_DSN: z.string().url().optional(),

  // Test
  TEST_DB_URL: z.string().url().optional(),
});

export function validateEnv(env: Record<string, string | undefined>) {
  try {
    return envSchema.parse(env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors
        .filter(e => e.code === 'invalid_type' && e.received === 'undefined')
        .map(e => `- ${e.path.join('.')}`);

      if (missingVars.length > 0) {
        console.error('❌ Missing required environment variables:');
        missingVars.forEach(v => console.error(v));
        process.exit(1);
      }

      console.error('❌ Invalid environment variables:');
      error.errors.forEach(e => {
        console.error(`- ${e.path.join('.')}: ${e.message}`);
      });
      process.exit(1);
    }
    throw error;
  }
}