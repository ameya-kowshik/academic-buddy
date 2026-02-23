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
let redisInitialized = false;
let redisAvailable = false;

/**
 * Test Redis connection with timeout
 */
async function testRedisConnection(client: Redis): Promise<boolean> {
  try {
    // Set a short timeout for the connection test
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Redis connection timeout')), 3000)
    );
    
    const pingPromise = client.ping();
    
    await Promise.race([pingPromise, timeoutPromise]);
    return true;
  } catch (error) {
    logger.warn('Redis connection test failed - caching disabled', { error: (error as Error).message });
    return false;
  }
}

/**
 * Initialize Redis client
 */
async function getRedisClient(): Promise<Redis | null> {
  // Return null immediately if we already know Redis is unavailable
  if (redisInitialized && !redisAvailable) {
    return null;
  }

  // Check if Upstash Redis REST API credentials are available
  if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) {
    // Fallback to REDIS_URL if available
    if (!env.REDIS_URL) {
      if (!redisInitialized) {
        logger.warn('Redis credentials not configured - caching disabled');
        redisInitialized = true;
      }
      return null;
    }
  }

  if (!redisClient && !redisInitialized) {
    redisInitialized = true;
    
    try {
      // Prefer Upstash REST API configuration
      if (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN) {
        const client = new Redis({
          url: env.UPSTASH_REDIS_REST_URL,
          token: env.UPSTASH_REDIS_REST_TOKEN,
        });
        
        // Test connection before using
        redisAvailable = await testRedisConnection(client);
        
        if (redisAvailable) {
          redisClient = client;
          logger.info('Redis client initialized and connected successfully');
        } else {
          logger.warn('Redis client initialized but connection failed - caching disabled');
        }
      } else if (env.REDIS_URL) {
        // Fallback to standard Redis URL
        const client = Redis.fromEnv();
        redisAvailable = await testRedisConnection(client);
        
        if (redisAvailable) {
          redisClient = client;
          logger.info('Redis client initialized and connected successfully');
        } else {
          logger.warn('Redis client initialized but connection failed - caching disabled');
        }
      }
    } catch (error) {
      logger.error('Failed to initialize Redis client - caching disabled', error as Error);
      redisAvailable = false;
      return null;
    }
  }

  return redisAvailable ? redisClient : null;
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
  const client = await getRedisClient();
  
  if (!client) {
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
    // Mark Redis as unavailable on connection errors
    if ((error as any).code === 'ENOTFOUND' || (error as any).message?.includes('fetch failed')) {
      redisAvailable = false;
    }
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
  const client = await getRedisClient();
  
  if (!client) {
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
    // Mark Redis as unavailable on connection errors
    if ((error as any).code === 'ENOTFOUND' || (error as any).message?.includes('fetch failed')) {
      redisAvailable = false;
    }
  }
}

/**
 * Delete value from cache
 * @param key Cache key
 */
export async function deleteKey(key: string): Promise<void> {
  const client = await getRedisClient();
  
  if (!client) {
    return;
  }

  try {
    await client.del(key);
    logger.debug('Cache key deleted', { key });
  } catch (error) {
    logger.error('Cache delete error', error as Error, { key });
    // Mark Redis as unavailable on connection errors
    if ((error as any).code === 'ENOTFOUND' || (error as any).message?.includes('fetch failed')) {
      redisAvailable = false;
    }
  }
}

/**
 * Invalidate all keys matching a pattern
 * @param pattern Pattern to match (e.g., "user:123:*")
 */
export async function invalidatePattern(pattern: string): Promise<void> {
  const client = await getRedisClient();
  
  if (!client) {
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
    // Mark Redis as unavailable on connection errors
    if ((error as any).code === 'ENOTFOUND' || (error as any).message?.includes('fetch failed')) {
      redisAvailable = false;
    }
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
