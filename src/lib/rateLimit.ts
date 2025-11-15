import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Initialize Redis client
// If REDIS_URL is not provided, we'll use an in-memory store for development
let redis: Redis | null = null;

if (process.env.REDIS_URL) {
  redis = Redis.fromEnv();
}

// Rate limit configurations for different endpoint types
export const rateLimitConfigs = {
  // Read operations - more permissive
  read: {
    requests: 100,
    window: "1 m" as const, // 100 requests per minute
  },
  // Write operations - more restrictive
  write: {
    requests: 30,
    window: "1 m" as const, // 30 requests per minute
  },
  // Authentication operations - very restrictive
  auth: {
    requests: 10,
    window: "1 m" as const, // 10 requests per minute
  },
  // Default fallback
  default: {
    requests: 60,
    window: "1 m" as const, // 60 requests per minute
  },
};

// Create rate limiters for different endpoint types
export const rateLimiters = {
  read: redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(
          rateLimitConfigs.read.requests,
          rateLimitConfigs.read.window
        ),
        analytics: true,
        prefix: "@ratelimit/read",
      })
    : null,

  write: redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(
          rateLimitConfigs.write.requests,
          rateLimitConfigs.write.window
        ),
        analytics: true,
        prefix: "@ratelimit/write",
      })
    : null,

  auth: redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(
          rateLimitConfigs.auth.requests,
          rateLimitConfigs.auth.window
        ),
        analytics: true,
        prefix: "@ratelimit/auth",
      })
    : null,

  default: redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(
          rateLimitConfigs.default.requests,
          rateLimitConfigs.default.window
        ),
        analytics: true,
        prefix: "@ratelimit/default",
      })
    : null,
};

export type RateLimitType = keyof typeof rateLimiters;

/**
 * Check if a request should be rate limited
 * @param identifier - Unique identifier for the rate limit (e.g., IP address or user ID)
 * @param type - Type of rate limit to apply (read, write, auth, default)
 * @returns Object containing success status and rate limit information
 */
export async function checkRateLimit(
  identifier: string,
  type: RateLimitType = "default"
) {
  const limiter = rateLimiters[type];

  // If Redis is not configured, allow all requests (development mode)
  if (!limiter) {
    return {
      success: true,
      limit: rateLimitConfigs[type].requests,
      remaining: rateLimitConfigs[type].requests,
      reset: Date.now() + 60000, // 1 minute from now
      pending: Promise.resolve(),
    };
  }

  try {
    const result = await limiter.limit(identifier);

    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
      pending: result.pending,
    };
  } catch (error) {
    console.error("Rate limit check failed:", error);
    // On error, allow the request but log the issue
    return {
      success: true,
      limit: rateLimitConfigs[type].requests,
      remaining: rateLimitConfigs[type].requests,
      reset: Date.now() + 60000,
      pending: Promise.resolve(),
    };
  }
}

/**
 * Get the identifier for rate limiting
 * Prefers user ID if authenticated, falls back to IP address
 * @param request - Next.js request object
 * @param userId - Optional user ID from authentication
 * @returns Identifier string for rate limiting
 */
export function getRateLimitIdentifier(
  request: Request,
  userId?: string
): string {
  // Prefer user ID for authenticated requests
  if (userId) {
    return `user:${userId}`;
  }

  // Fall back to IP address
  // Try to get real IP from headers (for proxied requests)
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");

  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return `ip:${forwardedFor.split(",")[0].trim()}`;
  }

  if (realIp) {
    return `ip:${realIp}`;
  }

  // Fallback to a generic identifier
  return "ip:unknown";
}
