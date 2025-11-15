# Error Handling and Monitoring

This document describes the error handling and monitoring infrastructure implemented in the Academic Buddy application.

## Overview

The application includes a comprehensive error handling and monitoring system with the following components:

1. **Centralized Error Handling** - Standardized error types and response formats
2. **Sentry Integration** - Real-time error monitoring and alerting
3. **React Error Boundaries** - Graceful error handling in UI components
4. **Structured Logging** - JSON-formatted logs with contextual metadata

## Centralized Error Handling

### Error Types

The application provides several predefined error classes in `src/lib/errors.ts`:

```typescript
import {
  AppError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ValidationError,
  ConflictError,
  RateLimitError,
  InternalServerError,
} from '@/lib/errors';

// Example usage
throw new NotFoundError('Project');
throw new ValidationError('Invalid email format', { field: 'email' });
throw new AuthenticationError('Token expired');
```

### Error Response Format

All errors follow a consistent response format:

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Project not found",
    "details": { "projectId": "123" }
  },
  "timestamp": "2024-01-15T10:30:00.000Z",
  "path": "/api/projects/123"
}
```

### Using Error Handling in API Routes

#### Basic Error Handling

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createErrorResponse, NotFoundError } from '@/lib/errors';

export async function GET(request: NextRequest) {
  try {
    // Your logic here
    const data = await fetchData();
    
    if (!data) {
      throw new NotFoundError('Resource');
    }
    
    return NextResponse.json(data);
  } catch (error) {
    return createErrorResponse(
      error instanceof Error ? error : new Error(String(error)),
      request.nextUrl.pathname
    );
  }
}
```

#### With Authentication

```typescript
import { requireAuth } from '@/middleware/auth';
import { createErrorResponse } from '@/lib/errors';
import { User } from '@prisma/client';

async function handler(
  request: NextRequest,
  context: Record<string, unknown>,
  user: User
) {
  try {
    // Your authenticated logic here
    return NextResponse.json({ success: true });
  } catch (error) {
    return createErrorResponse(
      error instanceof Error ? error : new Error(String(error)),
      request.nextUrl.pathname,
      { userId: user.id }
    );
  }
}

export const GET = requireAuth(handler);
```

### Automatic Error Formatting

The system automatically formats common error types:

- **Zod Validation Errors** - Formatted with field-level details
- **Prisma Database Errors** - Mapped to appropriate HTTP status codes
- **Generic Errors** - Sanitized in production to prevent information leakage

## Sentry Integration

### Configuration

Sentry is configured in three files:

- `sentry.client.config.ts` - Client-side error tracking
- `sentry.server.config.ts` - Server-side error tracking
- `sentry.edge.config.ts` - Edge runtime error tracking

### Environment Variables

Add these to your `.env` file:

```env
SENTRY_DSN="https://key@sentry.io/project"
NEXT_PUBLIC_SENTRY_DSN="https://key@sentry.io/project"
```

### Manual Error Capture

```typescript
import * as Sentry from '@sentry/nextjs';

// Capture an exception
try {
  riskyOperation();
} catch (error) {
  Sentry.captureException(error, {
    tags: { feature: 'projects' },
    contexts: {
      custom: { userId: user.id }
    }
  });
}

// Capture a message
Sentry.captureMessage('Something important happened', 'info');
```

### Testing Sentry

Use the test endpoint to verify Sentry integration:

```bash
# Test error capture
curl http://localhost:3000/api/sentry-test?type=error

# Test warning capture
curl http://localhost:3000/api/sentry-test?type=warning

# Test info capture
curl http://localhost:3000/api/sentry-test?type=info
```

## React Error Boundaries

### Basic Usage

Error boundaries are automatically applied at the root layout level, but you can add them to specific components:

```typescript
import { ErrorBoundary } from '@/components/ErrorBoundary';

function MyComponent() {
  return (
    <ErrorBoundary>
      <RiskyComponent />
    </ErrorBoundary>
  );
}
```

### Custom Fallback UI

```typescript
<ErrorBoundary
  fallback={
    <div>
      <h1>Oops! Something went wrong</h1>
      <button onClick={() => window.location.reload()}>
        Reload
      </button>
    </div>
  }
>
  <MyComponent />
</ErrorBoundary>
```

### With Error Callback

```typescript
<ErrorBoundary
  onError={(error, errorInfo) => {
    console.log('Error caught:', error);
    // Custom error handling logic
  }}
>
  <MyComponent />
</ErrorBoundary>
```

### Higher-Order Component

```typescript
import { withErrorBoundary } from '@/components/ErrorBoundary';

const SafeComponent = withErrorBoundary(RiskyComponent);
```

## Structured Logging

### Basic Logging

```typescript
import { logger } from '@/lib/logger';

// Debug (only in development)
logger.debug('Debugging information', { variable: value });

// Info
logger.info('User logged in', { userId: user.id });

// Warning
logger.warn('Slow query detected', { duration: 2000, query: 'SELECT...' });

// Error
logger.error('Failed to process payment', error, {
  userId: user.id,
  amount: 100,
});
```

### Creating Context Loggers

```typescript
import { createLogger } from '@/lib/logger';

// Create a logger with default context
const projectLogger = createLogger('projects', {
  feature: 'project-management',
});

projectLogger.info('Project created', { projectId: project.id });
// Output includes: context: 'projects', feature: 'project-management'
```

### Request Logging Middleware

```typescript
import { withRequestLogging } from '@/middleware/requestLogger';

async function handler(request: NextRequest) {
  // Your logic here
  return NextResponse.json({ success: true });
}

// Automatically logs request/response details
export const GET = withRequestLogging(handler);
```

### Log Levels

Configure log level via environment variable:

```env
LOG_LEVEL="info"  # Options: debug, info, warn, error
```

Default levels by environment:
- **Development**: `debug` (all logs)
- **Production**: `info` (info, warn, error)
- **Test**: `error` (errors only)

### Log Format

#### Development (Human-Readable)

```
🔍 [DEBUG] Debugging information
  Metadata: { variable: 'value' }

ℹ️ [INFO] User logged in
  Metadata: { userId: '123' }

⚠️ [WARN] Slow query detected
  Metadata: { duration: 2000, query: 'SELECT...' }

❌ [ERROR] Failed to process payment
  Metadata: { userId: '123', amount: 100, error: Error... }
```

#### Production (JSON)

```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "level": "info",
  "message": "User logged in",
  "metadata": {
    "userId": "123"
  },
  "environment": "production"
}
```

## Best Practices

### 1. Use Appropriate Error Types

```typescript
// ✅ Good - Use specific error types
throw new NotFoundError('Project');
throw new ValidationError('Invalid email');

// ❌ Bad - Generic errors lose context
throw new Error('Not found');
```

### 2. Include Context in Errors

```typescript
// ✅ Good - Include helpful details
throw new NotFoundError('Project', { projectId: id, userId: user.id });

// ❌ Bad - No context
throw new NotFoundError('Project');
```

### 3. Log Before Throwing

```typescript
// ✅ Good - Log with context before throwing
logger.error('Failed to create project', error, {
  userId: user.id,
  projectData: data,
});
throw new InternalServerError('Failed to create project');
```

### 4. Use Structured Metadata

```typescript
// ✅ Good - Structured, searchable metadata
logger.info('Payment processed', {
  userId: user.id,
  amount: 100,
  currency: 'USD',
  paymentMethod: 'card',
});

// ❌ Bad - Unstructured string
logger.info(`Payment of $100 processed for user ${user.id}`);
```

### 5. Don't Log Sensitive Data

```typescript
// ✅ Good - Exclude sensitive data
logger.info('User authenticated', {
  userId: user.id,
  email: user.email,
});

// ❌ Bad - Logs password
logger.info('User authenticated', {
  userId: user.id,
  password: password, // Never log passwords!
});
```

## Monitoring and Alerts

### Key Metrics to Monitor

1. **Error Rate** - Percentage of requests resulting in errors
2. **Response Time** - Average and P95 response times
3. **Error Types** - Distribution of error types
4. **User Impact** - Number of users affected by errors

### Setting Up Alerts

Configure alerts in Sentry for:

- Error rate exceeds 5% for 5 minutes
- New error types appear
- Critical errors (500s) occur
- Performance degradation detected

### Viewing Logs

#### Development

Logs appear in the console with emoji indicators and formatted metadata.

#### Production

Logs are output as JSON and can be:
- Viewed in Vercel logs
- Sent to log aggregation services (Datadog, LogDNA, etc.)
- Analyzed with log analysis tools

## Troubleshooting

### Sentry Not Capturing Errors

1. Check environment variables are set:
   ```bash
   echo $SENTRY_DSN
   echo $NEXT_PUBLIC_SENTRY_DSN
   ```

2. Verify Sentry is initialized:
   ```typescript
   import * as Sentry from '@sentry/nextjs';
   console.log('Sentry initialized:', !!Sentry.getCurrentHub().getClient());
   ```

3. Check error filtering in `sentry.*.config.ts`

### Logs Not Appearing

1. Check log level configuration:
   ```bash
   echo $LOG_LEVEL
   ```

2. Verify logger is imported correctly:
   ```typescript
   import { logger } from '@/lib/logger';
   ```

3. Check if log level is high enough for the message

### Error Boundary Not Catching Errors

1. Error boundaries only catch errors in:
   - Render methods
   - Lifecycle methods
   - Constructors

2. They do NOT catch:
   - Event handlers (use try-catch)
   - Async code (use try-catch)
   - Server-side rendering errors
   - Errors in the error boundary itself

## Examples

See the following files for complete examples:

- `src/app/api/example-error-handling/route.ts` - API error handling
- `src/app/api/sentry-test/route.ts` - Sentry testing
- `src/components/ErrorBoundary.tsx` - Error boundary implementation

## Additional Resources

- [Sentry Documentation](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Next.js Error Handling](https://nextjs.org/docs/app/building-your-application/routing/error-handling)
- [Structured Logging Best Practices](https://www.datadoghq.com/blog/structured-logging/)
