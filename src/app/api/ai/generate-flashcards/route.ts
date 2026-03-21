import { NextRequest, NextResponse } from 'next/server';
import { User } from '@prisma/client';
import { requireAuth } from '@/middleware/auth';
import { withRateLimit } from '@/middleware/rateLimit';
import { aiService } from '@/lib/services/ai.service';
import { prisma } from '@/lib/prisma';

// POST /api/ai/generate-flashcards - Generate flashcards from document
export const POST = withRateLimit(
  requireAuth(async (request: NextRequest, _context, user: User) => {
    try {
      console.log('POST /api/ai/generate-flashcards called for user:', user.id);

      const body = await request.json();
      const { documentId, count = 10 } = body;

      // Validate input
      if (!documentId) {
        return NextResponse.json(
          { error: 'Document ID is required' },
          { status: 400 }
        );
      }

      if (typeof count !== 'number' || count < 1 || count > 50) {
        return NextResponse.json(
          { error: 'Count must be a number between 1 and 50' },
          { status: 400 }
        );
      }

      // Fetch document with ownership check
      const document = await prisma.sourceMaterial.findFirst({
        where: {
          id: documentId,
          userId: user.id,
        },
      });

      if (!document) {
        return NextResponse.json(
          { error: 'Document not found' },
          { status: 404 }
        );
      }

      // Check if text has been extracted
      if (!document.extractedText) {
        return NextResponse.json(
          { error: 'Document text has not been extracted yet' },
          { status: 400 }
        );
      }

      // Generate flashcards using AI
      const flashcards = await aiService.generateFlashcards(document.extractedText, count);

      console.log(`Generated ${flashcards.length} flashcards for document ${documentId}`);
      return NextResponse.json({ flashcards, sourceMaterialId: documentId }, { status: 200 });
    } catch (error) {
      console.error('Error generating flashcards:', error);

      if (error instanceof Error && error.message.includes('AI service is not configured')) {
        return NextResponse.json(
          { error: 'AI service is not available. Please contact administrator.' },
          { status: 503 }
        );
      }

      return NextResponse.json(
        {
          error: 'Failed to generate flashcards',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      );
    }
  }),
  'write'
);
