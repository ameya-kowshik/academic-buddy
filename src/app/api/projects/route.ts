import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, User } from '@prisma/client';
import { requireAuth } from '@/middleware/auth';
import { withValidation } from '@/middleware/validation';
import { withRateLimit } from '@/middleware/rateLimit';
import { createProjectSchema } from '@/schemas/project.schema';
import { cache, CACHE_TTL, CACHE_PREFIX, generateCacheKey, invalidatePattern } from '@/lib/cache';

const prisma = new PrismaClient();

// GET /api/projects - Fetch all projects and tasks for user
export const GET = withRateLimit(requireAuth(async (request: NextRequest, context, user: User) => {
  try {
    // Parse query parameters for pagination
    const url = new URL(request.url);
    const includeArchived = url.searchParams.get('includeArchived') === 'true';
    const limit = parseInt(url.searchParams.get('limit') || '100', 10);
    const offset = parseInt(url.searchParams.get('offset') || '0', 10);
    
    // Generate cache key based on user ID and query parameters
    const cacheKey = generateCacheKey(
      CACHE_PREFIX.PROJECTS,
      user.id,
      `archived:${includeArchived}`,
      `limit:${limit}`,
      `offset:${offset}`
    );
    
    // Try to get from cache
    const cachedData = await cache.get<{
      projects: any[];
      tasks: any[];
      pagination: { limit: number; offset: number; hasMore: boolean };
    }>(cacheKey);
    
    if (cachedData) {
      return NextResponse.json(cachedData);
    }
    
    // Build where clause
    const whereClause: any = { userId: user.id };
    if (!includeArchived) {
      whereClause.isArchived = false;
    }
    
    // Fetch projects with optimized query - only load necessary fields
    const projects = await prisma.project.findMany({
      where: whereClause,
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        priority: true,
        startDate: true,
        dueDate: true,
        estimatedHours: true,
        actualHours: true,
        color: true,
        icon: true,
        isArchived: true,
        completedAt: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            tasks: true,
            pomodoroLogs: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    });
    
    // Fetch tasks with optimized query - only load necessary fields
    const tasks = await prisma.task.findMany({
      where: { userId: user.id },
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
        { order: 'asc' },
        { createdAt: 'desc' }
      ],
      take: limit,
      skip: offset
    });

    const responseData = {
      projects, 
      tasks,
      pagination: {
        limit,
        offset,
        hasMore: projects.length === limit || tasks.length === limit
      }
    };
    
    // Cache the response for 2 minutes
    await cache.set(cacheKey, responseData, CACHE_TTL.PROJECTS);

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}), 'read');

// POST /api/projects - Create new project
export const POST = withRateLimit(requireAuth(
  withValidation(createProjectSchema, async (request: NextRequest, context, user: User, validatedData) => {
    try {
      const {
        title,
        description,
        status,
        priority,
        startDate,
        dueDate,
        estimatedHours,
        color,
        icon
      } = validatedData;

      // Create project using Prisma
      const project = await prisma.project.create({
        data: {
          title,
          description: description || null,
          status,
          priority,
          startDate: startDate ? new Date(startDate) : null,
          dueDate: dueDate ? new Date(dueDate) : null,
          estimatedHours: estimatedHours || null,
          color,
          icon: icon || null,
          userId: user.id
        },
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          priority: true,
          startDate: true,
          dueDate: true,
          estimatedHours: true,
          actualHours: true,
          color: true,
          icon: true,
          isArchived: true,
          completedAt: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              tasks: true,
              pomodoroLogs: true
            }
          }
        }
      });

      // Invalidate projects cache for this user
      await invalidatePattern(generateCacheKey(CACHE_PREFIX.PROJECTS, user.id, '*'));

      return NextResponse.json(project, { status: 201 });
    } catch (error) {
      console.error('Error creating project:', error);
      return NextResponse.json(
        { error: 'Failed to create project' },
        { status: 500 }
      );
    }
  })
), 'write');