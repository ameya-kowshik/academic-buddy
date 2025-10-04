import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Helper function to get authenticated user from Firebase UID
async function getAuthenticatedUser(request: NextRequest) {
  try {
    // Get Firebase UID from request headers (set by client after Firebase auth)
    const firebaseUid = request.headers.get('x-firebase-uid');
    
    if (!firebaseUid) {
      return null;
    }

    // Find user in database by Firebase UID
    const user = await prisma.user.findUnique({
      where: { firebaseUid }
    });

    return user;
  } catch (error) {
    console.error('Auth verification error:', error);
    return null;
  }
}

// Helper function to verify task ownership
async function verifyTaskOwnership(taskId: string, userId: string) {
  const task = await prisma.task.findUnique({
    where: { id: taskId }
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
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('GET /api/tasks/[id] called for task:', params.id);

    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    const { task, error } = await verifyTaskOwnership(params.id, user.id);
    if (error) {
      return NextResponse.json(
        { error },
        { status: error.includes('not found') ? 404 : 403 }
      );
    }

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
}

// PUT /api/tasks/[id] - Update task
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('PUT /api/tasks/[id] called for task:', params.id);

    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    const { task, error } = await verifyTaskOwnership(params.id, user.id);
    if (error) {
      return NextResponse.json(
        { error },
        { status: error.includes('not found') ? 404 : 403 }
      );
    }

    const body = await request.json();
    console.log('Update data:', body);

    const { title, description, priority, status, dueDate, tags, isRecurring, recurringPattern } = body;

    // Validation
    if (title !== undefined && (!title || title.trim().length === 0)) {
      return NextResponse.json(
        { error: 'Task title cannot be empty' },
        { status: 400 }
      );
    }

    // Prepare update data (only include fields that are provided)
    const updateData: any = {};
    
    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (priority !== undefined) updateData.priority = priority;
    if (status !== undefined) {
      updateData.status = status;
      // Set completedAt when marking as completed
      if (status === 'COMPLETED') {
        updateData.completedAt = new Date();
      } else if (task?.status === 'COMPLETED' && status !== 'COMPLETED') {
        // Clear completedAt if unmarking as completed
        updateData.completedAt = null;
      }
    }
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
    if (tags !== undefined) updateData.tags = tags;
    if (isRecurring !== undefined) updateData.isRecurring = isRecurring;
    if (recurringPattern !== undefined) updateData.recurringPattern = recurringPattern;

    const updatedTask = await prisma.task.update({
      where: { id: params.id },
      data: updateData
    });

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
}

// DELETE /api/tasks/[id] - Delete task
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('DELETE /api/tasks/[id] called for task:', params.id);

    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

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
}