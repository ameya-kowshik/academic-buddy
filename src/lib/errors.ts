import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import * as Sentry from '@sentry/nextjs';

/**
 * Base application error class
 */
export class AppError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode: number,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * Authentication error
 */
export class AuthenticationError extends AppError {
  constructor(message = 'Authentication required', details?: unknown) {
    super('AUTHENTICATION_ERROR', message, 401, details);
    this.name = 'AuthenticationError';
  }
}

/**
 * Authorization error
 */
export class AuthorizationError extends AppError {
  constructor(message = 'Insufficient permissions', details?: unknown) {
    super('AUTHORIZATION_ERROR', message, 403, details);
    this.name = 'AuthorizationError';
  }
}

/**
 * Not found error
 */
export class NotFoundError extends AppError {
  constructor(resource: string, details?: unknown) {
    super('NOT_FOUND', `${resource} not found`, 404, details);
    this.name = 'NotFoundError';
  }
}

/**
 * Validation error
 */
export class ValidationError extends AppError {
  constructor(message = 'Validation failed', details?: unknown) {
    super('VALIDATION_ERROR', message, 422, details);
    this.name = 'ValidationError';
  }
}

/**
 * Conflict error
 */
export class ConflictError extends AppError {
  constructor(message = 'Resource conflict', details?: unknown) {
    super('CONFLICT', message, 409, details);
    this.name = 'ConflictError';
  }
}

/**
 * Rate limit error
 */
export class RateLimitError extends AppError {
  constructor(message = 'Too many requests', details?: unknown) {
    super('RATE_LIMIT_EXCEEDED', message, 429, details);
    this.name = 'RateLimitError';
  }
}

/**
 * Internal server error
 */
export class InternalServerError extends AppError {
  constructor(message = 'Internal server error', details?: unknown) {
    super('INTERNAL_ERROR', message, 500, details);
    this.name = 'InternalServerError';
  }
}

/**
 * Error response structure
 */
export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  timestamp: string;
  path?: string;
}

/**
 * Format Zod validation errors into a standardized structure
 */
export function formatValidationError(error: ZodError): ErrorResponse {
  return {
    error: {
      code: 'VALIDATION_ERROR',
      message: 'Request validation failed',
      details: error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
        received: 'received' in issue ? issue.received : undefined,
      })),
    },
    timestamp: new Date().toISOString(),
  };
}

/**
 * Format Prisma database errors into a standardized structure
 */
export function formatDatabaseError(error: Prisma.PrismaClientKnownRequestError): ErrorResponse {
  let message = 'Database operation failed';
  let code = 'DATABASE_ERROR';
  let statusCode = 500;

  switch (error.code) {
    case 'P2002':
      // Unique constraint violation
      code = 'DUPLICATE_ENTRY';
      message = 'A record with this value already exists';
      statusCode = 409;
      break;
    case 'P2025':
      // Record not found
      code = 'NOT_FOUND';
      message = 'Record not found';
      statusCode = 404;
      break;
    case 'P2003':
      // Foreign key constraint violation
      code = 'INVALID_REFERENCE';
      message = 'Referenced record does not exist';
      statusCode = 400;
      break;
    case 'P2014':
      // Required relation violation
      code = 'INVALID_RELATION';
      message = 'The change would violate a required relation';
      statusCode = 400;
      break;
    case 'P2000':
      // Value too long
      code = 'VALUE_TOO_LONG';
      message = 'The provided value is too long for the field';
      statusCode = 400;
      break;
    case 'P2001':
      // Record does not exist
      code = 'NOT_FOUND';
      message = 'The record does not exist';
      statusCode = 404;
      break;
    default:
      // Generic database error
      code = 'DATABASE_ERROR';
      message = 'A database error occurred';
      statusCode = 500;
  }

  return {
    error: {
      code,
      message,
      details: {
        prismaCode: error.code,
        meta: error.meta,
      },
    },
    timestamp: new Date().toISOString(),
  };
}

/**
 * Error context for logging
 */
export interface ErrorContext {
  userId?: string;
  path?: string;
  method?: string;
  query?: Record<string, unknown>;
  body?: unknown;
  headers?: Record<string, string>;
  [key: string]: unknown;
}

/**
 * Log error with context
 */
export function logError(error: Error, context?: ErrorContext): void {
  const errorLog = {
    timestamp: new Date().toISOString(),
    name: error.name,
    message: error.message,
    stack: error.stack,
    context,
  };

  // Send to Sentry if configured
  if (process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.captureException(error, {
      contexts: {
        custom: context,
      },
      tags: {
        errorType: error.name,
      },
      level: error instanceof AppError && error.statusCode < 500 ? 'warning' : 'error',
    });
  }

  // In production, use structured JSON logging
  if (process.env.NODE_ENV === 'production') {
    // Structured JSON logging for production
    console.error(JSON.stringify(errorLog));
  } else {
    // Human-readable logging for development
    console.error('❌ Error occurred:', {
      name: error.name,
      message: error.message,
      context,
    });
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
  }
}

/**
 * Create a standardized error response
 */
export function createErrorResponse(
  error: Error,
  path?: string,
  context?: ErrorContext
): NextResponse {
  // Log the error with context
  logError(error, context);

  // Handle known error types
  if (error instanceof AppError) {
    const response: ErrorResponse = {
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
      timestamp: new Date().toISOString(),
      path,
    };
    return NextResponse.json(response, { status: error.statusCode });
  }

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    const response = formatValidationError(error);
    return NextResponse.json({ ...response, path }, { status: 422 });
  }

  // Handle Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const response = formatDatabaseError(error);
    const errorStatusCode = response.error.code === 'NOT_FOUND' ? 404 : 
                            response.error.code === 'DUPLICATE_ENTRY' ? 409 : 400;
    return NextResponse.json({ ...response, path }, { status: errorStatusCode });
  }

  // Handle Prisma validation errors
  if (error instanceof Prisma.PrismaClientValidationError) {
    const response: ErrorResponse = {
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid data provided',
        details: error.message,
      },
      timestamp: new Date().toISOString(),
      path,
    };
    return NextResponse.json(response, { status: 400 });
  }

  // Handle generic errors
  const response: ErrorResponse = {
    error: {
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'production' 
        ? 'An unexpected error occurred' 
        : error.message,
      details: process.env.NODE_ENV === 'production' ? undefined : error.stack,
    },
    timestamp: new Date().toISOString(),
    path,
  };

  return NextResponse.json(response, { status: 500 });
}

/**
 * Async error handler wrapper for route handlers
 */
export function withErrorHandler<T extends unknown[]>(
  handler: (...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (error) {
      // Extract request information if available
      const request = args[0] as { url?: string; method?: string };
      const path = request?.url ? new URL(request.url).pathname : undefined;
      
      return createErrorResponse(
        error instanceof Error ? error : new Error(String(error)),
        path
      );
    }
  };
}
