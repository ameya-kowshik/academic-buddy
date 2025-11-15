# Project Feature Removal Guide

## Overview
This guide helps you safely remove project management features and transform the app into a focused productivity tool.

---

## Phase 1: Preparation (Do First!)

### 1.1 Backup Everything
```bash
# Backup database
pg_dump $DATABASE_URL > backup_before_removal.sql

# Commit all current changes
git add .
git commit -m "Backup before project removal"
git push

# Create a new branch
git checkout -b remove-projects
```

### 1.2 Clear Cache
```bash
# Clear Redis cache to avoid stale data
curl -X DELETE http://localhost:3000/api/cache/clear
```

---

## Phase 2: Remove UI Components

### 2.1 Delete Project Pages
```bash
# Remove project pages
rm -rf src/app/projects

# Remove project components
rm -rf src/components/projects
```

### 2.2 Update Navigation
Files to update:
- `src/components/layout/Sidebar.tsx` - Remove "Projects" link
- `src/components/layout/Navbar.tsx` - Remove project navigation
- `src/app/layout.tsx` - Update any project-related metadata

### 2.3 Update Home/Dashboard
- `src/app/page.tsx` - Remove project widgets/cards
- Focus on: Tasks, Focus Sessions, Analytics

---

## Phase 3: Remove API Routes

### 3.1 Delete Project API Routes
```bash
# Remove project API routes
rm -rf src/app/api/projects
```

### 3.2 Keep These APIs
- ✅ `/api/tasks` - Core feature
- ✅ `/api/tasks/[id]` - Task operations
- ✅ `/api/focus-sessions` - Core feature
- ✅ `/api/tags` - Organization
- ✅ `/api/tags/[id]` - Tag operations
- ✅ `/api/health` - Monitoring
- ✅ `/api/metrics` - Monitoring
- ✅ `/api/cache/clear` - Development tool

---

## Phase 4: Update Database Schema

### 4.1 Create Migration
Create `prisma/migrations/XXX_make_projectId_optional/migration.sql`:

```sql
-- Make projectId optional in Task table
ALTER TABLE "Task" ALTER COLUMN "projectId" DROP NOT NULL;

-- Make projectId optional in PomodoroLog table (keep for historical data)
ALTER TABLE "PomodoroLog" ALTER COLUMN "projectId" DROP NOT NULL;

-- Add index for tasks without projects
CREATE INDEX "Task_userId_projectId_null_idx" ON "Task"("userId") WHERE "projectId" IS NULL;

-- Optional: If you want to completely remove projects later
-- (Don't run this yet - keep for historical data)
-- DROP TABLE "Project" CASCADE;
```

### 4.2 Update Prisma Schema
Edit `prisma/schema.prisma`:

```prisma
model Task {
  id                String    @id @default(cuid())
  title             String
  description       String?
  status            TaskStatus @default(TODO)
  priority          TaskPriority @default(MEDIUM)
  estimatedMinutes  Int?
  actualMinutes     Int       @default(0)
  dueDate           DateTime?
  isRecurring       Boolean   @default(false)
  recurringPattern  String?
  order             Int       @default(0)
  tags              String[]  @default([])
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  completedAt       DateTime?
  
  // Make projectId optional
  projectId         String?   // Changed from String to String?
  project           Project?  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  
  parentTaskId      String?
  parentTask        Task?     @relation("TaskSubtasks", fields: [parentTaskId], references: [id], onDelete: Cascade)
  subtasks          Task[]    @relation("TaskSubtasks")
  
  userId            String
  user              User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  pomodoroLogs      PomodoroLog[]

  @@index([userId, status])
  @@index([userId, projectId])
  @@index([projectId, order])
  @@index([parentTaskId])
}

// Keep Project model for now (for historical data)
// You can remove it later after data migration
model Project {
  id              String    @id @default(cuid())
  title           String
  description     String?
  status          ProjectStatus @default(PLANNING)
  priority        ProjectPriority @default(MEDIUM)
  startDate       DateTime?
  dueDate         DateTime?
  estimatedHours  Int?
  actualHours     Int       @default(0)
  color           String    @default("#3B82F6")
  icon            String?
  isArchived      Boolean   @default(false)
  completedAt     DateTime?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  userId          String
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  tasks           Task[]
  pomodoroLogs    PomodoroLog[]

  @@index([userId, createdAt])
  @@index([userId, status])
}
```

### 4.3 Run Migration
```bash
# Generate migration
npx prisma migrate dev --name make_projectId_optional

# Apply to database
npx prisma migrate deploy
```

---

## Phase 5: Remove Frontend Code

### 5.1 Delete Hooks
```bash
# Remove project hook
rm src/hooks/useProjects.ts
```

### 5.2 Update Task Hook
Edit `src/hooks/useTasks.ts` - Remove any project-related logic

### 5.3 Update Types
Edit shared type files to remove Project interface imports

---

## Phase 6: Update Caching

### 6.1 Update Cache Configuration
Edit `src/lib/cache.ts`:

```typescript
// Remove PROJECTS from CACHE_PREFIX
export const CACHE_PREFIX = {
  USER: 'user',
  // PROJECTS: 'projects', // REMOVED
  TASKS: 'tasks',
  ANALYTICS: 'analytics',
} as const;
```

### 6.2 Update Cache Invalidation
Remove project cache invalidation from:
- `src/app/api/tasks/route.ts`
- `src/app/api/tasks/[id]/route.ts`

Change from:
```typescript
await invalidatePattern(generateCacheKey(CACHE_PREFIX.PROJECTS, user.id, '*'));
```

To: (just remove that line)

---

## Phase 7: Clean Up Schemas

### 7.1 Delete Project Schema
```bash
rm src/schemas/project.schema.ts
```

### 7.2 Update Task Schema
Edit `src/schemas/task.schema.ts` - Make projectId optional:

```typescript
export const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(1000).optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE', 'CANCELLED']).default('TODO'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  estimatedMinutes: z.number().int().positive().optional(),
  dueDate: z.string().datetime().optional(),
  isRecurring: z.boolean().default(false),
  recurringPattern: z.string().optional(),
  tags: z.array(z.string()).default([]),
  projectId: z.string().optional(), // Made optional
  parentTaskId: z.string().optional(),
  order: z.number().int().default(0),
});
```

---

## Phase 8: Testing

### 8.1 Test Core Features
```bash
# Start dev server
npm run dev

# Test these features:
# 1. Create task (without project)
# 2. Update task
# 3. Delete task
# 4. Create focus session
# 5. View analytics
# 6. Create/manage tags
```

### 8.2 Check for Errors
- Open browser console - should see no errors
- Check server logs - should see no project-related errors
- Test all pages - should load without issues

### 8.3 Clear Cache Again
```bash
curl -X DELETE http://localhost:3000/api/cache/clear
```

---

## Phase 9: Documentation Updates

### 9.1 Update README
- Remove project management from features list
- Update screenshots (no projects)
- Update architecture diagram
- Focus on: Tasks, Focus Sessions, Analytics

### 9.2 Update API Documentation
- Remove project API endpoints
- Update task API docs (projectId is optional)

---

## Phase 10: Commit Changes

```bash
# Add all changes
git add .

# Commit with descriptive message
git commit -m "Remove project management features - focus on productivity

- Removed project pages and components
- Removed project API routes
- Made projectId optional in database
- Updated caching strategy
- Simplified navigation
- Enhanced focus on tasks and focus sessions"

# Push to remote
git push origin remove-projects

# Create pull request for review
```

---

## Rollback Plan (If Needed)

If something goes wrong:

```bash
# Restore database from backup
psql $DATABASE_URL < backup_before_removal.sql

# Revert code changes
git checkout main
git branch -D remove-projects

# Clear cache
curl -X DELETE http://localhost:3000/api/cache/clear
```

---

## Post-Removal Enhancements

After successful removal, enhance remaining features:

### 1. Smart Task Lists
- Add "Today" view
- Add "This Week" view
- Add "Important" view
- Add "Overdue" view

### 2. Enhanced Tags
- Add tag colors
- Add tag icons
- Show task count per tag
- Add tag-based analytics

### 3. Better Task Organization
- Improve subtask UI
- Add task templates
- Add task search
- Add saved filters

---

## Verification Checklist

Before considering removal complete:

- [ ] All project pages deleted
- [ ] All project components deleted
- [ ] All project API routes deleted
- [ ] Database migration successful
- [ ] No project-related errors in console
- [ ] Tasks work without projects
- [ ] Focus sessions work
- [ ] Tags work
- [ ] Analytics work
- [ ] Cache cleared
- [ ] Documentation updated
- [ ] Code committed and pushed
- [ ] Tests pass (if you have tests)

---

## Benefits After Removal

✅ **Simpler codebase** - 30% less code
✅ **Faster performance** - Fewer database queries
✅ **Clearer focus** - Productivity, not project management
✅ **Easier maintenance** - Less complexity
✅ **Better UX** - Simpler for users to understand
✅ **Mobile-ready** - Easier to adapt to mobile

---

## Need Help?

If you encounter issues during removal:
1. Check the rollback plan above
2. Review error logs carefully
3. Test one feature at a time
4. Clear cache between tests
5. Ask for help if stuck!

Good luck with the transformation! 🚀
