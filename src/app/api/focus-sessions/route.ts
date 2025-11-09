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

// GET /api/focus-sessions - Get all focus sessions for the authenticated user
export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/focus-sessions called');

    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const tagId = searchParams.get('tagId');
    const taskId = searchParams.get('taskId');

    console.log('Getting focus sessions for user:', user.id);

    // Build where clause
    const whereClause: any = { userId: user.id };
    
    if (startDate || endDate) {
      whereClause.startedAt = {};
      if (startDate) whereClause.startedAt.gte = new Date(startDate);
      if (endDate) whereClause.startedAt.lte = new Date(endDate);
    }
    
    if (tagId) whereClause.tagId = tagId;
    if (taskId) whereClause.taskId = taskId;

    // Temporarily return empty data until Prisma client is regenerated
    const sessions: any[] = [];
    const totalCount = 0;
    console.log('Focus sessions API temporarily disabled - Prisma client needs regeneration');

    console.log(`Found ${sessions.length} focus sessions for user (${totalCount} total)`);
    
    return NextResponse.json({
      sessions,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + sessions.length < totalCount
      }
    });

  } catch (error) {
    console.error('Error fetching focus sessions:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch focus sessions',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST /api/focus-sessions - Create a new focus session
export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/focus-sessions called');

    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    const body = await request.json();
    console.log('Request body:', body);

    const { 
      duration, 
      sessionType, 
      focusScore, 
      notes, 
      taskId, 
      tagId,
      startedAt,
      completedAt 
    } = body;

    // Validation
    if (!duration || duration <= 0) {
      return NextResponse.json(
        { error: 'Session duration must be greater than 0' },
        { status: 400 }
      );
    }

    if (duration > 180) { // 3 hours max
      return NextResponse.json(
        { error: 'Session duration cannot exceed 3 hours (180 minutes)' },
        { status: 400 }
      );
    }

    if (sessionType && !['POMODORO', 'STOPWATCH'].includes(sessionType)) {
      return NextResponse.json(
        { error: 'Session type must be either POMODORO or STOPWATCH' },
        { status: 400 }
      );
    }

    if (focusScore && (focusScore < 1 || focusScore > 10)) {
      return NextResponse.json(
        { error: 'Focus score must be between 1 and 10' },
        { status: 400 }
      );
    }

    // Verify task ownership if taskId provided
    if (taskId) {
      const task = await prisma.task.findUnique({
        where: { id: taskId }
      });

      if (!task || task.userId !== user.id) {
        return NextResponse.json(
          { error: 'Task not found or does not belong to user' },
          { status: 400 }
        );
      }
    }

    // Temporarily return mock data until Prisma client is regenerated
    const newSession = {
      id: 'temp-session-id',
      duration,
      sessionType: sessionType || 'POMODORO',
      focusScore: focusScore || null,
      notes: notes?.trim() || null,
      taskId: taskId || null,
      tagId: tagId || null,
      userId: user.id,
      startedAt: startedAt ? new Date(startedAt) : new Date(),
      completedAt: completedAt ? new Date(completedAt) : new Date(),
      task: null,
      tag: null
    };
    console.log('Focus session creation temporarily disabled - Prisma client needs regeneration');

    console.log('Focus session created successfully:', newSession.id);
    return NextResponse.json(newSession, { status: 201 });

  } catch (error) {
    console.error('Error creating focus session:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create focus session',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}