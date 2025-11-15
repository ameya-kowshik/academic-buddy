import { NextRequest, NextResponse } from 'next/server';
import { ZodSchema, ZodError } from 'zod';

/**
 * Error response structure for validation errors
 */
export interface ValidationErrorResponse {
  error: {
    code: string;
    message: string;
    details: Array<{
      field: string;
      message: string;
      received?: unknown;
    }>;
  };
  timestamp: string;
  path: string;
}

/**
 * Format Zod validation errors into a consistent structure
 */
export function formatValidationError(error: ZodError, path: string): ValidationErrorResponse {
  return {
    error: {
      code: 'VALIDATION_ERROR',
      message: 'Request validation failed',
      details: error.issues.map((err) => {
        const detail: { field: string; message: string; received?: unknown } = {
          field: err.path.join('.'),
          message: err.message
        };
        
        if (err.code === 'invalid_type') {
          detail.received = (err as { received?: unknown }).received;
        }
        
        return detail;
      })
    },
    timestamp: new Date().toISOString(),
    path
  };
}

/**
 * Validate request body against a Zod schema
 * 
 * @param schema - Zod schema to validate against
 * @returns Middleware function that validates the request body
 * 
 * @example
 * ```typescript
 * export const POST = validateBody(createProjectSchema)(async (request) => {
 *   const body = await request.json();
 *   // body is now validated and typed
 * });
 * ```
 */
export function validateBody<T>(schema: ZodSchema<T>) {
  return function (
    handler: (request: NextRequest, context: Record<string, unknown>, validatedData: T) => Promise<NextResponse>
  ) {
    return async (request: NextRequest, context: Record<string, unknown>): Promise<NextResponse> => {
      try {
        const body = await request.json();
        const validatedData = schema.parse(body);
        
        // Pass validated data to the handler
        return await handler(request, context, validatedData);
      } catch (error) {
        if (error instanceof ZodError) {
          const validationError = formatValidationError(error, request.nextUrl.pathname);
          return NextResponse.json(validationError, { status: 422 });
        }
        
        // Re-throw non-validation errors
        throw error;
      }
    };
  };
}

/**
 * Validate query parameters against a Zod schema
 * 
 * @param schema - Zod schema to validate against
 * @returns Middleware function that validates query parameters
 * 
 * @example
 * ```typescript
 * export const GET = validateQuery(querySchema)(async (request, context, validatedQuery) => {
 *   // validatedQuery is now validated and typed
 * });
 * ```
 */
export function validateQuery<T>(schema: ZodSchema<T>) {
  return function (
    handler: (request: NextRequest, context: Record<string, unknown>, validatedQuery: T) => Promise<NextResponse>
  ) {
    return async (request: NextRequest, context: Record<string, unknown>): Promise<NextResponse> => {
      try {
        const { searchParams } = new URL(request.url);
        const queryObject: Record<string, string> = {};
        
        searchParams.forEach((value, key) => {
          queryObject[key] = value;
        });
        
        const validatedQuery = schema.parse(queryObject);
        
        // Pass validated query to the handler
        return await handler(request, context, validatedQuery);
      } catch (error) {
        if (error instanceof ZodError) {
          const validationError = formatValidationError(error, request.nextUrl.pathname);
          return NextResponse.json(validationError, { status: 422 });
        }
        
        // Re-throw non-validation errors
        throw error;
      }
    };
  };
}

/**
 * Validate route parameters against a Zod schema
 * 
 * @param schema - Zod schema to validate against
 * @returns Middleware function that validates route parameters
 * 
 * @example
 * ```typescript
 * export const GET = validateParams(paramsSchema)(async (request, context, validatedParams) => {
 *   // validatedParams is now validated and typed
 * });
 * ```
 */
export function validateParams<T>(schema: ZodSchema<T>) {
  return function (
    handler: (request: NextRequest, context: Record<string, unknown>, validatedParams: T) => Promise<NextResponse>
  ) {
    return async (request: NextRequest, context: Record<string, unknown>): Promise<NextResponse> => {
      try {
        const params = (context.params as Record<string, unknown>) || {};
        const validatedParams = schema.parse(params);
        
        // Pass validated params to the handler
        return await handler(request, context, validatedParams);
      } catch (error) {
        if (error instanceof ZodError) {
          const validationError = formatValidationError(error, request.nextUrl.pathname);
          return NextResponse.json(validationError, { status: 422 });
        }
        
        // Re-throw non-validation errors
        throw error;
      }
    };
  };
}

/**
 * Combine validation middleware with authentication middleware
 * This is a helper to make it easier to chain middleware
 * 
 * @example
 * ```typescript
 * export const POST = requireAuth(
 *   validateBody(createProjectSchema)(async (request, context, user, validatedData) => {
 *     // Both authenticated and validated
 *   })
 * );
 * ```
 */
export function withValidation<T, U = unknown>(
  schema: ZodSchema<T>,
  handler: (request: NextRequest, context: Record<string, unknown>, user: U, validatedData: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, context: Record<string, unknown>, user: U): Promise<NextResponse> => {
    try {
      const body = await request.json();
      const validatedData = schema.parse(body);
      
      return await handler(request, context, user, validatedData);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = formatValidationError(error, request.nextUrl.pathname);
        return NextResponse.json(validationError, { status: 422 });
      }
      
      throw error;
    }
  };
}
