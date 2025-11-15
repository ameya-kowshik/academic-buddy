import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, User } from '@prisma/client';
import { requireAuth } from '@/middleware/auth';
import { withRateLimit } from '@/middleware/rateLimit';

const prisma = new PrismaClient();

// GET /api/projects/tasks - Get all tasks for user
export const GET = withRateLimit(requireAuth(async (request: NextRequest, context, user: User) => {
  try {
    // Get tasks with project relations
    const tasks = await prisma.task.findMany({
      where: { userId: user.id },
      include: {
        project: true,
        subtasks: true,
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
      ]
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    );
  }
}), 'read');

// POST /api/projects/tasks - Create new task
export const POST = withRateLimit(requireAuth(async (request: NextRequest, context, user: User) => {
  try {
    const body = await request.json();
    const {
      title,
      description,
      status = 'TODO',
      priority = 'MEDIUM',
      projectId,
      parentTaskId,
      estimatedMinutes,
      dueDate,
      tags = [],
      order = 0
    } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    // Create task using existing Task model
    const task = await prisma.task.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        status: status, // Use the status directly as it should match TaskStatus enum
        priority,
        projectId: projectId || null,
        parentTaskId: parentTaskId || null,
        estimatedMinutes: estimatedMinutes || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        tags: Array.isArray(tags) ? tags : [],
        order,
        userId: user.id
      }
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    );
  }
}), 'write');