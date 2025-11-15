import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { User } from '@prisma/client';
import { requireAuth } from '@/middleware/auth';
import { withValidation } from '@/middleware/validation';
import { withRateLimit } from '@/middleware/rateLimit';
import { createFocusSessionSchema } from '@/schemas/focus-session.schema';

// GET /api/focus-sessions - Get all focus sessions for the authenticated user
export const GET = withRateLimit(requireAuth(async (request: NextRequest, context, user: User) => {
  try {
    console.log('GET /api/focus-sessions called');

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

    // Get total count for pagination
    const totalCount = await prisma.pomodoroLog.count({
      where: whereClause
    });

    // Fetch focus sessions (pomodoroLogs) with related data
    const sessions = await prisma.pomodoroLog.findMany({
      where: whereClause,
      select: {
        id: true,
        duration: true,
        sessionType: true,
        focusScore: true,
        notes: true,
        startedAt: true,
        completedAt: true,
        taskId: true,
        tagId: true,
        projectId: true,
        task: {
          select: {
            id: true,
            title: true,
            status: true
          }
        },
        tag: {
          select: {
            id: true,
            name: true,
            color: true
          }
        },
        project: {
          select: {
            id: true,
            title: true,
            color: true,
            icon: true
          }
        }
      },
      orderBy: { startedAt: 'desc' },
      take: limit,
      skip: offset
    });

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
}), 'read');

// POST /api/focus-sessions - Create a new focus session
export const POST = withRateLimit(requireAuth(
  withValidation(createFocusSessionSchema, async (request: NextRequest, context, user: User, validatedData) => {
    try {
      console.log('POST /api/focus-sessions called');
      console.log('Validated data:', validatedData);

      const { 
        duration, 
        sessionType, 
        focusScore, 
        notes, 
        taskId, 
        tagId,
        projectId,
        startedAt,
        completedAt 
      } = validatedData;

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

      // Note: projectId is kept for historical data but project validation is removed
      // since project management features have been removed from the app

      // Create the focus session (pomodoroLog)
      const newSession = await prisma.pomodoroLog.create({
        data: {
          duration,
          sessionType,
          focusScore: focusScore || null,
          notes: notes || null,
          taskId: taskId || null,
          tagId: tagId || null,
          projectId: projectId || null,
          userId: user.id,
          startedAt: startedAt ? new Date(startedAt) : new Date(),
          completedAt: completedAt ? new Date(completedAt) : new Date()
        },
        select: {
          id: true,
          duration: true,
          sessionType: true,
          focusScore: true,
          notes: true,
          startedAt: true,
          completedAt: true,
          taskId: true,
          tagId: true,
          projectId: true,
          task: {
            select: {
              id: true,
              title: true,
              status: true
            }
          },
          tag: {
            select: {
              id: true,
              name: true,
              color: true
            }
          },
          project: {
            select: {
              id: true,
              title: true,
              color: true,
              icon: true
            }
          }
        }
      });

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
  })
), 'write');