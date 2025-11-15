# Database Optimization

This document describes the database optimizations implemented for the Academic Buddy application.

## Overview

The database optimization task focused on three key areas:
1. Adding database indexes for frequently queried columns
2. Configuring connection pooling for better resource management
3. Optimizing existing database queries to reduce data transfer and improve performance

## 1. Database Indexes

Added the following indexes to improve query performance:

### Users Table
- **Index on `firebaseUid`**: Speeds up authentication lookups when verifying JWT tokens

### Projects Table
- **Composite index on `(userId, createdAt)`**: Optimizes queries that fetch projects for a user ordered by creation date

### Tasks Table
- **Composite index on `(userId, status)`**: Improves performance when filtering tasks by user and status
- **Composite index on `(projectId, order)`**: Speeds up queries that fetch tasks for a project in order

### PomodoroLogs Table
- **Composite index on `(userId, startedAt)`**: Optimizes analytics queries that fetch focus sessions by user and time range

## 2. Connection Pooling

Configured Prisma Client with connection pooling to handle production load efficiently:

### Configuration
- **Connection Limit**: Configurable via `DATABASE_CONNECTION_LIMIT` environment variable (default: 20)
- **Pool Timeout**: Configurable via `DATABASE_POOL_TIMEOUT` environment variable (default: 10 seconds)
- **PgBouncer Support**: Automatically detects and configures for pooling services like Neon

### Health Monitoring
Added `checkDatabaseConnection()` function to monitor database health:
- Performs lightweight connectivity check
- Measures response time
- Returns detailed error information on failure
- Integrated with `/api/health` endpoint

### Graceful Shutdown
Added `disconnectDatabase()` function for clean application shutdown

## 3. Query Optimization

Optimized all API routes to reduce data transfer and prevent N+1 queries:

### Projects API (`/api/projects`)
**Before:**
- Loaded all tasks for all projects (N+1 query)
- Returned all fields including unnecessary relations

**After:**
- Uses `select` to return only necessary fields
- Adds pagination support (limit/offset)
- Filters archived projects by default
- Optimized task loading with selective fields
- Returns pagination metadata

**Query Parameters:**
- `includeArchived`: Include archived projects (default: false)
- `limit`: Maximum number of results (default: 100)
- `offset`: Number of results to skip (default: 0)

### Tasks API (`/api/tasks`)
**Before:**
- Returned all fields for all tasks
- No filtering or pagination support

**After:**
- Uses `select` to return only necessary fields
- Adds filtering by status and projectId
- Implements pagination (limit/offset)
- Optimized project relation loading
- Returns pagination metadata

**Query Parameters:**
- `status`: Filter by task status
- `projectId`: Filter by project
- `limit`: Maximum number of results (default: 100)
- `offset`: Number of results to skip (default: 0)

### Task Detail API (`/api/tasks/[id]`)
**Before:**
- Single query loaded all fields

**After:**
- Two-step approach: lightweight ownership check, then full data fetch
- Uses `select` to return only necessary fields
- Optimized subtasks loading with selective fields
- Includes task counts for related data

### Project Detail API (`/api/projects/[id]`)
**Before:**
- Loaded all tasks when updating/deleting
- Returned all fields

**After:**
- Lightweight ownership verification queries
- Uses `select` instead of `include` for updates
- Returns only necessary fields

## Performance Impact

### Expected Improvements
1. **Query Speed**: 30-50% faster queries due to indexes on frequently queried columns
2. **Data Transfer**: 40-60% reduction in data transfer by using selective field loading
3. **Connection Management**: Better resource utilization with connection pooling
4. **Scalability**: Support for pagination enables handling large datasets

### Monitoring
- Database connection health is monitored via `/api/health` endpoint
- Query performance can be tracked through Prisma query logs (enabled in development)
- Response times are logged for all API requests

## Environment Variables

Add these to your `.env` file for custom configuration:

```env
# Database Connection Pool Configuration (Optional)
DATABASE_CONNECTION_LIMIT="20"
DATABASE_POOL_TIMEOUT="10"
```

## Migration

The database indexes were applied using:
```bash
npx prisma db push
```

For production deployments with existing data, this is a safe operation as it only adds indexes without modifying data.

## Future Optimizations

Potential areas for further optimization:
1. Implement Redis caching for frequently accessed data
2. Add database query result caching
3. Implement cursor-based pagination for better performance on large datasets
4. Add database query performance monitoring and alerting
5. Consider read replicas for analytics queries
