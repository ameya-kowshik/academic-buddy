import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// PUT /api/projects/[id] - Update project
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
      startDate,
      dueDate,
      estimatedHours,
      color,
      icon
    } = body;

    // Verify project ownership
    const existingProject = await prisma.project.findFirst({
      where: {
        id: params.id,
        userId: user.id
      }
    });

    if (!existingProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const updateData: any = {};
    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (status !== undefined) updateData.status = status;
    if (priority !== undefined) updateData.priority = priority;
    if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : null;
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
    if (estimatedHours !== undefined) updateData.estimatedHours = estimatedHours ? parseInt(estimatedHours) : null;
    if (color !== undefined) updateData.color = color;
    if (icon !== undefined) updateData.icon = icon;

    // Set completion date if status changed to COMPLETED
    if (status === 'COMPLETED' && existingProject.status !== 'COMPLETED') {
      updateData.completedAt = new Date();
    } else if (status !== 'COMPLETED' && existingProject.status === 'COMPLETED') {
      updateData.completedAt = null;
    }

    const project = await prisma.project.update({
      where: { id: params.id },
      data: updateData,
      include: {
        tasks: true,
        _count: {
          select: {
            tasks: true,
            pomodoroLogs: true
          }
        }
      }
    });

    return NextResponse.json(project);
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[id] - Delete project
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

    // Verify project ownership
    const existingProject = await prisma.project.findFirst({
      where: {
        id: params.id,
        userId: user.id
      }
    });

    if (!existingProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Delete project (this will cascade to tasks and focus sessions)
    await prisma.project.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    );
  }
}