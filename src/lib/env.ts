import { z } from 'zod';

/**
 * Environment variable validation schema
 * Defines all required and optional environment variables with their validation rules
 */
const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url().min(1, 'DATABASE_URL is required'),

  // Firebase Configuration (Public)
  NEXT_PUBLIC_FIREBASE_API_KEY: z.string().min(1, 'NEXT_PUBLIC_FIREBASE_API_KEY is required'),
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string().min(1, 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN is required'),
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string().min(1, 'NEXT_PUBLIC_FIREBASE_PROJECT_ID is required'),
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: z.string().min(1, 'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET is required'),
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: z.string().min(1, 'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID is required'),
  NEXT_PUBLIC_FIREBASE_APP_ID: z.string().min(1, 'NEXT_PUBLIC_FIREBASE_APP_ID is required'),

  // AI API Keys (Optional)
  GEMINI_API_KEY: z.string().optional(),
  GROQ_API_KEY: z.string().optional(),

  // NextAuth (Optional)
  NEXTAUTH_SECRET: z.string().optional(),

  // Redis (Optional)
  REDIS_URL: z.string().url().optional().or(z.literal('')),
  UPSTASH_REDIS_REST_URL: z.string().url().optional().or(z.literal('')),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional().or(z.literal('')),

  // Monitoring (Optional)
  SENTRY_DSN: z.string().url().optional().or(z.literal('')),
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional().or(z.literal('')),

  // Environment
  NODE_ENV: z.enum(['development', 'test', 'staging', 'production']).default('development'),
  NEXT_PUBLIC_APP_URL: z.string().url().optional().or(z.literal('')),

  // Rate Limiting (Optional)
  RATE_LIMIT_MAX_REQUESTS: z.string().regex(/^\d+$/).optional(),
  RATE_LIMIT_WINDOW_MS: z.string().regex(/^\d+$/).optional(),

  // Logging (Optional)
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).optional(),
});

/**
 * Validated and type-safe environment configuration
 */
export type EnvConfig = z.infer<typeof envSchema>;

/**
 * Validates environment variables and returns a type-safe configuration object
 * @throws {Error} If required environment variables are missing or invalid
 * @returns {EnvConfig} Validated environment configuration
 */
function validateEnv(): EnvConfig {
  try {
    const env = envSchema.parse({
      // Database
      DATABASE_URL: process.env.DATABASE_URL,

      // Firebase
      NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,

      // AI API Keys
      GEMINI_API_KEY: process.env.GEMINI_API_KEY,
      GROQ_API_KEY: process.env.GROQ_API_KEY,

      // NextAuth
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,

      // Redis
      REDIS_URL: process.env.REDIS_URL,
      UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
      UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,

      // Monitoring
      SENTRY_DSN: process.env.SENTRY_DSN,
      NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,

      // Environment
      NODE_ENV: process.env.NODE_ENV,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,

      // Rate Limiting
      RATE_LIMIT_MAX_REQUESTS: process.env.RATE_LIMIT_MAX_REQUESTS,
      RATE_LIMIT_WINDOW_MS: process.env.RATE_LIMIT_WINDOW_MS,

      // Logging
      LOG_LEVEL: process.env.LOG_LEVEL,
    });

    return env;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.issues.map((err: z.ZodIssue) => {
        const path = err.path.join('.');
        return `  - ${path}: ${err.message}`;
      });

      console.error('❌ Environment variable validation failed:\n');
      console.error(missingVars.join('\n'));
      console.error('\n💡 Please check your .env file and ensure all required variables are set.');
      console.error('   See .env.example for reference.\n');

      throw new Error('Invalid environment variables');
    }
    throw error;
  }
}

/**
 * Validated environment configuration
 * This will throw an error if validation fails during module initialization
 */
export const env = validateEnv();

/**
 * Helper function to check if we're in production
 */
export const isProduction = env.NODE_ENV === 'production';

/**
 * Helper function to check if we're in development
 */
export const isDevelopment = env.NODE_ENV === 'development';

/**
 * Helper function to check if we're in test environment
 */
export const isTest = env.NODE_ENV === 'test';
