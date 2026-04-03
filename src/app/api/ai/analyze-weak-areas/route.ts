import { NextRequest, NextResponse } from 'next/server';
import { User } from '@prisma/client';
import { requireAuth } from '@/middleware/auth';
import { withRateLimit } from '@/middleware/rateLimit';
import { aiService } from '@/lib/services/ai.service';
import { prisma } from '@/lib/prisma';

// POST /api/ai/analyze-weak-areas
// Body: { attemptId?: string } — if provided, analyzes that specific attempt's wrong answers
// Otherwise analyzes all attempts for the user (legacy behaviour)
export const POST = withRateLimit(
  requireAuth(async (request: NextRequest, _context, user: User) => {
    try {
      const body = await request.json().catch(() => ({}));
      const { attemptId } = body;

      // --- Per-attempt analysis ---
      if (attemptId) {
        const attempt = await prisma.quizAttempt.findFirst({
          where: { id: attemptId, quiz: { userId: user.id } },
          include: {
            questionAttempts: {
              where: { isCorrect: false },
              include: {
                quizQuestion: {
                  select: {
                    questionText: true,
                    correctAnswer: true,
                    explanation: true,
                  },
                },
              },
            },
          },
        });

        if (!attempt) {
          return NextResponse.json({ error: 'Attempt not found' }, { status: 404 });
        }

        if (attempt.questionAttempts.length === 0) {
          return NextResponse.json({
            analysis: { weakTopics: [], weakDifficulties: [], recommendations: ['Perfect score! No weak areas detected.'] },
            attemptCount: 0,
          });
        }

        const wrongQuestions = attempt.questionAttempts.map((qa) => ({
          questionText: qa.quizQuestion.questionText,
          selectedAnswer: qa.selectedAnswer,
          correctAnswer: qa.quizQuestion.correctAnswer,
          explanation: qa.quizQuestion.explanation || '',
        }));

        const analysis = await aiService.analyzeAttemptWeakAreas(wrongQuestions);
        return NextResponse.json({ analysis, attemptCount: wrongQuestions.length });
      }

      // --- All-attempts analysis (legacy) ---
      const attempts = await prisma.quizAttempt.findMany({
        where: { quiz: { userId: user.id } },
        include: { quiz: { select: { grouping: true, difficulty: true } } },
        orderBy: { startedAt: 'desc' },
      });

      if (attempts.length === 0) {
        return NextResponse.json(
          { error: 'No quiz attempts found. Complete some quizzes first.' },
          { status: 400 }
        );
      }

      const analysis = await aiService.analyzeWeakAreas(attempts);
      return NextResponse.json({ analysis, attemptCount: attempts.length }, { status: 200 });
    } catch (error) {
      console.error('Error analyzing weak areas:', error);

      if (error instanceof Error && error.message.includes('AI service is not configured')) {
        return NextResponse.json(
          { error: 'AI service is not available. Please contact administrator.' },
          { status: 503 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to analyze weak areas', details: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      );
    }
  }),
  'read'
);
