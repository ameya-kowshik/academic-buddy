import { NextRequest, NextResponse } from 'next/server';
import { User } from '@prisma/client';
import { requireAuth } from '@/middleware/auth';
import { withRateLimit } from '@/middleware/rateLimit';
import { aiService } from '@/lib/services/ai.service';
import { prisma } from '@/lib/prisma';

// POST /api/ai/analyze-weak-areas
// Body: { attemptId?: string }
// - With attemptId: analyzes that attempt's wrong answers, saves result to DB, returns it
// - Without: legacy all-attempts analysis (not saved)
export const POST = withRateLimit(
  requireAuth(async (request: NextRequest, _context, user: User) => {
    try {
      const body = await request.json().catch(() => ({}));
      const { attemptId } = body;

      // --- Per-attempt analysis (saves to DB) ---
      if (attemptId) {
        const attempt = await prisma.quizAttempt.findFirst({
          where: { id: attemptId, quiz: { userId: user.id } },
          include: {
            questionAttempts: {
              where: { isCorrect: false },
              include: {
                quizQuestion: {
                  select: { questionText: true, correctAnswer: true, explanation: true },
                },
              },
            },
          },
        });

        if (!attempt) {
          return NextResponse.json({ error: 'Attempt not found' }, { status: 404 });
        }

        // If analysis already exists, return it without re-running
        if (attempt.weakAreaAnalysis) {
          return NextResponse.json({
            analysis: attempt.weakAreaAnalysis,
            cached: true,
          });
        }

        if (attempt.questionAttempts.length === 0) {
          const analysis = { weakTopics: [], weakDifficulties: [], recommendations: ['Perfect score! No weak areas detected.'] };
          await prisma.$executeRaw`UPDATE quiz_attempts SET "weakAreaAnalysis" = ${JSON.stringify(analysis)}::jsonb WHERE id = ${attemptId}`;
          return NextResponse.json({ analysis, cached: false });
        }

        const wrongQuestions = attempt.questionAttempts.map((qa) => ({
          questionText: qa.quizQuestion.questionText,
          selectedAnswer: qa.selectedAnswer,
          correctAnswer: qa.quizQuestion.correctAnswer,
          explanation: qa.quizQuestion.explanation || '',
        }));

        const analysis = await aiService.analyzeAttemptWeakAreas(wrongQuestions);

        // Persist so it never needs to be re-generated
        await prisma.$executeRaw`UPDATE quiz_attempts SET "weakAreaAnalysis" = ${JSON.stringify(analysis)}::jsonb WHERE id = ${attemptId}`;

        return NextResponse.json({ analysis, cached: false });
      }

      // --- Legacy all-attempts analysis ---
      const attempts = await prisma.quizAttempt.findMany({
        where: { quiz: { userId: user.id } },
        include: { quiz: { select: { grouping: true, difficulty: true } } },
        orderBy: { startedAt: 'desc' },
      });

      if (attempts.length === 0) {
        return NextResponse.json({ error: 'No quiz attempts found. Complete some quizzes first.' }, { status: 400 });
      }

      const analysis = await aiService.analyzeWeakAreas(attempts);
      return NextResponse.json({ analysis, attemptCount: attempts.length });
    } catch (error) {
      console.error('Error analyzing weak areas:', error);
      if (error instanceof Error && error.message.includes('AI service is not configured')) {
        return NextResponse.json({ error: 'AI service is not available.' }, { status: 503 });
      }
      return NextResponse.json(
        { error: 'Failed to analyze weak areas', details: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      );
    }
  }),
  'read'
);
