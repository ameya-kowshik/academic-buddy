import { NextRequest, NextResponse } from 'next/server';
import { checkDatabaseConnection } from '@/lib/prisma';
import { adminAuth } from '@/lib/firebase-admin';
import { withRequestLogging } from '@/middleware/requestLogger';

/**
 * Health check endpoint
 * Checks the status of critical services: database and Firebase authentication
 * Returns 200 if all services are healthy, 503 if any service is down
 */

interface HealthStatus {
  status: 'up' | 'down';
  responseTime?: number;
  error?: string;
}

interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  checks: {
    database: HealthStatus;
    firebase: HealthStatus;
  };
}

/**
 * Check database connectivity
 */
async function checkDatabase(): Promise<HealthStatus> {
  const result = await checkDatabaseConnection();
  
  return {
    status: result.healthy ? 'up' : 'down',
    responseTime: result.responseTime,
    error: result.error,
  };
}

/**
 * Check Firebase authentication service
 */
async function checkFirebase(): Promise<HealthStatus> {
  const startTime = Date.now();
  
  try {
    // Try to list users with a limit of 1 to verify Firebase connection
    // This is a lightweight operation that confirms Firebase Admin SDK is working
    await adminAuth.listUsers(1);
    
    const responseTime = Date.now() - startTime;
    
    return {
      status: 'up',
      responseTime,
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    return {
      status: 'down',
      responseTime,
      error: error instanceof Error ? error.message : 'Unknown Firebase error',
    };
  }
}

/**
 * GET /api/health
 * Health check endpoint that verifies all critical services are operational
 */
export const GET = withRequestLogging(async (request: NextRequest) => {
  try {
    // Run all health checks in parallel
    const [databaseCheck, firebaseCheck] = await Promise.all([
      checkDatabase(),
      checkFirebase(),
    ]);

    // Determine overall health status
    const allHealthy = databaseCheck.status === 'up' && firebaseCheck.status === 'up';
    const anyDown = databaseCheck.status === 'down' || firebaseCheck.status === 'down';

    const healthStatus: HealthCheckResponse = {
      status: allHealthy ? 'healthy' : anyDown ? 'unhealthy' : 'degraded',
      timestamp: new Date().toISOString(),
      checks: {
        database: databaseCheck,
        firebase: firebaseCheck,
      },
    };

    // Return 503 if any service is down, 200 otherwise
    const statusCode = healthStatus.status === 'unhealthy' ? 503 : 200;

    return NextResponse.json(healthStatus, { status: statusCode });
  } catch (error) {
    // If the health check itself fails, return unhealthy status
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Health check failed',
        checks: {
          database: { status: 'down', error: 'Health check failed' },
          firebase: { status: 'down', error: 'Health check failed' },
        },
      } as HealthCheckResponse,
      { status: 503 }
    );
  }
});
