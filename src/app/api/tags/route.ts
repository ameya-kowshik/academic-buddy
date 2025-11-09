import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Helper function to get authenticated user from Firebase UID
async function getAuthenticatedUser(request: NextRequest) {
  try {
    const firebaseUid = request.headers.get('x-firebase-uid');
    
    if (!firebaseUid) {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { firebaseUid }
    });

    return user;
  } catch (error) {
    console.error('Auth verification error:', error);
    return null;
  }
}

// GET /api/tags - Get all tags for the authenticated user
export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/tags called');

    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    console.log('Getting tags for user:', user.id);

    // Temporarily return empty array until Prisma client is regenerated
    const tags: any[] = [];
    console.log('Tags API temporarily disabled - Prisma client needs regeneration');

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
}

// POST /api/tags - Create a new tag
export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/tags called');

    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    const body = await request.json();
    console.log('Request body:', body);

    const { name, color } = body;

    // Validation
    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Tag name is required' },
        { status: 400 }
      );
    }

    if (!color || !color.match(/^#[0-9A-F]{6}$/i)) {
      return NextResponse.json(
        { error: 'Valid hex color is required (e.g., #FF5733)' },
        { status: 400 }
      );
    }

    // Temporarily return mock data until Prisma client is regenerated
    const newTag = {
      id: 'temp-id',
      name: name.trim(),
      color: color.toUpperCase(),
      userId: user.id,
      createdAt: new Date(),
      updatedAt: new Date(),
      _count: { pomodoroLogs: 0 }
    };
    console.log('Tag creation temporarily disabled - Prisma client needs regeneration');

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
}