# Prisma Client Generation Issue

## Issue
There's a permission error when running `npx prisma generate` on Windows:
```
EPERM: operation not permitted, rename 'query_engine-windows.dll.node.tmp' -> 'query_engine-windows.dll.node'
```

## Status
- ✅ Database schema is updated and in sync
- ✅ `npx prisma db push` works correctly
- ❌ `npx prisma generate` has permission issues
- ✅ API routes temporarily use mock data until client is regenerated

## Solution
The API routes are temporarily disabled with mock responses. Once the Prisma client generation issue is resolved:

1. Run `npx prisma generate` successfully
2. Remove the temporary mock code from API routes
3. Restore full functionality

## Files with temporary fixes
- `src/app/api/tags/route.ts` - Mock responses
- `src/app/api/tags/[id]/route.ts` - Mock responses  
- `src/app/api/focus-sessions/route.ts` - Mock responses
- `src/lib/focus-utils.ts` - Custom type definitions

The core functionality and UI components can still be developed and tested.