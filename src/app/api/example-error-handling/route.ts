import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/middleware/auth';
import { createErrorResponse, NotFoundError, ValidationError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { User } from '@prisma/client';

/**
 * Example API route demonstrating error handling and logging
 * This shows how to use the centralized error handling system
 */
async function handler(
  request: NextRequest,
  context: Record<string, unknown>,
  user: User
) {
  try {
    // Log the operation
    logger.info('Processing example request', {
      userId: user.id,
      path: request.nextUrl.pathname,
    });

    // Example: Throw different types of errors based on query param
    const errorType = request.nextUrl.searchParams.get('error');

    switch (errorType) {
      case 'not-found':
        throw new NotFoundError('Example resource');
      
      case 'validation':
        throw new ValidationError('Invalid input data', {
          field: 'example',
          message: 'This is a validation error example',
        });
      
      case 'generic':
        throw new Error('This is a generic error');
      
      default:
        // Success case
        logger.info('Example request completed successfully', {
          userId: user.id,
        });
        
        return NextResponse.json({
          message: 'Success! Try adding ?error=not-found or ?error=validation to see error handling',
          user: {
            id: user.id,
            email: user.email,
          },
        });
    }
  } catch (error) {
    // The error will be caught and formatted by createErrorResponse
    return createErrorResponse(
      error instanceof Error ? error : new Error(String(error)),
      request.nextUrl.pathname,
      {
        userId: user.id,
        method: request.method,
      }
    );
  }
}

// Apply authentication middleware (request logging is built into requireAuth)
export const GET = requireAuth(handler);
