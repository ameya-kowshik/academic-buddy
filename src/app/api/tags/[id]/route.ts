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

// Helper function to verify tag ownership
async function verifyTagOwnership(tagId: string, userId: string) {
  // Temporarily return mock data until Prisma client is regenerated
  console.log('Tag ownership verification temporarily disabled - Prisma client needs regeneration');
  return { 
    tag: null, 
    error: 'Tag API temporarily disabled - Prisma client needs regeneration' 
  };
}

// GET /api/tags/[id] - Get specific tag
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('GET /api/tags/[id] called for tag:', params.id);

    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    const { tag, error } = await verifyTagOwnership(params.id, user.id);
    if (error) {
      return NextResponse.json(
        { error },
        { status: error.includes('not found') ? 404 : 403 }
      );
    }

    return NextResponse.json({ error: 'Tag API temporarily disabled' }, { status: 503 });

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
}

// PUT /api/tags/[id] - Update tag
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('PUT /api/tags/[id] called for tag:', params.id);

    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    const { tag, error } = await verifyTagOwnership(params.id, user.id);
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

    return NextResponse.json({ error: 'Tag API temporarily disabled' }, { status: 503 });

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
}

// DELETE /api/tags/[id] - Delete tag
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('DELETE /api/tags/[id] called for tag:', params.id);

    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    const { tag, error } = await verifyTagOwnership(params.id, user.id);
    if (error) {
      return NextResponse.json(
        { error },
        { status: error.includes('not found') ? 404 : 403 }
      );
    }

    return NextResponse.json({ error: 'Tag API temporarily disabled' }, { status: 503 });

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
}