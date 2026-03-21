import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.SENTRY_DSN;

// Only initialize Sentry if DSN is provided and not explicitly disabled
if (SENTRY_DSN && process.env.DISABLE_SENTRY !== 'true') {
  Sentry.init({
    dsn: SENTRY_DSN,
    
    // Adjust this value in production, or use tracesSampler for greater control
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    
    // Disable debug logging
    debug: false,
    
    // Environment
    environment: process.env.NODE_ENV || 'development',
    
    // Add custom tags
    initialScope: {
      tags: {
        'app.version': process.env.NEXT_PUBLIC_APP_VERSION || 'unknown',
        'runtime': 'edge',
      },
    },
  });
}
