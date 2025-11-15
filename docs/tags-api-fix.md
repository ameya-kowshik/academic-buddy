# API Fixes - User Experience Improvement

## Fixed: Tags & Focus Sessions APIs

## Problems

Users were seeing multiple errors when visiting the analytics or focus session pages:
- ❌ "Failed to fetch tags"
- ❌ "Failed to fetch focus sessions"

These were caused by:

1. **Incomplete API Implementation**: Both tags and focus-sessions API routes were returning temporary/mock data
2. **Old Authentication Method**: Frontend was using deprecated `x-firebase-uid` header instead of JWT tokens

## Changes Made

### 1. Fixed Tags API Routes

#### `src/app/api/tags/route.ts`
- ✅ **GET /api/tags**: Now properly queries the database and returns user's tags
- ✅ **POST /api/tags**: Implemented full tag creation with duplicate checking
- ✅ Removed temporary mock data
- ✅ Added proper error handling

#### `src/app/api/tags/[id]/route.ts`
- ✅ **GET /api/tags/[id]**: Fetches specific tag with usage count
- ✅ **PUT /api/tags/[id]**: Updates tag name and color
- ✅ **DELETE /api/tags/[id]**: Deletes tag from database
- ✅ Implemented proper ownership verification
- ✅ Added validation for tag name and color

### 2. Fixed Focus Sessions API Routes

#### `src/app/api/focus-sessions/route.ts`
- ✅ **GET /api/focus-sessions**: Now queries pomodoroLog table with filters
- ✅ **POST /api/focus-sessions**: Creates focus sessions in database
- ✅ Removed temporary mock data
- ✅ Added pagination support
- ✅ Includes related data (task, tag, project)
- ✅ Supports filtering by date range, tag, and task

### 3. Updated Authentication Method

#### `src/lib/focus-utils.ts`
Updated all API functions to use Firebase ID tokens:

**Tags:**
- ✅ `getTags()`: Now uses `Authorization: Bearer <token>` header
- ✅ `createTag()`: Uses proper JWT authentication
- ✅ `updateTag()`: Uses proper JWT authentication
- ✅ `deleteTag()`: Uses proper JWT authentication

**Focus Sessions:**
- ✅ `getSessions()`: Now uses `Authorization: Bearer <token>` header
- ✅ `createSession()`: Uses proper JWT authentication

**Before:**
```typescript
headers: {
  'x-firebase-uid': firebaseUid
}
```

**After:**
```typescript
const idToken = await auth.currentUser?.getIdToken();
headers: {
  'Authorization': `Bearer ${idToken}`
}
```

## Benefits

### For Users
- ✅ **No More Error Messages**: Tags and focus sessions load properly
- ✅ **Better UX**: Smooth experience without failed fetch warnings
- ✅ **Functional Tags**: Users can create, update, and delete tags
- ✅ **Functional Focus Sessions**: Users can view and create focus sessions
- ✅ **Analytics Work**: Analytics pages now display real data

### For Security
- ✅ **Proper Authentication**: Uses JWT tokens instead of simple UID headers
- ✅ **Token Verification**: Backend verifies Firebase tokens on every request
- ✅ **Ownership Validation**: Ensures users can only access their own tags

### For Reliability
- ✅ **Real Database Queries**: No more mock data
- ✅ **Error Handling**: Proper error messages for debugging
- ✅ **Validation**: Input validation prevents bad data

## API Endpoints

### GET /api/tags
**Description**: Get all tags for authenticated user

**Authentication**: Required (Bearer token)

**Response**:
```json
[
  {
    "id": "tag_123",
    "name": "Work",
    "color": "#FF5733",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z",
    "_count": {
      "pomodoroLogs": 5
    }
  }
]
```

### POST /api/tags
**Description**: Create a new tag

**Authentication**: Required (Bearer token)

**Request Body**:
```json
{
  "name": "Study",
  "color": "#3B82F6"
}
```

**Response**: Created tag object (201)

**Errors**:
- 409: Tag with same name already exists
- 400: Invalid input data

### GET /api/tags/[id]
**Description**: Get specific tag

**Authentication**: Required (Bearer token)

**Response**: Tag object

**Errors**:
- 404: Tag not found
- 403: Unauthorized (tag belongs to another user)

### PUT /api/tags/[id]
**Description**: Update tag

**Authentication**: Required (Bearer token)

**Request Body**:
```json
{
  "name": "Updated Name",
  "color": "#10B981"
}
```

**Response**: Updated tag object

**Errors**:
- 404: Tag not found
- 403: Unauthorized
- 400: Invalid input data

### DELETE /api/tags/[id]
**Description**: Delete tag

**Authentication**: Required (Bearer token)

**Response**:
```json
{
  "message": "Tag deleted successfully"
}
```

**Errors**:
- 404: Tag not found
- 403: Unauthorized

## Testing

### Test Tag Creation
```bash
# Get your Firebase ID token first (from browser console):
# await firebase.auth().currentUser.getIdToken()

curl -X POST http://localhost:3000/api/tags \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Tag","color":"#FF5733"}'
```

### Test Tag Fetching
```bash
curl http://localhost:3000/api/tags \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Migration Notes

### For Existing Code
If you have other parts of the codebase using `x-firebase-uid` header, they should be updated to use the same pattern:

```typescript
// Get Firebase ID token
const { auth } = await import('@/lib/firebase/firebaseConfig');
const idToken = await auth.currentUser?.getIdToken();

// Use in fetch
const response = await fetch('/api/endpoint', {
  headers: {
    'Authorization': `Bearer ${idToken}`
  }
});
```

### For New Features
Always use the `requireAuth` middleware for protected routes:

```typescript
import { requireAuth } from '@/middleware/auth';
import { withRateLimit } from '@/middleware/rateLimit';

export const GET = withRateLimit(requireAuth(async (
  request: NextRequest,
  context,
  user: User
) => {
  // user object is automatically available
  // user.id, user.firebaseUid, user.email, etc.
}), 'read');
```

## Related Files

- `src/app/api/tags/route.ts` - Main tags API
- `src/app/api/tags/[id]/route.ts` - Individual tag operations
- `src/lib/focus-utils.ts` - Frontend tag utilities
- `src/middleware/auth.ts` - Authentication middleware
- `src/schemas/tag.schema.ts` - Tag validation schemas

## Next Steps

Consider implementing:
- [ ] Tag color presets/palette
- [ ] Tag usage statistics
- [ ] Bulk tag operations
- [ ] Tag search/filtering
- [ ] Tag categories/groups


## Focus Sessions API

### GET /api/focus-sessions
**Description**: Get all focus sessions for authenticated user

**Authentication**: Required (Bearer token)

**Query Parameters**:
- `limit` (optional): Number of sessions to return (default: 50)
- `offset` (optional): Pagination offset (default: 0)
- `startDate` (optional): Filter by start date (ISO string)
- `endDate` (optional): Filter by end date (ISO string)
- `tagId` (optional): Filter by tag ID
- `taskId` (optional): Filter by task ID

**Response**:
```json
{
  "sessions": [
    {
      "id": "session_123",
      "duration": 25,
      "sessionType": "POMODORO",
      "focusScore": 85,
      "notes": "Great focus session",
      "startedAt": "2024-01-01T10:00:00Z",
      "completedAt": "2024-01-01T10:25:00Z",
      "taskId": "task_123",
      "tagId": "tag_123",
      "projectId": "project_123",
      "task": {
        "id": "task_123",
        "title": "Complete report",
        "status": "IN_PROGRESS"
      },
      "tag": {
        "id": "tag_123",
        "name": "Work",
        "color": "#FF5733"
      },
      "project": {
        "id": "project_123",
        "title": "Q4 Project",
        "color": "#3B82F6",
        "icon": "📊"
      }
    }
  ],
  "pagination": {
    "total": 100,
    "limit": 50,
    "offset": 0,
    "hasMore": true
  }
}
```

### POST /api/focus-sessions
**Description**: Create a new focus session

**Authentication**: Required (Bearer token)

**Request Body**:
```json
{
  "duration": 25,
  "sessionType": "POMODORO",
  "focusScore": 85,
  "notes": "Great session",
  "taskId": "task_123",
  "tagId": "tag_123",
  "projectId": "project_123",
  "startedAt": "2024-01-01T10:00:00Z",
  "completedAt": "2024-01-01T10:25:00Z"
}
```

**Response**: Created session object (201)

**Errors**:
- 400: Invalid task or project (doesn't exist or doesn't belong to user)
- 400: Invalid input data

## Summary of All Fixed Files

1. ✅ `src/app/api/tags/route.ts` - Tags list and creation
2. ✅ `src/app/api/tags/[id]/route.ts` - Individual tag operations
3. ✅ `src/app/api/focus-sessions/route.ts` - Focus sessions list and creation
4. ✅ `src/lib/focus-utils.ts` - Frontend authentication for all APIs

## Testing Both APIs

### Test Focus Sessions
```bash
# Get your Firebase ID token first (from browser console):
# await firebase.auth().currentUser.getIdToken()

# Fetch focus sessions
curl http://localhost:3000/api/focus-sessions \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Create a focus session
curl -X POST http://localhost:3000/api/focus-sessions \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "duration": 25,
    "sessionType": "POMODORO",
    "focusScore": 90,
    "notes": "Productive session"
  }'
```

## What's Fixed

✅ **Tags API**: Fully functional - create, read, update, delete
✅ **Focus Sessions API**: Fully functional - create and read with filters
✅ **Authentication**: All APIs use proper JWT tokens
✅ **User Experience**: No more error messages on analytics/focus pages
✅ **Data Persistence**: All data is saved to and loaded from the database

Users can now use the analytics and focus session pages without any errors! 🎉
