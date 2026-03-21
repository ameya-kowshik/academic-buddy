import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

// Only initialize Sentry if DSN is provided and not explicitly disabled
if (SENTRY_DSN && process.env.NEXT_PUBLIC_DISABLE_SENTRY !== 'true') {
  Sentry.init({
    dsn: SENTRY_DSN,
    
    // Adjust this value in production, or use tracesSampler for greater control
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    
    // Disable debug logging in development to reduce console noise
    debug: false,
    
    // Replay configuration for session replay
    replaysOnErrorSampleRate: 1.0,
    replaysSessionSampleRate: 0.1,
    
    integrations: [
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    
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
        // Ignore network errors that are user-related
        if (error.message.includes('Failed to fetch') || 
            error.message.includes('NetworkError')) {
          return null;
        }
        
        // Ignore cancelled requests
        if (error.message.includes('AbortError') || 
            error.message.includes('cancelled')) {
          return null;
        }
      }
      
      return event;
    },
    
    // Add custom tags
    initialScope: {
      tags: {
        'app.version': process.env.NEXT_PUBLIC_APP_VERSION || 'unknown',
      },
    },
  });
}
