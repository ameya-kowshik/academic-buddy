import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { User } from '@prisma/client';
import { requireAuth } from '@/middleware/auth';
import { withRateLimit } from '@/middleware/rateLimit';

// Helper function to verify tag ownership
async function verifyTagOwnership(tagId: string, userId: string) {
  const tag = await prisma.tag.findUnique({
    where: { id: tagId },
    select: {
      id: true,
      userId: true,
      name: true,
      color: true
    }
  });

  if (!tag) {
    return { tag: null, error: 'Tag not found' };
  }

  if (tag.userId !== userId) {
    return { tag: null, error: 'Unauthorized - Tag belongs to another user' };
  }

  return { tag, error: null };
}

// GET /api/tags/[id] - Get specific tag
export const GET = withRateLimit(requireAuth(async (
  request: NextRequest,
  context: { params?: { id: string } },
  user: User
) => {
  const params = context.params!;
  try {
    console.log('GET /api/tags/[id] called for tag:', params.id);

    const { error } = await verifyTagOwnership(params.id, user.id);
    if (error) {
      return NextResponse.json(
        { error },
        { status: error.includes('not found') ? 404 : 403 }
      );
    }

    // Fetch full tag data with usage count
    const fullTag = await prisma.tag.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        color: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            pomodoroLogs: true
          }
        }
      }
    });

    return NextResponse.json(fullTag);

  } catch (error) {
    console.error('Error fetching tag:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch tag',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}), 'read');

// PUT /api/tags/[id] - Update tag
export const PUT = withRateLimit(requireAuth(async (
  request: NextRequest,
  context: { params?: { id: string } },
  user: User
) => {
  const params = context.params!;
  try {
    console.log('PUT /api/tags/[id] called for tag:', params.id);

    const { error } = await verifyTagOwnership(params.id, user.id);
    if (error) {
      return NextResponse.json(
        { error },
        { status: error.includes('not found') ? 404 : 403 }
      );
    }

    const body = await request.json();
    console.log('Update data:', body);

    const { name, color } = body;

    // Validation
    if (name !== undefined && (!name || name.trim().length === 0)) {
      return NextResponse.json(
        { error: 'Tag name cannot be empty' },
        { status: 400 }
      );
    }

    if (color !== undefined && (!color || !color.match(/^#[0-9A-F]{6}$/i))) {
      return NextResponse.json(
        { error: 'Valid hex color is required (e.g., #FF5733)' },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: { name?: string; color?: string } = {};
    if (name !== undefined) updateData.name = name.trim();
    if (color !== undefined) updateData.color = color.toUpperCase();

    // Update the tag
    const updatedTag = await prisma.tag.update({
      where: { id: params.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        color: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            pomodoroLogs: true
          }
        }
      }
    });

    console.log('Tag updated successfully:', updatedTag.id);
    return NextResponse.json(updatedTag);

  } catch (error) {
    console.error('Error updating tag:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update tag',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}), 'write');

// DELETE /api/tags/[id] - Delete tag
export const DELETE = withRateLimit(requireAuth(async (
  request: NextRequest,
  context: { params?: { id: string } },
  user: User
) => {
  const params = context.params!;
  try {
    console.log('DELETE /api/tags/[id] called for tag:', params.id);

    const { error } = await verifyTagOwnership(params.id, user.id);
    if (error) {
      return NextResponse.json(
        { error },
        { status: error.includes('not found') ? 404 : 403 }
      );
    }

    // Delete the tag
    await prisma.tag.delete({
      where: { id: params.id }
    });

    console.log('Tag deleted successfully:', params.id);
    return NextResponse.json(
      { message: 'Tag deleted successfully' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error deleting tag:', error);
    return NextResponse.json(
      { 
        error: 'Failed to delete tag',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}), 'write');
