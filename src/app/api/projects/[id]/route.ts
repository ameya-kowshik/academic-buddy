import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, User } from '@prisma/client';
import { requireAuth } from '@/middleware/auth';
import { withValidation } from '@/middleware/validation';
import { withRateLimit } from '@/middleware/rateLimit';
import { updateProjectSchema } from '@/schemas/project.schema';
import { invalidatePattern, CACHE_PREFIX, generateCacheKey } from '@/lib/cache';

const prisma = new PrismaClient();

// PUT /api/projects/[id] - Update project
export const PUT = withRateLimit(requireAuth(
  withValidation(updateProjectSchema, async (
    request: NextRequest,
    context: { params?: { id: string } },
    user: User,
    validatedData
  ) => {
    const params = context.params!;
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

      // Verify project ownership with lightweight query
      const existingProject = await prisma.project.findFirst({
        where: {
          id: params.id,
          userId: user.id
        },
        select: {
          id: true,
          status: true
        }
      });

      if (!existingProject) {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 });
      }

      const updateData: any = {};
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description || null;
      if (status !== undefined) updateData.status = status;
      if (priority !== undefined) updateData.priority = priority;
      if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : null;
      if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
      if (estimatedHours !== undefined) updateData.estimatedHours = estimatedHours || null;
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

      return NextResponse.json(project);
    } catch (error) {
      console.error('Error updating project:', error);
      return NextResponse.json(
        { error: 'Failed to update project' },
        { status: 500 }
      );
    }
  })
), 'write');

// DELETE /api/projects/[id] - Delete project
export const DELETE = withRateLimit(requireAuth(async (
  request: NextRequest,
  context: { params?: { id: string } },
  user: User
) => {
  const params = context.params!;
  try {
    // Verify project ownership with lightweight query
    const existingProject = await prisma.project.findFirst({
      where: {
        id: params.id,
        userId: user.id
      },
      select: {
        id: true
      }
    });

    if (!existingProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Delete project (this will cascade to tasks and focus sessions)
    await prisma.project.delete({
      where: { id: params.id }
    });

    // Invalidate projects cache for this user
    await invalidatePattern(generateCacheKey(CACHE_PREFIX.PROJECTS, user.id, '*'));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    );
  }
}), 'write');