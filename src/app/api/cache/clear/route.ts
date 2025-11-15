import { NextRequest, NextResponse } from 'next/server';
import { invalidatePattern } from '@/lib/cache';

/**
 * Cache clearing endpoint for development
 * This endpoint should be protected or disabled in production
 */
export async function POST(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'This endpoint is not available in production' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { pattern } = body;

    if (!pattern) {
      return NextResponse.json(
        { error: 'Pattern is required' },
        { status: 400 }
      );
    }

    // Clear cache for the specified pattern
    await invalidatePattern(pattern);

    return NextResponse.json({
      message: 'Cache cleared successfully',
      pattern
    });
  } catch (error) {
    console.error('Error clearing cache:', error);
    return NextResponse.json(
      {
        error: 'Failed to clear cache',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Clear all caches (use with caution!)
 */
export async function DELETE(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'This endpoint is not available in production' },
      { status: 403 }
    );
  }

  try {
    // Clear all cache patterns
    await invalidatePattern('*');

    return NextResponse.json({
      message: 'All caches cleared successfully'
    });
  } catch (error) {
    console.error('Error clearing all caches:', error);
    return NextResponse.json(
      {
        error: 'Failed to clear caches',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
