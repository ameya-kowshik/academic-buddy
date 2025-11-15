import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { User } from '@prisma/client';
import { requireAuth } from '@/middleware/auth';
import { withValidation } from '@/middleware/validation';
import { withRateLimit } from '@/middleware/rateLimit';
import { updateTaskSchema } from '@/schemas/task.schema';
import { invalidatePattern, CACHE_PREFIX, generateCacheKey } from '@/lib/cache';

// Helper function to verify task ownership (lightweight check)
async function verifyTaskOwnership(taskId: string, userId: string) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: {
      id: true,
      userId: true,
      status: true
    }
  });

  if (!task) {
    return { task: null, error: 'Task not found' };
  }

  if (task.userId !== userId) {
    return { task: null, error: 'Unauthorized - Task belongs to another user' };
  }

  return { task, error: null };
}

// GET /api/tasks/[id] - Get specific task
export const GET = withRateLimit(requireAuth(async (
  request: NextRequest,
  context: { params?: { id: string } },
  user: User
) => {
  const params = context.params!;
  try {
    console.log('GET /api/tasks/[id] called for task:', params.id);

    // First verify ownership with lightweight query
    const { error } = await verifyTaskOwnership(params.id, user.id);
    if (error) {
      return NextResponse.json(
        { error },
        { status: error.includes('not found') ? 404 : 403 }
      );
    }

    // Fetch full task data with optimized select
    const task = await prisma.task.findUnique({
      where: { id: params.id },
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
        subtasks: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            order: true
          },
          orderBy: {
            order: 'asc'
          }
        },
        _count: {
          select: {
            pomodoroLogs: true,
            subtasks: true
          }
        }
      }
    });

    console.log('Task found:', task?.id);
    return NextResponse.json(task);

  } catch (error) {
    console.error('Error fetching task:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch task',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}), 'read');

// PUT /api/tasks/[id] - Update task
export const PUT = withRateLimit(requireAuth(
  withValidation(updateTaskSchema, async (
    request: NextRequest,
    context: { params?: { id: string } },
    user: User,
    validatedData
  ) => {
    const params = context.params!;
    try {
      console.log('PUT /api/tasks/[id] called for task:', params.id);

      const { task, error } = await verifyTaskOwnership(params.id, user.id);
      if (error) {
        return NextResponse.json(
          { error },
          { status: error.includes('not found') ? 404 : 403 }
        );
      }

      console.log('Validated update data:', validatedData);

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
        parentTaskId,
        order
      } = validatedData;

      // Prepare update data (only include fields that are provided)
      const updateData: any = {};
      
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description || null;
      if (priority !== undefined) updateData.priority = priority;
      if (estimatedMinutes !== undefined) updateData.estimatedMinutes = estimatedMinutes || null;
      if (status !== undefined) {
        updateData.status = status;
        // Set completedAt when marking as completed
        if (status === 'DONE') {
          updateData.completedAt = new Date();
        } else if (task && task.status === 'DONE') {
          // Clear completedAt if unmarking as completed
          updateData.completedAt = null;
        }
      }
      if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
      if (tags !== undefined) updateData.tags = tags;
      if (isRecurring !== undefined) updateData.isRecurring = isRecurring;
      if (recurringPattern !== undefined) updateData.recurringPattern = recurringPattern;
      if (projectId !== undefined) updateData.projectId = projectId;
      if (parentTaskId !== undefined) updateData.parentTaskId = parentTaskId;
      if (order !== undefined) updateData.order = order;

      const updatedTask = await prisma.task.update({
        where: { id: params.id },
        data: updateData
      });

      // Invalidate tasks cache for this user
      await invalidatePattern(generateCacheKey(CACHE_PREFIX.TASKS, user.id, '*'));
      // Also invalidate projects cache since it includes task counts
      await invalidatePattern(generateCacheKey(CACHE_PREFIX.PROJECTS, user.id, '*'));

      console.log('Task updated successfully:', updatedTask.id);
      return NextResponse.json(updatedTask);

    } catch (error) {
      console.error('Error updating task:', error);
      return NextResponse.json(
        { 
          error: 'Failed to update task',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
    }
  })
), 'write');

// DELETE /api/tasks/[id] - Delete task
export const DELETE = withRateLimit(requireAuth(async (
  request: NextRequest,
  context: { params?: { id: string } },
  user: User
) => {
  const params = context.params!;
  try {
    console.log('DELETE /api/tasks/[id] called for task:', params.id);

    const { task, error } = await verifyTaskOwnership(params.id, user.id);
    if (error) {
      return NextResponse.json(
        { error },
        { status: error.includes('not found') ? 404 : 403 }
      );
    }

    await prisma.task.delete({
      where: { id: params.id }
    });

    // Invalidate tasks cache for this user
    await invalidatePattern(generateCacheKey(CACHE_PREFIX.TASKS, user.id, '*'));
    // Also invalidate projects cache since it includes task counts
    await invalidatePattern(generateCacheKey(CACHE_PREFIX.PROJECTS, user.id, '*'));

    console.log('Task deleted successfully:', params.id);
    return NextResponse.json(
      { message: 'Task deleted successfully' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json(
      { 
        error: 'Failed to delete task',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}), 'write');