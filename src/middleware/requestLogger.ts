import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { metricsCollector } from '@/lib/metrics';

/**
 * Generate a unique request ID
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Request logging middleware
 * Logs all API requests with method, path, status, and duration
 */
export function withRequestLogging(
  handler: (request: NextRequest, context: Record<string, unknown>) => Promise<NextResponse>
) {
  return async (request: NextRequest, context: Record<string, unknown>): Promise<NextResponse> => {
    const requestId = generateRequestId();
    const startTime = Date.now();
    const { method, url } = request;
    const path = new URL(url).pathname;

    // Log incoming request
    logger.info('Incoming request', {
      requestId,
      method,
      path,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    try {
      // Execute the handler
      const response = await handler(request, context);
      const duration = Date.now() - startTime;
      const statusCode = response.status;

      // Record metrics
      const isError = statusCode >= 400;
      metricsCollector.recordRequest(path, duration, isError);

      // Log successful response
      logger.info('Request completed', {
        requestId,
        method,
        path,
        statusCode,
        duration,
      });

      // Add request ID to response headers
      response.headers.set('X-Request-ID', requestId);

      return response;
    } catch (error) {
      const duration = Date.now() - startTime;

      // Record error in metrics
      metricsCollector.recordRequest(path, duration, true);

      // Log error
      logger.error(
        'Request failed',
        error instanceof Error ? error : new Error(String(error)),
        {
          requestId,
          method,
          path,
          duration,
        }
      );

      throw error;
    }
  };
}

/**
 * Request logging middleware with authentication context
 * Includes user information in logs
 */
export function withAuthenticatedRequestLogging<T>(
  handler: (
    request: NextRequest,
    context: Record<string, unknown>,
    user: T
  ) => Promise<NextResponse>
) {
  return async (
    request: NextRequest,
    context: Record<string, unknown>,
    user: T
  ): Promise<NextResponse> => {
    const requestId = generateRequestId();
    const startTime = Date.now();
    const { method, url } = request;
    const path = new URL(url).pathname;
    
    // Extract user ID if available
    const userId = (user as { id?: string })?.id;

    // Log incoming request with user context
    logger.info('Incoming authenticated request', {
      requestId,
      method,
      path,
      userId,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    try {
      // Execute the handler
      const response = await handler(request, context, user);
      const duration = Date.now() - startTime;
      const statusCode = response.status;

      // Record metrics
      const isError = statusCode >= 400;
      metricsCollector.recordRequest(path, duration, isError);

      // Log successful response
      logger.info('Authenticated request completed', {
        requestId,
        method,
        path,
        userId,
        statusCode,
        duration,
      });

      // Add request ID to response headers
      response.headers.set('X-Request-ID', requestId);

      return response;
    } catch (error) {
      const duration = Date.now() - startTime;

      // Record error in metrics
      metricsCollector.recordRequest(path, duration, true);

      // Log error with user context
      logger.error(
        'Authenticated request failed',
        error instanceof Error ? error : new Error(String(error)),
        {
          requestId,
          method,
          path,
          userId,
          duration,
        }
      );

      throw error;
    }
  };
}

/**
 * Performance logging for slow requests
 */
export function logSlowRequest(
  path: string,
  method: string,
  duration: number,
  threshold = 1000
): void {
  if (duration > threshold) {
    logger.warn('Slow request detected', {
      path,
      method,
      duration,
      threshold,
    });
  }
}
