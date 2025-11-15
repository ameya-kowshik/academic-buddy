import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { User } from '@prisma/client';
import { requireAuth } from '@/middleware/auth';
import { withValidation } from '@/middleware/validation';
import { withRateLimit } from '@/middleware/rateLimit';
import { createTagSchema } from '@/schemas/tag.schema';

// GET /api/tags - Get all tags for the authenticated user
export const GET = withRateLimit(requireAuth(async (request: NextRequest, context, user: User) => {
  try {
    console.log('GET /api/tags called');
    console.log('Getting tags for user:', user.id);

    // Fetch tags with usage count
    const tags = await prisma.tag.findMany({
      where: { userId: user.id },
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
      },
      orderBy: { name: 'asc' }
    });

    console.log(`Found ${tags.length} tags for user`);
    return NextResponse.json(tags);

  } catch (error) {
    console.error('Error fetching tags:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch tags',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}), 'read');

// POST /api/tags - Create a new tag
export const POST = withRateLimit(requireAuth(
  withValidation(createTagSchema, async (request: NextRequest, context, user: User, validatedData) => {
    try {
      console.log('POST /api/tags called');
      console.log('Validated data:', validatedData);

      const { name, color } = validatedData;

      // Check if tag with same name already exists for this user
      const existingTag = await prisma.tag.findFirst({
        where: {
          userId: user.id,
          name: name
        }
      });

      if (existingTag) {
        return NextResponse.json(
          { error: 'A tag with this name already exists' },
          { status: 409 }
        );
      }

      // Create the tag
      const newTag = await prisma.tag.create({
        data: {
          name,
          color: color.toUpperCase(),
          userId: user.id
        },
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

      console.log('Tag created successfully:', newTag.id);
      return NextResponse.json(newTag, { status: 201 });

    } catch (error) {
      console.error('Error creating tag:', error);
      return NextResponse.json(
        { 
          error: 'Failed to create tag',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
    }
  })
), 'write');