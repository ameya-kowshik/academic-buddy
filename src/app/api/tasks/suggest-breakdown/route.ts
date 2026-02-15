import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/middleware/auth';
import { withRateLimit } from '@/middleware/rateLimit';
import { User } from '@prisma/client';
import { getTaskBreakdownAgent } from '@/lib/ai-agents/task-breakdown-agent';
import { ValidationError } from '@/lib/errors';

/**
 * POST /api/tasks/suggest-breakdown
 * Suggests subtasks for a complex task using AI
 */
export const POST = withRateLimit(
  requireAuth(async (request: NextRequest, context, user: User) => {
    try {
      const body = await request.json();
      const { title, description, estimatedMinutes } = body;

      if (!title) {
        throw new ValidationError('Task title is required');
      }

      // Check if API key is configured
      if (!process.env.GEMINI_API_KEY) {
        return NextResponse.json(
          {
            error: 'AI features are not configured',
            message: 'GEMINI_API_KEY is not set',
          },
          { status: 503 }
        );
      }

      const agent = getTaskBreakdownAgent();

      // Check if task should be broken down
      if (!agent.shouldBreakdown(title, estimatedMinutes)) {
        return NextResponse.json({
          shouldBreakdown: false,
          message: 'Task is simple enough to complete as-is',
          subtasks: [],
        });
      }

      // Generate breakdown
      const breakdown = await agent.breakdownTask(
        title,
        description,
        estimatedMinutes
      );

      return NextResponse.json({
        shouldBreakdown: true,
        subtasks: breakdown.subtasks,
        reasoning: breakdown.reasoning,
      });
    } catch (error) {
      console.error('Error generating task breakdown:', error);

      if (error instanceof ValidationError) {
        return NextResponse.json(
          { error: error.message },
          { status: error.statusCode }
        );
      }

      return NextResponse.json(
        {
          error: 'Failed to generate task breakdown',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      );
    }
  }),
  'write' // Uses write quota since it's an AI operation
);
