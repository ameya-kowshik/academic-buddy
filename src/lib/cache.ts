import { Redis } from '@upstash/redis';
import { env } from './env';
import { logger } from './logger';

/**
 * Cache service interface
 */
export interface CacheService {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
  invalidatePattern(pattern: string): Promise<void>;
}

/**
 * Redis client instance
 * Only initialized if REDIS_URL is provided
 */
let redisClient: Redis | null = null;

/**
 * Initialize Redis client
 */
function getRedisClient(): Redis | null {
  // Check if Upstash Redis REST API credentials are available
  if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) {
    // Fallback to REDIS_URL if available
    if (!env.REDIS_URL) {
      return null;
    }
  }

  if (!redisClient) {
    try {
      // Prefer Upstash REST API configuration
      if (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN) {
        redisClient = new Redis({
          url: env.UPSTASH_REDIS_REST_URL,
          token: env.UPSTASH_REDIS_REST_TOKEN,
        });
      } else if (env.REDIS_URL) {
        // Fallback to standard Redis URL
        redisClient = Redis.fromEnv();
      }
      
      if (redisClient) {
        logger.info('Redis client initialized successfully');
      }
    } catch (error) {
      logger.error('Failed to initialize Redis client', error as Error);
      return null;
    }
  }

  return redisClient;
}

/**
 * Cache TTL values (in seconds)
 */
export const CACHE_TTL = {
  USER_PROFILE: 300, // 5 minutes
  PROJECTS: 120, // 2 minutes
  TASKS: 120, // 2 minutes
  ANALYTICS: 600, // 10 minutes
  STATIC_CONTENT: 3600, // 1 hour
} as const;

/**
 * Cache key prefixes for different data types
 */
export const CACHE_PREFIX = {
  USER: 'user',
  TASKS: 'tasks',
  ANALYTICS: 'analytics',
} as const;

/**
 * Generate cache key with prefix
 */
export function generateCacheKey(prefix: string, ...parts: string[]): string {
  return `${prefix}:${parts.join(':')}`;
}

/**
 * Get value from cache
 * @param key Cache key
 * @returns Cached value or null if not found or cache unavailable
 */
export async function get<T>(key: string): Promise<T | null> {
  const client = getRedisClient();
  
  if (!client) {
    logger.debug('Cache unavailable, skipping get operation', { key });
    return null;
  }

  try {
    const value = await client.get<T>(key);
    
    if (value !== null) {
      logger.debug('Cache hit', { key });
    } else {
      logger.debug('Cache miss', { key });
    }
    
    return value;
  } catch (error) {
    logger.error('Cache get error', error as Error, { key });
    return null;
  }
}

/**
 * Set value in cache with optional TTL
 * @param key Cache key
 * @param value Value to cache
 * @param ttl Time to live in seconds (optional)
 */
export async function set<T>(key: string, value: T, ttl?: number): Promise<void> {
  const client = getRedisClient();
  
  if (!client) {
    logger.debug('Cache unavailable, skipping set operation', { key });
    return;
  }

  try {
    if (ttl) {
      await client.setex(key, ttl, value);
      logger.debug('Cache set with TTL', { key, ttl });
    } else {
      await client.set(key, value);
      logger.debug('Cache set without TTL', { key });
    }
  } catch (error) {
    logger.error('Cache set error', error as Error, { key });
  }
}

/**
 * Delete value from cache
 * @param key Cache key
 */
export async function deleteKey(key: string): Promise<void> {
  const client = getRedisClient();
  
  if (!client) {
    logger.debug('Cache unavailable, skipping delete operation', { key });
    return;
  }

  try {
    await client.del(key);
    logger.debug('Cache key deleted', { key });
  } catch (error) {
    logger.error('Cache delete error', error as Error, { key });
  }
}

/**
 * Invalidate all keys matching a pattern
 * @param pattern Pattern to match (e.g., "user:123:*")
 */
export async function invalidatePattern(pattern: string): Promise<void> {
  const client = getRedisClient();
  
  if (!client) {
    logger.debug('Cache unavailable, skipping invalidate operation', { pattern });
    return;
  }

  try {
    // Upstash Redis doesn't support SCAN, so we'll use KEYS for pattern matching
    // Note: This is not ideal for production with large datasets
    // Consider using a different approach or Redis instance with SCAN support
    const keys = await client.keys(pattern);
    
    if (keys.length > 0) {
      await client.del(...keys);
      logger.info('Cache pattern invalidated', { pattern, count: keys.length });
    } else {
      logger.debug('No keys found for pattern', { pattern });
    }
  } catch (error) {
    logger.error('Cache invalidate pattern error', error as Error, { pattern });
  }
}

/**
 * Cache service instance
 */
export const cache: CacheService = {
  get,
  set,
  delete: deleteKey,
  invalidatePattern,
};

/**
 * Helper function to wrap a function with caching
 * @param key Cache key
 * @param ttl Time to live in seconds
 * @param fn Function to execute if cache miss
 * @returns Cached or fresh value
 */
export async function withCache<T>(
  key: string,
  ttl: number,
  fn: () => Promise<T>
): Promise<T> {
  // Try to get from cache
  const cached = await get<T>(key);
  
  if (cached !== null) {
    return cached;
  }

  // Execute function and cache result
  const result = await fn();
  await set(key, result, ttl);
  
  return result;
}
