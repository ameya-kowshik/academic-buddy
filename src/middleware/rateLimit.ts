import { NextRequest, NextResponse } from "next/server";
import {
  checkRateLimit,
  getRateLimitIdentifier,
  RateLimitType,
} from "@/lib/rateLimit";

/**
 * Rate limit middleware wrapper for API routes
 * @param handler - The API route handler function
 * @param type - Type of rate limit to apply (read, write, auth, default)
 * @returns Wrapped handler with rate limiting
 */
export function withRateLimit<T = any>(
  handler: (request: NextRequest, context?: { params?: T }) => Promise<NextResponse>,
  type: RateLimitType = "default"
) {
  return async (request: NextRequest, context?: { params?: T }): Promise<NextResponse> => {
    try {
      // Extract user ID if available (from auth middleware)
      const userId = request.headers.get("x-user-id") || undefined;

      // Get identifier for rate limiting
      const identifier = getRateLimitIdentifier(request, userId);

      // Check rate limit
      const rateLimitResult = await checkRateLimit(identifier, type);

      // Add rate limit headers to response
      const headers = new Headers();
      headers.set("X-RateLimit-Limit", rateLimitResult.limit.toString());
      headers.set("X-RateLimit-Remaining", rateLimitResult.remaining.toString());
      headers.set(
        "X-RateLimit-Reset",
        new Date(rateLimitResult.reset).toISOString()
      );

      // If rate limit exceeded, return 429 response
      if (!rateLimitResult.success) {
        const retryAfter = Math.ceil(
          (rateLimitResult.reset - Date.now()) / 1000
        );

        return NextResponse.json(
          {
            error: {
              code: "RATE_LIMIT_EXCEEDED",
              message: "Too many requests. Please try again later.",
              details: {
                limit: rateLimitResult.limit,
                reset: new Date(rateLimitResult.reset).toISOString(),
                retryAfter: `${retryAfter} seconds`,
              },
            },
            timestamp: new Date().toISOString(),
            path: request.nextUrl.pathname,
          },
          {
            status: 429,
            headers: {
              ...Object.fromEntries(headers.entries()),
              "Retry-After": retryAfter.toString(),
            },
          }
        );
      }

      // Execute the handler
      const response = await handler(request, context);

      // Add rate limit headers to successful response
      headers.forEach((value, key) => {
        response.headers.set(key, value);
      });

      return response;
    } catch (error) {
      console.error("Rate limit middleware error:", error);
      // On error, allow the request to proceed
      return handler(request, context);
    }
  };
}

/**
 * Helper function to determine rate limit type based on HTTP method
 * @param method - HTTP method (GET, POST, PUT, DELETE, etc.)
 * @returns Rate limit type
 */
export function getRateLimitTypeFromMethod(method: string): RateLimitType {
  const readMethods = ["GET", "HEAD", "OPTIONS"];
  const writeMethods = ["POST", "PUT", "PATCH", "DELETE"];

  if (readMethods.includes(method.toUpperCase())) {
    return "read";
  }

  if (writeMethods.includes(method.toUpperCase())) {
    return "write";
  }

  return "default";
}

/**
 * Automatic rate limit wrapper that determines type based on HTTP method
 * @param handler - The API route handler function
 * @returns Wrapped handler with automatic rate limiting
 */
export function withAutoRateLimit(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const type = getRateLimitTypeFromMethod(request.method);
    return withRateLimit(handler, type)(request);
  };
}
