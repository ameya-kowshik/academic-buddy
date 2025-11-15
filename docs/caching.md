# Caching Implementation

This document describes the caching layer implementation for the Academic Buddy application.

## Overview

The caching layer uses Upstash Redis to cache frequently accessed data and reduce database load. The implementation is optional and gracefully degrades when Redis is not available.

## Configuration

### Environment Variables

Add the following environment variables to your `.env` file:

```env
# Upstash Redis REST API (Recommended)
UPSTASH_REDIS_REST_URL="https://your-redis-url.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-redis-token"

# Or standard Redis URL (Fallback)
REDIS_URL="redis://default:password@host:6379"
```

Get your Upstash Redis credentials from: https://console.upstash.com/

## Cache Service API

The cache service is located at `src/lib/cache.ts` and provides the following methods:

### Methods

- `get<T>(key: string): Promise<T | null>` - Get value from cache
- `set<T>(key: string, value: T, ttl?: number): Promise<void>` - Set value in cache with optional TTL
- `delete(key: string): Promise<void>` - Delete value from cache
- `invalidatePattern(pattern: string): Promise<void>` - Invalidate all keys matching a pattern

### Helper Functions

- `generateCacheKey(prefix: string, ...parts: string[]): string` - Generate cache key with prefix
- `withCache<T>(key: string, ttl: number, fn: () => Promise<T>): Promise<T>` - Wrap a function with caching

### Cache TTL Values

```typescript
CACHE_TTL = {
  USER_PROFILE: 300,    // 5 minutes
  PROJECTS: 120,        // 2 minutes
  TASKS: 120,           // 2 minutes
  ANALYTICS: 600,       // 10 minutes
  STATIC_CONTENT: 3600, // 1 hour
}
```

### Cache Prefixes

```typescript
CACHE_PREFIX = {
  USER: 'user',
  PROJECTS: 'projects',
  TASKS: 'tasks',
  ANALYTICS: 'analytics',
}
```

## Cached Endpoints

### GET /api/projects

- **Cache Key Pattern**: `projects:{userId}:archived:{true|false}:limit:{limit}:offset:{offset}`
- **TTL**: 2 minutes
- **Invalidation**: On project create, update, or delete

### GET /api/tasks

- **Cache Key Pattern**: `tasks:{userId}:status:{status}:project:{projectId}:limit:{limit}:offset:{offset}`
- **TTL**: 2 minutes
- **Invalidation**: On task create, update, or delete

### GET /api/metrics

- **Cache Key Pattern**: `analytics:metrics`
- **TTL**: 10 minutes
- **Invalidation**: On metrics reset

## Cache Invalidation Strategy

Cache invalidation is implemented using pattern matching to ensure data consistency:

1. **Project Mutations** (Create/Update/Delete):
   - Invalidates: `projects:{userId}:*`
   - Reason: Project list and counts may have changed

2. **Task Mutations** (Create/Update/Delete):
   - Invalidates: `tasks:{userId}:*`
   - Invalidates: `projects:{userId}:*`
   - Reason: Task list changed, and project task counts may have changed

3. **Metrics Reset**:
   - Invalidates: `analytics:metrics`
   - Reason: Metrics data has been reset

## Usage Examples

### Basic Caching

```typescript
import { cache, CACHE_TTL, CACHE_PREFIX, generateCacheKey } from '@/lib/cache';

// Generate cache key
const cacheKey = generateCacheKey(CACHE_PREFIX.PROJECTS, userId, 'all');

// Try to get from cache
const cachedData = await cache.get(cacheKey);
if (cachedData) {
  return cachedData;
}

// Fetch from database
const data = await fetchFromDatabase();

// Store in cache
await cache.set(cacheKey, data, CACHE_TTL.PROJECTS);
```

### Cache Invalidation

```typescript
import { invalidatePattern, CACHE_PREFIX, generateCacheKey } from '@/lib/cache';

// Invalidate all project caches for a user
await invalidatePattern(generateCacheKey(CACHE_PREFIX.PROJECTS, userId, '*'));
```

### Using withCache Helper

```typescript
import { withCache, CACHE_TTL, CACHE_PREFIX, generateCacheKey } from '@/lib/cache';

const data = await withCache(
  generateCacheKey(CACHE_PREFIX.PROJECTS, userId),
  CACHE_TTL.PROJECTS,
  async () => {
    // This function only executes on cache miss
    return await fetchFromDatabase();
  }
);
```

## Graceful Degradation

The caching layer is designed to gracefully degrade when Redis is not available:

- If Redis credentials are not configured, all cache operations are no-ops
- Cache errors are logged but don't affect the application
- The application continues to work normally without caching

## Performance Benefits

With caching enabled:

- **Reduced Database Load**: Frequently accessed data is served from cache
- **Faster Response Times**: Cache hits return data in milliseconds
- **Better Scalability**: Less database queries means better handling of concurrent requests

## Monitoring

Cache operations are logged with the following information:

- Cache hits and misses
- Cache set operations with TTL
- Cache invalidation operations
- Cache errors

Check application logs for cache-related messages with the `cache` context.

## Best Practices

1. **Always invalidate related caches** when data changes
2. **Use appropriate TTL values** based on data freshness requirements
3. **Include all query parameters** in cache keys to avoid stale data
4. **Monitor cache hit rates** to optimize caching strategy
5. **Test cache invalidation** to ensure data consistency

## Troubleshooting

### Cache Not Working

1. Verify Redis credentials are set in `.env`
2. Check application logs for Redis connection errors
3. Test Redis connectivity using the health check endpoint

### Stale Data

1. Verify cache invalidation is called on data mutations
2. Check cache key generation includes all relevant parameters
3. Consider reducing TTL values for frequently changing data

### High Memory Usage

1. Review TTL values and reduce if necessary
2. Implement cache size limits in Redis
3. Monitor cache key patterns and remove unused keys

