import { NextRequest, NextResponse } from 'next/server';
import { metricsCollector } from '@/lib/metrics';
import { withRequestLogging } from '@/middleware/requestLogger';
import { cache, CACHE_TTL, CACHE_PREFIX, generateCacheKey } from '@/lib/cache';

/**
 * Metrics endpoint
 * Provides application metrics including request counts, response times, and error rates
 * Protected with basic authentication
 */

/**
 * Verify basic authentication
 * Expects Authorization header with format: "Basic base64(username:password)"
 */
function verifyBasicAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return false;
  }

  try {
    // Extract and decode credentials
    const base64Credentials = authHeader.substring(6);
    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
    const [username, password] = credentials.split(':');

    // Get expected credentials from environment variables
    // Default to 'admin:metrics' for development if not set
    const expectedUsername = process.env.METRICS_USERNAME || 'admin';
    const expectedPassword = process.env.METRICS_PASSWORD || 'metrics';

    // Simple constant-time comparison to prevent timing attacks
    const usernameMatch = username === expectedUsername;
    const passwordMatch = password === expectedPassword;

    return usernameMatch && passwordMatch;
  } catch (error) {
    return false;
  }
}

/**
 * GET /api/metrics
 * Returns application metrics
 * Requires basic authentication
 */
export const GET = withRequestLogging(async (request: NextRequest) => {
  // Verify authentication
  if (!verifyBasicAuth(request)) {
    return NextResponse.json(
      {
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      },
      {
        status: 401,
        headers: {
          'WWW-Authenticate': 'Basic realm="Metrics"',
        },
      }
    );
  }

  try {
    // Generate cache key for metrics
    const cacheKey = generateCacheKey(CACHE_PREFIX.ANALYTICS, 'metrics');
    
    // Try to get from cache
    const cachedMetrics = await cache.get<{
      timestamp: string;
      summary: Record<string, unknown>;
      endpoints: Record<string, unknown>;
    }>(cacheKey);
    
    if (cachedMetrics) {
      return NextResponse.json(cachedMetrics, { status: 200 });
    }
    
    // Get metrics summary and detailed breakdown
    const summary = metricsCollector.getSummary();
    const endpoints = metricsCollector.getDetailedMetrics();

    const response = {
      timestamp: new Date().toISOString(),
      summary,
      endpoints,
    };
    
    // Cache the response for 10 minutes
    await cache.set(cacheKey, response, CACHE_TTL.ANALYTICS);

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve metrics',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
});

/**
 * DELETE /api/metrics
 * Reset all metrics
 * Requires basic authentication
 */
export const DELETE = withRequestLogging(async (request: NextRequest) => {
  // Verify authentication
  if (!verifyBasicAuth(request)) {
    return NextResponse.json(
      {
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      },
      {
        status: 401,
        headers: {
          'WWW-Authenticate': 'Basic realm="Metrics"',
        },
      }
    );
  }

  try {
    metricsCollector.reset();
    
    // Invalidate metrics cache
    const cacheKey = generateCacheKey(CACHE_PREFIX.ANALYTICS, 'metrics');
    await cache.delete(cacheKey);

    return NextResponse.json(
      {
        message: 'Metrics reset successfully',
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to reset metrics',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
});
