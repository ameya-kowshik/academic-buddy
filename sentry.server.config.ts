import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.SENTRY_DSN;

Sentry.init({
  dsn: SENTRY_DSN,
  
  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: true,
  
  // Environment
  environment: process.env.NODE_ENV || 'development',
  
  // Filter out certain errors
  beforeSend(event, hint) {
    const error = hint.originalException;
    
    // Don't send errors in development unless explicitly enabled
    if (process.env.NODE_ENV === 'development' && !process.env.SENTRY_ENABLE_DEV) {
      return null;
    }
    
    // Filter out known non-critical errors
    if (error instanceof Error) {
      // Ignore expected operational errors
      if (error.message.includes('ECONNREFUSED') || 
          error.message.includes('ETIMEDOUT')) {
        // Log but don't alert for connection issues
        console.error('Connection error:', error.message);
        return null;
      }
    }
    
    return event;
  },
  
  // Add custom tags
  initialScope: {
    tags: {
      'app.version': process.env.NEXT_PUBLIC_APP_VERSION || 'unknown',
      'runtime': 'node',
    },
  },
  
  // Enable performance monitoring for server-side
  integrations: [
    // Add custom integrations here if needed
  ],
});
