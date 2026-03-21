import { NextRequest, NextResponse } from 'next/server';
import { User } from '@prisma/client';
import { requireAuth } from '@/middleware/auth';
import { withRateLimit } from '@/middleware/rateLimit';
import { documentService } from '@/lib/services/document.service';
import { updateDocumentTagsSchema } from '@/schemas/document.schema';

// GET /api/documents/[id] - Get specific document
export const GET = withRateLimit(
  requireAuth(async (
    request: NextRequest,
    context: { params: Promise<{ id: string }> },
    user: User
  ) => {
    const params = await context.params;
    try {
      console.log('GET /api/documents/[id] called for document:', params.id);

      const document = await documentService.getDocument(user.id, params.id);

      if (!document) {
        return NextResponse.json(
          { error: 'Document not found' },
          { status: 404 }
        );
      }

      console.log('Document found:', document.id);
      return NextResponse.json(document);
    } catch (error) {
      console.error('Error fetching document:', error);
      return NextResponse.json(
        {
          error: 'Failed to fetch document',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      );
    }
  }),
  'read'
);

// PUT /api/documents/[id] - Update document tags
export const PUT = withRateLimit(
  requireAuth(async (
    request: NextRequest,
    context: { params: Promise<{ id: string }> },
    user: User
  ) => {
    const params = await context.params;
    try {
      console.log('PUT /api/documents/[id] called for document:', params.id);

      const body = await request.json();

      // Validate request body
      const validatedData = updateDocumentTagsSchema.parse(body);

      // Update document tags
      const document = await documentService.updateDocumentTags(user.id, params.id, validatedData.tags);

      console.log('Document tags updated successfully:', document.id);
      return NextResponse.json(document);
    } catch (error) {
      console.error('Error updating document tags:', error);

      if (error instanceof Error && error.name === 'ZodError') {
        return NextResponse.json(
          { error: 'Invalid tags data', details: error.message },
          { status: 400 }
        );
      }

      if (error instanceof Error && error.message === 'Document not found') {
        return NextResponse.json(
          { error: 'Document not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(
        {
          error: 'Failed to update document tags',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      );
    }
  }),
  'write'
);

// DELETE /api/documents/[id] - Delete document
export const DELETE = withRateLimit(
  requireAuth(async (
    request: NextRequest,
    context: { params: Promise<{ id: string }> },
    user: User
  ) => {
    const params = await context.params;
    try {
      console.log('[DELETE /api/documents/[id]] Request received');
      console.log('[DELETE /api/documents/[id]] Document ID:', params.id);
      console.log('[DELETE /api/documents/[id]] User ID:', user.id);

      await documentService.deleteDocument(user.id, params.id);

      console.log('[DELETE /api/documents/[id]] Document deleted successfully:', params.id);
      return NextResponse.json(
        { message: 'Document deleted successfully' },
        { status: 200 }
      );
    } catch (error) {
      console.error('[DELETE /api/documents/[id]] Error occurred:', error);
      
      // Check if it's a "not found" error
      if (error instanceof Error && error.message === 'Document not found') {
        console.error('[DELETE /api/documents/[id]] Document not found or unauthorized');
        return NextResponse.json(
          { error: 'Document not found' },
          { status: 404 }
        );
      }

      // Log detailed error information
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[DELETE /api/documents/[id]] Error details:', errorMessage);

      return NextResponse.json(
        {
          error: 'Failed to delete document',
          details: errorMessage,
        },
        { status: 500 }
      );
    }
  }),
  'write'
);
