import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { User } from "@prisma/client";
import { requireAuth } from "@/middleware/auth";
import { withValidation } from "@/middleware/validation";
import { withRateLimit } from "@/middleware/rateLimit";
import { createTaskSchema } from "@/schemas/task.schema";
import { cache, CACHE_TTL, CACHE_PREFIX, generateCacheKey, invalidatePattern } from "@/lib/cache";

// GET /api/tasks - Get all tasks for the authenticated user
export const GET = withRateLimit(requireAuth(async (request: NextRequest, context, user: User) => {
  try {
    console.log("GET /api/tasks called");
    console.log("Getting tasks for user:", user.id);

    // Parse query parameters for filtering and pagination
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const projectId = url.searchParams.get('projectId');
    const limit = parseInt(url.searchParams.get('limit') || '100', 10);
    const offset = parseInt(url.searchParams.get('offset') || '0', 10);
    
    // Generate cache key based on user ID and query parameters
    const cacheKey = generateCacheKey(
      CACHE_PREFIX.TASKS,
      user.id,
      `status:${status || 'all'}`,
      `project:${projectId || 'all'}`,
      `limit:${limit}`,
      `offset:${offset}`
    );
    
    // Try to get from cache
    const cachedData = await cache.get<{
      tasks: any[];
      pagination: { limit: number; offset: number; hasMore: boolean };
    }>(cacheKey);
    
    if (cachedData) {
      console.log('Returning cached tasks');
      return NextResponse.json(cachedData);
    }
    
    // Build where clause
    const whereClause: any = { userId: user.id };
    if (status) {
      whereClause.status = status;
    }
    if (projectId) {
      whereClause.projectId = projectId;
    }

    // Optimized query with select to limit fields
    const tasks = await prisma.task.findMany({
      where: whereClause,
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        priority: true,
        estimatedMinutes: true,
        actualMinutes: true,
        dueDate: true,
        isRecurring: true,
        recurringPattern: true,
        order: true,
        tags: true,
        createdAt: true,
        updatedAt: true,
        completedAt: true,
        projectId: true,
        parentTaskId: true,
        project: {
          select: {
            id: true,
            title: true,
            color: true,
            icon: true
          }
        },
        _count: {
          select: {
            pomodoroLogs: true,
            subtasks: true
          }
        }
      },
      orderBy: [
        { status: "asc" }, // Pending tasks first
        { priority: "desc" }, // High priority first
        { dueDate: "asc" }, // Earliest due date first
        { createdAt: "desc" }, // Newest first
      ],
      take: limit,
      skip: offset
    });

    const responseData = {
      tasks,
      pagination: {
        limit,
        offset,
        hasMore: tasks.length === limit
      }
    };
    
    // Cache the response for 2 minutes
    await cache.set(cacheKey, responseData, CACHE_TTL.TASKS);

    console.log(`Found ${tasks.length} tasks for user`);
    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch tasks",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}), 'read');

// POST /api/tasks - Create a new task
export const POST = withRateLimit(requireAuth(
  withValidation(createTaskSchema, async (request: NextRequest, context, user: User, validatedData) => {
    try {
      console.log("POST /api/tasks called");
      console.log("Validated data:", validatedData);

      const {
        title,
        description,
        status,
        priority,
        estimatedMinutes,
        dueDate,
        isRecurring,
        recurringPattern,
        tags,
        projectId,
        parentTaskId
      } = validatedData;

      // Create the task
      const newTask = await prisma.task.create({
        data: {
          title,
          description: description || null,
          status,
          priority,
          estimatedMinutes: estimatedMinutes || null,
          dueDate: dueDate ? new Date(dueDate) : null,
          isRecurring,
          recurringPattern: recurringPattern || null,
          tags,
          projectId: projectId || null,
          parentTaskId: parentTaskId || null,
          userId: user.id
        },
      });

      // Invalidate tasks cache for this user
      await invalidatePattern(generateCacheKey(CACHE_PREFIX.TASKS, user.id, '*'));

      console.log("Task created successfully:", newTask.id);
      return NextResponse.json(newTask, { status: 201 });
    } catch (error) {
      console.error("Error creating task:", error);
      return NextResponse.json(
        {
          error: "Failed to create task",
          details: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500 }
      );
    }
  })
), 'write');
