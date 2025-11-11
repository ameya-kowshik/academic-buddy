import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// PUT /api/projects/tasks/[id] - Update task
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const firebaseUid = request.headers.get('x-firebase-uid');
    
    if (!firebaseUid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { firebaseUid }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const {
      title,
      description,
      status,
      priority,
      projectId,
      parentTaskId,
      estimatedMinutes,
      dueDate,
      tags,
      order
    } = body;

    // Verify task ownership
    const existingTask = await prisma.task.findFirst({
      where: {
        id: params.id,
        userId: user.id
      }
    });

    if (!existingTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const updateData: any = {};
    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (status !== undefined) updateData.status = status;
    if (priority !== undefined) updateData.priority = priority;
    if (projectId !== undefined) updateData.projectId = projectId || null;
    if (parentTaskId !== undefined) updateData.parentTaskId = parentTaskId || null;
    if (estimatedMinutes !== undefined) updateData.estimatedMinutes = estimatedMinutes ? parseInt(estimatedMinutes) : null;
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
    if (tags !== undefined) updateData.tags = Array.isArray(tags) ? tags : [];
    if (order !== undefined) updateData.order = order;

    // Set completion date if status changed to DONE
    if (status === 'DONE' && existingTask.status !== 'DONE') {
      updateData.completedAt = new Date();
    } else if (status !== 'DONE' && existingTask.status === 'DONE') {
      updateData.completedAt = null;
    }

    const task = await prisma.task.update({
      where: { id: params.id },
      data: updateData
    });

    return NextResponse.json(task);
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json(
      { error: 'Failed to update task' },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/tasks/[id] - Delete task
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const firebaseUid = request.headers.get('x-firebase-uid');
    
    if (!firebaseUid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { firebaseUid }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify task ownership
    const existingTask = await prisma.task.findFirst({
      where: {
        id: params.id,
        userId: user.id
      }
    });

    if (!existingTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Delete task (this will cascade to subtasks and focus sessions)
    await prisma.task.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json(
      { error: 'Failed to delete task' },
      { status: 500 }
    );
  }
}